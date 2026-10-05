import {
  GrievanceCallProcedureURL,
} from './index';

/**
 * Call Oracle procedure via call-procedure API
 */
const callProcedure = async (procedureName, params = {}) => {
  try {
    if (Array.isArray(params) && params.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Invalid params for ${procedureName}: params is empty array`);
      }
      return {
        success: false,
        error: { message: 'Invalid params: params cannot be an empty array' },
        data: null,
      };
    }

    const validParams = Array.isArray(params) ? {} : (params || {});

    const body = {
      dbName: 'LMES',
      packageName: 'PKG_GA_SYSTEM_REQUEST',
      procedureName: procedureName,
      params: validParams,
    };

    const response = await fetch(GrievanceCallProcedureURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData = null;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // If response is not JSON, use error text
      }

      if (process.env.NODE_ENV === 'development' && response.status !== 400) {
        console.warn(`API call failed for ${procedureName}:`, response.status, errorData || errorText);
      }

      return {
        success: false,
        error: errorData || { message: errorText, status: response.status },
        data: null,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Network error calling procedure ${procedureName}:`, error.message);
    }
    return {
      success: false,
      error: { message: error.message },
      data: null,
    };
  }
};

/**
 * Get Grievance Registration data by calling SEL_GRIEVANCE_DATA procedure
 * @param {Object} params - Query parameters
 * @param {string|null} params.argQType - Registration ID (optional)
 * @param {string|null} params.argFromDate - From date in format YYYY-MM-DD (optional)
 * @param {string|null} params.argToDate - To date in format YYYY-MM-DD (optional)
 * @param {string|null} params.argPraiseID - Praise ID (optional)
 * @returns {Promise<{success: boolean, data: array|null, error: object|null}>}
 */
export const getGrievanceRegistration = async ({
  argQType = null,
  argFromDate = null,
  argToDate = null,
  argPraiseID = null,
} = {}) => {
  try {
    const data = await callProcedure('SEL_GRIEVANCE_DATA', {
      ARG_QTYPE: { value: argQType, type: "IN" },
      ARG_FROM_DATE: { value: argFromDate, type: "IN" },
      ARG_TO_DATE: { value: argToDate, type: "IN" },
        ARG_PRAISE_ID: { value: argPraiseID, type: "IN" },
      OUT_CURSOR: { type: "OUT", dataType: "CURSOR" },
    });

    if (data && data.success && data.data && data.data.OUT_CURSOR) {
      return {
        success: true,
        data: Array.isArray(data.data.OUT_CURSOR) ? data.data.OUT_CURSOR : [],
        error: null,
      };
    }

    return {
      success: false,
      data: null,
      error: data?.error || { message: 'No data returned from procedure' },
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting grievance registration:', error);
    }
    return {
      success: false,
      data: null,
      error: { message: error.message },
    };
  }
};

/**
 * Save B Registration by calling SMT_SAVE_CAN_REG procedure
 * Uses MERGE to INSERT or UPDATE based on key: EMP_NO + REG_TYPE + REG_DATE + MEAL_TYPE
 * @param {Object} registrationData - Registration data object
 * @param {string} registrationData.argType - Employee number
 * @param {string} registrationData.argPraiseId - Employee number
 * @param {string} registrationData.argRate - Registration type (SELF/VISITOR)
 * @param {string} registrationData.argDate - Registration type (SELF/VISITOR)
 * @returns {Promise<{success: boolean, data: object|null, error: object|null}>}
 */
export const saveGrievanceRegistration = async (registrationData) => {
  try {
    const {
      argType,
      argPraiseId,
      argRate,
      argDate,
      argPic
    } = registrationData;

    const data = await callProcedure('UPLOAD_GRIEVANCE_DATA', {
      ARG_TYPE: { value: String(argType), type: "IN" },
      ARG_PRAISE_ID: { value: String(argPraiseId), type: "IN" },
      ARG_RATE: { value: String(argRate || ''), type: "IN" },
      ARG_DATE: { value: String(argDate || ''), type: "IN" },
      ARG_PIC: { value: String(argPic || ''), type: "IN" },
      OUT_STATUS: { type: "OUT", dataType: "VARCHAR2" },
      OUT_MSG: { type: "OUT", dataType: "VARCHAR2" },
    });

    if (data && data.success && data.data) {
      return {
        success: data.data.OUT_STATUS === 'SUCCESS',
        data: {
          status: data.data.OUT_STATUS,
          message: data.data.OUT_MSG,
        },
        error: data.data.OUT_STATUS !== 'SUCCESS'
          ? { message: data.data.OUT_MSG }
          : null,
      };
    }

    return {
      success: false,
      data: null,
      error: data?.error || { message: 'No data returned from procedure' },
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error saving Business Trip registration:', error);
    }
    return {
      success: false,
      data: null,
      error: { message: error.message },
    };
  }
};