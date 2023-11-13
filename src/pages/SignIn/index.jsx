import * as React from "react";
import { useState } from "react";
import {
  TextField,
  Typography,
  Box,
  Stack,
  Grid,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import InputAdornment from "@mui/material/InputAdornment";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ButtonPrimary, ModalWarning, ModalInfo } from "../../components";
import { decode as base64_decode, encode as base64_encode } from "base-64";
import "./SignIn.scss";

import loginImage from "../../assets/images/sign-in.png";
import { LoginURL, UserRegisterURL, downloadURL, imageURL } from "../../api";
import Swal from "sweetalert2";

const height = window.innerHeight - 30 + "px";

const SignIn = () => {
  /////// Translate Lang
  const { t } = useTranslation();

  const navigate = useNavigate();
  const lastLogin =
    localStorage.getItem("lastLogin") === null
      ? ""
      : localStorage.getItem("lastLogin");
  const [data, setData] = useState(lastLogin ? JSON.parse(lastLogin).data : "");
  const [data1, setData1] = useState(
    lastLogin ? JSON.parse(lastLogin).data1 : ""
  );
  const [showPassword, setShowPassword] = React.useState(false);

  /////// Handle Warning Modal
  const [openWarn, setOpenWarn] = useState(false);
  const handleOpenWarn = () => setOpenWarn(true);
  const handleCloseWarn = () => setOpenWarn(false);

  /////// Handle Info Modal
  const [openInfo, setOpenInfo] = useState(false);
  const handleCloseInfo = () => setOpenInfo((prevData) => !prevData);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  //////// Handle Set Controlled Data
  const handleChange = (event) => {
    switch (event.target.name) {
      case "USER_ID":
        setData(event.target.value);
        break;
      case "PASSWORD":
        setData1(event.target.value);
        break;
      default:
        break;
    }
  };

  ////// Cancel Fetch API After Timeout
  const Timeout = (time) => {
    let controller = new AbortController();
    setTimeout(() => controller.abort(), time * 1000);
    return controller;
  };

  const handleSignIn = () => {
    // const dataConfig = {
    //   ARG_TYPE: "EMP",
    //   ARG_EMPID: data,
    //   OUT_CURSOR: "",
    // };
    //fetchDownload(dataConfig);

    userLoginHandle();
  };

  ////// Download User Info Data
  const fetchDownload = async (dataConfig) => {
    fetch(downloadURL, {
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
        response.json().then(async (result) => {
          if (result.length > 0) {
            // Store
            if (
              result[0].EMAIL === null ||
              result[0].EMAIL === undefined ||
              result[0].EMAIL === ""
            ) {
              handleOpenWarn();
            } else {
              sessionStorage.setItem("userData", JSON.stringify(result[0]));
              localStorage.setItem(
                "lastLogin",
                JSON.stringify({ data: data, data1: data1 })
              );
              // fetchDownloadImg();
              userLoginHandle();
            }
          } else {
            handleOpenWarn();
          }
        });
      })
      .catch((error) => {
        setOpenInfo(true);
      });
  };

  ////// Download User Image
  const fetchDownloadImg = async () => {
    fetch(imageURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ARG_EMPID: data,
        OUT_CURSOR: "",
      }),
      signal: Timeout(5).signal,
    })
      .then((response) => {
        response.json().then(async (result) => {
          if (result.length > 0) {
            let imgData = await arrayBufferToBase64(result[0].PHOTO.data);
            if (imgData !== "" && imgData !== null) {
              sessionStorage.setItem("userImg", imgData);
              navigate("/");
            }
          }
        });
      })
      .catch((error) => {
        setOpenInfo(true);
      });
  };

  const userLoginHandle = async () => {
    if (!data1) {
      Swal.fire(
        "Hãy nhập vào mật khẩu!",
        "Dữ liệu không được để trống!<br/>Nếu là lần đầu tiên đăng nhập mật khẩu là số thẻ.!",
        "error"
      );
      return;
    }

    fetch(LoginURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ARG_TYPE: "Q",
        ARG_EMPID: data, //user name
        ARG_PASSWORD: base64_encode(data1), //password
        OUT_CURSOR: "",
      }),
      signal: Timeout(5).signal,
    })
      .then((response) => {
        response.json().then(async (result) => {
          if (result.length > 0) {
            let imgData = await arrayBufferToBase64(result[0].PHOTO.data);
            let pwd = await result[0].PASSWORD;
            let isExist = await result[0].IS_EXIST;
            if (isExist === 0 && !pwd) {
              //case : Chưa đăng ký
              if (data === data1) {
                const { value: password } = await Swal.fire({
                  title: t("title_please_change_password"),
                  text: t("title_please_change_password_text"),
                  input: "password",
                  inputLabel: t("label_input_new_password"),
                  inputPlaceholder: t("input_new_password_place_holder"),
                  inputAttributes: {
                    maxlength: 50,
                    autocapitalize: "off",
                    autocorrect: "off",
                  },
                });
                if (password) {
                  // Swal.fire(JSON.stringify(password));
                  if (password === data1) {
                    Swal.fire(
                      t("title_password_must_diff_with_empid"),
                      t("text_password_must_diff_with_empid"),
                      "error"
                    );
                    return;
                  } else {
                    fetch(UserRegisterURL, {
                      method: "POST",
                      mode: "cors",
                      dataType: "json",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        ARG_TYPE: "S",
                        ARG_EMPID: data, //user name
                        ARG_PASSWORD: base64_encode(password), //password
                      }),
                      signal: Timeout(5).signal,
                    }).then((response) => {
                      response.json().then(async (result) => {
                        //console.log(result);
                        if (result.Result === "OK") {
                          //console.log("Đăng ký thành công!");
                          Swal.fire(
                            t("title_password_change_successfully"),
                            t("text_user_can_login_with_new_password"),
                            "success"
                          );

                          setData1(password);
                        } else {
                        }
                      });
                    });
                  }
                }
              } else {
                Swal.fire(
                  t("title_wrong_password"),
                  t("text_if_first_time_password"),
                  "error"
                );
                return;
              }
            } else if (isExist === 1 && !pwd) {
              //case : Có đăng ký nhưng nhập sai pass
              Swal.fire(
                t("title_wrong_password"),
                t("text_if_first_time_password"),
                "error"
              );
              return;
            } else {
              //Có đăng ký nhập đúng pass
              if (imgData !== "" && imgData !== null) {
                sessionStorage.setItem("userData", JSON.stringify(result[0]));
                localStorage.setItem(
                  "lastLogin",
                  JSON.stringify({ data: data, data1: data1 })
                );
                sessionStorage.setItem("userImg", imgData);
                //    sessionStorage.setItem("userInfor", JSON.stringify(result));
                //console.log(result[0]);

                navigate("/");

                if ("caches" in window) {
                  caches.keys().then((names) => {
                    // delete all the cache files
                    names.foreach((name) => {
                      caches.delete(name);
                    });
                  });
                  // makes sure the page reloads. changes are only visible after you refresh.
                   window.location.reload(true);
                }
              }
            }
          } else {
            Swal.fire(
              t("title_wrong_password"),
              t("text_if_first_time_password"),
              "error"
            );
          }
        });
      })
      .catch((error) => {
        setOpenInfo(true);
      });
  };

  //////// Get Image Base-64
  const arrayBufferToBase64 = (buffer) => {
    var base64Flag = "data:image/jpeg;base64,";
    var binary = "";
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => (binary += String.fromCharCode(b)));

    return base64Flag + window.btoa(binary);
  };

  return (
    <>
      <Box
        className="s-layout"
        sx={{
          width: "100%",
          minHeight: height,
        }}
      >
        <Typography variant="h5" component="div" className="s-logo">
          CSG
        </Typography>
        <Box className="b-box">
          <Box className="s-form">
            <Typography variant="h1" className="p-title">
              General Affairs System
            </Typography>
            <Box className="b-thumb">
              <img src={loginImage} alt="Login" />
            </Box>
            <form>
              <Stack marginBottom={1} spacing={2}>
                {/* <Typography variant="h5" className="p-label">
                  {t("frm_user_id")}
                </Typography> */}
                <TextField
                  label={t("frm_user_id")}
                  id="userID"
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  className="b-input"
                  placeholder={t("frm_user_id_placeholder")}
                  value={data}
                  onChange={handleChange}
                  name="USER_ID"
                  color="info"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineOutlinedIcon />
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />

                <TextField
                  type={showPassword ? "text" : "password"}
                  label={t("frm_password")}
                  id="passWord"
                  className="b-input"
                  placeholder={t("frm_password_placeholder")}
                  value={data1}
                  onChange={handleChange}
                  name="PASSWORD"
                  color="info"
                  helperText={t("text_if_first_time_password")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </Stack>
              <Grid justifyContent="flex-end" className="s-mid">
                <ButtonPrimary
                  title={t("btn_login")}
                  handleClick={handleSignIn}
                />
              </Grid>
            </form>
          </Box>
        </Box>
      </Box>
      <ModalWarning
        open={openWarn}
        handleOpen={handleOpenWarn}
        handleClose={handleCloseWarn}
        type="login-failed"
      />
      <ModalInfo
        open={openInfo}
        handleClose={handleCloseInfo}
        type="connect-failed"
      />
    </>
  );
};

export default SignIn;
