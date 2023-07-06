import React from "react";
import { Grid, TextField, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import SelectModal from "../../../../SelectModal";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";
import PassengersSelect from "../../../../SelectModal/PassengersSelect";
import DepartmentSelect from "../../../../SelectModal/DepartmentSelect";
import DropOffSelect from "../../../../SelectModal/DropOffSelect";
//Include Me!
const KoreaPassengerInfo = ({
  cValue,
  expList,
  handlePassengerSelect,
  handleClearClick,
}) => {
  /////// Translate Lang
  const { t } = useTranslation();

  return (
    <PassengersSelect
      cValue={cValue}
      handleEvent={handlePassengerSelect}
      expList={expList}
      handleClearClick={handleClearClick}
    />
  );
};

export default KoreaPassengerInfo;
