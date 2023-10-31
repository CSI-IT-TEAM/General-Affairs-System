import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { IMaskInput } from "react-imask";
import { NumericFormat } from "react-number-format";
import "../../components/Button/Primary/ButtonPrimary.scss";

import moment from "moment";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
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
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import ProductionQuantityLimitsIcon from "@mui/icons-material/ProductionQuantityLimits";
import DiscountIcon from "@mui/icons-material/Discount";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CommentIcon from "@mui/icons-material/Comment";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
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
import {
  ClinicListURL,
  MedicalClinicSaveURL,
  MedicalClinicSaveWithImageURL,
  RelationListURL,
  UnitListURL,
} from "../../api";
import Swal from "sweetalert2";
import {
  uploadMedicalData,
  uploadMedicalFormData,
} from "../../data/uploadMedicalData";

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
  const { t, i18n } = useTranslation();
  const { navigate } = useNavigate();
  const langCookie = i18next.language;
  const [lang, setLang] = useState("kr"); //langCookie
  const [data, setData] = useState(medicalfreeData);

  const [ClinicListData, setClinicListData] = useState([]);
  const [UnitListData, setUnitListData] = useState([]);
  const [RelationListData, setRelationListData] = useState([]);
  const [selectIndex, setselectIndex] = useState(0);
  const [isMyself, setisMyself] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const today = dayjs();
  const yesterday = dayjs().subtract(1, "day");
  const todayStartOfTheDay = today.startOf("day");
  const fileInputRef = useRef();

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

  const fetchRelationListSelect = async (EMP_ID) => {
    fetch(RelationListURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ARG_TYPE: "Q",
        ARG_EMP_ID: EMP_ID,
        OUT_CURSOR: "",
      }),
    })
      .then((response) => {
        response.json().then(async (result) => {
          if (result.length > 0) {
            // console.log(result);
            setRelationListData(result);
          }
        });
      })
      .catch((e) => console.log(e));
  };

  const HandleDefault = () => {
    fetchClinicListSelect();
    // fetchUnitListSelect();
    setData(medicalfreeData);
    setselectIndex(0);
    setisMyself(true);
    setSelectedImage(null);
    const empData = JSON.parse(sessionStorage.getItem("userData"));
    if (empData != null) {
      fetchRelationListSelect(empData.EMPID);
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
          RELATIONSHIP: "Myself",
          BUDGET: empData.BUDGET,
          PASSPORT: empData.PASSPORT,
          EMAIL_ADDRESS: empData.EMAIL,
          QTY: 1,
          CREATOR: getLastName(empData.EMP_NM),
          CREATE_PROGRAM_ID: "MEDICAL_FEE",
        };
      });
    } else {
      navigate("/signin");
    }
  };
  useEffect(() => {
    HandleDefault();
  }, []);

  function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || "";
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    return new File(byteArrays, "pot", { type: contentType });
  }
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

  const HandleRelationSelectChange = (event) => {
    setData((prevData) => {
      return {
        ...prevData,
        RELATIONSHIP: event.value,
      };
    });
  };

  const scrollToTop = () => {
    // window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document
      .getElementById("title_text")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const handleIsMyselfChanged = (event) => {
    setisMyself(event.target.checked);
    if (event.target.checked) {
      setData((prevData) => {
        return {
          ...prevData,
          RELATIONSHIP: "Myself",
        };
      });
    } else {
      // console.log(RelationListData[0]);
      setData((prevData) => {
        return {
          ...prevData,
          RELATIONSHIP: RelationListData[0].value,
        };
      });
    }
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
      // console.log(key, value, "valuedated: ", value !== "");
    }
    if (isValid) {
      //Test View Data Again
      // console.log(data);
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
            // console.log(uploadData);
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
                // console.log(response);
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

  const handleSubmitv2 = (event) => {
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
      // console.log(key, value, "valuedated: ", value !== "");
    }
    if (isValid) {
      //Test View Data Again
      // alert(data);
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
          //  alert(JSON.stringify(data));
          uploadMedicalFormData(data).then((uploadData) => {
            // Display the key/value pairs
            fetch(MedicalClinicSaveWithImageURL, {
              method: "POST",
              body: uploadData,
            })
              .then((response) => {
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

          <form onSubmit={handleSubmitv2}>
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
                    <Grid item xs={12} md={12}>
                      <Stack direction={"column"} spacing={1}>
                        <Stack direction={"column"}>
                          <FormControlLabel
                            label={
                              <Typography
                                sx={{
                                  px: "10px",
                                  fontSize: "18px",
                                  fontWeight: "bold",
                                }}
                              >
                                {t("frm_title_check_myself")}
                              </Typography>
                            }
                            control={
                              <Checkbox
                                disabled={RelationListData.length === 0}
                                size="large"
                                color="success"
                                checked={isMyself}
                                onChange={handleIsMyselfChanged}
                              />
                            }
                          />
                          <FormHelperText
                            sx={{
                              marginLeft: "35px",
                            }}
                          >
                            {RelationListData.length === 0
                              ? t("frm_helper_not_relationship")
                              : t("frm_helper_relationship")}
                          </FormHelperText>
                        </Stack>
                        <Collapse in={!isMyself}>
                          {/* <TextField
                            hidden
                            disabled={isMyself}
                            name="RELATIONSHIP"
                            error={data.RELATIONSHIP === ""}
                            value={data.RELATIONSHIP}
                            label={t("frm_relationship")}
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
                          /> */}
                          <FormControl fullWidth>
                            <Select
                              defaultValue={RelationListData[selectIndex]}
                              value={RelationListData.filter(
                                (item) => item.value === data.RELATIONSHIP
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
                                      : data.RELATIONSHIP === ""
                                      ? "#CB2D2D"
                                      : "#CCCCCC"
                                  }`,
                                  "&:hover": {
                                    borderColor: isFocused
                                      ? "#00B2E2"
                                      : "#CCCCCC",
                                    cursor: "pointer",
                                  },
                                  minHeight: 55,
                                  fontWeight: 500,
                                  background: isDisabled
                                    ? "#EBEBEB"
                                    : "#FFFFFF",
                                }),
                                menu: (provided) => ({
                                  ...provided,
                                  zIndex: 9999,
                                }),
                              }}
                              options={RelationListData}
                              theme={(theme) => ({
                                ...theme,
                                borderRadius: 0,
                                colors: {
                                  ...theme.colors,
                                  primary25: "#00B2E2",
                                  primary: "#0f005f",
                                },
                              })}
                              onChange={(event) =>
                                HandleRelationSelectChange(event)
                              }
                            />
                          </FormControl>
                        </Collapse>
                      </Stack>
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
                        inputAttr={{
                          readonly: "true",
                        }}
                        acceptCustomValue={false}
                        name="TREAT_DATE"
                        max={Date.now()}
                        label={t("frm_treat_date")}
                        isValid={true}
                        defaultValue={new Date()}
                        placeholder={t("frm_treat_date")}
                        // type="date"
                        onValueChanged={(e) => {
                          setData((prevData) => {
                            return {
                              ...prevData,
                              TREAT_DATE: moment(e.value).format("YYYYMMDD"),
                            };
                          });
                        }}
                        pickerType="rollers"
                        // useMaskBehavior={true}
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
                          option: (
                            base,
                            { data, isDisabled, isFocused, isSelected }
                          ) => ({
                            ...base,
                            backgroundColor:
                              data.label === "Insert New Clinic/Hospital"
                                ? isSelected
                                  ? "navy"
                                  : "#e65522"
                                : isSelected
                                ? "navy"
                                : isFocused
                                ? "#00B2E2"
                                : "#ffffff",
                            color:
                              data.label === "Insert New Clinic/Hospital"
                                ? "white"
                                : isSelected
                                ? "white"
                                : isFocused
                                ? "white"
                                : "black",
                          }),
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
                      <FormHelperText>
                        {t("frm_select_clinic_helper")}
                      </FormHelperText>
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

                    {/* <Grid item xs={12} md={4}>
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
                          maxLength: 50,
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
                    </Grid> */}
                    <Grid item xs={12} md={8}>
                      <TextField
                        multiline
                        maxRows={4}
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

                    <Grid item xs={12} md={4}>
                      <TextField
                        autoComplete="false"
                        name="QTY"
                        value={data.QTY}
                        error={data.QTY === ""}
                        label={t("frm_qty")}
                        disabled={false}
                        placeholder={t("frm_qty")}
                        color="info"
                        fullWidth
                        inputProps={{
                          inputMode: "numeric",
                          pattern: "[0-9/,]*",
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
                    {/* <Grid item xs={6} md={3}> */}
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
                    {/* <FormControl fullWidth>
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
                    </Grid> */}
                    <Grid item xs={12} md={6}>
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
                        inputProps={{
                          inputMode: "numeric",
                          // pattern: "[0-9/,]*",
                          maxLength: 20,
                        }}
                        InputProps={{
                          inputMode: "numeric",
                          pattern: "[0-9]*",
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
                    <Grid item xs={12} md={6}>
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
                        inputProps={{
                          inputMode: "numeric",
                          // pattern: "[0-9/,]*",
                          maxLength: 20,
                        }}
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
                        multiline
                        maxRows={4}
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
                    <Grid item sx={12} md={12} width={"100%"}>
                      {selectedImage ? (
                        <Box
                          borderRadius={"15px"}
                          alignSelf={"center"}
                          fullWidth
                          alignContent={"center"}
                          justifyContent={"center"}
                        >
                          <Stack spacing={1}>
                            <Paper
                              sx={{
                                p: "5px",
                              }}
                            >
                              <img
                                style={{
                                  borderRadius: "5px",
                                }}
                                alt="not found"
                                width={"250px"}
                                src={URL.createObjectURL(selectedImage)}
                              />
                              <br />
                            </Paper>
                            <Button
                              sx={{
                                textTransform: "none",
                              }}
                              startIcon={<DeleteIcon />}
                              variant="contained"
                              color="error"
                              onClick={() => setSelectedImage(null)}
                            >
                              {t("btn_title_remove")}
                            </Button>
                          </Stack>
                        </Box>
                      ) : (
                        <Box
                          alignSelf={"center"}
                          fullWidth
                          alignContent={"center"}
                          justifyContent={"center"}
                        >
                          <Stack>
                            <Button
                              sx={{
                                textTransform: "none",
                              }}
                              startIcon={<AddPhotoAlternateIcon />}
                              variant="contained"
                              color="success"
                              onClick={() => fileInputRef.current.click()}
                            >
                              {t("btn_title_attachment_invoice")}
                            </Button>
                            <input
                              ref={fileInputRef}
                              style={{ display: "none" }}
                              type="file"
                              accept="image/*"
                              name="INVOICE_PIC"
                              // onChange={handleUploadFileChanged} multiple={false}
                              onChange={(event) => {
                                var img = new Image(); //create a image
                                img.src = URL.createObjectURL(
                                  event.target.files[0]
                                );
                                // eslint-disable-next-line no-loop-func
                                img.onload = function (el) {
                                  var elem = document.createElement("canvas"); //create a canvas
                                  //scale the image to 600 (width) and keep aspect ratio
                                  var scaleFactor = 1000 / el.target.width;
                                  elem.width = 1000;
                                  elem.height = el.target.height * scaleFactor;

                                  //draw in canvas
                                  var ctx = elem.getContext("2d");
                                  ctx.drawImage(
                                    el.target,
                                    0,
                                    0,
                                    elem.width,
                                    elem.height
                                  );

                                  // (C2) ADD WATERMARK
                                  //var d = new Date();
                                  //var watermark = d;

                                  //get the base64-encoded Data URI from the resize image
                                  var srcEncoded = ctx.canvas.toDataURL(
                                    "image/png",
                                    1
                                  );
                                  // alert(srcEncoded);

                                  // console.log(
                                  //   b64toBlob(
                                  //     srcEncoded.replace(
                                  //       "data:image/png;base64,",
                                  //       ""
                                  //     ),
                                  //     "image/png"
                                  //   )
                                  // );
                                  // var _result = {
                                  //   ID: "TEST_IMAGE",
                                  //   IMAGE: srcEncoded,
                                  //   IMAGE_FILE: b64toBlob(
                                  //     srcEncoded.replace(
                                  //       "data:image/png;base64,",
                                  //       ""
                                  //     ),
                                  //     "image/png"
                                  //   ),
                                  // };

                                  setData((prevData) => {
                                    return {
                                      ...prevData,
                                      INVOICE_PIC_NAME: "PHUOC_TEST_PIC",
                                      INVOICE_PIC: b64toBlob(
                                        srcEncoded.replace(
                                          "data:image/png;base64,",
                                          ""
                                        ),
                                        "image/png"
                                      ),
                                    };
                                  });
                                };

                                setSelectedImage(event.target.files[0]);
                              }}
                            />
                          </Stack>
                        </Box>
                      )}
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
