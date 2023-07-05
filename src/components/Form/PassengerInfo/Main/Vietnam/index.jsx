import React from "react";
import { Grid, TextField, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import SelectModal from "../../../../SelectModal";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";
import DepartmentSelect from "../../../../SelectModal/DepartmentSelect";
//Include Me!
const VietnamPassengerInfo = ({
  cValue,
  tValue,
  DeptList,
  deptNameHandleSelect,
  _PassengerChange,
}) => {
  /////// Translate Lang
  const { t } = useTranslation();
  const [NumberOfPassenger, setNumberOfPassenger] = React.useState("");

  return (
    <Grid item xs={12} className="s-form-grid__item s-form-grid__item--first">
      <Grid container spacing={2}>
        <Grid item xs={12} md={4} xl={4}>
          <DepartmentSelect
            cValue={cValue}
            tValue={tValue}
            DeptList={DeptList}
            handleEvent={deptNameHandleSelect}
            PassengerChange={_PassengerChange}
          />
        </Grid>
        {/* <Grid item xs={12} md={4} xl={5}>
          <Stack sx={{ width: "100%" }}>
            <SelectModal
              name={item.id + "_DROP_OFF_CD"}
              data={dropOffList}
              placeholder={t("frm_dropOff_placeholder")}
              cValue={item.dropOff}
              handleEvent={handleDropOff}
              isValidate={item.validDropOff}
              message={t("frm_required")}
            />
          </Stack>
        </Grid> */}
      </Grid>
    </Grid>
  );
};

export default VietnamPassengerInfo;
