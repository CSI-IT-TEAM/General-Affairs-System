const reqCarValidate = {
    "MAIN_REASON_CD": {
        validate: true,
        message: 'The reason field is required',
    },
    "SUB_REASON_CD": {
        validate: true,
        message: 'The reason detail field is required',
    },
    "GO_DATE": {
        validate: true,
        message: 'The depart date field is required',
    },       
    "GO_TIME": {
        validate: true,
        message: 'The depart time field is required',
    },       
    "COMEBACK_DATE": {
        validate: true,
        message: 'The comback date field is required',
    }, 
    "COMEBACK_TIME": {
        validate: true,
        message: 'The comback time field is required',
    },
    "DEPART": {
        validate: true,
        message: 'The pick up field is required',
    },           
    "MAN_QTY": {
        validate: true,
        message: 'The passengers field must be greater than 0',
    },
}

export default reqCarValidate;