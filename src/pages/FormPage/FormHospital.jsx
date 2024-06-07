import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { IMaskInput } from "react-imask";
import { NumericFormat } from "react-number-format";
import "../../components/Button/Primary/ButtonPrimary.scss";
import moment from "moment";
import SendIcon from "@mui/icons-material/Send";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
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
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BadgeIcon from "@mui/icons-material/Badge";
import i18next from "i18next";
import { Translator, Translate } from "react-auto-translate";
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
  ExchangeRateSelectURL,
  HospitalTypeListURL,
  MedicalAccountBankDocURL,
  MedicalBankImageUploadURL,
  MedicalClinicSaveURL,
  MedicalClinicSaveWithImageURL,
  MedicalImageUploadURL,
  RelationListURL,
  UnitListURL,
} from "../../api";
import Swal from "sweetalert2";
import {
  uploadMedicalBankImageFormData,
  uploadMedicalData,
  uploadMedicalFormData,
  uploadMedicalImageFormData,
} from "../../data/uploadMedicalData";
import { pink } from "@mui/material/colors";
import { Uploader } from "rsuite";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
const krwExchangeRate = 18.79;

export const BankOptions = [
  { code: "BANK_CD", value: "woori", label: "Woori Bank", color: "#00B8D9" },
  {
    code: "BANK_NAME",
    value: "shinhan",
    label: "Shinhan Bank",
    color: "#0052CC",
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
      suffix=" "
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
  const [exChangeRateData, setexChangeRateData] = useState([]);
  const [ClinicListData, setClinicListData] = useState([]);
  const [UnitListData, setUnitListData] = useState([]);
  const [RelationListData, setRelationListData] = useState([]);
  const [HospitalTypeListData, setHospitalTypeListData] = useState([]);
  const [TextTransServicesName, setTextTransServicesName] = useState("");
  const [TextTransMemo, setTextTransMemo] = useState("");
  const [selectIndex, setselectIndex] = useState(0);
  const [isMyself, setisMyself] = useState(true);
  const [selectedImage, setSelectedImage] = useState([]);
  const [selectedBankImage, setSelectedBankImage] = useState([]);
  const [fileType, setFileType] = useState(null);
  const today = dayjs();
  const yesterday = dayjs().subtract(1, "day");
  const todayStartOfTheDay = today.startOf("day");
  const fileInputRef = useRef();

  const date = new Date();
  var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

  const handleCheckFileType = async (url) => {
    const type = await checkFileType(url);

    setFileType(type);
  };

  const getFileTypeFromExtension = (url) => {
    const extension = url.split(".").pop().toLowerCase();
    if (extension === "pdf") {
      setFileType("pdf");
    } else if (
      ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(extension)
    ) {
      setFileType("image");
    } else {
      setFileType("unknown");
    }

    console.log(extension);
  };

  ///DATABASE SELECT

  const fetchClinicListSelect = (HOSPITAL_TYPE_CD) => {
    // console.log("Vào fetch hospital again...", HOSPITAL_TYPE_CD);
    fetch(ClinicListURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ARG_TYPE: "Q",
        ARG_HOSPITAL_TYPE: HOSPITAL_TYPE_CD,
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
  const fetchHospitalTypeListSelect = async () => {
    fetch(HospitalTypeListURL, {
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
            setHospitalTypeListData(result);
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

  const fetchExchangeRateSelect = async (ARG_CURRENCY) => {
    fetch(ExchangeRateSelectURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ARG_TYPE: "Q",
        ARG_CURRENCY: ARG_CURRENCY,
        OUT_CURSOR: "",
      }),
    })
      .then((response) => {
        response.json().then(async (result) => {
          if (result.length > 0) {
            // console.log(result);

            setexChangeRateData(result[0]);
          }
        });
      })
      .catch((e) => console.log(e));
  };

  const HandleDefault = () => {
    fetchHospitalTypeListSelect();
    fetchClinicListSelect("T0001");
    fetchExchangeRateSelect("USD");
    // fetchUnitListSelect();
    setData(medicalfreeData);
    setselectIndex(0);
    setisMyself(true);
    setSelectedImage(null);
    setSelectedBankImage(null);
    setTextTransServicesName("");
    setTextTransMemo("");
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
          MEDICAL_CD: "M00011",
          MEDICAL_NAME: "BV Dong Nai",
          HOSPITAL_TYPE_CD: "T0001",
          EXCHANGE_RATE: data.EXCHANGE_RATE ? data.EXCHANGE_RATE : 1,
          SERVICE_NAME_TL: "",
          QTY: 1,
          CURRENCY: data.CURRENCY ? data.CURRENCY : "VND",
          ACCOUNT_NAME: empData.EMP_NM,
          // ACC_BANK_DOC: empData.ACC_BANK_DOC,
          CREATOR: getLastName(empData.EMP_NM),
          CREATE_PROGRAM_ID: "MEDICAL_FEE",
        };
      });

      fetch(MedicalAccountBankDocURL, {
        method: "POST",
        mode: "cors",
        dataType: "json",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ARG_TYPE: "Q",
          ARG_EMPID: empData.EMPID, //user name
          OUT_CURSOR: "",
        }),
      }).then((response) => {
        response.json().then(async (result1) => {
          if (result1.length > 0) {
            getFileTypeFromExtension(result1[0].ACC_BANK_DOC);
            setData((prevData) => {
              return {
                ...prevData,
                ACC_BANK_DOC: result1[0].ACC_BANK_DOC,
                ACCOUNT_NO: result1[0].ACCOUNT_NO,
                BANK_NAME:result1[0].BANK_NAME,
                BANK_CD:result1[0].BANK_CD
              };
            });
          }
        });
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

  const HandleHospitalSelectChange = (event) => {
    setData((prevData) => {
      return {
        ...prevData,
        [event.code]: event.value,
        [event.name]: event.label,
      };
    });
    setClinicListData([]);
    fetchClinicListSelect(event.value);
  };

  const HandleBankSelectChange = (event) => {
    setData((prevData) => {
      return {
        ...prevData,
        BANK_CD: event.value,
        BANK_NAME: event.label,
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

  const checkFileType = async (url) => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      if (contentType) {
        if (contentType.includes("application/pdf")) {
          return "pdf";
        } else if (contentType.includes("image")) {
          return "image";
        }
      }
      return "unknown";
    } catch (error) {
      console.error("Error fetching the URL:", error);
      return "error";
    }
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
      if (key === "QTY") {
        value = value.replace(",", "").replace(" VNĐ", "");
      } else if (key === "UNIT_PRICE" || key === "DISCOUNT_QTY") {
        value = Number(value.replace(",", "").replace(" VNĐ", "")).toFixed(2);
      }
      if (key !== "REMARKS" && key !== "DISCOUNT_QTY" && key !== "ACCOUNT_NO") {
        if (value === "") {
          isValid = false;
        }
      }
      // console.log(key, value, "valuedated: ", value !== "");
    }

    if (data.MEDICAL_CD === "" || data.HOSPITAL_TYPE_CD === "") {
      isValid = false;
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
            //console.log(uploadData);
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
                  response.json().then(async (result) => {
                    if (result.length > 0) {
                      //Upload Account Bank Image
                      if (selectedBankImage && selectedBankImage.length > 0) {
                        console.log(selectedBankImage);
                        await uploadMedicalBankImageFormData(
                          {
                            TYPE: "U",
                            EMP_ID: result[0].EMP_ID,
                            ACCOUNT_NO: data.ACCOUNT_NO,
                            BANK_CD: data.BANK_CD,
                            BANK_NAME: data.BANK_NAME,
                            CREATOR: result[0].CREATOR,
                            CREATE_PC: result[0].CREATE_PC,
                            CREATE_PROGRAM_ID: result[0].CREATE_PROGRAM_ID,
                          },
                          selectedBankImage[selectedBankImage.length - 1]
                        ).then((uploadData) => {
                          fetch(MedicalBankImageUploadURL, {
                            method: "POST",
                            body: uploadData,
                          }).then((response) => {
                            if (response.status === 200) {
                              //Upload OK
                              //Select Account Bank Document and Display for User
                              fetch(MedicalAccountBankDocURL, {
                                method: "POST",
                                mode: "cors",
                                dataType: "json",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  ARG_TYPE: "Q",
                                  ARG_EMPID: data.EMP_ID, //user name
                                  OUT_CURSOR: "",
                                }),
                              }).then((response) => {
                                response.json().then(async (result1) => {
                                  console.log(result1);
                                  if (result1.length > 0) {
                                    setData((prevData) => {
                                      getFileTypeFromExtension(
                                        result1[0].ACC_BANK_DOC
                                      );
                                      return {
                                        ...prevData,
                                        ACC_BANK_DOC: result1[0].ACC_BANK_DOC,
                                      };
                                    });
                                  }
                                });
                              });
                            } else {
                              //error
                            }
                          });
                        });
                      }

                      if (selectedImage && selectedImage.length > 0) {
                        selectedImage.map((item) => {
                          uploadMedicalImageFormData(
                            {
                              TYPE: "U",
                              TREAT_DATE: result[0].TREAT_DATE,
                              TREAT_SEQ: result[0].TREAT_SEQ,
                              EMP_ID: result[0].EMP_ID,
                              INVOICE_PIC_NAME: result[0].INVOICE_PIC_NAME,
                              CREATOR: result[0].CREATOR,
                              CREATE_PC: result[0].CREATE_PC,
                              CREATE_PROGRAM_ID: result[0].CREATE_PROGRAM_ID,
                            },
                            item
                          ).then((uploadData) => {
                            // console.log(uploadData);
                            // Display the key/value pairs
                            fetch(MedicalImageUploadURL, {
                              method: "POST",
                              body: uploadData,
                            }).then((response) => {
                              if (response.status === 200) {
                                // Swal.fire(
                                //   t("swal_success"),
                                //   t("swal_your_data_uploaded"),
                                //   "success"
                                // ).then(() => {
                                //   setTimeout(() => {
                                //     scrollToTop();
                                //     HandleDefault();
                                //   }, 500);
                                // });
                              } else {
                                //   Swal.fire(
                                //     t("swal_failed"),
                                //     t("swal_image_upload_error"),
                                //     "error"
                                //   ).then(() => {
                                //     setTimeout(() => {
                                //       scrollToTop();
                                //     }, 500);
                                //   });
                              }
                            });
                          });
                        });
                      }

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
                        t("swal_success"),
                        t("swal_your_data_uploaded"),
                        "success"
                      ).then(() => {
                        setTimeout(() => {
                          scrollToTop();
                          HandleDefault();
                        }, 500);
                      });
                    }
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

  const TestTrans = (name, textTarget) => {
    fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&f=text&dt=t&q=${textTarget}`,
      {
        method: "GET",
        dataType: "json",
      }
    )
      .then((response) => {
        response.json().then(async (result) => {
          //console.log(result);
          if (result[0] !== null) {
            let transText = "";
            result[0].forEach((item) => {
              transText += item[0];
            });
            switch (name) {
              case "SERVICE_NAME":
                setTextTransServicesName(transText);
                setData((prevData) => {
                  return {
                    ...prevData,
                    SERVICE_NAME_TL: transText,
                  };
                });
                break;
              default:
                setTextTransMemo(transText);
                setData((prevData) => {
                  return {
                    ...prevData,
                    MEMO_TL: transText,
                  };
                });
                break;
            }
          }
        });
      })
      .catch((error) => {
        // console.log(error);
        setTextTransServicesName(error.message);
      });
  };

  const TestTransv2 = (textTarget) => {
    fetch(
      `https://translation.googleapis.com/language/translate/v2?key=AIzaSyBJtlRHyvmlIXIbhxsuxASf1ZNhbjAyW_8&format=text&target=vi&q=${textTarget}`,
      {
        method: "POST",
        dataType: "json",
      }
    )
      .then((response) => {
        response.json().then(async (result) => {
          // console.log(result.data.translations);
          if (result.data.translations !== null) {
            setTextTransServicesName(
              result.data.translations[0].translatedText
            );

            setData((prevData) => {
              return {
                ...prevData,
                SERVICE_NAME_TL: result.data.translations[0].translatedText,
              };
            });
          }
        });
      })
      .catch((error) => {
        // console.log(error);
        setTextTransServicesName(error.message);
      });
  };

  const handleSubmitv2 = (event) => {
    event.preventDefault();
    let isValid = true;
    var formData = new FormData(event.target);
    for (var [key, value] of formData.entries()) {
      if (key === "QTY") {
        value = value.replace(",", "").replace(" VNĐ", "");
      } else if (key === "UNIT_PRICE" || key === "DISCOUNT_QTY") {
        value = Number(value.replace(",", "").replace(" VNĐ", "")).toFixed(2);
      }
      if (key !== "REMARKS" && key !== "DISCOUNT_QTY") {
        if (value === "") {
          isValid = false;
        }
      }
      // console.log(key, value, "valuedated: ", value !== "");
    }

    if (data.MEDICAL_CD === "" || data.HOSPITAL_TYPE_CD === "") {
      isValid = false;
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
        confirmButtonText: t("btn_confirm"),
        cancelButtonText: t("btn_cancel"),
      }).then((result) => {
        if (result.isConfirmed) {
          //Upload Data
          //  alert(JSON.stringify(data));
          uploadMedicalFormData(data).then((uploadData) => {
            // console.log(data);
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
                        <Collapse in={true}>
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
                              placeholder="It's Me!"
                              isDisabled={isMyself}
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
                <FormTitle order="3" title={t("title_medical_bank")} />
                <Box className="s-form-content">
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={12} lg={12}>
                      <TextField
                        disabled
                        name="ACCOUNT_NAME"
                        // error={data.ACCOUNT_NAME === ""}
                        value={data.ACCOUNT_NAME}
                        label={t("frm_account_name")}
                        placeholder={t("frm_account_name")}
                        color="info"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6} lg={6}>
                      <TextField
                        name="ACCOUNT_NO"
                        // error={data.ACCOUNT_NO === ""}
                        value={data.ACCOUNT_NO}
                        label={t("frm_account_no")}
                        
                        placeholder={t("frm_account_no")}
                        color="info"
                        fullWidth
                        inputProps={{
                          inputMode: "numeric",
                          // pattern: "[0-9/,]*",
                          maxLength: 20,
                        }}
                        InputProps={{
                          inputComponent: NumericFormat,
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccountBalanceWalletIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => HandleControlsChange(event)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6} lg={6}>
                    {/* <TextField
                        name="BANK_NAME"
                        // error={data.ACCOUNT_NO === ""}
                        value={data.BANK_NAME}
                        label={t("frm_bank_nm")}
                        disabled
                        placeholder={t("frm_bank_nm")}
                        color="info"
                        fullWidth
                       
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccountBalanceWalletIcon />
                            </InputAdornment>
                          ),
                        }}
                      /> */}
                      <Box
                        sx={{
                          paddingTop: "0px",
                          marginTop: "-20px",
                        }}
                      >
                        <FormLabel
                          sx={{
                            fontSize: "12px",
                            top: "12px",
                            left: "10px",
                            backgroundColor: "white",
                            zIndex: 999,
                            paddingX: "2px",
                          }}
                        >
                          {t("frm_bank_nm")}
                        </FormLabel>
                        <Select
                          defaultValue={BankOptions[0]}
                          value={BankOptions.filter(
                            (item) => item.value === data.BANK_CD
                          )}
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? "border-red-600"
                                : "border-grey-300",
                          }}
                          textFieldProps={{
                            label: "Label",
                            InputLabelProps: {
                              shrink: true,
                            },
                          }}
                          styles={{
                            option: (
                              base,
                              { data, isDisabled, isFocused, isSelected }
                            ) => ({
                              ...base,
                              backgroundColor: isSelected
                                ? "navy"
                                : isFocused
                                ? "#00B2E2"
                                : "#ffffff",
                            }),
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
                          options={BankOptions}
                          theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                              ...theme.colors,
                              primary25: "orangered",
                              primary: "#0f005f",
                            },
                          })}
                          onChange={(event) => HandleBankSelectChange(event)}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={12} lg={12}>
                      <Stack spacing={1}>
                        {data.ACC_BANK_DOC !== "Not Found" &&
                        fileType === "pdf" ? (
                          <Button
                            sx={{
                              textTransform: "none",
                            }}
                            color="success"
                            variant="outlined"
                            endIcon={<AssignmentTurnedInIcon />}
                            onClick={() =>
                              window.open(
                                `http://vjweb.dskorea.com:9000/${data.ACC_BANK_DOC}`,
                                "_blank",
                                "resizable=yes"
                              )
                            }
                          >
                            {t("btn_already_upload_acc_bank_doc")}
                          </Button>
                        ) : fileType === "image" ? (
                          <img
                            style={{
                              borderRadius: "5px",
                            }}
                            alt="not found"
                            width={"100%"}
                            src={`http://vjweb.dskorea.com:9000/${data.ACC_BANK_DOC}`}
                          />
                        ) : null}
                        <Alert severity="info">
                          {t("text_uploader_once_infor")}
                        </Alert>
                        <Uploader
                          fullWidth
                          style={{
                            width: "100%",
                          }}
                          type="file"
                          action=""
                          // accept="application/pdf"
                          acceptType={["pdf,jpg,jpeg,png"]}
                          draggable
                          autoUpload={false}
                          listType="picture-text"
                          multiple={false}
                          fileList={selectedBankImage}
                          onChange={setSelectedBankImage}
                          shouldQueueUpdate={(fileList) => {
                            console.log(fileList[fileList.length - 1]);
                            var re = /(?:\.([^.]+))?$/;
                            return new Promise((resolve) => {
                              setTimeout(() => {
                                if (fileList.length > 0) {
                                  fileList.map((file, index) => {
                                    if (
                                      re.exec(file.name)[1] === "jpg" ||
                                      re.exec(file.name)[1] === "png" ||
                                      re.exec(file.name)[1] === "jpeg" ||
                                      re.exec(file.name)[1] === "pdf"
                                    ) {
                                      resolve(true);
                                    } else {
                                      // console.log(re.exec(file.name)[1]);
                                      alert(
                                        "Please select the file with the required format."
                                      );
                                      fileList.splice(index, 1);
                                      resolve(false);
                                    }
                                  });
                                }
                              });
                            });
                          }}
                        >
                          <div
                            style={{
                              height: 150,
                              width: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "3px dashed #3e79f0",
                              borderRadius: "5px",
                            }}
                          >
                            <CloudUploadIcon
                              sx={{ fontSize: 55, color: "#005abc" }}
                            />
                            <span>{t("plholder_upload_img")}</span>
                          </div>
                        </Uploader>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>

              <Stack direction="column">
                <FormTitle order="4" title={t("title_medical_third")} />
                <Box className="s-form-content">
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={12}>
                      <DateBox
                        inputAttr={{
                          readonly: "true",
                        }}
                        min={firstDay}
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
                    <Grid item xs={12} md={12}>
                      <Box
                        sx={{
                          paddingTop: "0px",
                          marginTop: "-20px",
                        }}
                      >
                        <FormLabel
                          sx={{
                            fontSize: "12px",
                            top: "12px",
                            left: "10px",
                            backgroundColor: "white",
                            zIndex: 999,
                            paddingX: "2px",
                          }}
                        >
                          {t("frm_medical_type_nm")}
                        </FormLabel>
                        <Select
                          defaultValue={HospitalTypeListData[selectIndex]}
                          value={HospitalTypeListData.filter(
                            (item) => item.value === data.HOSPITAL_TYPE_CD
                          )}
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? "border-red-600"
                                : "border-grey-300",
                          }}
                          textFieldProps={{
                            label: "Label",
                            InputLabelProps: {
                              shrink: true,
                            },
                          }}
                          styles={{
                            option: (
                              base,
                              { data, isDisabled, isFocused, isSelected }
                            ) => ({
                              ...base,
                              backgroundColor: isSelected
                                ? "navy"
                                : isFocused
                                ? "#00B2E2"
                                : "#ffffff",
                              color: isSelected
                                ? "white"
                                : isFocused
                                ? "white"
                                : data.TEXT_COLOR,
                            }),
                            control: (base, { isDisabled, isFocused }) => ({
                              ...base,
                              borderRadius: 5,
                              border: `1px solid ${
                                isFocused
                                  ? "#00B2E2"
                                  : data.HOSPITAL_TYPE_CD === ""
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
                          options={HospitalTypeListData}
                          theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                              ...theme.colors,
                              primary25: "orangered",
                              primary: "#0f005f",
                            },
                          })}
                          onChange={(event) =>
                            HandleHospitalSelectChange(event)
                          }
                        />
                      </Box>
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
                      <Box
                        sx={{
                          paddingTop: "0px",
                          marginTop: "-20px",
                        }}
                      >
                        <FormLabel
                          sx={{
                            fontSize: "12px",
                            top: "12px",
                            left: "10px",
                            backgroundColor: "white",
                            zIndex: 999,
                            paddingX: "2px",
                          }}
                        >
                          {t("frm_medical_nm")}
                        </FormLabel>
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
                          textFieldProps={{
                            label: "Label",
                            InputLabelProps: {
                              shrink: true,
                            },
                          }}
                          styles={{
                            option: (
                              base,
                              { data, isDisabled, isFocused, isSelected }
                            ) => ({
                              ...base,
                              backgroundColor:
                                data.label === "Add New Hospital"
                                  ? isSelected
                                    ? "navy"
                                    : "#e65522"
                                  : isSelected
                                  ? "navy"
                                  : isFocused
                                  ? "#00B2E2"
                                  : "#ffffff",
                              color:
                                data.label === "Add New Hospital"
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
                      </Box>
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
                    <Grid item xs={12} md={12}>
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
                        onBlur={(event) => {
                          TestTrans(
                            "SERVICE_NAME",
                            encodeURIComponent(event.target.value)
                          );
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

                    {TextTransServicesName && (
                      <Grid item xs={12} md={12}>
                        <Collapse in={TextTransServicesName}>
                          <TextField
                            label={t("frm_translate_to_vietnamese")}
                            fullWidth
                            disabled
                            multiline
                            value={TextTransServicesName}
                            variant="standard"
                            sx={{
                              color: "hotpink",
                              fontSize: "14px",
                            }}
                          />
                        </Collapse>
                      </Grid>
                    )}
                    <Collapse in={false}>
                      <Grid item xs={12} md={4}>
                        {/* <TextField
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
                        /> */}
                      </Grid>
                    </Collapse>

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
                    <Grid item xs={12} md={12}>
                      <Box
                        fullWidth
                        // alignItems={"center"}
                        bgcolor={"#829fbd"}
                        borderRadius={"5px"}
                      >
                        {/* <Typography>
                          {exChangeRateData.EXCHANGE_RATE}
                        </Typography> */}
                        <FormLabel
                          sx={{
                            marginLeft: 1,
                            color: "white",
                            textAlign: "center",
                          }}
                          id="demo-row-radio-buttons-group-label"
                        >
                          {t("frm_currency")}
                        </FormLabel>
                        <RadioGroup
                          name="CURRENCY"
                          value={data.CURRENCY}
                          row
                          sx={{
                            border: "2px dashed #4b50f0",
                            borderRadius: "5px",
                            // justifyContent: "center",
                            backgroundColor: "#e6f2ff",
                          }}
                          onChange={(event) => {
                            setData((prevData) => {
                              return {
                                ...prevData,
                                EXCHANGE_RATE:
                                  event.target.value === "USD"
                                    ? exChangeRateData.EXCHANGE_RATE
                                    : event.target.value === "WON"
                                    ? krwExchangeRate
                                    : 1,
                                CURRENCY: event.target.value,
                              };
                            });
                          }}
                        >
                          <FormControlLabel
                            fullWidth
                            sx={{
                              justifyContent: "center",
                            }}
                            value="WON"
                            control={<Radio color="primary" />}
                            label={
                              <Typography
                                sx={{
                                  fontWeight: "bold",
                                  color: "navy",
                                }}
                              >
                                WON
                              </Typography>
                            }
                          />
                          <FormControlLabel
                            fullWidth
                            sx={{
                              justifyContent: "center",
                            }}
                            justifyContent="center"
                            value="USD"
                            color="success"
                            control={
                              <Radio
                                sx={{
                                  color: pink[800],
                                  "&.Mui-checked": {
                                    color: pink[600],
                                  },
                                }}
                              />
                            }
                            label={
                              <Typography
                                sx={{
                                  fontWeight: "bold",
                                  color: "navy",
                                }}
                              >
                                USD
                              </Typography>
                            }
                          />
                          <FormControlLabel
                            fullWidth
                            sx={{
                              justifyContent: "center",
                            }}
                            justifyContent="center"
                            value="VND"
                            control={<Radio color="secondary" />}
                            label={
                              <Typography
                                sx={{
                                  fontWeight: "bold",
                                  color: "navy",
                                }}
                              >
                                VND
                              </Typography>
                            }
                          />
                        </RadioGroup>
                      </Box>
                    </Grid>
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
                          inputComponent: NumericFormatThounsand,
                          startAdornment: (
                            <InputAdornment position="start">
                              <PriceChangeIcon />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <Typography
                              sx={{
                                px: 2,
                                py: 0.5,
                                backgroundColor: "navy",
                                fontWeight: "bold",
                                color: "white",
                              }}
                            >
                              {data.CURRENCY}
                            </Typography>
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
                          inputComponent: NumericFormatThounsand,
                          startAdornment: (
                            <InputAdornment position="start">
                              <DiscountIcon />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <Typography
                              sx={{
                                px: 2,
                                py: 0.5,
                                backgroundColor: "navy",
                                fontWeight: "bold",
                                color: "white",
                              }}
                            >
                              {data.CURRENCY}
                            </Typography>
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
                            : (data.UNIT_PRICE * data.QTY - data.DISCOUNT_QTY) *
                              data.EXCHANGE_RATE
                        }
                        label={t("frm_amount_price")}
                        disabled
                        placeholder={t("frm_amount_price")}
                        fullWidth
                        color="warning"
                        InputProps={{
                          inputComponent: NumericFormatThounsand,
                          // endAdornment: (
                          //   <InputAdornment position="start">
                          //     <MonetizationOnIcon />
                          //   </InputAdornment>
                          // ),
                          endAdornment: (
                            <InputAdornment position="start">
                              <Typography
                                sx={{
                                  fontWeight: "bold",
                                  color: "navy",
                                  fontSize: "1.2em",
                                }}
                              >
                                VND
                              </Typography>
                            </InputAdornment>
                          ),
                          inputProps: {
                            style: { textAlign: "center" },
                          },
                        }}
                        onChange={(event) => {
                          setData((prevData) => {
                            return {
                              ...prevData,
                              AMOUNT_QTY: event.target.value,
                            };
                          });
                        }}
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
                        onBlur={(event) => {
                          TestTrans(
                            "REMARKS",
                            encodeURIComponent(event.target.value)
                          );
                        }}
                      />
                    </Grid>

                    {TextTransMemo && (
                      <Grid item xs={12} md={12}>
                        <Collapse in={TextTransMemo}>
                          <TextField
                            label={t("frm_translate_to_vietnamese")}
                            fullWidth
                            disabled
                            multiline
                            value={TextTransMemo}
                            variant="standard"
                            sx={{
                              color: "hotpink",
                              fontSize: "14px",
                            }}
                          />
                        </Collapse>
                      </Grid>
                    )}

                    {/* <Grid item sx={12} md={12} width={"100%"}>
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
                                backgroundColor: "navy",
                              }}
                              startIcon={<AddPhotoAlternateIcon />}
                              variant="contained"
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
                                  var scaleFactor = 800 / el.target.width;
                                  elem.width = 800;
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
                    </Grid> */}
                    <Grid item xs={12} md={12} lg={12}>
                      <Stack spacing={1}>
                        {" "}
                        <Alert severity="info">
                          {t("text_uploader_infor")}
                        </Alert>
                        <Uploader
                          fullWidth
                          style={{
                            width: "100%",
                          }}
                          type="file"
                          action=""
                          accept="application/pdf"
                          acceptType={["pdf"]}
                          draggable
                          autoUpload={false}
                          listType="picture-text"
                          multiple={true}
                          fileList={selectedImage}
                          onChange={setSelectedImage}
                          shouldQueueUpdate={(fileList) => {
                            // console.log(fileList);
                            var re = /(?:\.([^.]+))?$/;

                            return new Promise((resolve) => {
                              setTimeout(() => {
                                if (fileList.length > 0) {
                                  fileList.map((file, index) => {
                                    if (
                                      // re.exec(file.name)[1] === "jpg" ||
                                      // re.exec(file.name)[1] === "png" ||
                                      // re.exec(file.name)[1] === "jpeg" ||
                                      re.exec(file.name)[1] === "pdf"
                                    ) {
                                      resolve(true);
                                    } else {
                                      // console.log(re.exec(file.name)[1]);
                                      alert(
                                        "Please select the file with the required format."
                                      );
                                      fileList.splice(index, 1);
                                      resolve(false);
                                    }
                                  });
                                }
                              });
                            });
                          }}
                        >
                          <div
                            style={{
                              height: 150,
                              width: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "3px dashed #3e79f0",
                              borderRadius: "5px",
                            }}
                          >
                            <CloudUploadIcon
                              sx={{ fontSize: 55, color: "#005abc" }}
                            />
                            <span>{t("plholder_upload_img")}</span>
                          </div>
                        </Uploader>
                      </Stack>
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
