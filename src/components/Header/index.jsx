import { Typography, Box, Container, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import i18next from "i18next";

import avatarImage from "../../assets/images/avatar.png";
import ModalLogout from "../Modal/Logout";
import { langData } from "../../data";

const Header = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    ///// Set Default language
    const [lang, setLang] = useState(i18next.language);
    const handleChange = (event: SelectChangeEvent) => {
        i18next.changeLanguage(event.target.value);
        setLang(event.target.value);
    };
   
    const getLangImage = () => {
        const value = langData.filter(item => item.value === lang);
        return value[0].thumb;
    }

    const langImage = getLangImage();

    /////// Check user Thumb
    const userImage = (sessionStorage.getItem('userImg') === null || sessionStorage.getItem('userImg').length === 0) ? avatarImage : sessionStorage.getItem('userImg');

    const handleToggle = () => {
        setOpen(open => !open);
    }

    const handleLogOut = () => {
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('userImg');
        navigate("/signin");
    }

    const handleNavigate = () => {
        navigate("/");
    }

    return (
        <>
            <Box className="s-header">
                <Container className="d-flex">
                    <Box className="s-header-text" onClick={() => handleNavigate()}>
                        <Typography variant="h5" component="div" className="s-header-logo">
                            CSG
                        </Typography>
                        <span>
                            <Typography variant="h1" className="s-header-title s-header-title__top">
                                General Affairs
                            </Typography>
                            <Typography variant="h2" className="s-header-title s-header-title__bot">
                                System
                            </Typography>
                        </span>
                    </Box>
                    <Box className="d-flex">
                        <Box className="s-language d-flex">
                            <Box className="s-language__thumb">
                                <img src={langImage} alt="Language" />
                            </Box>
                            <FormControl sx={{ m: 1 }} size="small" variant="standard" className="s-language__select">
                                <Select
                                    value={lang}
                                    onChange={handleChange}
                                >
                                    {langData.map((item) => {
                                        return (
                                            <MenuItem key={item.value} value={item.value} className="s-lang__item">{item.title}</MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                        <Avatar
                            alt="avatar"
                            src={userImage}
                            className="s-avatar"
                            onClick={() => handleToggle()}
                        />
                        
                    </Box>
                </Container>
            </Box>
            <ModalLogout open={open} handleClose={handleToggle} handleLogOut={handleLogOut} />
        </>
    );
};

export default Header;
