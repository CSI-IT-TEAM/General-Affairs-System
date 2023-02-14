import { Box, Container, Grid, TextField, Stack, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

import TextInput from '../../components/TextInput';
import SelectModal from '../../components/SelectModal';
import DateModal from '../../components/DateModal/Desktop';
import DateModalMobile from '../../components/DateModal/Mobile';
import TimeModal from '../../components/TimeModal/Desktop';
import TimeModalMobile from '../../components/TimeModal/Mobile';
import ButtonPrimary from '../../components/Button/Primary';
import FormTitle from '../../components/Title/Form';
import ModalWarning from '../../components/Modal/Warning';
import ModalInfo from '../../components/Modal/Info';
import FormDefaultInfo from '../../components/Form/DefaultInfo';

import { reqCarData, reqCarValidate } from '../../data';
import { removeVietnamese, removeNewLine } from '../../function/getFormat';
import { getDate, formatDate, formatHMS, getDateFormat, getDateTimeFormat, formatHMS_00 } from '../../function/getDate';
import getDevice from '../../function/getDevice';
import { isCombackDate_Validate } from '../../function/getValidate';
import { getLastName } from '../../function/getLastName';
import { uploadURL } from '../../api';

import "./Form.scss";

const FormCar = () => {

    const [type, setType] = useState('connect-failed');

    /////// Request Data
    const [data, setData] = useState(reqCarData);
    const [validate, setValidate] = useState(reqCarValidate);
    const [reason, setReason] = useState(null);

    /////// Handle Warning Modal
    const [openWarn, setOpenWarn] = useState(false);
    const handleOpenWarn = () => setOpenWarn(true);
    const handleCloseWarn = () => setOpenWarn(false);

    /////// Handle Warning Modal
    const [openInfo, setOpenInfo] = useState(false);
    const handleCloseInfo = () => setOpenInfo(false);

    let _mainReason = JSON.parse(sessionStorage.getItem('mainReason'));
    let _subReason = JSON.parse(sessionStorage.getItem('subReason'));
    
    /////// Handle Default Data
    const handleDefault = async() => {
        const empData = JSON.parse(sessionStorage.getItem('userData'));

        setData(prevData => {
            return {
                ...prevData,
                "REQ_DATE": getDate(),
                "PLANT_CD": empData.PLANT_CD,    
                "PLANT_NM": empData.PLANT_NM, 
                "DEPT_CD": empData.DEPT,      
                "DEPT_NM": empData.DEPT_NM,           
                "REQ_EMP": empData.EMPID,           
                "REQ_EMP_NM": empData.EMP_NM, 
                "EMAIL_ADDRESS": empData.EMAIL, 
                "CREATOR": getLastName(empData.EMP_NM),
                "CREATE_PROGRAM_ID": "GA_SYSTEM_REQUEST",
            }
        });
    }

    useEffect(() => {
        handleDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    //////// Handle Set Controlled Data
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setData(prevData => {
            return {
                ...prevData,
                [event.target.name]: event.target.value,
            }
        });
    };

    const handleChangeSub = (name, value) => {
        
        let _result = "";

        switch(name){
            case "GO_DATE" : case "COMEBACK_DATE" : {
                _result = formatDate(value)
                break;
            }
            case "GO_TIME" : case "COMEBACK_TIME" : {
                _result = formatHMS(value)
                break;
            }
            default: {
                _result = value;
                break;
            }
        }

        switch(name){
            case "GO_DATE": {
                setData(prevData => {
                    return {
                        ...prevData,
                        [name]: _result,
                        "GO_DATE_FULL": value,
                    }
                });
                break;
            }
            case "COMEBACK_DATE": {
                setData(prevData => {
                    return {
                        ...prevData,
                        [name]: _result,
                        "COMEBACK_DATE_FULL": value,
                    }
                });
                break;
            }
            case "GO_TIME": {
                setData(prevData => {
                    return {
                        ...prevData,
                        [name]: _result,
                        "GO_TIME_FULL": value,
                    }
                });
                break;
            }
            case "COMEBACK_TIME": {
                setData(prevData => {
                    return {
                        ...prevData,
                        [name]: _result,
                        "COMEBACK_TIME_FULL": value,
                    }
                });
                break;
            }
            case "MAIN_REASON_CD": {
                setData(prevData => {
                    return {
                        ...prevData,
                        [name]: _result,
                        "SUB_REASON_CD": "",
                        "ARRIVAL": "",
                    }
                });
                setReason(prevData => []);
                setReason(prevData => _subReason.filter(val => val.MAIN_REASON_CD === _result));
              
                break;
            }
            case "SUB_REASON_CD": {
                let data = _subReason.filter(val => val.SUB_REASON_CD === _result);

                setData(prevData => {
                    return {
                        ...prevData,
                        [name]: _result,
                        "ARRIVAL": data[0].SUB_REASON_NM,
                    }
                });
              
                break;
            }
            default: {
                setData(prevData => {
                    return {
                        ...prevData,
                        [name]: _result,
                    }
                });

                break;
            }
        }
    }

    //////Cancel Fetch API After Timeout
    const Timeout = (time) => {
        let controller = new AbortController();
        setTimeout(() => controller.abort(), time * 1000);
        return controller;
    };

    //////// Handle Upload Data
    const handleSubmit = () => {
        if(handleVaidate()){
            const _uploadData = {
                ARG_TYPE: "SAVE",    
                ARG_REQ_DATE      : data.REQ_DATE,
                ARG_PLANT_CD      : data.PLANT_CD,
                ARG_DEPT_CD       : data.DEPT_CD,
                ARG_DEPT_NM       : data.DEPT_NM,
                ARG_REQ_EMP       : data.REQ_EMP,
                ARG_REQ_EMP_NM    : data.REQ_EMP_NM,
                ARG_EMAIL_ADDRESS : data.EMAIL_ADDRESS,
                ARG_GO_DATE       : data.GO_DATE,
                ARG_GO_TIME       : formatHMS_00(data.GO_TIME),
                ARG_COMEBACK_DATE : data.COMEBACK_DATE,
                ARG_COMEBACK_TIME : formatHMS_00(data.COMEBACK_TIME),
                ARG_DEPART        : removeVietnamese(data.DEPART.trim()),
                ARG_ARRIVAL       : data.ARRIVAL,
                ARG_MAN_QTY       : data.MAN_QTY,
                ARG_MAN_LIST      : removeVietnamese(removeNewLine(data.MAN_LIST)),
                ARG_MAIN_REASON_CD: data.MAIN_REASON_CD,
                ARG_SUB_REASON_CD : data.SUB_REASON_CD,
                ARG_CREATOR       : data.CREATOR,
                ARG_CREATE_PC     : "ADMIN",
                ARG_CREATE_PROGRAM_ID: data.CREATE_PROGRAM_ID,
            }
            fetchUpload(_uploadData);
        }
    }

    const fetchUpload = async (dataConfig) => {
        fetch(uploadURL, {
            method: 'POST',
            mode: 'cors',
            dataType: "json",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataConfig),
            signal: Timeout(5).signal,
        }).then((response) => {

            if(response.status === 200){
                setType('upload-success');
                setOpenInfo(true);

                ///// Clear Form Data to Default
                setData(prev => reqCarData);
                setValidate(prev => reqCarValidate);
                handleDefault();
            }else{
                handleOpenWarn();
            }
            
        }).catch(error => {
            setType('connect-failed');
            setOpenInfo(true);
        });
    }

    /////// Handle Validate Form Data
    const handleVaidate = () => {
        let _result = true;
        
        for (const property in data) {
            switch(property){
                case "MAIN_REASON_CD": case "SUB_REASON_CD":
                case "GO_DATE": case "GO_TIME":
                case "DEPART":
                    if(data[property] === ''){
                        _result = false;
                        handleSetValidate(property, false);
                    }else{
                        handleSetValidate(property, true);
                    }
                    break;
                case "COMEBACK_DATE": 
                    if(data[property] === ''){
                        _result = false;
                        handleSetValidate(property, false);
                    }else{
                        let _isValidate = isCombackDate_Validate(getDateFormat(data["GO_DATE"]),getDateFormat(data["COMEBACK_DATE"]));
                        if(_isValidate){
                            handleSetValidate(property, true);
                        }else{
                            _result = false;
                            handleSetValidate(property, false, "Comback Date must equal or greater than Depart Date");
                        }
                    }
                    break;
                case "COMEBACK_TIME":
                    if(data[property] === ''){
                        _result = false;
                        handleSetValidate(property, false);
                    }else{

                        let _depart = getDateTimeFormat(data["GO_DATE"] + " " + data["GO_TIME"]);
                        let _comeback = getDateTimeFormat(data["COMEBACK_DATE"] + " " + data["COMEBACK_TIME"]);
                        let _isValidate = isCombackDate_Validate(_depart,_comeback);
                        
                        if(_isValidate){
                            handleSetValidate(property, true);
                        }else{
                            _result = false;
                            handleSetValidate(property, false, "Comback Time must equal or greater than Depart Time");
                        }
                    }
                    break;
                case "MAN_QTY":
                    if(data[property] === '' || isNaN(data[property])){
                        _result = false;
                        handleSetValidate(property, false);
                    }else{
                        if(Number(data[property]) < 0){
                            _result = false;
                            handleSetValidate(property, false);
                        }else{
                            handleSetValidate(property, true);
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        return _result;
    }

    const handleSetValidate = (name, value, message="") => {
        setValidate(prevData => {
            return {
                ...prevData,
                [name]: {
                    validate: value,
                    message: message !== "" ? message : validate[name].message,
                }
            }
        });
    }

    return (
        <>
            <Box className="s-form">
                <Container>
                    <h3 className="s-form-title">Request <span>Vehicle</span></h3>
                    <Box className="s-form-content">
                        <form>
                            <FormTitle order='1' title='Personal Information' />
                            <FormDefaultInfo data={data} />
                            <FormTitle order='2' title='Request Information' />

                            <Stack direction={{xs: "column", sm: "row"}} alignItems="center" className="b-text-select b-spec">
                                <Typography variant="h6" className="b-text-input__title b-italic">
                                    Reason <span>(*)</span>
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4} xl={3} >
                                        <SelectModal 
                                            name="MAIN_REASON_CD"
                                            data={_mainReason}
                                            placeholder="Select Your Reason" 
                                            cValue={data.MAIN_REASON_CD}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.MAIN_REASON_CD.validate}
                                            message={validate.MAIN_REASON_CD.message} />
                                    </Grid>
                                    <Grid item xs={12} md={8} xl={9} >
                                        <SelectModal 
                                            name="SUB_REASON_CD"
                                            data={reason}
                                            placeholder="Reason Detail" 
                                            cValue={data.SUB_REASON_CD}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.SUB_REASON_CD.validate}
                                            message={validate.SUB_REASON_CD.message} />
                                    </Grid>
                                </Grid>
                            </Stack>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    {getDevice() ? 
                                        <DateModalMobile 
                                            title="Depart Date"
                                            placeholder="Select Depart Date" 
                                            name="GO_DATE"
                                            cValue={data.GO_DATE_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.GO_DATE.validate}
                                            message={validate.GO_DATE.message} />
                                        :
                                        <DateModal 
                                            title="Depart Date" 
                                            placeholder="Select Depart Date" 
                                            name="GO_DATE" 
                                            cValue={data.GO_DATE}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.GO_DATE.validate}
                                            message={validate.GO_DATE.message} />
                                
                                    }
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    {getDevice() ?
                                        <TimeModalMobile 
                                            title="Depart Time" 
                                            placeholder="Select Depart Time" 
                                            name="GO_TIME"
                                            cValue={data.GO_TIME_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.GO_TIME.validate}
                                            message={validate.GO_TIME.message} />
                                        :
                                        <TimeModal 
                                            title="Depart Time" 
                                            placeholder="Select Depart Time" 
                                            name="GO_TIME"
                                            cValue={data.GO_TIME_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.GO_TIME.validate}
                                            message={validate.GO_TIME.message} />
                                    }
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    {getDevice() ?
                                        <DateModalMobile
                                            title="Comeback Date" 
                                            placeholder="Select Comeback Date" 
                                            name="COMEBACK_DATE" 
                                            cValue={data.COMEBACK_DATE_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.COMEBACK_DATE.validate}
                                            message={validate.COMEBACK_DATE.message} />
                                        :
                                        <DateModal 
                                            title="Comeback Date" 
                                            placeholder="Select Comeback Date" 
                                            name="COMEBACK_DATE" 
                                            cValue={data.COMEBACK_DATE}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.COMEBACK_DATE.validate}
                                            message={validate.COMEBACK_DATE.message} /> 
                                    }
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    {getDevice() ?
                                        <TimeModalMobile
                                            title="Comeback Time" 
                                            placeholder="Select Comeback Time"
                                            name="COMEBACK_TIME" 
                                            cValue={data.COMEBACK_TIME_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.COMEBACK_TIME.validate}
                                            message={validate.COMEBACK_TIME.message} />
                                        :
                                        <TimeModal 
                                            title="Comeback Time" 
                                            placeholder="Select Comeback Time" 
                                            name="COMEBACK_TIME" 
                                            cValue={data.COMEBACK_TIME_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.COMEBACK_TIME.validate}
                                            message={validate.COMEBACK_TIME.message} />
                                    }
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextInput 
                                        title="Pick up" 
                                        placeholder="Type place to pick up" 
                                        value={data.DEPART}
                                        handleEvent={handleChange}
                                        disable={false} 
                                        inputProp={{ inputMode: 'text' }}
                                        name="DEPART"
                                        isImportant={true}
                                        isValidate={validate.DEPART.validate}
                                        message={validate.DEPART.message} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextInput 
                                        title="Passengers" 
                                        placeholder="Type number of passengers" 
                                        value={data.MAN_QTY} 
                                        handleEvent={handleChange}
                                        disable={false} 
                                        inputProp={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                        name="MAN_QTY"
                                        isImportant={true}
                                        isValidate={validate.MAN_QTY.validate}
                                        message={validate.MAN_QTY.message} />
                                </Grid>
                            </Grid>

                            <Stack marginBottom={2} direction={{xs: "column", sm: "row"}} alignItems={{xs: "normal", sm: "center"}} className="b-text-input mt-10">
                                <Typography variant="h6" className="b-text-input__title b-italic">
                                    Passengers List
                                </Typography>
                                <TextField
                                    inputProps={{ inputMode: 'text' }}
                                    className="b-text-input__desc"
                                    disabled={false}
                                    placeholder="Type Passengers Name"
                                    color="info"
                                    fullWidth
                                    value={data.MAN_LIST}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    name="MAN_LIST"
                                    sx={{ backgroundColor: "#f8f6f7" }}
                                />
                            </Stack>
                            <Box className="s-form-bot">
                                <ButtonPrimary title="Request Now" handleClick={() => handleSubmit()} />
                            </Box>
                        </form>
                    </Box>
                </Container>
            </Box>
            <ModalWarning 
                open={openWarn} 
                handleOpen={handleOpenWarn} 
                handleClose={handleCloseWarn}
                type='upload-failed' />
            <ModalInfo 
                open={openInfo} 
                handleClose={handleCloseInfo}
                type={type} />
        </>
    );
}

export default FormCar;