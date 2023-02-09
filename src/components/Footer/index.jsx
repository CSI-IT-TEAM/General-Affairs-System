import { Typography, Box, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import ModalLogout from "../Modal/Logout";
import overlayImage from "../../assets/images/icons/logout.png";

const Footer = () => {

    const date = new Date();
    const year = date.getFullYear();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleToggle = () => {
        setOpen(open => !open);
    }

    const handleLogOut = () => {
        sessionStorage.removeItem('userData');
        navigate("/signin");
    }

    return (
        <>
            <ModalLogout open={open} handleClose={handleToggle} handleLogOut={handleLogOut} />
            <div className="btn-floating" onClick={handleToggle}>
                <img src={overlayImage} alt="Overlay" />
            </div>
            <Box className="s-footer">
                <Container>
                    <Typography variant="h5" component="div" className="s-footer-title">© {year} - Application is made with 🥰 by CSI IT Team</Typography>
                </Container>
            </Box>
        </>
    )
}

export default Footer;