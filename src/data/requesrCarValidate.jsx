const reqCarValidate = {
    "MAIN_REASON_CD": {
        validate: true,
        message: 'The reason field is required',
        messageVN: 'Dữ liệu không được rỗng',
    },
    "SUB_REASON_CD": {
        validate: true,
        message: 'The reason detail field is required',
        messageVN: 'Dữ liệu không được rỗng',
    },
    "GO_DATE": {
        validate: true,
        message: 'The depart date field is required',
        messageVN: 'Dữ liệu không được rỗng',
    },       
    "GO_TIME": {
        validate: true,
        message: 'The depart time field is required',
        messageVN: 'Dữ liệu không được rỗng',
    },       
    "COMEBACK_DATE": {
        validate: true,
        message: 'The comback date field is required',
        messageVN: 'Dữ liệu không được rỗng',
    }, 
    "COMEBACK_TIME": {
        validate: true,
        message: 'The comback time field is required',
        messageVN: 'Dữ liệu không được rỗng',
    },
    "DEPART": {
        validate: true,
        message: 'The pick up field is required',
        messageVN: 'Dữ liệu không được rỗng',
    },           
    "MAN_QTY": {
        validate: true,
        message: 'The passengers field must be greater than 0',
        messageVN: 'Dữ liệu phải lớn hơn 0',
    },
}

export default reqCarValidate;