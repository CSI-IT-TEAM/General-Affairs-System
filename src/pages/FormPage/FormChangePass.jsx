import React from "react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18next from "i18next";
import "./Form.scss";
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ButtonPrimary, FormDefaultInfo, FormTitle } from "../../components";
import { decode as base64_decode, encode as base64_encode } from "base-64";
import { LoginURL, UserRegisterURL } from "../../api";
const empData = JSON.parse(sessionStorage.getItem("userData"));
const FormChangePass = () => {
  /////// Translate Lang
  const { t } = useTranslation();
  const langCookie = i18next.language;
  const [lang, setLang] = useState(langCookie);
  const [showPassword, setShowPassword] = React.useState(false);
  const [Password, setPassword] = useState("");
  const [PasswordNew, setPasswordNew] = useState("");
  const [PasswordNewConfirm, setPasswordNewConfirm] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    console.log(empData);
    setLang(i18next.language);
  }, [langCookie]);

  //////// Handle Set Controlled Data
  const handleChange = (event) => {
    switch (event.target.name) {
      case "PASSWORD":
        setPassword(event.target.value);
        break;
      case "PASSWORD_NEW":
        setPasswordNew(event.target.value);
        break;
      case "PASSWORD_NEW_CONFIRM":
        setPasswordNewConfirm(event.target.value);
        break;
      default:
        break;
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  ////// Cancel Fetch API After Timeout
  const Timeout = (time) => {
    let controller = new AbortController();
    setTimeout(() => controller.abort(), time * 1000);
    return controller;
  };

  const arrayBufferToBase64 = (buffer) => {
    var base64Flag = "data:image/jpeg;base64,";
    var binary = "";
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => (binary += String.fromCharCode(b)));

    return base64Flag + window.btoa(binary);
  };

  const HandleChangePass = () => {
    // console.log(empData.PASSWORD);
    // return;
    const empData = JSON.parse(sessionStorage.getItem("userData"));
    if (base64_encode(Password) !== empData.PASSWORD) {
      Swal.fire(
        t("title_wrong_password1"),
        t("title_old_password_incorrect"),
        "error"
      );
    } else {
      if (!PasswordNew || !PasswordNewConfirm) {
        Swal.fire(t("title_new_password_can_be_empty"), "", "error");
      } else if (PasswordNewConfirm !== PasswordNew) {
        Swal.fire(
          t("title_password_must_be_same_as_old_password"),
          t("title_please_checking_new_password"),
          "error"
        );
      } else {
        //Call Update Password.
        Swal.fire({
          title: t("title_change_password_question"),
          text: t("title_new_password_will_applied"),
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: t("btn_confirm"),
        }).then((result) => {
          if (result.isConfirmed) {
            fetch(UserRegisterURL, {
              method: "POST",
              mode: "cors",
              dataType: "json",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ARG_TYPE: "S",
                ARG_EMPID: empData.EMPID, //user name
                ARG_PASSWORD: base64_encode(PasswordNew), //password
              }),
              signal: Timeout(5).signal,
            }).then((response) => {
              response.json().then(async (result) => {
                if (result.Result === "OK") {
                  fetch(LoginURL, {
                    method: "POST",
                    mode: "cors",
                    dataType: "json",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      ARG_TYPE: "Q",
                      ARG_EMPID: empData.EMPID, //user name
                      ARG_PASSWORD: base64_encode(PasswordNew), //password
                      OUT_CURSOR: "",
                    }),
                    signal: Timeout(5).signal,
                  }).then((response) => {
                    response.json().then(async (result) => {
                      if (result.length > 0) {
                        let imgData = await arrayBufferToBase64(
                          result[0].PHOTO.data
                        );
                        sessionStorage.setItem(
                          "userData",
                          JSON.stringify(result[0])
                        );
                        localStorage.setItem(
                          "lastLogin",
                          JSON.stringify({
                            data: empData.EMPID,
                            data1: PasswordNew,
                          })
                        );
                        sessionStorage.setItem("userImg", imgData);
                        Swal.fire(
                          t("title_success"),
                          t("title_change_password_sucessfully"),
                          "success"
                        );
                        navigate("/");
                      }
                    });
                  });
                } else {
                  Swal.fire(
                    t("title_error"),
                    t("title_password_change_unsuccessful"),
                    "error"
                  );
                }
              });
            });
          }
        });
      }
    }
  };

  return (
    <>
      <Box className="s-form">
        <Container fullWidth>
          <Paper
            sx={{
              p: 2,
            }}
          >
            <Button variant="contained" onClick={() => navigate("/")}>
              {t("btn_back_to_home")}
            </Button>
            <hr
              style={{
                height: "30px",
                border: "none",
              }}
            />
            <Grid spacing={2} columns={12}>
              <Grid item sx={12} sm={12} md={12} lg={12}>
                <TextField
                  type={showPassword ? "text" : "password"}
                  label={t("frm_password")}
                  id="passWord"
                  className="b-input"
                  placeholder={t("frm_password_placeholder")}
                  value={Password}
                  onChange={handleChange}
                  name="PASSWORD"
                  color="info"
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
              </Grid>
              <hr
                style={{
                  height: "30px",
                  border: "none",
                }}
              />
              <Grid item sx={12} sm={12} md={12} lg={12}>
                <TextField
                  type={showPassword ? "text" : "password"}
                  label={t("frm_new_password")}
                  id="passWord_new"
                  className="b-input"
                  placeholder={t("frm_new_password_placeholder")}
                  value={PasswordNew}
                  onChange={handleChange}
                  name="PASSWORD_NEW"
                  color="info"
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
              </Grid>

              <Grid item sx={12} sm={12} md={12} lg={12}>
                <TextField
                  type={showPassword ? "text" : "password"}
                  label={t("frm_confirm_password")}
                  id="passWord_new_Confirm"
                  className="b-input"
                  placeholder={t("frm_confirm_password_placeholder")}
                  value={PasswordNewConfirm}
                  onChange={handleChange}
                  name="PASSWORD_NEW_CONFIRM"
                  color="info"
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
              </Grid>
            </Grid>
            <Box className="s-form-bot">
              <ButtonPrimary
                title={t("btn_change_password")}
                handleClick={HandleChangePass}
              />
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default FormChangePass;
