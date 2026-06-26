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
import InputAdornment from "@mui/material/InputAdornment";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ButtonPrimary, ModalWarning, ModalInfo } from "../../components";
import { decode as base64_decode, encode as base64_encode } from "base-64";
import {
    LoginURL,
    UserRegisterURL,
    downloadURL,
    imageURL,
    SendEmailURL,
} from "../../api";
import "./SignIn.scss";
import loginImage from "../../assets/images/sign-in.png";
import otpImage from "../../assets/images/logos/otp.png";
import AvatarImage from "../../assets/images/avatar.png";


const SignIn = () => {
    /////// Translate Lang
    const { t } = useTranslation();

    const navigate = useNavigate();
    const lastLogin =
        localStorage.getItem("lastLogin") === null
            ? ""
            : localStorage.getItem("lastLogin");
    const [data, setData] = useState(
        lastLogin ? JSON.parse(lastLogin).data : ""
    );
    const [data1, setData1] = useState(
        lastLogin ? JSON.parse(lastLogin).data1 : ""
    );
    const [showPassword, setShowPassword] = React.useState(false);
    const [reset, setReset] = useState(false);
    const [dataOTP, setDataOTP] = useState("");
    const [email, setEmail] = useState("");

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
                        if (
                            result[0].EMAIL === null ||
                            result[0].EMAIL === undefined ||
                            result[0].EMAIL === ""
                        ) {
                            handleOpenWarn();
                        } else {
                            sessionStorage.setItem(
                                "userData",
                                JSON.stringify(result[0])
                            );
                            localStorage.setItem(
                                "lastLogin",
                                JSON.stringify({ data: data, data1: data1 })
                            );
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
            setData((data) =>
                lastLogin ? JSON.parse(lastLogin).data : ""
            );
        } else {
            setDataOTP((dataOTP) => "");
        }
        setData1((data1) => "");
        setEmail((email) => "");

        setTimeout(() => {
            Swal.close();
            setReset((reset) => !reset);
        }, 1000);
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
                        let imgData = await arrayBufferToBase64(
                            result[0].PHOTO.data
                        );
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
                ARG_EMPID: data,
                ARG_PASSWORD: base64_encode(data1),
                OUT_CURSOR: "",
            }),
            signal: Timeout(5).signal,
        })
            .then((response) => {
                response.json().then(async (result) => {
                    if (result.length > 0) {
                        let imgData = null;
                        if (result[0].PHOTO && result[0].PHOTO.data) {
                            imgData = await arrayBufferToBase64(
                                result[0].PHOTO.data
                            );
                        } else {
                            console.warn("PHOTO.data is null");
                            imgData = AvatarImage;
                        }
                        let pwd = await result[0].PASSWORD;
                        let isExist = await result[0].IS_EXIST;
                        if (isExist === 0 && !pwd) {
                            fetch(UserRegisterURL, {
                                method: "POST",
                                mode: "cors",
                                dataType: "json",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    ARG_TYPE: "S",
                                    ARG_EMPID: data,
                                    ARG_PASSWORD: base64_encode(data1),
                                }),
                                signal: Timeout(5).signal,
                            }).then((response) => {
                                response.json().then(async (rs) => {
                                    if (rs.Result === "OK") {
                                        sessionStorage.setItem(
                                            "userData",
                                            JSON.stringify(result[0])
                                        );
                                        localStorage.setItem(
                                            "lastLogin",
                                            JSON.stringify({
                                                data: data,
                                                data1: data1,
                                            })
                                        );
                                        sessionStorage.setItem(
                                            "userImg",
                                            imgData
                                        );
                                        navigate("/");
                                    } else {
                                        alert("Network Error!");
                                    }
                                });
                            });
                        } else if (isExist === 1 && !pwd) {
                            Swal.fire(
                                t("title_wrong_password"),
                                t("text_if_first_time_password"),
                                "error"
                            );
                            return;
                        } else {
                            if (imgData !== "" && imgData !== null) {
                                sessionStorage.setItem(
                                    "userData",
                                    JSON.stringify(result[0])
                                );
                                localStorage.setItem(
                                    "lastLogin",
                                    JSON.stringify({
                                        data: data,
                                        data1: data1,
                                    })
                                );
                                sessionStorage.setItem("userImg", imgData);
                                navigate("/");
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
                    ARG_EMPID: data,
                    ARG_PASSWORD: "",
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
                                if (
                                    result[0].EMAIL !== null &&
                                    result[0].EMAIL !== ""
                                ) {
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
                                            ARG_EMPID: data,
                                            ARG_PASSWORD: "",
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
                                                        "Content-Type":
                                                            "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                        ARG_TYPE: "Q_OTP",
                                                        ARG_EMPID: data,
                                                        ARG_PASSWORD: "",
                                                        OUT_CURSOR: "",
                                                    }),
                                                    signal: Timeout(5).signal,
                                                }).then((response) => {
                                                    response
                                                        .json()
                                                        .then(async (result) => {
                                                            let _sendEmailPrams =
                                                                {
                                                                    to: [
                                                                        _emailData,
                                                                    ],
                                                                    subject:
                                                                        "General Affairs System - Reset Password",
                                                                    html:
                                                                        "<html>" +
                                                                        "<head><style>.text{ font-family: 'Consolas', Times, serif; font-size: '14'; }</style></head>" +
                                                                        "<body class='text'>" +
                                                                        t(
                                                                            "mail_hello"
                                                                        ) +
                                                                        ",<br />- " +
                                                                        t(
                                                                            "mail_system"
                                                                        ) +
                                                                        ".<br />" +
                                                                        "- " +
                                                                        t(
                                                                            "mail_warn"
                                                                        ) +
                                                                        ".<br/>" +
                                                                        "- <b>" +
                                                                        result[0]
                                                                            .OTP_CD +
                                                                        "</b>" +
                                                                        t(
                                                                            "mail_define"
                                                                        ) +
                                                                        ".<br />" +
                                                                        t(
                                                                            "mail_end"
                                                                        ) +
                                                                        "." +
                                                                        "</body>" +
                                                                        "</html>",
                                                                };

                                                            const response =
                                                                await fetch(
                                                                    SendEmailURL,
                                                                    {
                                                                        method: "POST",
                                                                        mode: "cors",
                                                                        dataType:
                                                                            "json",
                                                                        headers: {
                                                                            "Content-Type":
                                                                                "application/json",
                                                                        },
                                                                        body: JSON.stringify(
                                                                            _sendEmailPrams
                                                                        ),
                                                                    }
                                                                );

                                                            if (
                                                                response.status ===
                                                                200
                                                            ) {
                                                                setTimeout(
                                                                    () => {
                                                                        setEmail(
                                                                            (
                                                                                email
                                                                            ) =>
                                                                                _emailData
                                                                        );
                                                                        Swal.close();
                                                                    },
                                                                    1000
                                                                );
                                                            } else {
                                                                Swal.close();
                                                                alert(
                                                                    "Network Error!"
                                                                );
                                                            }
                                                        });
                                                });
                                            } else {
                                                Swal.close();
                                                alert("Network Error!");
                                            }
                                        });
                                    });
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
                    ARG_EMPID: data,
                    ARG_PASSWORD: dataOTP,
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
                                        ARG_EMPID: data,
                                        ARG_PASSWORD: base64_encode(data),
                                    }),
                                    signal: Timeout(5).signal,
                                }).then((response) => {
                                    response.json().then(async (rs) => {
                                        if (rs.Result === "OK") {
                                            Swal.close();
                                            Swal.fire({
                                                position: "center",
                                                icon: "success",
                                                title: t("title_success"),
                                                text: t(
                                                    "swal_new_reset_pass"
                                                ),
                                                showConfirmButton: false,
                                                timer: 3500,
                                            }).then(() => {
                                                handleShowReset();
                                            });
                                        } else {
                                            Swal.close();
                                            alert("Network Error!");
                                        }
                                    });
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
                    });
                });
        }
    };

    // ============================================
    // RENDER: RESET PASSWORD VIEW
    // ============================================
    const renderResetPassword = () => (
        <Box className="b-box">
            <Box className="s-form">
                <Typography variant="h1" className="p-title">
                    Reset Password
                </Typography>
                <Box className="b-thumb">
                    <img src={otpImage} alt="OTP Verification" />
                </Box>
                <form>
                    <Stack marginBottom={1} spacing={2}>
                        {email === "" ? (
                            <TextField
                                label={t("frm_user_id")}
                                id="userID"
                                inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                }}
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
                                <Box textAlign="center">
                                    <Typography
                                        variant="h5"
                                        className="p-desc"
                                    >
                                        {t("plholder_email")} -{" "}
                                        <span>{email}</span>
                                    </Typography>
                                </Box>
                                <Box className="otp-container">
                                    {Array.from({ length: 6 }, (_, idx) => {
                                        const digit = dataOTP[idx] || "";
                                        return (
                                            <input
                                                key={idx}
                                                className="otp-input-slot"
                                                type="number"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => {
                                                    const val =
                                                        e.target.value.replace(
                                                            /[^0-9]/g,
                                                            ""
                                                        );
                                                    const otpArr =
                                                        dataOTP.split("");
                                                    otpArr[idx] =
                                                        val.slice(-1) || "";
                                                    setDataOTP(
                                                        otpArr.join("")
                                                    );
                                                    // Auto-focus next input
                                                    if (
                                                        val &&
                                                        idx < 5
                                                    ) {
                                                        const nextSibling =
                                                            e.target
                                                                .parentElement
                                                                .children[
                                                                idx + 1
                                                            ];
                                                        if (
                                                            nextSibling
                                                        )
                                                            nextSibling.focus();
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key ===
                                                            "Backspace" &&
                                                        !dataOTP[
                                                            idx
                                                        ] &&
                                                        idx > 0
                                                    ) {
                                                        const prevSibling =
                                                            e.target
                                                                .parentElement
                                                                .children[
                                                                idx - 1
                                                            ];
                                                        if (
                                                            prevSibling
                                                        )
                                                            prevSibling.focus();
                                                    }
                                                }}
                                                onPaste={(e) => {
                                                    e.preventDefault();
                                                    const pasted =
                                                        e.clipboardData
                                                            .getData("text")
                                                            .replace(
                                                                /[^0-9]/g,
                                                                ""
                                                            )
                                                            .slice(0, 6);
                                                    setDataOTP(
                                                        pasted.padEnd(
                                                            6,
                                                            ""
                                                        )
                                                    );
                                                }}
                                            />
                                        );
                                    })}
                                </Box>
                            </>
                        )}
                    </Stack>
                    <Grid justifyContent="flex-end" className="s-mid">
                        <ButtonPrimary
                            title={
                                email === ""
                                    ? t("title_continue")
                                    : t("btn_confirm")
                            }
                            handleClick={handleReset}
                        />
                        {email === "" ? (
                            <Typography
                                variant="h5"
                                className="p-desc align-center"
                            >
                                {t("title_have_account")}{" "}
                                <span onClick={handleShowReset}>
                                    {t("btn_login")}
                                </span>
                            </Typography>
                        ) : (
                            <Typography
                                variant="h5"
                                className="p-desc align-center"
                            >
                                <span
                                    onClick={() => setEmail((email) => "")}
                                >
                                    {t("btn_cancel")}
                                </span>
                            </Typography>
                        )}
                    </Grid>
                </form>
            </Box>
        </Box>
    );

    // ============================================
    // RENDER: MAIN LOGIN VIEW
    // ============================================
    const renderLogin = () => (
        <Box
            className="login-only-wrapper"
            sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                bgcolor: "transparent !important",
                background: "transparent !important",
                boxShadow: "none !important",
                borderRadius: "0 !important",
                p: "0 !important",
                m: "0 auto !important",
            }}
            style={{
                background: "transparent",
                boxShadow: "none",
                borderRadius: 0,
                padding: 0,
            }}
        >
            <Box
                className="login-only-container"
                sx={{
                    width: "auto !important",
                    maxWidth: "none !important",
                    minWidth: "0 !important",
                    display: "flex",
                    justifyContent: "center",
                    gridTemplateColumns: "1fr !important",
                    bgcolor: "transparent !important",
                    background: "transparent !important",
                    borderRadius: "0 !important",
                    overflow: "visible !important",
                    boxShadow: "none !important",
                    p: "0 !important",
                    m: "0 auto !important",
                }}
                style={{
                    width: "auto",
                    maxWidth: "none",
                    minWidth: 0,
                    background: "transparent",
                    boxShadow: "none",
                    borderRadius: 0,
                    padding: 0,
                }}
            >
                <Box
                    className="s-form left-form login-only-form"
                    sx={{
                        width: "min(92vw, 440px) !important",
                        maxWidth: "440px !important",
                        minWidth: "0 !important",
                        borderRight: "0 !important",
                        bgcolor: "#fff !important",
                        borderRadius: "24px !important",
                        overflow: "hidden",
                        boxShadow: "0 22px 70px rgba(0,0,0,0.18)",
                        m: "0 auto !important",
                        px: { xs: 3, sm: 4 },
                        py: { xs: 3, sm: 4 },
                    }}
                    style={{
                        width: "min(92vw, 440px)",
                        maxWidth: "440px",
                        minWidth: 0,
                        borderRight: 0,
                        background: "#fff",
                        borderRadius: 24,
                    }}
                >
                    <Typography variant="h1" className="p-title">
                        {t("main_title") || "General Affairs System"}
                    </Typography>
                    <Box className="b-thumb">
                        <img src={loginImage} alt="Login Illustration" />
                    </Box>
                    <form>
                        <Stack marginBottom={1} spacing={2}>
                            <TextField
                                label={t("frm_user_id")}
                                id="userID"
                                inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                }}
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
                                                edge="end"
                                            >
                                                {showPassword ? (
                                                    <VisibilityOff />
                                                ) : (
                                                    <Visibility />
                                                )}
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

                            <Box
                                sx={{
                                    width: "100%",
                                    my: 1.25,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        flex: 1,
                                        height: "1px",
                                        bgcolor: "rgba(0,0,0,0.14)",
                                    }}
                                />
                                <Typography
                                    component="span"
                                    sx={{
                                        color: "#777",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        letterSpacing: 1,
                                    }}
                                >
                                    OR
                                </Typography>
                                <Box
                                    sx={{
                                        flex: 1,
                                        height: "1px",
                                        bgcolor: "rgba(0,0,0,0.14)",
                                    }}
                                />
                            </Box>

                            <ButtonPrimary
                                title={t("business_trip") || "Business Trip"}
                                handleClick={() =>
                                    navigate("/registration/business-trip")
                                }
                            />

                            <Typography
                                variant="h5"
                                className="p-desc align-center"
                                sx={{ mt: 1 }}
                            >
                                {t("title_forgot_pass")}{" "}
                                <span onClick={handleShowReset}>
                                    {t("title_reset")}
                                </span>
                            </Typography>
                        </Grid>
                    </form>
                </Box>
            </Box>
        </Box>
    );

    return (
        <>
            <Box className="s-layout">
                {/* Logo */}
                <Typography variant="h5" component="div" className="s-logo">
                    CSG
                </Typography>

                {/* Conditional rendering: Reset Password vs Login */}
                {reset ? renderResetPassword() : renderLogin()}
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
