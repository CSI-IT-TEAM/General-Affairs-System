import {
  Box,
  Container,
  Grid,
  TextField,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18next from "i18next";
import {
  SelectModal,
  ButtonPrimary,
  FormTitle,
  ModalWarning,
  ModalInfo,
  FormDefaultInfo,
  ResponsiveDateTime,
  KoreaPassengerInfo,
  VietnamPassengerInfo,
} from "../../components";
import InputAdornment from "@mui/material/InputAdornment";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";

import {
  reqCarData,
  reqCarValidate,
  passengerNum,
  uploadCarData,
} from "../../data";
import {
  getDate,
  getDateTime,
  formatDate,
  formatHMS,
  getDateFormat,
  getDateTimeFormat,
} from "../../function/getDate";
import getDevice from "../../function/getDevice";
import {
  isCombackDate_Validate,
  timeDifference,
} from "../../function/getValidate";
import { getLastName } from "../../function/getLastName";
import { uploadURL } from "../../api";

import "./Form.scss";
import React from "react";

const FormCar = () => {
  const navigate = useNavigate();
  const _specificTime = " 160000";

  /////// Handle Checkbox
  const [isInclude, setIsInclude] = useState(false);

  /////// Handle Radio Korean or Vietnamese
  const [PassengerNameList, setPassengerNameList] = useState("Korea");

  /////// Open Text Field for Pick Up: ETC
  const [openPickUp, setOpenPickUp] = useState(false);

  /////// Translate Lang
  const { t } = useTranslation();
  const langCookie = i18next.language;
  const [lang, setLang] = useState(langCookie);

  useEffect(() => {
    setLang(i18next.language);
  }, [langCookie]);

  const [type, setType] = useState("connect-failed");

  /////// Request Data
  const [data, setData] = useState(reqCarData);
  const [validate, setValidate] = useState(reqCarValidate);
  const [reason, setReason] = useState(null);
  const [passengerList, setPassengerList] = useState([]);
  const [passengerSelectList, setpassengerSelectList] = useState([]);
  const [PassengerCount, setPassengerCount] = useState(1);
  const [PassengerDeptCount, setPassengerDeptCount] = useState(1);
  const [DeptName, setDeptName] = useState("");
  /////// Handle Warning Modal
  const [openWarn, setOpenWarn] = useState(false);
  const handleOpenWarn = () => setOpenWarn(true);
  const handleCloseWarn = () => setOpenWarn(false);

  /////// Handle Warning Modal
  const [openInfo, setOpenInfo] = useState(false);
  const handleCloseInfo = () => setOpenInfo(false);

  ////// List Data From Session
  let _mainReason = JSON.parse(sessionStorage.getItem("mainReason"));
  let _subReason = JSON.parse(sessionStorage.getItem("subReason"));
  let _departList = JSON.parse(sessionStorage.getItem("departList"));
  let _dropOffList = JSON.parse(sessionStorage.getItem("dropOffList"));
  let _deptEmpList = JSON.parse(sessionStorage.getItem("deptEmpList"));
  let _EXPList = JSON.parse(sessionStorage.getItem("EXPList"));
  let _DEPTList = JSON.parse(sessionStorage.getItem("DeptList"));

  ////// Search EMP ID
  const [empID, setEmpID] = useState("");
  const [empName, setempName] = useState("");

  async function CalcPassengers() {
    try {
      var PassengerCounts = 0;
      const empData = JSON.parse(sessionStorage.getItem("userData"));
      var _arrList = [];
      if (isInclude) {
        console.log("Bao gồm tôi");
        _arrList.push({
          id: empData.EMPID,
          name: empData.EMP_NM,
          validate: true,
          dropOff: "",
          validDropOff: true,
        });
      }

      //If selected Korea, then add Korean Passengers
      if (passengerSelectList !== null && passengerSelectList.length > 0) {
        for (var i = 0; i < passengerSelectList.length; i++) {
          var EMPID = passengerSelectList[i];
          var EXPs = _EXPList.filter((item) => item.EMPID === EMPID);
          if (EXPs.length > 0) {
            _arrList.push({
              id: EMPID,
              name: EXPs[0].NAME,
              validate: true,
              dropOff: "",
              validDropOff: true,
            });
          }
        }
      }
      //if selected dept then add dept to the list
      if (DeptName && PassengerDeptCount !== "") {
        _arrList.push({
          id: DeptName,
          name: DeptName + "-" + PassengerDeptCount,
          validate: true,
          dropOff: "",
          validDropOff: true,
        });
      }

      PassengerCounts =
        parseInt(passengerSelectList.length) +
        parseInt(
          DeptName === "" || PassengerDeptCount === "" ? 0 : PassengerDeptCount
        ) +
        (isInclude ? 1 : 0);
      console.log(PassengerCounts);
    } catch (e) {
      console.log(e.message);
      return [];
    }

    return [_arrList, PassengerCounts];
  }
  const handleClearClick = () => {
    setpassengerSelectList([]);
  };

  const handlePassengerList = (value) => {
    const _result = passengerList.map((item) => {
      if (item.id === "passenger_1") {
        return {
          ...item,
          name: value,
          validate: value === "" ? false : true,
        };
      } else {
        return item;
      }
    });

    setPassengerList((prevData) => _result);
  };
  ///PassengerKorean List Select
  const handlePassengerSelect = (
    event: React.SelectChangeEvent<HTMLInputElement>
  ) => {
    setpassengerSelectList(event);
  };
  //Passenger IN Dept Select
  const handleDeptSelect = (
    event: React.SelectChangeEvent<HTMLInputElement>
  ) => {
    //typeof value === "string" ? value.split(",") : value
    console.log(event);
    setDeptName(event);
  };

  //Number Of Passenger in Dept
  const HandlePassengerChange = (
    value: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log(value);

    setPassengerDeptCount(value);
    setData((prevData) => {
      return {
        ...prevData,
      };
    });
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isInclude) {
      if (_deptEmpList !== null && _deptEmpList.length > 0) {
        let _searchResult = _deptEmpList.filter((item) =>
          item.EMPID.includes(event.target.value)
        );

        if (
          _searchResult !== null &&
          _searchResult !== "" &&
          _searchResult.length > 0
        ) {
          handlePassengerList(_searchResult[0].EMP_NM);
        } else {
          handlePassengerList("");
        }
      }
    }
    // setEmpID(event.target.value);

    // if (event.target.value === "") {
    //   handlePassengerList("");
    // } else {
    //   if (_deptEmpList !== null && _deptEmpList.length > 0) {
    //     let _searchResult = _deptEmpList.filter((item) =>
    //       item.EMPID.includes(event.target.value)
    //     );

    //     if (
    //       _searchResult !== null &&
    //       _searchResult !== "" &&
    //       _searchResult.length > 0
    //     ) {
    //       handlePassengerList(_searchResult[0].EMP_NM);
    //     } else {
    //       handlePassengerList("");
    //     }
    //   }
    // }
  };
  //   for(let iCount = 1; iCount <= _result; iCount++){
  //     _arrList.push({
  //         id: "passenger_" + iCount,
  //         name: iCount === 1 && isInclude ? empData.EMP_NM : "",
  //         validate: iCount === 1 && isInclude ? true : false,
  //         dropOff: "",
  //         validDropOff: false,
  //     });
  // }
  ////// Handle Include Myself Event
  const handleIsInclude = () => {
    setIsInclude((isInclude) => !isInclude);
    const empData = JSON.parse(sessionStorage.getItem("userData"));
    if (!isInclude) {
      setempName(empData.EMP_NM);
    } else {
      setempName("");
    }
  };

  ////// Handle Include Myself Event
  const handleRadPassList = (event) => {
    console.log(event.target.value);
    setPassengerNameList(event.target.value);
    //setPassengerList([]);
    // setData((prevData) => {
    //   return {
    //     ...prevData,
    //     ["PASSENGERS_LIST_RD"]: event.target.value,
    //     ["PASSENGERS_COUNT"]: 0,
    //   };
    // });
  };

  /////// Handle Default Data
  const handleDefault = async () => {
    const empData = JSON.parse(sessionStorage.getItem("userData"));

    setOpenPickUp(false);
    setIsInclude(false);
    setPassengerList([]);
    setEmpID("");

    if (empData != null) {
      setData((prevData) => {
        return {
          ...prevData,
          REQ_DATE: getDate(),
          PLANT_CD: empData.PLANT_CD,
          PLANT_NM: empData.PLANT_NM,
          DEPT_CD: empData.DEPT,
          DEPT_NM: empData.DEPT_NM,
          REQ_EMP: empData.EMPID,
          REQ_EMP_NM: empData.EMP_NM,
          EMAIL_ADDRESS: empData.EMAIL,
          CREATOR: getLastName(empData.EMP_NM),
          CREATE_PROGRAM_ID: "GA_SYSTEM_REQUEST",
        };
      });
    } else {
      navigate("/signin");
    }
  };

  useEffect(() => {
    handleDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //////// Handle Set Controlled Data
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === "") {
      handleSetValidate(event.target.name, false);
    } else {
      handleSetValidate(event.target.name, true);
    }

    setData((prevData) => {
      return {
        ...prevData,
        [event.target.name]: event.target.value,
      };
    });
  };

  const handleChangeSub = (name, value) => {
    let _result = "";

    switch (name) {
      case "GO_DATE":
      case "COMEBACK_DATE": {
        _result = formatDate(value);
        break;
      }
      case "GO_TIME":
      case "COMEBACK_TIME": {
        _result = formatHMS(value);
        break;
      }
      default: {
        console.log(name);
        console.log(value);
        _result = value;
        break;
      }
    }

    switch (name) {
      case "GO_DATE": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            GO_DATE_FULL: value,
          };
        });

        /////// If Depart Date is Today && Current Time >= 14:00 PM => Invalidate
        const _currentDateTime = getDateTime();
        let _specificDateTime = getDate() + _specificTime;
        let _checkValidate = isCombackDate_Validate(
          _currentDateTime,
          _specificDateTime
        );

        if (_result === getDate() && !_checkValidate) {
          handleSetValidate(
            "GO_DATE",
            false,
            "The depart date must start from tomorrow",
            "Ngày xuất phát phải từ ngày mai trở đi"
          );
          break;
        } else {
          handleSetValidate("GO_DATE", true);
        }

        /////// If Depart Date > Current Time
        let _depart = getDateTimeFormat(_result + " " + data["GO_TIME"]);
        let _isValidate = timeDifference(_depart);

        if (_isValidate) {
          handleSetValidate("GO_DATE", true);
          handleSetValidate("GO_TIME", true);
        } else {
          handleSetValidate(
            "GO_DATE",
            false,
            "The return date and time must be 2 hours greater than the present time",
            "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại"
          );
          handleSetValidate(
            "GO_TIME",
            false,
            "The return date and time must be 2 hours greater than the present time",
            "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại"
          );
          break;
        }

        break;
      }
      case "COMEBACK_DATE": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            COMEBACK_DATE_FULL: value,
          };
        });

        let _isValidate = isCombackDate_Validate(
          getDateFormat(data["GO_DATE"]),
          getDateFormat(_result)
        );
        if (_isValidate) {
          handleSetValidate(name, true);
        } else {
          handleSetValidate(
            name,
            false,
            "Comback Date must equal or greater than Depart Date",
            "Ngày về phải lớn hơn hoặc bằng Ngày xuất phát"
          );
        }

        break;
      }
      case "GO_TIME": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            GO_TIME_FULL: value,
          };
        });

        /////// If Depart Date is Today && Current Time >= 14:00 PM => Invalidate
        const _currentDateTime = getDateTime();
        let _specificDateTime = getDate() + _specificTime;
        let _checkValidate = isCombackDate_Validate(
          _currentDateTime,
          _specificDateTime
        );

        if (data["GO_DATE"] === getDate() && !_checkValidate) {
          handleSetValidate(
            "GO_DATE",
            false,
            "The depart date must start from tomorrow",
            "Ngày xuất phát phải từ ngày mai trở đi"
          );
          break;
        } else {
          handleSetValidate("GO_DATE", true);
        }

        /////// If Depart Date Time > Current Date Time
        let _depart = getDateTimeFormat(data["GO_DATE"] + " " + _result);
        let _isValidate = timeDifference(_depart);

        if (_isValidate) {
          handleSetValidate("GO_DATE", true);
          handleSetValidate("GO_TIME", true);
        } else {
          handleSetValidate(
            "GO_DATE",
            false,
            "The return date and time must be 2 hours greater than the present time",
            "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại"
          );
          handleSetValidate(
            "GO_TIME",
            false,
            "The return date and time must be 2 hours greater than the present time",
            "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại"
          );
        }

        break;
      }
      case "COMEBACK_TIME": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            COMEBACK_TIME_FULL: value,
          };
        });

        let _depart = getDateTimeFormat(
          data["GO_DATE"] + " " + data["GO_TIME"]
        );
        let _comeback = getDateTimeFormat(
          data["COMEBACK_DATE"] + " " + _result
        );
        let _isValidate = isCombackDate_Validate(_depart, _comeback);

        if (_isValidate) {
          handleSetValidate(name, true);
        } else {
          handleSetValidate(
            name,
            false,
            "Comback Time must equal or greater than Depart Time",
            "Giờ về phải lớn hơn hoặc bằng Giờ xuất phát"
          );
        }

        break;
      }
      case "MAIN_REASON_CD": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            SUB_REASON_CD: "",
            ARRIVAL: "",
          };
        });
        setReason((prevData) => []);
        setReason((prevData) =>
          _subReason.filter((val) => val.MAIN_REASON_CD === _result)
        );

        if (_result === "") {
          handleSetValidate(name, false);
        } else {
          handleSetValidate(name, true);
        }

        break;
      }
      case "SUB_REASON_CD": {
        let data = _subReason.filter((val) => val.SUB_REASON_CD === _result);

        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            ARRIVAL: data[0].SUB_REASON_NM,
          };
        });

        if (_result === "") {
          handleSetValidate(name, false);
        } else {
          handleSetValidate(name, true);
        }

        break;
      }

      case "DEPART_CD": {
        let data = _departList.filter((val) => val.DEPART_CD === _result);

        if (_result !== "ETC") {
          setOpenPickUp(false);
          setData((prevData) => {
            return {
              ...prevData,
              [name]: _result,
              DEPART_NM: data[0].DEPART_NM,
            };
          });
        } else {
          setOpenPickUp(true);
          setData((prevData) => {
            return {
              ...prevData,
              [name]: _result,
              DEPART_NM: "",
            };
          });
        }

        if (_result === "") {
          handleSetValidate(name, false);
        } else {
          handleSetValidate(name, true);
        }

        break;
      }
      //case "MAN_QTY":
      // setPassengerList((prevData) => []);
      // let _arrList = [];
      // const empData = JSON.parse(sessionStorage.getItem("userData"));

      // for (let iCount = 1; iCount <= _result; iCount++) {
      //   _arrList.push({
      //     id: "passenger_" + iCount,
      //     name: iCount === 1 && isInclude ? empData.EMP_NM : "",
      //     validate: iCount === 1 && isInclude ? true : false,
      //     dropOff: "",
      //     validDropOff: false,
      //   });
      // }

      // setPassengerList((prevData) => _arrList);
      // setData((prevData) => {
      //   return {
      //     ...prevData,
      //     [name]: _result,
      //   };
      // });

      // if (_result === "") {
      //   handleSetValidate(name, false);
      // } else {
      //   handleSetValidate(name, true);
      // }
      // handleSetValidate(name, true);
      //break;

      default: {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
          };
        });

        break;
      }
    }
  };

  ///// Handle Passenger Name
  const handlePassengerName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const _result = passengerList.map((item) => {
      if (item.id === event.target.name) {
        return {
          ...item,
          name: event.target.value,
          validate: event.target.value === "" ? false : true,
        };
      } else {
        return item;
      }
    });

    setPassengerList((prevData) => _result);
  };

  ///// Handle Passenger Drop-off Place huỳnh
  // const handlePassengerDropOff = (name, value) => {
  //   const _result = passengerList.map((item) => {
  //     if (name.indexOf(item.id) > -1) {
  //       return {
  //         ...item,
  //         dropOff: value,
  //         validDropOff: true,
  //       };
  //     } else {
  //       return item;
  //     }
  //   });

  //   setPassengerList((prevData) => _result);
  // };
  ///// Handle Passenger Drop-off Place PHUOC EDIT
  const handlePassengerDropOff = (name, value) => {
    console.log(name + ": " + value);
  };

  //////Cancel Fetch API After Timeout
  const Timeout = (time) => {
    let controller = new AbortController();
    setTimeout(() => controller.abort(), time * 1000);
    return controller;
  };

  //////// Handle Upload Data
  const handleSubmit = async () => {
    // await CalcPassengers().then(async (result) => {
    //   if (result !== null && result.length > 0 && result[1] > 0) {
    //     await uploadCarData(data, result[0], result[1]).then(
    //       (uploadData) => {
    //         console.log(uploadData);
    //         // fetchUpload(uploadData);
    //       }
    //     );
    //   } else {
    //     alert(t("no_passengers_error"));
    //   }
    // });

    if (handleVaidate()) {

      if (handleValidateDepart()) {
        await CalcPassengers().then(async (result) => {
          if (result !== null && result.length > 0 && result[1] > 0) {
            await uploadCarData(data, result[0], result[1]).then(
              (uploadData) => {
               // console.log(uploadData);
                 fetchUpload(uploadData);
              }
            );
          } else {
            alert(t("no_passengers_error"));
          }
        });
      }
    }
  };

  const fetchUpload = async (dataConfig) => {
    fetch(uploadURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataConfig),
      signal: Timeout(5).signal,
    })
      .then((response) => {
        if (response.status === 200) {
          setType("upload-success");
          setOpenInfo(true);

          ///// Clear Form Data to Default
          setData((prev) => reqCarData);
          setValidate((prev) => reqCarValidate);
          handleDefault();
        } else {
          handleOpenWarn();
        }
      })
      .catch((error) => {
        setType("connect-failed");
        setOpenInfo(true);
      });
  };

  /////// Handle Validate Form Data
  const handleVaidate = () => {
    let _result = true;
    for (const property in data) {
      switch (property) {
        case "MAIN_REASON_CD":
        case "SUB_REASON_CD":
        case "GO_DATE":
        case "GO_TIME":
        case "DEPART_CD":
        case "DEPART_NM":
          if (data[property] === "") {
            _result = false;

            handleSetValidate(property, false);
          } else {
            handleSetValidate(property, true);
          }
          break;
        case "COMEBACK_DATE":
          if (data[property] === "") {
            _result = false;

            handleSetValidate(property, false);
          } else {
            let _isValidate = isCombackDate_Validate(
              getDateFormat(data["GO_DATE"]),
              getDateFormat(data["COMEBACK_DATE"])
            );
            if (_isValidate) {
              handleSetValidate(property, true);
            } else {
              _result = false;
              handleSetValidate(
                property,
                false,
                "Comback Date must equal or greater than Depart Date",
                "Ngày về phải lớn hơn hoặc bằng Ngày xuất phát"
              );
            }
          }
          break;
        case "COMEBACK_TIME":
          if (data[property] === "") {
            _result = false;
            handleSetValidate(property, false);
          } else {
            let _depart = getDateTimeFormat(
              data["GO_DATE"] + " " + data["GO_TIME"]
            );
            let _comeback = getDateTimeFormat(
              data["COMEBACK_DATE"] + " " + data["COMEBACK_TIME"]
            );
            let _isValidate = isCombackDate_Validate(_depart, _comeback);

            if (_isValidate) {
              handleSetValidate(property, true);
            } else {
              _result = false;
              handleSetValidate(
                property,
                false,
                "Comback Time must equal or greater than Depart Time",
                "Giờ về phải lớn hơn hoặc bằng Giờ xuất phát"
              );
            }
          }
          break;
        // case "MAN_QTY":
        //   if (data[property] === "" || isNaN(data[property])) {
        //     _result = false;
        //     handleSetValidate(property, false);
        //   } else {
        //     if (Number(data[property]) < 0) {
        //       _result = false;
        //       handleSetValidate(property, false);
        //     } else {
        //       handleSetValidate(property, true);
        //     }
        //   }
        //   break;
        default:
          break;
      }
    }
    console.log(passengerList);

    ////// Validate Passenger List
    // for (let iCount = 0; iCount < passengerList.length; iCount++) {
    //   if (
    //     passengerList[iCount].validate === false ||
    //     passengerList[iCount].validDropOff === false
    //   ) {
    //     _result = false;
    //     break;
    //   }
    // }

    console.log(_result);
    return _result;
  };

  /////// Handle Validate Data
  const handleSetValidate = (name, value, message = "", messageVN = "") => {
    setValidate((prevData) => {
      return {
        ...prevData,
        [name]: {
          validate: value,
          message: message !== "" ? message : validate[name].message,
          messageVN: messageVN !== "" ? messageVN : validate[name].messageVN,
        },
      };
    });
  };

  const handleValidateDepart = () => {
    if (data["GO_DATE"] === "" || data["GO_TIME"] === "") return false;
    let _result = true;

    let _depart = getDateTimeFormat(data["GO_DATE"] + " " + data["GO_TIME"]);
    let _isValidate = timeDifference(_depart);

    if (_isValidate) {
      handleSetValidate("GO_DATE", true);
      handleSetValidate("GO_TIME", true);
    } else {
      _result = false;
      handleSetValidate(
        "GO_DATE",
        false,
        "The return date and time must be 2 hours greater than the present time",
        "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại"
      );
      handleSetValidate(
        "GO_TIME",
        false,
        "The return date and time must be 2 hours greater than the present time",
        "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại"
      );
    }

    /////// If Depart Date is Today && Current Time >= 14:00 PM => Invalidate
    const _currentDateTime = getDateTime();
    let _specificDateTime = getDate() + _specificTime;
    let _checkValidate = isCombackDate_Validate(
      _currentDateTime,
      _specificDateTime
    );

    if (data["GO_DATE"] === getDate() && !_checkValidate) {
      _result = false;
      handleSetValidate(
        "GO_DATE",
        false,
        "The depart date must start from tomorrow",
        "Ngày xuất phát phải từ ngày mai trở đi"
      );
    } else {
      handleSetValidate("GO_DATE", true);
    }

    return _result;
  };

  return (
    <>
      <Box className="s-form">
        <Container>
          <h3 className="s-form-title">
            {t("request")} <span>{t("vehicle")}</span>
          </h3>
          <Box className="s-form-content">
            <form>
              <FormTitle order="1" title={t("title_first")} />
              <FormDefaultInfo data={data} />
              <FormTitle order="2" title={t("title_second")} />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems="center"
                className="b-text-select b-spec"
              >
                <Typography
                  variant="h6"
                  className="b-text-input__title b-italic"
                >
                  {t("frm_reason")} <span>(*)</span>
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4} xl={3}>
                    <SelectModal
                      name="MAIN_REASON_CD"
                      data={_mainReason}
                      placeholder={t("frm_reason_placeholder")}
                      cValue={data.MAIN_REASON_CD}
                      handleEvent={handleChangeSub}
                      isValidate={validate.MAIN_REASON_CD.validate}
                      message={
                        lang === "en"
                          ? validate.MAIN_REASON_CD.message
                          : validate.MAIN_REASON_CD.messageVN
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={8} xl={9}>
                    <SelectModal
                      name="SUB_REASON_CD"
                      data={reason}
                      placeholder={t("frm_reason_detail_placeholder")}
                      cValue={data.SUB_REASON_CD}
                      handleEvent={handleChangeSub}
                      isValidate={validate.SUB_REASON_CD.validate}
                      message={
                        lang === "en"
                          ? validate.SUB_REASON_CD.message
                          : validate.SUB_REASON_CD.messageVN
                      }
                    />
                  </Grid>
                </Grid>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ResponsiveDateTime
                    type="DATE"
                    title={t("frm_depart_date")}
                    placeholder={t("frm_depart_date_placeholder")}
                    name="GO_DATE"
                    cValue={getDevice() ? data.GO_DATE_FULL : data.GO_DATE}
                    handleChange={handleChangeSub}
                    isValidate={validate.GO_DATE.validate}
                    validMessage={
                      lang === "en"
                        ? validate.GO_DATE.message
                        : validate.GO_DATE.messageVN
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ResponsiveDateTime
                    type="TIME"
                    title={t("frm_depart_time")}
                    placeholder={t("frm_depart_time_placeholder")}
                    name="GO_TIME"
                    cValue={data.GO_TIME_FULL}
                    handleChange={handleChangeSub}
                    isValidate={validate.GO_TIME.validate}
                    validMessage={
                      lang === "en"
                        ? validate.GO_TIME.message
                        : validate.GO_TIME.messageVN
                    }
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ResponsiveDateTime
                    type="DATE"
                    title={t("frm_cb_date")}
                    placeholder={t("frm_cb_date_placeholder")}
                    name="COMEBACK_DATE"
                    cValue={
                      getDevice() ? data.COMEBACK_DATE_FULL : data.COMEBACK_DATE
                    }
                    handleChange={handleChangeSub}
                    isValidate={validate.COMEBACK_DATE.validate}
                    validMessage={
                      lang === "en"
                        ? validate.COMEBACK_DATE.message
                        : validate.COMEBACK_DATE.messageVN
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ResponsiveDateTime
                    type="TIME"
                    title={t("frm_cb_time")}
                    placeholder={t("frm_cb_time_placeholder")}
                    name="COMEBACK_TIME"
                    cValue={data.COMEBACK_TIME_FULL}
                    handleChange={handleChangeSub}
                    isValidate={validate.COMEBACK_TIME.validate}
                    validMessage={
                      lang === "en"
                        ? validate.COMEBACK_TIME.message
                        : validate.COMEBACK_TIME.messageVN
                    }
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Stack
                    marginBottom={2}
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "normal", sm: "center" }}
                    className="b-text-input"
                  >
                    <Typography
                      variant="h6"
                      className="b-text-input__title b-italic"
                    >
                      {t("frm_pickup")} <span>(*)</span>
                    </Typography>
                    <Stack sx={{ width: "100%" }}>
                      <SelectModal
                        name="DEPART_CD"
                        data={_departList}
                        placeholder={t("frm_pickup_placeholder")}
                        cValue={data.DEPART_CD}
                        handleEvent={handleChangeSub}
                        isValidate={validate.DEPART_CD.validate}
                        message={
                          lang === "en"
                            ? validate.DEPART_CD.message
                            : validate.DEPART_CD.messageVN
                        }
                      />
                      {openPickUp && (
                        <>
                          <TextField
                            name="DEPART_NM"
                            className="b-text-input__desc b-text-input__desc--sub"
                            disabled={false}
                            placeholder="Type place to pick up"
                            color="info"
                            fullWidth
                            value={data.DEPART_NM}
                            onChange={handleChange}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <PlaceOutlinedIcon />
                                </InputAdornment>
                              ),
                            }}
                          />
                          {!validate.DEPART_NM.validate && (
                            <Typography className="b-validate">
                              <HighlightOffIcon
                                sx={{ width: "17px", height: "17px" }}
                              />
                              {t("frm_required")}
                            </Typography>
                          )}
                        </>
                      )}
                    </Stack>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack
                    marginBottom={2}
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "normal", sm: "center" }}
                    className="b-text-input"
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                          onChange={handleIsInclude}
                        />
                      }
                      label={t("frm_include_me")}
                    />
                    <Stack sx={{ width: "100%" }}>
                      {isInclude && (
                        <Grid item>
                          <Stack
                            sx={{ width: "100%" }}
                            direction="row"
                            alignItems="center"
                            className="s-form-sub"
                          >
                            <SquareRoundedIcon sx={{ fontSize: 12 }} />
                            <Typography
                              variant="h6"
                              className="b-text-input__sub b-italic"
                            >
                              {`${t("frm_txt_passenger_placeholder")}`}
                            </Typography>
                          </Stack>
                          <TextField
                            className="b-text-input__desc"
                            disabled={true}
                            placeholder={t("frm_pass_placeholder")}
                            color="info"
                            fullWidth
                            value={empName}
                          />
                        </Grid>
                      )}
                    </Stack>
                  </Stack>
                </Grid>

                {/* <Stack
                    marginBottom={2}
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "normal", sm: "center" }}
                    className="b-text-input"
                  > */}
                {/* <Typography
                      variant="h6"
                      className="b-text-input__title b-italic"
                    >
                      {t("frm_passenger")} <span>(*)</span>
                    </Typography> */}
                {/* <Stack
                      sx={{ width: "100%" }}
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="center"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    > */}
                {/* <SelectModal
                        name="MAN_QTY"
                        data={passengerNum}
                        placeholder={t("frm_passenger_placeholder")}
                        cValue={data.MAN_QTY}
                        handleEvent={handleChangeSub}
                        isValidate={validate.MAN_QTY.validate}
                        message={
                          lang === "en"
                            ? validate.MAN_QTY.message
                            : validate.MAN_QTY.messageVN
                        }
                      /> */}
                {/* <FormControlLabel
                      control={
                        <Checkbox
                          sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                          onChange={handleIsInclude}
                        />
                      }
                      label={t("frm_include_me")}
                    /> */}
                {/* </Stack> */}
                {/* {isInclude && (
                      <Grid item xs={12} md={6}>
                        <Stack
                          sx={{ width: "100%" }}
                          direction="row"
                          alignItems="center"
                          className="s-form-sub"
                        >
                          <SquareRoundedIcon sx={{ fontSize: 12 }} />
                          <Typography
                            variant="h6"
                            className="b-text-input__sub b-italic"
                          >
                            {`${t("frm_txt_passenger_placeholder")}`}
                          </Typography>
                        </Stack>
                        <TextField
                          inputProps={{
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                          }}
                          className="b-text-input__desc"
                          disabled={true}
                          placeholder={t("frm_pass_placeholder")}
                          color="info"
                          fullWidth
                          value={empName}
                        />
                      </Grid>
                    )} */}
                {/* </Stack> */}
                {/* <Grid item>
                  <Stack sx={{ width: "100%" }}>
                    <FormControl>
                      <Typography
                        variant="h6"
                        className="b-text-input__title b-italic"
                      >
                        {t("frm_passengers_list")} <span>(*)</span>
                      </Typography>
                      <RadioGroup
                        row
                        aria-labelledby="demo-row-radio-buttons-group-label"
                        name="PASSENGERS_LIST_RD"
                        value={PassengerNameList}
                        onChange={handleRadPassList}
                      >
                        <FormControlLabel
                          color="success"
                          name="KOREA"
                          value="Korea"
                          control={<Radio />}
                          label={t("frm_korea_list")}
                        />
                        <FormControlLabel
                          color="secondary"
                          value="VietNam"
                          name="VIETNAM"
                          control={<Radio />}
                          label={t("frm_vietnam_list")}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Stack>
                </Grid> */}

                {/* {passengerList.map((item, index) => { */}
                {/* // if (!isInclude && index === 0) {
                        //   return (
                        //     <MainPassengerInfo
                        //       key={index}
                        //       item={item}
                        //       index={index}
                        //       empID={empID}
                        //       dropOffList={_dropOffList}
                        //       handleName={handleSearch}
                        //       handleDropOff={handlePassengerDropOff}
                        //     />
                        //   );
                        // } else {
                        //   return (
                        //     <PassengerInfo
                        //       key={item.id}
                        //       item={item}
                        //       index={index}
                        //       dropOffList={_dropOffList}
                        //       handleName={handlePassengerName}
                        //       handleDropOff={handlePassengerDropOff}
                        //     />
                        //   );
                        // }
                     // })} */}
                {/* <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-autowidth-label">
                      Age
                    </InputLabel>
                    <Select
                      labelId="demo-simple-select-autowidth-label"
                      id="demo-simple-select-autowidth"
                      value={Dropoff}
                      onChange={handleChange}
                      autoWidth
                      label="Age"
                    >

                      <MenuItem value={"DROP_OFF_CD"}>1111</MenuItem>
                    
                    </Select>
                  </FormControl> */}
              </Grid>
              <Grid item>
                <Stack fullWidth>
                  <Typography
                    variant="h6"
                    className="b-text-input__title b-italic"
                  >
                    {t("frm_passengers_korean_list")} <span>(*)</span>
                  </Typography>
                  <KoreaPassengerInfo
                    cValue={passengerSelectList}
                    expList={_EXPList}
                    handleName={handleSearch}
                    handlePassengerSelect={handlePassengerSelect}
                    handleClearClick={handleClearClick}
                  />
                </Stack>
              </Grid>
              <Grid item>
                <Typography
                  variant="h6"
                  className="b-text-input__title b-italic"
                >
                  {t("frm_passengers_vietnam_list")} <span>(*)</span>
                </Typography>
                <VietnamPassengerInfo
                  cValue={DeptName}
                  tValue={PassengerDeptCount}
                  DeptList={_DEPTList}
                  empName={empName}
                  dropOffList={_dropOffList}
                  handleName={handleSearch}
                  handleDropOff={handlePassengerDropOff}
                  deptNameHandleSelect={handleDeptSelect}
                  _PassengerChange={HandlePassengerChange}
                />
              </Grid>
              <Box className="s-form-bot">
                <ButtonPrimary
                  title={t("btn_request")}
                  handleClick={handleSubmit}
                />
              </Box>
            </form>
          </Box>
        </Container>
      </Box>
      <ModalWarning
        open={openWarn}
        handleOpen={handleOpenWarn}
        handleClose={handleCloseWarn}
        type="upload-failed"
      />
      <ModalInfo open={openInfo} handleClose={handleCloseInfo} type={type} />
    </>
  );
};

export default FormCar;
