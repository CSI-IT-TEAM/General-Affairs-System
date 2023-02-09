import { Box, TextField, Stack, Typography } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import InputAdornment from "@mui/material/InputAdornment";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const TimeModal = ({ title, placeholder, name, cValue, handleEvent, isValidate, message }) => {
    const value = cValue === "" ? null : cValue;

    return (

        <Stack marginBottom={2} direction="row" alignItems="center" className="b-text-input">
            <Typography variant="h6" className="b-text-input__title b-italic">
                {title} <span>(*)</span>
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ width: "100%" }}>
                    <MobileTimePicker
                        value={value}
                        onChange={(newValue) => {
                            handleEvent(name, newValue);
                        }}
                        renderInput={(params) => 
                        <Stack sx={{width:"100%"}}>
                            <TextField {...params} sx={{backgroundColor: "#f8f6f7",}} fullWidth placeholder={placeholder} InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <AccessTimeIcon />
                                    </InputAdornment>
                                ),
                            }} />
                            {!isValidate && <Typography className='b-validate'><HighlightOffIcon sx={{width: '15px', height: '15px'}} />{message}</Typography> }
                        </Stack>}
                    />
                </Box>
            </LocalizationProvider>
        </Stack>
    );
}

export default TimeModal;