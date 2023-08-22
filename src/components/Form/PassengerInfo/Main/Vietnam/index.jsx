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
  DeptList,
  deptNameHandleSelect,
  _PassengerChange,
}) => {
  /////// Translate Lang
  const { t } = useTranslation();
  const [NumberOfPassenger, setNumberOfPassenger] = React.useState("");

  return (
   
          <DepartmentSelect
            cValue={cValue}
            DeptList={DeptList}
            handleEvent={deptNameHandleSelect}
            PassengerChange={_PassengerChange}
          />
  );
};

export default VietnamPassengerInfo;
