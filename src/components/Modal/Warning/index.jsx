import * as React from 'react';
import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useTranslation } from "react-i18next";

import "./ModalWarning.scss";
import { warningData } from '../../../data';

const ModalWarning = ({ open, handleOpen, handleClose, type }) => {

    /////// Translate Lang
    const { t } = useTranslation();

    let data = null;
    let isWarning = true;
    let titleModal = "", titleDesc = "";

    switch(type){
        case warningData[0].type: 
            data = warningData[0];
            titleModal = t('login_fail_title');
            titleDesc = t('login_fail_desc');
            break;
        case warningData[1].type: 
            data = warningData[1];
            isWarning = false;
            titleModal = t('warn');
            titleDesc = t('under_construction');
            break;
        case warningData[2].type: 
            data = warningData[2];
            titleModal = t('upload_fail_title');
            titleDesc = t('upload_fail_desc');
            break;
        default:
            data = warningData[0];
            titleModal = t('login_fail_title');
            titleDesc = t('login_fail_desc');
            break;
    }

    //Fade effects with Timeout 
    useEffect(() => {

        var timeOut = '';

        if(open){
            timeOut = setTimeout(() => {
                handleClose();
            }, 5000);
        }

        return () => {
            if(timeOut) clearTimeout(timeOut);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <div>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box className="s-modal">
                    <Box className={isWarning ? "s-modal__thumb s-modal__thumb--warn" : "s-modal__thumb"}>
                        <img src={data.thumb} alt={data.title} />
                    </Box>
                    <Typography id="modal-modal-title" variant="h5" className="s-modal__title">
                        {titleModal}
                    </Typography>
                    <Typography id="modal-modal-desc" variant="h6" component="h2" className="s-modal__desc">
                        {titleDesc}
                    </Typography>
                </Box>
            </Modal>
        </div>
    );
}

export default ModalWarning;