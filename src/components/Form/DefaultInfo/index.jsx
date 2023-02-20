import { Grid } from '@mui/material';
import TextInput from '../../TextInput';
import { useTranslation } from "react-i18next";

const FormDefaultInfo = ({data}) => {

    /////// Translate Lang
    const { t } = useTranslation();

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6} xl={4}>
                    <TextInput 
                        title={t('frm_fty')}
                        placeholder="" 
                        value={data.PLANT_NM} 
                        disable={true} 
                        inputProp={{ inputMode: 'text' }}
                        isDefault={true} />
                </Grid>
                <Grid item xs={12} md={6} xl={8}>
                    <TextInput 
                        title={t('frm_depart')}
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
                        title={t('frm_user_id')}
                        placeholder="" 
                        value={data.REQ_EMP} 
                        disable={true} 
                        inputProp={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        isDefault={true} />
                </Grid>
                <Grid item xs={12} md={6} xl={8}>
                    <TextInput 
                        title={t('frm_user_nm')}
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