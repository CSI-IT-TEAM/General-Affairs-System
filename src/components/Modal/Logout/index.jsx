import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

import warningImage from "../../../assets/images/icons/warning.png";
import ButtonRound from '../../Button/Round';

const ModalLogout = ({ open, handleClose, handleLogOut }) => {

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
                        Warning!!!
                    </Typography>
                    <Typography id="modal-modal-desc" variant="h6" component="h2" className="s-modal__desc">
                        Are you sure you want to logout?
                    </Typography>
                    <Box className="d-flex s-modal__bot">
                        <ButtonRound title="Yes" bgColor="#4caf50" handleClick={handleLogOut} />
                        <ButtonRound title="No" bgColor="#d32f2f" handleClick={handleClose} />
                    </Box>
                </Box>
            </Modal>
        </div>
    );
}

export default ModalLogout;