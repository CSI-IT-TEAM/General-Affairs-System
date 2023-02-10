import { Stack, Typography } from '@mui/material';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import DateBox from 'devextreme-react/date-box';

const DateModalMobile = ({ title, placeholder, name, handleEvent, cValue, isValidate, message }) => {

    const value = cValue === "" ? null : cValue;
    const minDate = new Date();

    return (
        <>
            <Stack marginBottom={2} direction={{xs: "column", sm: "row"}} alignItems={{xs: "normal", sm: "center"}} className="b-text-input">
                <Typography variant="h6" className="b-text-input__title b-italic">
                    {title} <span>(*)</span>
                </Typography>
                <Stack sx={{width: "100%"}}>
                    <DateBox defaultValue={new Date()}
                        placeholder={placeholder}
                        type="date"
                        value={value}
                        min={minDate}
                        onValueChanged={(e) => {
                            if(e.value !== null && e.value !== "" && e.value !== undefined){
                                handleEvent(name, e.value);
                            }
                        }}
                        pickerType="rollers"
                        useMaskBehavior={true}
                        displayFormat={"dd-MM-yyyy"}
                        />
                    {!isValidate && <Typography className='b-validate'><HighlightOffIcon sx={{width: '15px', height: '15px'}} />{message}</Typography> }
                </Stack>
            </Stack>
        </>
    );
}

export default DateModalMobile;