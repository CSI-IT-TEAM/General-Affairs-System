import { Typography, Box, Container } from "@mui/material";

const Footer = () => {

    const date = new Date();
    const year = date.getFullYear();

    return (
        <>
            <Box className="s-footer">
                <Container>
                    <Typography variant="h5" component="div" className="s-footer-title">© {year} - Application is made with 🥰 by VJ IT Team</Typography>
                </Container>
            </Box>
        </>
    )
}

export default Footer;