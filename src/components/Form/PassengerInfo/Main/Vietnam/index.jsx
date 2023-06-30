import { Grid, TextField, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import SelectModal from "../../../../SelectModal";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";
import DepartmentSelect from "../../../../SelectModal/DepartmentSelect";
//Include Me!
const VietnamPassengerInfo = ({
  item,
  index,
  empName,
  dropOffList,
  handleDropOff,
  deptNameHandleSelect,
  _PassengerChange,
}) => {
  /////// Translate Lang
  const { t } = useTranslation();

  return (
    <Grid
      item
      xs={12}
      className="s-form-grid__item s-form-grid__item--first"
      key={index}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={4} xl={3}>
          <Stack
            sx={{ width: "100%" }}
            direction="row"
            alignItems="center"
            className="s-form-sub"
          >
            <SquareRoundedIcon sx={{ fontSize: 12 }} />
            <Typography variant="h6" className="b-text-input__sub b-italic">
              {`${t("frm_txt_passenger_placeholder")} ${index + 1}`}
            </Typography>
          </Stack>
          <TextField
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            className="b-text-input__desc"
            disabled={true}
            placeholder={t("frm_pass_placeholder")}
            color="info"
            fullWidth
            value={empName}
          />
        </Grid>
        <Grid item xs={12} md={4} xl={4}>
          <DepartmentSelect
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
