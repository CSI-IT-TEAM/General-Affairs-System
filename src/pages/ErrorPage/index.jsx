import { Box, Container, Typography } from '@mui/material';
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ButtonRound from "../../components/Button/Round";
import warningImage from "../../assets/images/icons/warning.png";
import "./ErrorPage.scss";

const height = window.innerHeight;

const ErrorPage = () => {

    /////// Translate Lang
    const { t } = useTranslation();

    const navigate = useNavigate();

    const handleBack = () => {
        sessionStorage.removeItem('userData');
        navigate("/signin");
    }

    return (
        <>
            <Box className="s-error d-flex" sx={{ height: height }}>
                <Container>
                    <Box className="s-error-thumb">
                        <img src={warningImage} alt="Warning" />
                    </Box>
                    <Box className="s-error-content">
                        <Typography variant="h3" className="s-error-title">{t('404_title')}</Typography>
                        <Typography variant="h1" className="s-error-sub">
                            <span>4</span>
                            <span>0</span>
                            <span>4</span>
                        </Typography>
                        <Typography variant="h5" className="s-error-desc">{t('404_desc')}</Typography>
                    </Box>
                    <Box className="s-error-bot">
                        <ButtonRound title={t('btn_goback')} bgColor="#5550a5" handleClick={handleBack} />
                    </Box>
                </Container>
            </Box>
        </>
    );
}

export default ErrorPage;