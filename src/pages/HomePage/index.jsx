import { Box, Container, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import CardPrimary from '../../components/Card/Primary';
import ModalWarning from '../../components/Modal/Warning';

import "./HomePage.scss";
import { optionData } from '../../data';
import { downloadURL } from '../../api';

const width = window.innerWidth;

const HomePage = () => {

    /////// Handle Warning Modal
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const colSpacing = width > 479 ? 2 : 1.5;

    /////// Check user Info
    const userIsActive = (sessionStorage.getItem('userData') === null || sessionStorage.getItem('userData').length === 0) ? true : false;
    const navigate = useNavigate();

    const handleReason = async(type) => {
        const dataConfig = {
            ARG_TYPE: type,
            ARG_EMPID: "",
            OUT_CURSOR: "",
        }
        fetchDownload(type, dataConfig);
    }

    const fetchDownload = async (type, dataConfig) => {
        fetch(downloadURL, {
            method: 'POST',
            mode: 'cors',
            dataType: "json",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataConfig)
        }).then((response) => {
            response.json().then(async(result) => {
                if(result.length > 0){
                    // Store
                    if(type === "MAIN_REASON"){
                        sessionStorage.setItem("mainReason", JSON.stringify(result));
                    }else{
                        sessionStorage.setItem("subReason", JSON.stringify(result));
                    }
                }
            })  
        });
    }

    useEffect(() => {
        handleLogOut();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /////// LogOut Event
    const handleLogOut = () => {
        if (userIsActive) {
            navigate("/signin");
        }else{
            sessionStorage.removeItem('mainReason');
            sessionStorage.removeItem('subReason');
            handleReason("MAIN_REASON");
            handleReason("SUB_REASON");
        }
    }

    /////// Navigate to new Screen
    const handleNavigate = (id) => {
        switch (id) {
            case "001":
                navigate("/request/car");
                break;
            case "002":
                navigate("/request/hospital");
                break;
            case "003":
                navigate("/request/plane");
                break;
            default: {
                navigate("/");
                break;
            }
        }
    }

    return (
        <>
            <Box className='s-home'>
                <Container>
                    <h3 className="s-home-title">Services <span>Provided</span></h3>
                    <Grid container spacing={colSpacing}>
                        {optionData.map((item, index) => {
                            if (item.id === "001") {
                                return (
                                    <Grid item md={4} xs={12} key={item.id}>
                                        <CardPrimary data={item} handleClick={() => handleNavigate(item.id)} />
                                    </Grid>
                                );
                            }
                            else {
                                return (
                                    <Grid item md={4} xs={6} key={item.id}>
                                        <CardPrimary data={item} handleClick={handleOpen} />
                                    </Grid>
                                );
                            }
                        })}
                    </Grid>
                </Container>
            </Box>
            <ModalWarning 
                open={open} 
                handleOpen={handleOpen} 
                handleClose={handleClose}
                type='under-construct' />
        </>
    );
}

export default HomePage;