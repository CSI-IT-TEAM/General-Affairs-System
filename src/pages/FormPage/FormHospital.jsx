import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { IMaskInput } from "react-imask";
import { NumericFormat } from "react-number-format";
import "../../components/Button/Primary/ButtonPrimary.scss";
import moment from "moment";
import {
  Box,
  Collapse,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
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
import { ClinicListURL, MedicalClinicSaveURL, UnitListURL } from "../../api";
import Swal from "sweetalert2";
import uploadMedicalData from "../../data/uploadMedicalData";

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

  const [ClinicListData, setClinicListData] = useState([]);
  const [UnitListData, setUnitListData] = useState([]);

  const [selectIndex, setselectIndex] = useState(0);

  const today = dayjs();
  const yesterday = dayjs().subtract(1, "day");
  const todayStartOfTheDay = today.startOf("day");

  ///DATABASE SELECT
  const fetchClinicListSelect = async () => {
    fetch(ClinicListURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ARG_TYPE: "Q",
        OUT_CURSOR: "",
      }),
    })
      .then((response) => {
        response.json().then(async (result) => {
          if (result.length > 0) {
            setClinicListData(result);
          }
        });
      })
      .catch((e) => console.log(e));
  };
  const fetchUnitListSelect = async () => {
    fetch(UnitListURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ARG_TYPE: "Q",
        OUT_CURSOR: "",
      }),
    })
      .then((response) => {
        response.json().then(async (result) => {
          if (result.length > 0) {
            setUnitListData(result);
          }
        });
      })
      .catch((e) => console.log(e));
  };
  const HandleDefault = () => {
    fetchClinicListSelect();
    fetchUnitListSelect();
    setData(medicalfreeData);
    setselectIndex(0);
    const empData = JSON.parse(sessionStorage.getItem("userData"));
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
          EMP_NAME_KOR: empData.NAME_KOR,
          BIRTHDATE: empData.BIRTHDATE,
          BUDGET: empData.BUDGET,
          PASSPORT: empData.PASSPORT,
          EMAIL_ADDRESS: empData.EMAIL,
          CREATOR: getLastName(empData.EMP_NM),
          CREATE_PROGRAM_ID: "MEDICAL_FEE",
        };
      });
    } else {
      navigate("/signin");
    }
  };
  useEffect(() => {
    setLang(i18next.language);

    HandleDefault();
  }, []);

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
        [event.name]: event.IS_CLINIC_NEW_CODE === "Y" ? "" : event.label,
        [event.IS_CLINIC_NEW]: event.IS_CLINIC_NEW_CODE,
      };
    });
  };
  const scrollToTop = () => {
    // window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document
      .getElementById("title_text")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    let isValid = true;
    var formData = new FormData(event.target);
    for (var [key, value] of formData.entries()) {
      if (key === "QTY" || key === "UNIT_PRICE" || key === "DISCOUNT_QTY") {
        value = value.replace(",", "").replace(" VNĐ", "");
      }
      if (key !== "REMARKS" && key !== "DISCOUNT_QTY") {
        if (value === "") {
          isValid = false;
        }
      }
      console.log(key, value, "valuedated: ", value !== "");
    }
    if (isValid) {
      //Test View Data Again
      console.log(data);
      //Checking Data If OK All then Submit
      Swal.fire({
        title: t("swal_are_you_sure"),
        // text: "You won't be able to revert this!",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#0f005f",
        cancelButtonColor: "red",
        confirmButtonText: "Confirm",
      }).then((result) => {
        if (result.isConfirmed) {
          //Upload Data
          uploadMedicalData(data).then((uploadData) => {
            console.log(uploadData);
            fetch(MedicalClinicSaveURL, {
              method: "POST",
              mode: "cors",
              dataType: "json",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(uploadData),
            })
              .then((response) => {
                console.log(response);
                if (response.status === 200) {
                  Swal.fire(
                    t("swal_success"),
                    t("swal_your_data_uploaded"),
                    "success"
                  ).then(() => {
                    setTimeout(() => {
                      scrollToTop();
                      HandleDefault();
                    }, 500);
                  });
                } else {
                  Swal.fire(
                    t("swal_failed"),
                    t("swal_networking_error"),
                    "error"
                  ).then(() => {
                    setTimeout(() => {
                      scrollToTop();
                    }, 500);
                  });
                }
              })
              .catch((error) => {});
          });
        }
      });
    } else {
      Swal.fire({
        icon: "error",
        title: t("swal_data_empty"),
        text: t("swal_checking_again"),
        footer: t("swal_red_fields_is_blank"),
      });
      return;
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
                    {/* <Grid item xs={12} md={6}>
                      <TextField
                        name="CUSTOMER_CODE"
                        value={data.CUSTOMER_CODE}
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
                      <FormHelperText>
                        {t("frm_helper_customer_code")}
                      </FormHelperText>
                    </Grid> */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        name="RELATIONSHIP"
                        error={data.RELATIONSHIP === ""}
                        value={data.RELATIONSHIP}
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
                      <FormHelperText>
                        {t("frm_helper_relationship")}
                      </FormHelperText>
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
                        name="TREAT_DATE"
                        max={Date.now()}
                        label={t("frm_treat_date")}
                        isValid={true}
                        defaultValue={new Date()}
                        placeholder={t("frm_treat_date")}
                        type="date"
                        onValueChanged={(e) => {
                          setData((prevData) => {
                            return {
                              ...prevData,
                              TREAT_DATE: moment(e.value).format("YYYYMMDD"),
                            };
                          });
                        }}
                        pickerType="rollers"
                        useMaskBehavior={true}
                        displayFormat={"dd-MM-yyyy"}
                      />
                    </Grid>
                    <Grid item xs={12} md={data.IS_CLINIC_NEW === "Y" ? 6 : 12}>
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
                        defaultValue={ClinicListData[selectIndex]}
                        value={ClinicListData.filter(
                          (item) => item.value === data.MEDICAL_CD
                        )}
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
                              isFocused
                                ? "#00B2E2"
                                : data.MEDICAL_CD === ""
                                ? "#CB2D2D"
                                : "#CCCCCC"
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
                        options={ClinicListData}
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
                    {data.IS_CLINIC_NEW === "Y" ? (
                      <Grid item xs={12} md={6}>
                        <Collapse
                          in={data.IS_CLINIC_NEW === "Y" ? true : false}
                        >
                          <TextField
                            value={data.MEDICAL_NAME}
                            name="MEDICAL_NAME"
                            error={data.MEDICAL_NAME === ""}
                            label={t("frm_medical_name")}
                            disabled={false}
                            placeholder={t("frm_medical_name")}
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
                          <FormHelperText>
                            {t("frm_helper_new_clinic")}
                          </FormHelperText>
                        </Collapse>
                      </Grid>
                    ) : null}

                    <Grid item xs={12} md={6}>
                      <TextField
                        name="SERVICE_TYPE"
                        error={data.SERVICE_TYPE === ""}
                        value={data.SERVICE_TYPE}
                        label={t("frm_services_type")}
                        disabled={false}
                        placeholder={t("frm_services_type")}
                        color="info"
                        fullWidth
                        inputProps={{
                          maxLength: 20,
                        }}
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
                        value={data.SERVICE_NAME}
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

                    <Grid item xs={6} md={3}>
                      <TextField
                        autoComplete="false"
                        // inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        name="QTY"
                        value={data.QTY}
                        error={data.QTY === ""}
                        label={t("frm_qty")}
                        disabled={false}
                        placeholder={t("frm_qty")}
                        color="info"
                        fullWidth
                        inputProps={{
                          maxLength: 10,
                        }}
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
                    <Grid item xs={6} md={3}>
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
                          defaultValue={UnitListData[selectIndex]}
                          value={UnitListData.filter(
                            (item) => item.value === data.UNIT_CD
                          )}
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
                                isFocused
                                  ? "#00B2E2"
                                  : data.UNIT_CD === ""
                                  ? "#CB2D2D"
                                  : "#CCCCCC"
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
                          options={UnitListData}
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
                    <Grid item xs={12} md={3}>
                      <TextField
                        autoComplete="false"
                        // inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        name="UNIT_PRICE"
                        error={data.UNIT_PRICE === ""}
                        value={data.UNIT_PRICE}
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
                    <Grid item xs={12} md={3}>
                      <TextField
                        autoComplete="false"
                        // inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        name="DISCOUNT_QTY"
                        value={data.DISCOUNT_QTY}
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
                        inputProps={{
                          maxLength: 500,
                        }}
                        name="REMARKS"
                        value={data.REMARKS}
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
                <div className="btn-primary-bg" />
                <div className="btn-primary-title">Confirm</div>
              </button>
            </Box>
          </form>
        </Container>
      </Box>
      {/* <BottomNavigation /> */}
    </>
  );
};

export default FormHospital;
