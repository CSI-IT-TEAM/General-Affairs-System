import { Grid } from '@mui/material';
import TextInput from '../../TextInput';

const FormDefaultInfo = ({data}) => {
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6} xl={4}>
                    <TextInput 
                        title="Factory" 
                        placeholder="" 
                        value={data.PLANT_NM} 
                        disable={true} 
                        inputProp={{ inputMode: 'text' }}
                        isDefault={true} />
                </Grid>
                <Grid item xs={12} md={6} xl={8}>
                    <TextInput 
                        title="Department" 
                        placeholder="" 
                        value={data.DEPT_NM} 
                        disable={true} 
                        inputProp={{ inputMode: 'text' }}
                        isDefault={true} />
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6} xl={4}>
                    <TextInput 
                        title="User ID"
                        placeholder="" 
                        value={data.REQ_EMP} 
                        disable={true} 
                        inputProp={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        isDefault={true} />
                </Grid>
                <Grid item xs={12} md={6} xl={8}>
                    <TextInput 
                        title="User Name" 
                        placeholder="" 
                        value={data.REQ_EMP_NM} 
                        disable={true} 
                        inputProp={{ inputMode: 'text' }}
                        isDefault={true} />
                </Grid>
            </Grid>
        </>
    );
}

export default FormDefaultInfo;