import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

import { infoData } from '../../../data';
import ButtonRound from '../../Button/Round';

const ModalInfo = ({ open, handleClose, type }) => {

    let data = null;

    switch(type){
        case infoData[0].type: 
            data = infoData[0];
            break;
        case infoData[1].type: 
            data = infoData[1];
            break;
        default:
            data = infoData[0];
            break;
    }

    return (
        <div>
            <Modal
                open={open}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box className="s-modal">
                    <Box className="s-modal__thumb s-mt">
                        <img src={data.thumb} alt={data.type} />
                    </Box>
                    <Typography id="modal-modal-title" variant="h5" className="s-modal__title">
                        {data.title}
                    </Typography>
                    <Typography id="modal-modal-desc" variant="h6" component="h2" className="s-modal__desc">
                        {data.desc}
                    </Typography>
                    <Box className="s-modal__bot d-flex--center">
                        <ButtonRound title="OK" bgColor="#4caf50" handleClick={handleClose} />
                    </Box>
                </Box>
            </Modal>
        </div>
    );
}

export default ModalInfo;