import * as React from "react";
import { useState } from "react";
import { TextField, Typography, Box, Stack, Grid } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ButtonPrimary from "../../components/Button/Primary";
import { useNavigate } from "react-router-dom";
import ModalWarning from "../../components/Modal/Warning";
import ModalInfo from "../../components/Modal/Info";

import "./SignIn.scss";
import loginImage from "../../assets/images/sign-in.png";
import { downloadURL } from "../../api";

const height = window.innerHeight - 30 + "px";

const SignIn = () => {

    const navigate = useNavigate();
    const [data, setData] = useState('');

    /////// Handle Warning Modal
    const [openWarn, setOpenWarn] = useState(false);
    const handleOpenWarn = () => setOpenWarn(true);
    const handleCloseWarn = () => setOpenWarn(false);

    /////// Handle Info Modal
    const [openInfo, setOpenInfo] = useState(false);
    const handleCloseInfo = () => setOpenInfo(prevData => !prevData);

    //////// Handle Set Controlled Data
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setData(event.target.value,);
    };

    //////Cancel Fetch API After Timeout
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
                    sessionStorage.setItem("userData", JSON.stringify(result[0]));
                    navigate("/");
                }else{
                    handleOpenWarn();
                }
            })  
        }).catch(error => {
            setOpenInfo(true);
        });
    }

    return (
        <>
            <Box
                className="s-layout"
                sx={{
                    width: "100%",
                    height: height,
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
                            <Stack marginBottom={2}>
                                <Typography variant="h5" className="p-label">
                                    User ID
                                </Typography>
                                <TextField
                                    id="userID"
                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                    className="b-input"
                                    placeholder="Type your User ID"
                                    value={data}
                                    onChange={handleChange}
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
                            <Grid container justifyContent="flex-end" className="s-mid">
                                <ButtonPrimary title="Login" handleClick={handleSignIn} />
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
