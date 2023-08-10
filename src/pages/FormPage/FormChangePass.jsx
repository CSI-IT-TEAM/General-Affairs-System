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

  const HandleChangePass = () => {
    if (base64_encode(Password) !== empData.PASSWORD) {
      Swal.fire(
        "Sai mật khẩu",
        "Mật khẩu cũ không đúng, vui lòng kiểm tra lại",
        "error"
      );
    } else {
      if (PasswordNewConfirm !== PasswordNew) {
        Swal.fire(
          "Mật khẩu mới phải giống nhau",
          "Vui lòng kiểm tra lại mật khẩu mới",
          "error"
        );
      } else {
        //Call Update Password.
        Swal.fire({
          title: "Đổi mật khẩu?",
          text: "Mật khẩu mới sẽ được áp dụng sau khi bạn xác nhận",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Xác nhận",
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire("OK !", "Thay đổi mật khẩu thành công!.", "success");
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
            <Button variant="contained">Back lại trang chủ</Button>
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
