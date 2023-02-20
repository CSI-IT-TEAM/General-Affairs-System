import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useTranslation } from "react-i18next";

import warningImage from "../../../assets/images/icons/warning.png";
import ButtonRound from '../../Button/Round';

const ModalLogout = ({ open, handleClose, handleLogOut }) => {

    /////// Translate Lang
    const { t } = useTranslation();

    return (
        <div>
            <Modal
                open={open}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box className="s-modal">
                    <Box className="s-modal__thumb s-mt">
                        <img src={warningImage} alt="Under Construction" />
                    </Box>
                    <Typography id="modal-modal-title" variant="h5" className="s-modal__title">
                        {t('warn')}
                    </Typography>
                    <Typography id="modal-modal-desc" variant="h6" component="h2" className="s-modal__desc">
                        {t('logout_desc')}
                    </Typography>
                    <Box className="d-flex s-modal__bot">
                        <ButtonRound title={t('btn_yes')} bgColor="#4caf50" handleClick={handleLogOut} />
                        <ButtonRound title={t('btn_no')} bgColor="#d32f2f" handleClick={handleClose} />
                    </Box>
                </Box>
            </Modal>
        </div>
    );
}

export default ModalLogout;