import { Typography, Box, Container, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import avatarImage from "../../assets/images/avatar.png";
import ModalLogout from "../Modal/Logout";

const Header = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleToggle = () => {
        setOpen(open => !open);
    }

    const handleLogOut = () => {
        sessionStorage.removeItem('userData');
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
                    <Box onClick={() => handleToggle()}>
                        <Avatar
                            alt="avatar"
                            src={avatarImage}
                            className="s-avatar"
                        />
                    </Box>
                </Container>
            </Box>
            <ModalLogout open={open} handleClose={handleToggle} handleLogOut={handleLogOut} />
        </>
    );
};

export default Header;
