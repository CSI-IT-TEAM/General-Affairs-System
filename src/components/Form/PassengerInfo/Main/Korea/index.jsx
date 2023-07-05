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
}) => {
  /////// Translate Lang
  const { t } = useTranslation();

  return (
    <Grid item xs={12} className="s-form-grid__item s-form-grid__item--first">
      <Grid container spacing={2}>
        <Grid item xs={12} md={4} xl={4}>
          <PassengersSelect
            cValue={cValue}
            handleEvent={handlePassengerSelect}
            expList={expList}
          />
        </Grid>
        {/* <Grid item xs={12} md={4} xl={5}>
          <DropOffSelect
            handleEvent={handleDropOff}
            DropOffList={dropOffList}
          />
        </Grid> */}
      </Grid>
    </Grid>
  );
};

export default KoreaPassengerInfo;
