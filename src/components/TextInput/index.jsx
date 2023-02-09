import { TextField, Stack, Typography } from '@mui/material';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const TextInput = ({ title, placeholder, value, disable, inputProp, name="", handleEvent, isImportant=false, isValidate=true, message="" }) => {
    return (
        <>
            <Stack marginBottom={2} direction="row" alignItems="center" className='b-text-input'>
                <Typography variant="h6" className="b-text-input__title b-italic">
                    {title} {isImportant && <span>(*)</span>}
                </Typography>
                <Stack sx={{width:"100%"}}>
                    <TextField
                        name={name}
                        inputProps={inputProp}
                        className="b-text-input__desc"
                        disabled={disable}
                        placeholder={placeholder}
                        color="info"
                        fullWidth
                        value={value}
                        onChange={handleEvent}
                    />
                    {!isValidate && <Typography className='b-validate'><HighlightOffIcon sx={{width: '17px', height: '17px'}} />{message}</Typography> }
                </Stack>
            </Stack>
        </>
    );
}

export default TextInput;