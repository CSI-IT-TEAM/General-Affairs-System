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
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OtpInput from 'react-otp-input';
import InputAdornment from "@mui/material/InputAdornment";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ButtonPrimary, ModalWarning, ModalInfo } from "../../components";
import { decode as base64_decode, encode as base64_encode } from "base-64";
import { LoginURL, UserRegisterURL, downloadURL, imageURL, SendEmailURL } from "../../api";
import "./SignIn.scss";
import loginImage from "../../assets/images/sign-in.png";
import otpImage from "../../assets/images/logos/otp.png";
import AvatarImage from "../../assets/images/avatar.png";
const height = window.innerHeight + "px";
const width = window.innerWidth;

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
    const [reset, setReset] = useState(false);
    const [dataOTP, setDataOTP] = useState("");
    const [email, setEmail] = useState("");

    const size = width > 479 ? 500 - 110 - 9 * 5 : width * 0.9 - 50 - 9 * 5;

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

    ////// Handle Show Reset
    const handleShowReset = () => {
        Swal.fire({
            allowOutsideClick: false,
            background: "transparent",
            didOpen: () => {
                Swal.showLoading();
            },
        });

        if (reset) {
            setData(data => lastLogin ? JSON.parse(lastLogin).data : "");
        }
        else {
            setDataOTP(dataOTP => "");
        }
        setData1(data1 => "");
        setEmail(email => "");

        setTimeout(() => {
            Swal.close();
            setReset(reset => !reset);
        }, 1000);
    }

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
                        //let imgData = await arrayBufferToBase64(result[0].PHOTO.data);
                        let imgData = null;
                        if (result[0].PHOTO && result[0].PHOTO.data) {
                            imgData = await arrayBufferToBase64(result[0].PHOTO.data);
                        } else {
                            console.warn("PHOTO.data is null");
                            imgData = AvatarImage; // Hoặc gán ảnh mặc định nếu cần
                        }
                        let pwd = await result[0].PASSWORD;
                        let isExist = await result[0].IS_EXIST;
                        if (isExist === 0 && !pwd) {
                            //case : Chưa đăng ký
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
                                    ARG_PASSWORD: base64_encode(data1), //password
                                }),
                                signal: Timeout(5).signal,
                            }).then((response) => {
                                response.json().then(async (rs) => {
                                    //console.log(result);
                                    if (rs.Result === "OK") {
                                        //console.log("Đăng ký thành công!");
                                        // Swal.fire(
                                        //   t("title_password_change_successfully"),
                                        //   t("text_user_can_login_with_new_password"),
                                        //   "success"
                                        // );
                                        // setData1(pwd);
                                        sessionStorage.setItem(
                                            "userData",
                                            JSON.stringify(result[0])
                                        );
                                        localStorage.setItem(
                                            "lastLogin",
                                            JSON.stringify({ data: data, data1: data1 })
                                        );
                                        sessionStorage.setItem("userImg", imgData);
                                        navigate("/");
                                    } else {
                                        alert("Network Error!");
                                    }
                                });
                            });
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

                                // if ("caches" in window) {
                                //     caches.keys().then((names) => {
                                //         // delete all the cache files
                                //         names.foreach((name) => {
                                //             caches.delete(name);
                                //         });
                                //     });
                                //     // makes sure the page reloads. changes are only visible after you refresh.
                                //     window.location.reload(true);
                                // }
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

    ///// Handle Reset
    const handleReset = () => {
        Swal.fire({
            allowOutsideClick: false,
            background: "transparent",
            didOpen: () => {
                Swal.showLoading();
            },
        });

        if (email === "") {
            fetch(LoginURL, {
                method: "POST",
                mode: "cors",
                dataType: "json",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ARG_TYPE: "Q_EXIST",
                    ARG_EMPID: data, //user name
                    ARG_PASSWORD: "", //password
                    OUT_CURSOR: "",
                }),
                signal: Timeout(5).signal,
            })
                .then((response) => {
                    response.json().then(async (result) => {
                        if (result.length > 0) {
                            if (result[0].REGISTER_YN === "N") {
                                Swal.fire({
                                    position: "center",
                                    icon: "success",
                                    title: t("title_success"),
                                    text: t("text_if_first_time_password"),
                                    showConfirmButton: false,
                                    timer: 1500,
                                }).then(() => {
                                    handleShowReset();
                                });
                            } else {
                                if (result[0].EMAIL !== null && result[0].EMAIL !== "") {
                                    let _emailData = result[0].EMAIL;

                                    fetch(UserRegisterURL, {
                                        method: "POST",
                                        mode: "cors",
                                        dataType: "json",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            ARG_TYPE: "Q_OTP",
                                            ARG_EMPID: data, //user name
                                            ARG_PASSWORD: "", //password
                                        }),
                                        signal: Timeout(5).signal,
                                    }).then((response) => {
                                        response.json().then(async (rs) => {
                                            if (rs.Result === "OK") {

                                                fetch(LoginURL, {
                                                    method: "POST",
                                                    mode: "cors",
                                                    dataType: "json",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                        ARG_TYPE: "Q_OTP",
                                                        ARG_EMPID: data, //user name
                                                        ARG_PASSWORD: "", //password
                                                        OUT_CURSOR: "",
                                                    }),
                                                    signal: Timeout(5).signal,
                                                })
                                                    .then((response) => {
                                                        response.json().then(async (result) => {
                                                            let _sendEmailPrams = {
                                                                "to": [_emailData],
                                                                "subject": "General Affairs System - Reset Password",
                                                                "html":
                                                                    "<html>" +
                                                                    "<head><style>.text{ font-family: 'Consolas', Times, serif; font-size: '14'; }</style></head>" +
                                                                    "<body class='text'>" +
                                                                    t('mail_hello') + ",<br />- " + t('mail_system') + ".<br />" +
                                                                    "- " + t('mail_warn') + ".<br/>" +
                                                                    "- <b>" + result[0].OTP_CD + "</b>" + t('mail_define') + ".<br />" +
                                                                    t('mail_end') + "." +
                                                                    "</body>" +
                                                                    "</html>"
                                                            }

                                                            const response = await fetch(SendEmailURL, {
                                                                method: "POST",
                                                                mode: "cors",
                                                                dataType: "json",
                                                                headers: {
                                                                    "Content-Type": "application/json",
                                                                },
                                                                body: JSON.stringify(_sendEmailPrams),
                                                            });

                                                            if (response.status === 200) {
                                                                setTimeout(() => {
                                                                    setEmail(email => _emailData);
                                                                    Swal.close();
                                                                }, 1000);
                                                            } else {
                                                                Swal.close();
                                                                alert("Network Error!");
                                                            }
                                                        }
                                                        )
                                                    });
                                            } else {
                                                Swal.close();
                                                alert("Network Error!");
                                            }
                                        });
                                    });
                                }
                                else {
                                    Swal.close();
                                    Swal.fire({
                                        position: "center",
                                        icon: "error",
                                        title: t("warn"),
                                        text: t("frm_id_required"),
                                        showConfirmButton: false,
                                        timer: 1500,
                                    })
                                }
                            }
                        } else {
                            Swal.close();
                            Swal.fire({
                                position: "center",
                                icon: "error",
                                title: t("warn"),
                                text: t("frm_id_required"),
                                showConfirmButton: false,
                                timer: 1500,
                            });
                        }
                    });
                })
                .catch((error) => {
                    Swal.close();
                    setOpenInfo(true);
                });
        } else {
            fetch(LoginURL, {
                method: "POST",
                mode: "cors",
                dataType: "json",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ARG_TYPE: "Q_CHECK_OTP",
                    ARG_EMPID: data, //user name
                    ARG_PASSWORD: dataOTP, //password
                    OUT_CURSOR: "",
                }),
                signal: Timeout(5).signal,
            })
                .then((response) => {
                    response.json().then(async (result) => {
                        if (result !== null && result.length > 0) {
                            if (result[0].OTP_YN === "Y") {
                                fetch(UserRegisterURL, {
                                    method: "POST",
                                    mode: "cors",
                                    dataType: "json",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        ARG_TYPE: "Q_DELETE",
                                        ARG_EMPID: data, //user name
                                        ARG_PASSWORD: "", //password
                                    }),
                                    signal: Timeout(5).signal,
                                }).then((response) => {
                                    response.json().then(async (rs) => {
                                        if (rs.Result === "OK") {
                                            Swal.close();
                                            Swal.fire({
                                                position: "center",
                                                icon: "success",
                                                title: t('title_success'),
                                                text: t('swal_new_reset_pass'),
                                                showConfirmButton: false,
                                                timer: 3500,
                                            }).then(() => {
                                                handleShowReset();
                                            });
                                        } else {
                                            Swal.close();
                                            alert("Network Error!");
                                        }
                                    }
                                    )
                                });
                            } else {
                                Swal.close();
                                Swal.fire({
                                    position: "center",
                                    icon: "error",
                                    title: t("warn"),
                                    text: t("frm_otp_invalid"),
                                    showConfirmButton: false,
                                    timer: 1500,
                                });
                            }
                        } else {
                            Swal.close();
                            alert("Network Error!");
                        }
                    }
                    )
                });
        }
    }

    return (
        <>
            <Box
                className="s-layout"
                sx={{
                    width: "100%",
                    minHeight: height,
                }}
            >
                <Typography variant="h5" component="div" className="s-logo">CSG</Typography>
                {reset && (
                    <Box className="b-box">
                        <Box className="s-form">
                            <Typography variant="h1" className="p-title">
                                Reset Password
                            </Typography>
                            <Box className="b-thumb" sx={{ margin: '0 auto !important' }}>
                                <img src={otpImage} alt="OTP" />
                            </Box>
                            <form>
                                <Stack marginBottom={1} spacing={2}>
                                    {email === "" ? (
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
                                    ) : (
                                        <>
                                            <Box>
                                                <Typography variant="h5" className="p-desc">
                                                    {t('plholder_email')} - <span>{email}</span>
                                                </Typography>
                                            </Box>
                                            <OtpInput
                                                value={dataOTP}
                                                onChange={setDataOTP}
                                                numInputs={6}
                                                inputType="number"
                                                renderSeparator={<span>-</span>}
                                                renderInput={(props) => <input {...props} />}
                                                inputStyle={{ width: (size / 6) + 'px', height: '65px', fontWeight: '600' }}
                                            />
                                        </>
                                    )}
                                </Stack>
                                <Grid justifyContent="flex-end" className="s-mid">
                                    <ButtonPrimary
                                        title={email === "" ? t("title_continue") : t("btn_confirm")}
                                        handleClick={handleReset}
                                    />
                                    {email === "" ? (
                                        <Typography variant="h5" className="p-desc align-center">
                                            {t('title_have_account')} <span onClick={handleShowReset}>{t('btn_login')}</span>
                                        </Typography>
                                    ) : (
                                        <Typography variant="h5" className="p-desc align-center">
                                            <span onClick={() => setEmail(email => "")}>{t('btn_cancel')}</span>
                                        </Typography>
                                    )}
                                </Grid>
                            </form>
                        </Box>
                    </Box>
                )}
                {!reset && (
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
                                    <Typography variant="h5" className="p-desc align-center">
                                        {t('title_forgot_pass')} <span onClick={handleShowReset}>{t('title_reset')}</span>
                                    </Typography>
                                </Grid>
                            </form>
                        </Box>
                    </Box>
                )}
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
