import * as React from "react";
import { useState } from "react";
import { TextField, Typography, Box, Stack, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import InputAdornment from "@mui/material/InputAdornment";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { ButtonPrimary, ModalWarning, ModalInfo } from "../../components";

import "./SignIn.scss";

import loginImage from "../../assets/images/sign-in.png";
import { downloadURL, imageURL } from "../../api";

const height = window.innerHeight - 30 + "px";

const SignIn = () => {

    /////// Translate Lang
    const { t } = useTranslation();

    const navigate = useNavigate();
    const lastLogin = localStorage.getItem("lastLogin") === null ? "" : localStorage.getItem("lastLogin");
    const [data, setData] = useState(lastLogin);

    /////// Handle Warning Modal
    const [openWarn, setOpenWarn] = useState(false);
    const handleOpenWarn = () => setOpenWarn(true);
    const handleCloseWarn = () => setOpenWarn(false);

    /////// Handle Info Modal
    const [openInfo, setOpenInfo] = useState(false);
    const handleCloseInfo = () => setOpenInfo(prevData => !prevData);

    //////// Handle Set Controlled Data
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setData(event.target.value);
    };

    ////// Cancel Fetch API After Timeout
    const Timeout = (time) => {
        let controller = new AbortController();
        setTimeout(() => controller.abort(), time * 1000);
        return controller;
    };

    const handleSignIn = () => {
        const dataConfig = {
            ARG_TYPE: "EMP",
            ARG_EMPID: data,
            OUT_CURSOR: "",
        }

        fetchDownload(dataConfig);
    }
    
    ////// Download User Info Data
    const fetchDownload = async (dataConfig) => {
        fetch(downloadURL, {
            method: 'POST',
            mode: 'cors',
            dataType: "json",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataConfig),
            signal: Timeout(5).signal,
        }).then((response) => {
            response.json().then(async(result) => {
                if(result.length > 0){
                    // Store
                    if(result[0].EMAIL === null || result[0].EMAIL === undefined || result[0].EMAIL === ""){
                        handleOpenWarn();
                    }else{
                        sessionStorage.setItem("userData", JSON.stringify(result[0]));
                        localStorage.setItem("lastLogin", data);
                        fetchDownloadImg();
                    }
                }else{
                    handleOpenWarn();
                }
            })  
        }).catch(error => {
            setOpenInfo(true);
        });
    }

    ////// Download User Image
    const fetchDownloadImg = async () => {
        fetch(imageURL, {
            method: 'POST',
            mode: 'cors',
            dataType: "json",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "ARG_EMPID" : data,
                "OUT_CURSOR" : ""
              }),
            signal: Timeout(5).signal,
        }).then((response) => {
            response.json().then(async(result) => {

                if(result.length > 0){
                    let imgData = await arrayBufferToBase64(result[0].PHOTO.data);
    
                    if(imgData !== "" && imgData !== null){
                        sessionStorage.setItem("userImg", imgData);
                        navigate("/");
                    }
                }
            })  
        }).catch(error => {
            setOpenInfo(true);
        });
    }

    //////// Get Image Base-64
    const arrayBufferToBase64 = (buffer) => {
        var base64Flag = 'data:image/jpeg;base64,';
        var binary = '';
        var bytes = [].slice.call(new Uint8Array(buffer));
        bytes.forEach((b) => binary += String.fromCharCode(b));
        
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
                            <Stack marginBottom={1}>
                                <Typography variant="h5" className="p-label">
                                    {t('frm_user_id')}
                                </Typography>
                                <TextField
                                    id="userID"
                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                    className="b-input"
                                    placeholder={t('frm_user_id_placeholder')}
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
                            </Stack>
                            <Grid justifyContent="flex-end" className="s-mid">
                                <ButtonPrimary title={t('btn_login')} handleClick={handleSignIn} />
                            </Grid>
                        </form>
                    </Box>
                </Box>
            </Box>
            <ModalWarning 
                open={openWarn} 
                handleOpen={handleOpenWarn} 
                handleClose={handleCloseWarn}
                type='login-failed' />
            <ModalInfo 
                open={openInfo} 
                handleClose={handleCloseInfo}
                type='connect-failed' />
        </>
    );
};

export default SignIn;
