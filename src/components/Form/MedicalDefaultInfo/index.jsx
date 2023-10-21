import { Grid, InputAdornment } from "@mui/material";
import TextInput from "../../TextInput";
import { useTranslation } from "react-i18next";
import FactoryIcon from "@mui/icons-material/Factory";
const FormMedicalDefaultInfo = ({ data }) => {
  /////// Translate Lang
  const { t } = useTranslation();

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} xl={3}>
          <TextInput
            title={t("frm_fty")}
            placeholder={t("frm_fty")}
            value={data.PLANT_NM}
            disable={true}
            inputProp={{
              //   inputMode: "text",
              startAdornment: (
                <InputAdornment position="start">
                  <FactoryIcon />
                </InputAdornment>
              ),
            }}
            isDefault={true}
          />
        </Grid>
        <Grid item xs={12} md={6} xl={3}>
          <TextInput
            title={t("frm_depart")}
            placeholder=""
            value={data.DEPT_NM}
            disable={true}
            inputProp={{ inputMode: "text" }}
            isDefault={true}
          />
        </Grid>
        <Grid item xs={12} md={6} xl={3}>
          <TextInput
            title={t("frm_user_id")}
            placeholder=""
            value={data.EMP_ID}
            disable={true}
            inputProp={{ inputMode: "numeric", pattern: "[0-9]*" }}
            isDefault={true}
          />
        </Grid>
        <Grid item xs={12} md={6} xl={3}>
          <TextInput
            title={t("frm_user_nm")}
            placeholder=""
            value={data.EMP_NAME_EN}
            disable={true}
            inputProp={{ inputMode: "text" }}
            isDefault={true}
          />
        </Grid>
        <Grid item xs={12} md={6} xl={3}>
          <TextInput
            title={t("frm_user_bithdate")}
            placeholder=""
            value={data.BIRTHDATE}
            disable={true}
            inputProp={{ inputMode: "text" }}
            isDefault={true}
          />
        </Grid>
        <Grid item xs={12} md={6} xl={3}>
          <TextInput
            name="BUDGET"
            title={t("frm_user_budget")}
            placeholder=""
            value={data.BUDGET}
            disable={true}
            inputProp={{ inputMode: "text" }}
            isDefault={true}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default FormMedicalDefaultInfo;
