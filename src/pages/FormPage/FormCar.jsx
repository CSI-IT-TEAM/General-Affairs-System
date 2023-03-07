import { Box, Container, Grid, TextField, Stack, Typography, Checkbox, FormControlLabel } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18next from "i18next";

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

import { reqCarData, reqCarValidate, passengerNum } from '../../data';
import { removeVietnamese, formatPassengerList, getMainPassenger } from '../../function/getFormat';
import { getDate, getDateTime, formatDate, formatHMS, getDateFormat, getDateTimeFormat, formatHMS_00 } from '../../function/getDate';
import getDevice from '../../function/getDevice';
import { isCombackDate_Validate, timeDifference } from '../../function/getValidate';
import { getLastName } from '../../function/getLastName';
import { uploadURL } from '../../api';

import "./Form.scss";

const FormCar = () => {
    const navigate = useNavigate();
    const _specificTime = " 160000";

    /////// Handle Checkbox
    const [isInclude, setIsInclude] = useState(false);

    const handleIsInclude = () => {
        setIsInclude(isInclude => !isInclude);

        if(passengerList !== null && passengerList.length > 0){
            const empData = JSON.parse(sessionStorage.getItem('userData'));

            const _result = passengerList.map((item) => {
                if(item.id === "passenger_1"){
                    return {
                        id: item.id,
                        name: !isInclude ? empData.EMP_NM : "",
                        validate: !isInclude ? true : false,
                    }
                }
                else{
                    return item;
                }
            });
    
            setPassengerList(prevData => _result);
        }
    }

    /////// Open Text Field for Pick Up: ETC
    const [openPickUp, setOpenPickUp] = useState(false);

    /////// Translate Lang
    const { t } = useTranslation();
    const langCookie = i18next.language;
    const [lang, setLang] = useState(langCookie);

    useEffect(() => {
        setLang(i18next.language);
    },[langCookie]);

    const [type, setType] = useState('connect-failed');

    /////// Request Data
    const [data, setData] = useState(reqCarData);
    const [validate, setValidate] = useState(reqCarValidate);
    const [reason, setReason] = useState(null);
    const [passengerList, setPassengerList] = useState([]);

    /////// Handle Warning Modal
    const [openWarn, setOpenWarn] = useState(false);
    const handleOpenWarn = () => setOpenWarn(true);
    const handleCloseWarn = () => setOpenWarn(false);

    /////// Handle Warning Modal
    const [openInfo, setOpenInfo] = useState(false);
    const handleCloseInfo = () => setOpenInfo(false);

    ////// List Data From Session
    let _mainReason = JSON.parse(sessionStorage.getItem('mainReason'));
    let _subReason = JSON.parse(sessionStorage.getItem('subReason'));
    let _departList = JSON.parse(sessionStorage.getItem('departList'));
    let _dropOffList = JSON.parse(sessionStorage.getItem('dropOffList'));
    let _deptEmpList = JSON.parse(sessionStorage.getItem('deptEmpList'));

    ////// Search EMP ID
    const [empID, setEmpID] = useState('');

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmpID(event.target.value);

        if(event.target.value === ""){
            const _result = passengerList.map((item) => {
                if(item.id === "passenger_1"){
                    return {
                        id: item.id,
                        name: "",
                        validate: false,
                    }
                }
                else{
                    return item;
                }
            });
    
            setPassengerList(prevData => _result);
        }
        else {
            if(_deptEmpList !== null && _deptEmpList.length > 0){
                let _searchResult = _deptEmpList.filter((item) => item.EMPID.includes(event.target.value));

                if(_searchResult !== null && _searchResult !== "" && _searchResult.length > 0){
                    const _result = passengerList.map((item) => {
                        if(item.id === "passenger_1"){
                            return {
                                id: item.id,
                                name: _searchResult[0].EMP_NM,
                                validate: true,
                            }
                        }
                        else{
                            return item;
                        }
                    });
            
                    setPassengerList(prevData => _result);
                }else{
                    const _result = passengerList.map((item) => {
                        if(item.id === "passenger_1"){
                            return {
                                id: item.id,
                                name: "",
                                validate: false,
                            }
                        }
                        else{
                            return item;
                        }
                    });
            
                    setPassengerList(prevData => _result);
                }
            }
        }
    } 
    
    /////// Handle Default Data
    const handleDefault = async() => {
        const empData = JSON.parse(sessionStorage.getItem('userData'));
        setOpenPickUp(false);
        setIsInclude(false);
        setPassengerList([]);
        setEmpID('');

        if(empData != null) {
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
        }else{
            navigate("/signin");
        }
    }

    useEffect(() => {
        handleDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    //////// Handle Set Controlled Data
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if(event.target.value === ""){
            handleSetValidate(event.target.name, false);
        }else{
            handleSetValidate(event.target.name, true);
        }

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

                /////// If Depart Date is Today && Current Time >= 14:00 PM => Invalidate
                const _currentDateTime = getDateTime();
                let _specificDateTime = getDate() + _specificTime;
                let _checkValidate = isCombackDate_Validate(_currentDateTime, _specificDateTime);

                if(_result === getDate() && !_checkValidate){
                    handleSetValidate("GO_DATE", false, "The depart date must start from tomorrow", "Ngày xuất phát phải từ ngày mai trở đi");
                    break;
                }else{
                    handleSetValidate("GO_DATE", true);
                }

                /////// If Depart Date > Current Time
                let _depart = getDateTimeFormat(_result + " " + data["GO_TIME"]);
                let _isValidate = timeDifference(_depart);

                if(_isValidate){
                    handleSetValidate("GO_DATE", true);
                    handleSetValidate("GO_TIME", true);
                }else{
                    handleSetValidate("GO_DATE", false, "The return date and time must be 2 hours greater than the present time", "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại");
                    handleSetValidate("GO_TIME", false, "The return date and time must be 2 hours greater than the present time", "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại");
                    break;
                }

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

                let _isValidate = isCombackDate_Validate(getDateFormat(data["GO_DATE"]),getDateFormat(_result));
                if(_isValidate){
                    handleSetValidate(name, true);
                }else{
                    handleSetValidate(name, false, "Comback Date must equal or greater than Depart Date", "Ngày về phải lớn hơn hoặc bằng Ngày xuất phát");
                }

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

                /////// If Depart Date is Today && Current Time >= 14:00 PM => Invalidate
                const _currentDateTime = getDateTime();
                let _specificDateTime = getDate() + _specificTime;
                let _checkValidate = isCombackDate_Validate(_currentDateTime, _specificDateTime);

                if(data["GO_DATE"] === getDate() && !_checkValidate){
                    handleSetValidate("GO_DATE", false, "The depart date must start from tomorrow", "Ngày xuất phát phải từ ngày mai trở đi");
                    break;
                }else{
                    handleSetValidate("GO_DATE", true);
                }

                /////// If Depart Date Time > Current Date Time
                let _depart = getDateTimeFormat(data["GO_DATE"] + " " + _result);
                let _isValidate = timeDifference(_depart);

                if(_isValidate){
                    handleSetValidate("GO_DATE", true);
                    handleSetValidate("GO_TIME", true);
                }else{
                    handleSetValidate("GO_DATE", false, "The return date and time must be 2 hours greater than the present time", "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại");
                    handleSetValidate("GO_TIME", false, "The return date and time must be 2 hours greater than the present time", "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại");
                }

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

                let _depart = getDateTimeFormat(data["GO_DATE"] + " " + data["GO_TIME"]);
                let _comeback = getDateTimeFormat(data["COMEBACK_DATE"] + " " + _result);
                let _isValidate = isCombackDate_Validate(_depart,_comeback);
                
                if(_isValidate){
                    handleSetValidate(name, true);
                }else{
                    handleSetValidate(name, false, "Comback Time must equal or greater than Depart Time", "Giờ về phải lớn hơn hoặc bằng Giờ xuất phát");
                }

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

                if(_result === ''){
                    handleSetValidate(name, false);
                }else{
                    handleSetValidate(name, true);
                }
              
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

                if(_result === ''){
                    handleSetValidate(name, false);
                }else{
                    handleSetValidate(name, true);
                }
              
                break;
            }

            case "DEPART_CD": {
                let data = _departList.filter(val => val.DEPART_CD === _result);

                if(_result !== "ETC"){
                    setOpenPickUp(false);
                    setData(prevData => {
                        return {
                            ...prevData,
                            [name]: _result,
                            "DEPART_NM": data[0].DEPART_NM,
                        }
                    });
                }else{
                    setOpenPickUp(true);
                    setData(prevData => {
                        return {
                            ...prevData,
                            [name]: _result,
                            "DEPART_NM": "",
                        }
                    });
                }

                if(_result === ''){
                    handleSetValidate(name, false);
                }else{
                    handleSetValidate(name, true);
                }
              
                break;
            }
            case "MAN_QTY":

                setPassengerList(prevData => []);
                const empData = JSON.parse(sessionStorage.getItem('userData'));

                for(let iCount = 1; iCount <= _result; iCount++){
                    if(iCount === 1 && isInclude){
                        setPassengerList(prevData => {
                            return [
                                ...prevData,
                                {
                                    id: "passenger_" + iCount,
                                    name: empData.EMP_NM,
                                    validate: true,
                                }
                            ]
                        })
                    }
                    else{
                        setPassengerList(prevData => {
                            return [
                                ...prevData,
                                {
                                    id: "passenger_" + iCount,
                                    name: "",
                                    validate: false,
                                }
                            ]
                        })
                    }
                }

                setData(prevData => {
                    return {
                        ...prevData,
                        [name]: _result,
                    }
                });

                if(_result === ''){
                    handleSetValidate(name, false);
                }else{
                    handleSetValidate(name, true);
                }

                break;

            case "DROP_OFF_CD":
                setData(prevData => {
                    return {
                        ...prevData,
                        [name]: _result,
                    }
                });

                if(_result === ''){
                    handleSetValidate(name, false);
                }else{
                    handleSetValidate(name, true);
                }

                break;
            
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

    const handleChangePassenger = (event: React.ChangeEvent<HTMLInputElement>) => {
        const _result = passengerList.map((item) => {
            if(item.id === event.target.name){
                return {
                    id: item.id,
                    name: event.target.value,
                    validate: event.target.value === "" ? false : true,
                }
            }
            else{
                return item;
            }
        });

        setPassengerList(prevData => _result);
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
            if(handleValidateDepart()){
                if(handleDepartSpecific()){
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
                        ARG_DEPART_CD     : data.DEPART_CD,
                        ARG_DEPART_NM     : removeVietnamese(data.DEPART_NM.trim()),
                        ARG_ARRIVAL       : data.ARRIVAL,
                        ARG_MAN_QTY       : data.MAN_QTY,
                        ARG_MAN_LIST      : formatPassengerList(passengerList),
                        ARG_MAIN_REASON_CD: data.MAIN_REASON_CD,
                        ARG_SUB_REASON_CD : data.SUB_REASON_CD,
                        ARG_DROP_OFF_CD   : data.DROP_OFF_CD,
                        ARG_PASSENGERS    : getMainPassenger(passengerList),
                        ARG_CREATOR       : data.CREATOR,
                        ARG_CREATE_PC     : "ADMIN",
                        ARG_CREATE_PROGRAM_ID: data.CREATE_PROGRAM_ID,
                    }
                    //console.log(_uploadData)
                    fetchUpload(_uploadData);
                }
            }
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
                case "DEPART_CD": case "DEPART_NM":
                case "DROP_OFF_CD":
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
                            handleSetValidate(property, false, "Comback Date must equal or greater than Depart Date", "Ngày về phải lớn hơn hoặc bằng Ngày xuất phát");
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
                            handleSetValidate(property, false, "Comback Time must equal or greater than Depart Time", "Giờ về phải lớn hơn hoặc bằng Giờ xuất phát");
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

        ////// Validate Passenger List
        for(let iCount = 0; iCount < passengerList.length; iCount++){
            if(passengerList[iCount].validate === false){
                _result = false;
                break;
            }
        }

        return _result;
    }

    const handleSetValidate = (name, value, message = "", messageVN = "") => {
        setValidate(prevData => {
            return {
                ...prevData,
                [name]: {
                    validate: value,
                    message: message !== "" ? message : validate[name].message,
                    messageVN: messageVN !== "" ? messageVN : validate[name].messageVN,
                }
            }
        });
    }

    const handleValidateDepart = () => {
        if(data["GO_DATE"] === '' || data["GO_TIME"] === '') return false;
        let _result = true;

        let _depart = getDateTimeFormat(data["GO_DATE"] + " " + data["GO_TIME"]);
        let _isValidate = timeDifference(_depart);

        if(_isValidate){
            handleSetValidate("GO_DATE", true);
            handleSetValidate("GO_TIME", true);
        }else{
            _result = false;
            handleSetValidate("GO_DATE", false, "The return date and time must be 2 hours greater than the present time", "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại");
            handleSetValidate("GO_TIME", false, "The return date and time must be 2 hours greater than the present time", "Ngày giờ xuất phát phải lớn hơn 2 tiếng so với hiện tại");
        }

        return _result;
    }

    const handleDepartSpecific = () => {
        if(data["GO_DATE"] === '') return false;
        let _result = true;

        /////// If Depart Date is Today && Current Time >= 14:00 PM => Invalidate
        const _currentDateTime = getDateTime();
        let _specificDateTime = getDate() + _specificTime;
        let _checkValidate = isCombackDate_Validate(_currentDateTime, _specificDateTime);

        if(data["GO_DATE"] === getDate() && !_checkValidate){
            _result = false;
            handleSetValidate("GO_DATE", false, "The depart date must start from tomorrow", "Ngày xuất phát phải từ ngày mai trở đi");
        }else{
            handleSetValidate("GO_DATE", true);
        }

        return _result;
    }

    return (
        <>
            <Box className="s-form">
                <Container>
                    <h3 className="s-form-title">{t('request')} <span>{t('vehicle')}</span></h3>
                    <Box className="s-form-content">
                        <form>
                            <FormTitle order='1' title={t('title_first')} />
                            <FormDefaultInfo data={data} />
                            <FormTitle order='2' title={t('title_second')} />
                            <Stack direction={{xs: "column", sm: "row"}} alignItems="center" className="b-text-select b-spec">
                                <Typography variant="h6" className="b-text-input__title b-italic">
                                    {t('frm_reason')} <span>(*)</span>
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4} xl={3} >
                                        <SelectModal 
                                            name="MAIN_REASON_CD"
                                            data={_mainReason}
                                            placeholder={t('frm_reason_placeholder')}
                                            cValue={data.MAIN_REASON_CD}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.MAIN_REASON_CD.validate}
                                            message={lang === "en" ? validate.MAIN_REASON_CD.message : validate.MAIN_REASON_CD.messageVN} />
                                    </Grid>
                                    <Grid item xs={12} md={8} xl={9} >
                                        <SelectModal 
                                            name="SUB_REASON_CD"
                                            data={reason}
                                            placeholder={t('frm_reason_detail_placeholder')}
                                            cValue={data.SUB_REASON_CD}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.SUB_REASON_CD.validate}
                                            message={lang === "en" ? validate.SUB_REASON_CD.message : validate.SUB_REASON_CD.messageVN } />
                                    </Grid>
                                </Grid>
                            </Stack>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    {getDevice() ? 
                                        <DateModalMobile 
                                            title={t('frm_depart_date')}
                                            placeholder={t('frm_depart_date_placeholder')}
                                            name="GO_DATE"
                                            cValue={data.GO_DATE_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.GO_DATE.validate}
                                            message={lang === "en" ? validate.GO_DATE.message : validate.GO_DATE.messageVN } />
                                        :
                                        <DateModal 
                                            title={t('frm_depart_date')}
                                            placeholder={t('frm_depart_date_placeholder')}
                                            name="GO_DATE" 
                                            cValue={data.GO_DATE}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.GO_DATE.validate}
                                            message={lang === "en" ? validate.GO_DATE.message : validate.GO_DATE.messageVN} />
                                
                                    }
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    {getDevice() ?
                                        <TimeModalMobile 
                                            title={t('frm_depart_time')}
                                            placeholder={t('frm_depart_time_placeholder')}
                                            name="GO_TIME"
                                            cValue={data.GO_TIME_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.GO_TIME.validate}
                                            message={lang === "en" ? validate.GO_TIME.message : validate.GO_TIME.messageVN } />
                                        :
                                        <TimeModal 
                                            title={t('frm_depart_time')} 
                                            placeholder={t('frm_depart_time_placeholder')}
                                            name="GO_TIME"
                                            cValue={data.GO_TIME_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.GO_TIME.validate}
                                            message={lang === "en" ? validate.GO_TIME.message : validate.GO_TIME.messageVN } />
                                    }
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    {getDevice() ?
                                        <DateModalMobile
                                            title={t('frm_cb_date')} 
                                            placeholder={t('frm_cb_date_placeholder')}
                                            name="COMEBACK_DATE" 
                                            cValue={data.COMEBACK_DATE_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.COMEBACK_DATE.validate}
                                            message={lang === "en" ? validate.COMEBACK_DATE.message : validate.COMEBACK_DATE.messageVN } />
                                        :
                                        <DateModal 
                                            title={t('frm_cb_date')} 
                                            placeholder={t('frm_cb_date_placeholder')}
                                            name="COMEBACK_DATE" 
                                            cValue={data.COMEBACK_DATE}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.COMEBACK_DATE.validate}
                                            message={lang === "en" ? validate.COMEBACK_DATE.message : validate.COMEBACK_DATE.messageVN } /> 
                                    }
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    {getDevice() ?
                                        <TimeModalMobile
                                            title={t('frm_cb_time')} 
                                            placeholder={t('frm_cb_time_placeholder')}
                                            name="COMEBACK_TIME" 
                                            cValue={data.COMEBACK_TIME_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.COMEBACK_TIME.validate}
                                            message={lang === "en" ? validate.COMEBACK_TIME.message : validate.COMEBACK_TIME.messageVN } />
                                        :
                                        <TimeModal 
                                            title={t('frm_cb_time')} 
                                            placeholder={t('frm_cb_time_placeholder')}
                                            name="COMEBACK_TIME" 
                                            cValue={data.COMEBACK_TIME_FULL}
                                            handleEvent={handleChangeSub}
                                            isValidate={validate.COMEBACK_TIME.validate}
                                            message={lang === "en" ? validate.COMEBACK_TIME.message : validate.COMEBACK_TIME.messageVN } />
                                    }
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Stack marginBottom={2} direction={{xs: "column", sm: "row"}} alignItems={{xs: "normal", sm: "center"}} className='b-text-input'>
                                        <Typography variant="h6" className="b-text-input__title b-italic">
                                            {t('frm_pickup')} <span>(*)</span>
                                        </Typography>
                                        <Stack sx={{width:"100%"}}>
                                            <SelectModal 
                                                name="DEPART_CD"
                                                data={_departList}
                                                placeholder={t('frm_pickup_placeholder')}
                                                cValue={data.DEPART_CD}
                                                handleEvent={handleChangeSub}
                                                isValidate={validate.DEPART_CD.validate}
                                                message={lang === "en" ? validate.DEPART_CD.message : validate.DEPART_CD.messageVN} />
                                            {openPickUp &&
                                                <>
                                                    <TextField
                                                        name="DEPART_NM"
                                                        className="b-text-input__desc b-text-input__desc--sub"
                                                        disabled={false}
                                                        placeholder="Type place to pick up"
                                                        color="info"
                                                        fullWidth
                                                        value={data.DEPART_NM}
                                                        onChange={handleChange}
                                                        InputProps={{
                                                            endAdornment: (
                                                            <InputAdornment position="end">
                                                                <PlaceOutlinedIcon />
                                                            </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                    {!validate.DEPART_NM.validate && <Typography className='b-validate'>
                                                        <HighlightOffIcon sx={{width: '17px', height: '17px'}} />{t('frm_required')}
                                                    </Typography>}
                                                </>
                                            }
                                        </Stack>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Stack marginBottom={2} direction={{xs: "column", sm: "row"}} alignItems={{xs: "normal", sm: "center"}} className='b-text-input'>
                                        <Typography variant="h6" className="b-text-input__title b-italic">
                                            {t('frm_dropOff')} <span>(*)</span>
                                        </Typography>
                                        <Stack sx={{width:"100%"}}>
                                            <SelectModal 
                                                name="DROP_OFF_CD"
                                                data={_dropOffList}
                                                placeholder={t('frm_dropOff_placeholder')}
                                                cValue={data.DROP_OFF_CD}
                                                handleEvent={handleChangeSub}
                                                isValidate={validate.DROP_OFF_CD.validate}
                                                message={lang === "en" ? validate.DROP_OFF_CD.message : validate.DROP_OFF_CD.messageVN} />
                                        </Stack>
                                    </Stack>
                                </Grid>
                            </Grid>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Stack marginBottom={2} direction={{xs: "column", sm: "row"}} alignItems={{xs: "normal", sm: "center"}} className='b-text-input'>
                                        <Typography variant="h6" className="b-text-input__title b-italic">
                                            {t('frm_passenger')} <span>(*)</span>
                                        </Typography>
                                        <Stack sx={{width:"100%"}} 
                                            direction="row"
                                            justifyContent="center"
                                            alignItems="center">
                                            <SelectModal 
                                                name="MAN_QTY"
                                                data={passengerNum}
                                                placeholder={t('frm_passenger_placeholder')}
                                                cValue={data.MAN_QTY}
                                                handleEvent={handleChangeSub}
                                                isValidate={validate.MAN_QTY.validate}
                                                message={lang === "en" ? validate.MAN_QTY.message : validate.MAN_QTY.messageVN} />
                                            <FormControlLabel control={<Checkbox sx={{ '& .MuiSvgIcon-root': { fontSize: 28} }} onChange={handleIsInclude} />} label={t('frm_include_me')} />
                                        </Stack>
                                    </Stack>
                                </Grid>
                            </Grid>

                            {data.MAN_QTY !== "" && passengerList !== null && passengerList.length > 0 && 
                                <Stack marginBottom={2} direction={{xs: "column", sm: "row"}} alignItems={{xs: "normal", sm: "center"}} className="b-text-input mt-10">
                                    <Typography variant="h6" className="b-text-input__title b-italic">
                                         {t('frm_passenger_list')} <span>(*)</span>
                                     </Typography>
                                    <Grid container spacing={2} className="s-form-grid">
                                        {passengerList.map((item, index) => {
                                            if(!isInclude && index === 0){
                                                return (
                                                    <Grid item xs={12} className="s-form-grid__item s-form-grid__item--first" key={index}>
                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12} md={4} xl={3} >
                                                                <TextField
                                                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                                                    className="b-text-input__desc"
                                                                    disabled={false}
                                                                    placeholder={t('frm_pass_placeholder')}
                                                                    color="info"
                                                                    fullWidth
                                                                    value={empID}
                                                                    onChange={handleSearch}
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12} md={8} xl={9} >
                                                                <TextField
                                                                    name={item.id}
                                                                    className="b-text-input__desc"
                                                                    disabled={true}
                                                                    placeholder={`${t('frm_txt_passenger_placeholder')} ${index + 1}`}
                                                                    color="info"
                                                                    fullWidth
                                                                    value={item.name}
                                                                />
                                                                {!item.validate && <Typography className='b-validate'>
                                                                    <HighlightOffIcon sx={{width: '17px', height: '17px'}} />{t('frm_required')}
                                                                </Typography>}
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                )
                                            }else{
                                                return (
                                                    <Grid item xs={12} md={6} className="s-form-grid__item" key={item.id}>
                                                        <Stack direction={{xs: "column"}} alignItems={{xs: "normal"}} className='b-text-input'>
                                                            <TextField
                                                                name={item.id}
                                                                className="b-text-input__desc"
                                                                disabled={index === 0 ? true : false}
                                                                placeholder={`${t('frm_txt_passenger_placeholder')} ${index + 1}`}
                                                                color="info"
                                                                fullWidth
                                                                value={item.name}
                                                                onChange={handleChangePassenger}
                                                            />
                                                            {!item.validate && <Typography className='b-validate'>
                                                                <HighlightOffIcon sx={{width: '17px', height: '17px'}} />{t('frm_required')}
                                                            </Typography>}
                                                        </Stack>
                                                    </Grid>
                                                );
                                            }
                                        })}
                                    </Grid>
                                </Stack>
                                // <Stack marginBottom={2} direction={{xs: "column", sm: "row"}} alignItems={{xs: "normal", sm: "center"}} className="b-text-input mt-10">
                                //     <Typography variant="h6" className="b-text-input__title b-italic">
                                //         {t('frm_passenger_list')} 
                                //     </Typography>
                                //     <TextField
                                //         inputProps={{ inputMode: 'text' }}
                                //         className="b-text-input__desc"
                                //         disabled={false}
                                //         placeholder={t('frm_passenger_list_placeholder')} 
                                //         color="info"
                                //         fullWidth
                                //         value={data.MAN_LIST}
                                //         onChange={handleChange}
                                //         multiline
                                //         rows={4}
                                //         name="MAN_LIST"
                                //         sx={{ backgroundColor: "#f8f6f7" }}
                                //     />
                                // </Stack> 
                            }
                            <Box className="s-form-bot">
                                <ButtonPrimary title={t('btn_request')} handleClick={handleSubmit} />
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