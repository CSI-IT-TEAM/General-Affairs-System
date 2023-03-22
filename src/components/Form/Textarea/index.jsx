import { TextField, Stack, Typography } from '@mui/material';

const FormTextarea = () => {
    return (
        <Stack marginBottom={2} direction={{xs: "column", sm: "row"}} alignItems={{xs: "normal", sm: "center"}} className="b-text-input mt-10">
            <Typography variant="h6" className="b-text-input__title b-italic">
                Passenger List
            </Typography>
            <TextField
                inputProps={{ inputMode: 'text' }}
                className="b-text-input__desc"
                disabled={false}
                placeholder="Xin chao" 
                color="info"
                fullWidth
                value=''
                onChange={() => {}}
                multiline
                rows={4}
                name="MAN_LIST"
                sx={{ backgroundColor: "#f8f6f7" }}
            />
        </Stack> 
    );
}

export default FormTextarea;