const getDate = () => {
  let date = new Date();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let ymd =
    date.getFullYear().toString() +
    ((month > 9 ? "" : "0") + month).toString() +
    ((day > 9 ? "" : "0") + day).toString();

  return ymd;
};

const getDateFormat = (date) => {
  return date.replace(/(\d{4})(\d{2})(\d{2})/g, "$1-$2-$3");
};

const getDateTimeFormat = (date) => {
  return date.replace(
    /(\d{4})(\d{2})(\d{2}) (\d{2})(\d{2})(\d{2})/g,
    "$1-$2-$3 $4:$5:$6"
  );
};

const formatDate = (value) => {
  let date = value;
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let ymd =
    date.getFullYear().toString() +
    ((month > 9 ? "" : "0") + month).toString() +
    ((day > 9 ? "" : "0") + day).toString();

  return ymd;
};

const formatHMS = (value) => {
  let date = value;
  let hours = (date.getHours() < 10 ? "0" : "") + date.getHours();
  let minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
  let seconds = (date.getSeconds() < 10 ? "0" : "") + date.getSeconds();
  let hms = hours + minutes + seconds;

  return hms;
};

const formatHMS_00 = (value) => {
  return value.slice(0, -2) + "00";
};

const getDateTime = () => {
  let date = new Date();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let ymd =
    date.getFullYear().toString() +
    ((month > 9 ? "" : "0") + month).toString() +
    ((day > 9 ? "" : "0") + day).toString();

  let hours = (date.getHours() < 10 ? "0" : "") + date.getHours();
  let minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
  let seconds = (date.getSeconds() < 10 ? "0" : "") + date.getSeconds();
  let hms = hours + minutes + seconds;

  return ymd + " " + hms;
};

export {
  getDate,
  getDateTime,
  getDateFormat,
  getDateTimeFormat,
  formatDate,
  formatHMS,
  formatHMS_00,
};
