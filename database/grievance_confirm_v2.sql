-- Replace UPLOAD_GRIEVANCE_DATA_V2 inside LMES.PKG_GA_SYSTEM_REQUEST package body.
-- ARG_PRAISE_ID: comma-separated IDs, exactly one highest-rated praise per populated factory.
-- ARG_DATE is retained for the existing procedure signature but is not used by CONFIRM.
-- CONFIRM_YN = 'Y' for every still-pending praise in this confirmation batch.
-- WINNER_YN = 'Y' only for the selected PRAISE_ID values.
-- The batch is all CONFIRM_YN = 'N' rows, matching Q_CONFIRM_LIST's scope.
-- Winner validation uses only praises with a RATE > 0.

PROCEDURE UPLOAD_GRIEVANCE_DATA_V2
(
    ARG_TYPE       VARCHAR2 DEFAULT('SAVE'),
    ARG_PRAISE_ID  VARCHAR2,
    ARG_RATE       VARCHAR2,
    ARG_DATE       VARCHAR2,
    ARG_PIC        VARCHAR2,
    OUT_STATUS     OUT VARCHAR2,
    OUT_MSG        OUT VARCHAR2
)
IS
    L_WINNER_IDS       SYS.ODCINUMBERLIST := SYS.ODCINUMBERLIST();
    L_DISTINCT_IDS     NUMBER;
    L_TOP_FACTORIES    NUMBER;
    L_VALID_WINNERS    NUMBER;
    L_WINNER_FACTORIES NUMBER;
    L_UPDATED_ROWS     NUMBER := 0;
BEGIN
    IF ARG_TYPE = 'SAVE' THEN
        INSERT INTO GRIEVANCE_PRAISE_RATE
            (ID, PRAISE_ID, RATE, EVALUATOR, CREATED_AT, CREATED_BY)
        VALUES
            (SEQ_GRIEVANCE_PRAISE_RATE.NEXTVAL,
             TO_NUMBER(ARG_PRAISE_ID), TO_NUMBER(ARG_RATE), ARG_PIC,
             SYSTIMESTAMP, ARG_PIC);

        OUT_MSG := 'Rate saved successfully';

    ELSIF ARG_TYPE = 'CONFIRM' THEN
        IF ARG_PIC IS NULL THEN
            RAISE_APPLICATION_ERROR(-20001, 'Missing confirmation user');
        END IF;

        IF ARG_PRAISE_ID IS NULL OR
           NVL(REGEXP_INSTR(ARG_PRAISE_ID, '^[0-9]+(,[0-9]+){0,2}$'), 0) <> 1 THEN
            RAISE_APPLICATION_ERROR(-20002, 'Provide 1 to 3 winner praise IDs');
        END IF;

        FOR I IN 1 .. REGEXP_COUNT(ARG_PRAISE_ID, ',') + 1 LOOP
            L_WINNER_IDS.EXTEND;
            L_WINNER_IDS(L_WINNER_IDS.LAST) :=
                TO_NUMBER(REGEXP_SUBSTR(ARG_PRAISE_ID, '[^,]+', 1, I));
        END LOOP;

        SELECT COUNT(DISTINCT COLUMN_VALUE)
          INTO L_DISTINCT_IDS
          FROM TABLE(L_WINNER_IDS);

        IF L_DISTINCT_IDS <> L_WINNER_IDS.COUNT THEN
            RAISE_APPLICATION_ERROR(-20004, 'Duplicate winner praise ID');
        END IF;

        -- Keep the pending batch stable while validating and updating it.
        FOR PENDING_ROW IN (
            SELECT P.ID
              FROM GRIEVANCE_PRAISE P
             WHERE P.CONFIRM_YN = 'N'
             FOR UPDATE
        ) LOOP
            NULL;
        END LOOP;

        -- Recalculate Q_CONFIRM_LIST's ranking exactly. Unrated praises do not
        -- make a factory eligible for an award.
        WITH PRAISE_RATE AS (
            SELECT P.ID,
                   SUBSTR(P.DEPARTMENT_NAME, 1, 3) AS FACTORY,
                   ROUND(AVG(R.RATE), 2) AS AVG_RATE
              FROM GRIEVANCE_PRAISE P
              INNER JOIN GRIEVANCE_PRAISE_RATE R
                      ON R.PRAISE_ID = P.ID
                     AND R.RATE > 0
             WHERE P.CONFIRM_YN = 'N'
               AND SUBSTR(P.DEPARTMENT_NAME, 1, 3) IN ('VJ1', 'VJ2', 'VJ3')
             GROUP BY P.ID, SUBSTR(P.DEPARTMENT_NAME, 1, 3)
        ), RANKED AS (
            SELECT ID, FACTORY,
                   DENSE_RANK() OVER
                       (PARTITION BY FACTORY ORDER BY AVG_RATE DESC) AS RN
              FROM PRAISE_RATE
        )
        SELECT COUNT(DISTINCT CASE WHEN RN = 1 THEN FACTORY END),
               COUNT(DISTINCT CASE
                   WHEN RN = 1 AND ID IN
                       (SELECT COLUMN_VALUE FROM TABLE(L_WINNER_IDS))
                   THEN ID END),
               COUNT(DISTINCT CASE
                   WHEN RN = 1 AND ID IN
                       (SELECT COLUMN_VALUE FROM TABLE(L_WINNER_IDS))
                   THEN FACTORY END)
          INTO L_TOP_FACTORIES, L_VALID_WINNERS, L_WINNER_FACTORIES
          FROM RANKED;

        IF L_TOP_FACTORIES = 0 THEN
            RAISE_APPLICATION_ERROR(-20006,
                'No rated pending praise in VJ1, VJ2 or VJ3');
        ELSIF L_VALID_WINNERS <> L_WINNER_IDS.COUNT THEN
            RAISE_APPLICATION_ERROR(-20006,
                'Selected ID is not a current pending highest-rated praise; ' ||
                'refresh Q_CONFIRM_LIST. IDs=' || ARG_PRAISE_ID);
        ELSIF L_WINNER_FACTORIES <> L_TOP_FACTORIES OR
              L_WINNER_FACTORIES <> L_WINNER_IDS.COUNT THEN
            RAISE_APPLICATION_ERROR(-20006,
                'Select one winner per eligible factory. Eligible=' ||
                L_TOP_FACTORIES || ', selected factories=' ||
                L_WINNER_FACTORIES || ', IDs=' || ARG_PRAISE_ID);
        END IF;

        UPDATE GRIEVANCE_PRAISE P
           SET CONFIRM_YN = 'Y',
               WINNER_YN = CASE WHEN P.ID IN
                   (SELECT COLUMN_VALUE FROM TABLE(L_WINNER_IDS))
                   THEN 'Y' ELSE 'N' END,
               CONFIRM_USER = ARG_PIC,
               UPDATED_AT = SYSTIMESTAMP,
               UPDATED_BY = ARG_PIC
         WHERE P.CONFIRM_YN = 'N';

        L_UPDATED_ROWS := SQL%ROWCOUNT;
        OUT_MSG := 'Confirmed ' || L_UPDATED_ROWS || ' praises; ' ||
                   L_WINNER_IDS.COUNT || ' winners';

    ELSE
        RAISE_APPLICATION_ERROR(-20007, 'Unsupported ARG_TYPE');
    END IF;

    OUT_STATUS := 'SUCCESS';
    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        OUT_STATUS := 'ERROR';
        OUT_MSG := SQLERRM;
END UPLOAD_GRIEVANCE_DATA_V2;
