import { Box, TextField, Stack, Typography } from '@mui/material';
import InputAdornment from "@mui/material/InputAdornment";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { getDateFormat } from '../../../function/getDate'; 
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const DateModal = ({ title, placeholder, name, handleEvent, cValue, isValidate, message }) => {

    const value = cValue === "" ? null : Date.parse(getDateFormat(cValue));
    const minDate = new Date();

    return (
        <>
            <Stack marginBottom={2} direction={{xs: "column", sm: "row"}} alignItems={{xs: "normal", sm: "center"}} className="b-text-input">
                <Typography variant="h6" className="b-text-input__title b-italic">
                    {title} <span>(*)</span>
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ width: "100%" }}>
                        <MobileDatePicker
                            value={value}
                            onChange={(newValue) => {
                                handleEvent(name, newValue);
                            }}
                            minDate={minDate}
                            inputFormat="dd-MM-yyyy"
                            renderInput={(params) => 
                            <Stack sx={{width:"100%"}}>
                                <TextField {...params} sx={{backgroundColor: "#f8f6f7",}} fullWidth placeholder={placeholder} InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <CalendarMonthIcon />
                                        </InputAdornment>
                                    ),
                                }} />
                                {!isValidate && <Typography className='b-validate'><HighlightOffIcon sx={{width: '15px', height: '15px'}} />{message}</Typography> }
                            </Stack>}
                        />
                    </Box>
                </LocalizationProvider>
            </Stack>
        </>
    );
}

export default DateModal;