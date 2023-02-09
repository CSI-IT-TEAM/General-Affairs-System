import { Typography, Box, Container, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import avatarImage from "../../assets/images/avatar.png";

const Header = () => {
    const navigate = useNavigate();

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
                    <Avatar
                        alt="avatar"
                        src={avatarImage}
                        className="s-avatar"
                    />
                </Container>
            </Box>
        </>
    );
};

export default Header;
