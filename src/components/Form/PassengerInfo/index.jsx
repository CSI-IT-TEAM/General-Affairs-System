import { Grid, TextField, Stack, Typography } from '@mui/material';
import { useTranslation } from "react-i18next";
import SelectModal from '../../SelectModal';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import SquareRoundedIcon from '@mui/icons-material/SquareRounded';

const PassengerInfo = ({ item, index, dropOffList, handleName, handleDropOff  }) => {

    /////// Translate Lang
    const { t } = useTranslation();

    return(
        <Grid container spacing={2} className="s-form-grid__item s-form-grid__item--second">
            <Grid item xs={12} md={6}>
                <Stack direction={{xs: "column"}} alignItems={{xs: "normal"}} className='b-text-input'>
                    <Stack sx={{width:"100%"}} 
                        direction="row"
                        alignItems="center"
                        className="s-form-sub"
                        >
                        <SquareRoundedIcon sx={{fontSize: 12}} />
                        <Typography variant="h6" className="b-text-input__sub b-italic">
                            {`${t('frm_txt_passenger_placeholder')} ${index + 1}`}
                        </Typography>
                    </Stack>
                    <TextField
                        name={item.id}
                        className="b-text-input__desc"
                        disabled={index === 0 ? true : false}
                        placeholder={`${t('frm_txt_passenger_placeholder')} ${index + 1}`}
                        color="info"
                        fullWidth
                        value={item.name}
                        onChange={handleName}
                    />
                    {!item.validate && <Typography className='b-validate'>
                        <HighlightOffIcon sx={{width: '17px', height: '17px'}} />{t('frm_required')}
                    </Typography>}
                </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
                <Stack sx={{width:"100%"}}>
                    <SelectModal 
                        name={item.id + "_DROP_OFF_CD"}
                        data={dropOffList}
                        placeholder={t('frm_dropOff_placeholder')}
                        cValue={item.dropOff}
                        handleEvent={handleDropOff}
                        isValidate={item.validDropOff}
                        message={t('frm_required')}
                        />
                </Stack>
            </Grid>
        </Grid>
    );
}

export default PassengerInfo;