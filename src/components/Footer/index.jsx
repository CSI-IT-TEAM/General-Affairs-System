import { Typography, Box, Container } from "@mui/material";

const Footer = () => {

    const date = new Date();
    const year = date.getFullYear();

    return (
        <>
            {/* <ModalLogout open={open} handleClose={handleToggle} handleLogOut={handleLogOut} />
            <div className="btn-floating" onClick={handleToggle}>
                <img src={overlayImage} alt="Overlay" />
            </div>  */}
            <Box className="s-footer">
                <Container>
                    <Typography variant="h5" component="div" className="s-footer-title">© {year} - Application is made with 🥰 by CSI IT Team</Typography>
                </Container>
            </Box>
        </>
    )
}

export default Footer;