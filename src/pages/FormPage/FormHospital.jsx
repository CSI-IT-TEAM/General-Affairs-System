import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { IMaskInput } from "react-imask";
import { NumericFormat } from "react-number-format";
import "../../components/Button/Primary/ButtonPrimary.scss";
import {
  Box,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import TagIcon from "@mui/icons-material/Tag";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import MedicationIcon from "@mui/icons-material/Medication";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import ProductionQuantityLimitsIcon from "@mui/icons-material/ProductionQuantityLimits";
import DiscountIcon from "@mui/icons-material/Discount";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CommentIcon from "@mui/icons-material/Comment";
import i18next from "i18next";

import {
  BottomNavigation,
  ButtonPrimary,
  FormMedicalDefaultInfo,
  FormTitle,
} from "../../components";
import {
  getDate,
  getDateTime,
  formatDate,
  formatHMS,
  getDateFormat,
  getDateTimeFormat,
} from "../../function/getDate";
import { getLastName } from "../../function/getLastName";
import {
  medicalfreeData,
  reqCarValidate,
  passengerNum,
  uploadCarData,
} from "../../data";
import { DateBox } from "devextreme-react";

const HospitalOptions = [
  {
    code: "MEDICAL_CD",
    value: "M00001",
    name: "MEDICAL_NAME",
    label: "Y HOC CO TRUYEN HANH PHUC",
  },
  {
    code: "MEDICAL_CD",
    value: "M00002",
    name: "MEDICAL_NAME",
    label: "CONG TY CO PHAN KIM'S EYE & DASOM POLYCLINIC",
  },
  {
    code: "MEDICAL_CD",
    value: "M00003",
    name: "MEDICAL_NAME",
    label: "CN CTY CP DUOC QUOC TE NHAN DUC - PKDK NHAN DUC 3",
  },
  {
    code: "MEDICAL_CD",
    value: "M00004",
    name: "MEDICAL_NAME",
    label: "CONG TY TNHH A CLINIC",
  },
  {
    code: "MEDICAL_CD",
    value: "M00005",
    name: "MEDICAL_NAME",
    label: "CONG TY TNHH ACE MEDICAL",
  },
  {
    code: "MEDICAL_CD",
    value: "M00006",
    name: "MEDICAL_NAME",
    label: "CONG TY TNHH DONG Y KYUNGHEE",
  },
  {
    code: "MEDICAL_CD",
    value: "M00007",
    name: "MEDICAL_NAME",
    label: "CONG TY TNHH NHA KHOA BF",
  },
  {
    code: "MEDICAL_CD",
    value: "M00008",
    name: "MEDICAL_NAME",
    label: "PHONG KHAM DA KHOA CHAM SOC SUC KHOE VINAHELTH",
  },
  {
    code: "MEDICAL_CD",
    value: "M00009",
    name: "MEDICAL_NAME",
    label: "PHONG KHAM DA KHOA NHAN DUC 2",
  },
  {
    code: "MEDICAL_CD",
    value: "M00010",
    name: "MEDICAL_NAME",
    label: "NHA KHOA KTS",
  },
];

const UnitOptions = [
  {
    code: "UNIT_CD",
    value: "UNIT0001",
    name: "UNIT_NAME",
    label: "Piecie",
  },
  {
    code: "UNIT_CD",
    value: "UNIT0002",
    name: "UNIT_NAME",
    label: "Box",
  },
];

const NumericFormatCustom = React.forwardRef(function NumericFormatCustom(
  props,
  ref
) {
  const { onChange, ...other } = props;

  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.value,
          },
        });
      }}
      thousandSeparator
      valueIsNumericString
      suffix=" VNĐ"
    />
  );
});

const NumericFormatThounsand = React.forwardRef(function NumericFormatCustom(
  props,
  ref
) {
  const { onChange, ...other } = props;

  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.value,
          },
        });
      }}
      thousandSeparator
      valueIsNumericString
    />
  );
});

NumericFormatCustom.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const FormHospital = () => {
  /////// Translate Lang
  const { t } = useTranslation();
  const { navigate } = useNavigate();
  const langCookie = i18next.language;
  const [lang, setLang] = useState(langCookie);
  const [data, setData] = useState(medicalfreeData);

  const today = dayjs();
  const yesterday = dayjs().subtract(1, "day");
  const todayStartOfTheDay = today.startOf("day");

  useEffect(() => {
    const empData = JSON.parse(sessionStorage.getItem("userData"));
    setLang(i18next.language);
    if (empData != null) {
      setData((prevData) => {
        return {
          ...prevData,
          TREAT_DATE: getDate(),
          PLANT_CD: empData.PLANT_CD,
          PLANT_NM: empData.PLANT_NM,
          DEPT_CD: empData.DEPT,
          DEPT_NM: empData.DEPT_NM,
          EMP_ID: empData.EMPID,
          EMP_NAME_EN: empData.EMP_NM,
          BIRTHDATE: empData.BIRTHDATE,
          EMAIL_ADDRESS: empData.EMAIL,
          CREATOR: getLastName(empData.EMP_NM),
          CREATE_PROGRAM_ID: "MEDICAL_FEE",
        };
      });
    } else {
      navigate("/signin");
    }
  }, [langCookie]);

  const HandleControlsChange = (event) => {
    setData((prevData) => {
      return {
        ...prevData,
        [event.target.name]: event.target.value,
      };
    });
  };

  const HandleSelectChange = (event) => {
    setData((prevData) => {
      return {
        ...prevData,
        [event.code]: event.value,
        [event.name]: event.label,
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    var formData = new FormData(event.target);
    for (var [key, value] of formData.entries()) {
      console.log(key, value);
    }
  };

  return (
    <>
      <Box className="s-form">
        <Container>
          <h3 className="s-form-title" id="title_text">
            {t("medical")} <span>{t("fee")}</span>
          </h3>

          <form onSubmit={handleSubmit}>
            <Stack direction="column" spacing={2}>
              <Stack direction="column">
                <FormTitle order="1" title={t("title_first")} />
                <Box className="s-form-content">
                  <FormMedicalDefaultInfo data={data} />
                </Box>
              </Stack>

              <Stack direction="column">
                <FormTitle order="2" title={t("title_relationship_second")} />
                <Box className="s-form-content">
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        name="CUSTOMER_CODE"
                        error={data.CUSTOMER_CODE === ""}
                        label={t("frm_customer_code")}
                        placeholder={t("frm_customer_code")}
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <TagIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        name="RELATIONSHIP"
                        error={data.RELATIONSHIP === ""}
                        label={t("frm_relationship")}
                        disabled={false}
                        placeholder={t("frm_relationship")}
                        color="info"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FamilyRestroomIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Stack>

              <Stack direction="column">
                <FormTitle order="3" title={t("title_medical_third")} />
                <Box className="s-form-content">
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={12}>
                      <DateBox
                        max={Date.now()}
                        label={t("frm_treat_date")}
                        isValid={true}
                        defaultValue={new Date()}
                        placeholder={t("frm_treat_date")}
                        type="date"
                        onValueChanged={(e) => {
                          console.log(e);
                        }}
                        pickerType="rollers"
                        useMaskBehavior={true}
                        displayFormat={"dd-MM-yyyy"}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      {/* <TextField
                        name="UNIT_CD"
                        error={data.UNIT_CD === ""}
                        label={t("frm_unit_cd")}
                        disabled={false}
                        placeholder={t("frm_unit_cd")}
                        color="info"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MedicationIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      /> */}
                      <Select
                        defaultValue={HospitalOptions[2]}
                        classNames={{
                          control: (state) =>
                            state.isFocused
                              ? "border-red-600"
                              : "border-grey-300",
                        }}
                        styles={{
                          control: (base, { isDisabled, isFocused }) => ({
                            ...base,
                            borderRadius: 5,
                            border: `1px solid ${
                              isFocused ? "#00B2E2" : "#CCCCCC"
                            }`,
                            "&:hover": {
                              borderColor: isFocused ? "#00B2E2" : "#CCCCCC",
                              cursor: "pointer",
                            },
                            minHeight: 55,
                            fontWeight: 500,
                            background: isDisabled ? "#EBEBEB" : "#FFFFFF",
                          }),
                          // Fixes the overlapping problem of the component
                          menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        }}
                        options={HospitalOptions}
                        theme={(theme) => ({
                          ...theme,
                          borderRadius: 0,
                          colors: {
                            ...theme.colors,
                            primary25: "orangered",
                            primary: "#0f005f",
                          },
                        })}
                        onChange={(event) => HandleSelectChange(event)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        name="SERVICE_TYPE"
                        error={data.SERVICE_TYPE === ""}
                        label={t("frm_services_type")}
                        disabled={false}
                        placeholder={t("frm_services_type")}
                        color="info"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MedicalServicesIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        name="SERVICE_NAME"
                        error={data.SERVICE_NAME === ""}
                        label={t("frm_services_name")}
                        disabled={false}
                        placeholder={t("frm_services_name")}
                        color="info"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MedicalServicesIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                    <Grid item xs={6} md={4}>
                      {/* <TextField
                        name="UNIT_CD"
                        error={data.UNIT_CD === ""}
                        label={t("frm_unit_cd")}
                        disabled={false}
                        placeholder={t("frm_unit_cd")}
                        color="info"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MedicationIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      /> */}
                      <FormControl fullWidth>
                        <Select
                          defaultValue={UnitOptions[1]}
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? "border-red-600"
                                : "border-grey-300",
                          }}
                          styles={{
                            control: (base, { isDisabled, isFocused }) => ({
                              ...base,
                              borderRadius: 5,
                              border: `1px solid ${
                                isFocused ? "#00B2E2" : "#CCCCCC"
                              }`,
                              "&:hover": {
                                borderColor: isFocused ? "#00B2E2" : "#CCCCCC",
                                cursor: "pointer",
                              },
                              minHeight: 55,
                              fontWeight: 500,
                              background: isDisabled ? "#EBEBEB" : "#FFFFFF",
                            }),
                            menu: (provided) => ({ ...provided, zIndex: 9999 }),
                          }}
                          options={UnitOptions}
                          theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                              ...theme.colors,
                              primary25: "orangered",
                              primary: "#0f005f",
                            },
                          })}
                          onChange={(event) => HandleSelectChange(event)}
                        />
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <TextField
                        autoComplete={false}
                        // inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        name="QTY"
                        error={data.QTY === ""}
                        label={t("frm_qty")}
                        disabled={false}
                        placeholder={t("frm_qty")}
                        color="info"
                        fullWidth
                        InputProps={{
                          inputComponent: NumericFormatThounsand,
                          startAdornment: (
                            <InputAdornment position="start">
                              <ProductionQuantityLimitsIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <TextField
                        autoComplete={false}
                        // inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        name="UNIT_PRICE"
                        error={data.UNIT_PRICE === ""}
                        label={t("frm_unit_price")}
                        disabled={false}
                        placeholder={t("frm_unit_price")}
                        color="info"
                        fullWidth
                        InputProps={{
                          inputComponent: NumericFormatCustom,
                          startAdornment: (
                            <InputAdornment position="start">
                              <PriceChangeIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <TextField
                        autoComplete={false}
                        // inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        name="DISCOUNT_QTY"
                        label={t("frm_discount_price")}
                        disabled={false}
                        placeholder={t("frm_discount_price")}
                        color="info"
                        fullWidth
                        InputProps={{
                          inputComponent: NumericFormatCustom,
                          startAdornment: (
                            <InputAdornment position="start">
                              <DiscountIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                    <Grid item xs={12} md={12}>
                      <TextField
                        sx={{
                          ".MuiInputBase-input": {
                            fontSize: "1.5rem !important",
                            fontWeight: "bold",
                            fontFamily: "Poppins !important",
                          },
                        }}
                        variant="standard"
                        name="AMOUNT_QTY"
                        value={
                          data.UNIT_PRICE * data.QTY - data.DISCOUNT_QTY < 0
                            ? 0
                            : data.UNIT_PRICE * data.QTY - data.DISCOUNT_QTY
                        }
                        label={t("frm_amount_price")}
                        disabled
                        placeholder={t("frm_amount_price")}
                        fullWidth
                        color="warning"
                        InputProps={{
                          inputComponent: NumericFormatCustom,
                          endAdornment: (
                            <InputAdornment position="start">
                              <MonetizationOnIcon />
                            </InputAdornment>
                          ),
                          inputProps: {
                            style: { textAlign: "center" },
                          },
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                    <Grid item xs={12} md={12}>
                      <TextField
                        name="REMARKS"
                        label={t("frm_notes")}
                        disabled={false}
                        placeholder={t("frm_notes")}
                        color="info"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CommentIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </Stack>
            <Box className="s-form-bot">
              <button className="btn-primary" type="submit">
                Click to submit
              </button>
              <ButtonPrimary
                title={t("btn_confirm")}
                // handleClick={() => alert(JSON.stringify(data))}
              />
            </Box>
          </form>
        </Container>
      </Box>
      {/* <BottomNavigation /> */}
    </>
  );
};

export default FormHospital;
