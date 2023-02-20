import moment from 'moment';
moment().format();

const isCombackDate_Validate = (value1, value2) => {

    const format = "YYYY-MM-DD HH:mm:ss";

    let dateTime1 = moment(value1).format(format);
    let dateTime2 = moment(value2).format(format);

    return dateTime1 <= dateTime2 ? true : false;
}

const timeDifference = (value) => {
    const format = "YYYY-MM-DD HH:mm:ss";

    let dateTime1 = moment().add(3,'hours').format(format);
    let dateTime2 = moment(value).format(format);

    return dateTime1 <= dateTime2 ? true : false;
}

export { isCombackDate_Validate, timeDifference }