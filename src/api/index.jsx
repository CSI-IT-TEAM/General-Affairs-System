const baseURL = "http://172.30.10.120/";

const downloadURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.SMT_DOWNLOAD";
const imageURL = baseURL + "HUBIC/SP_GET_EMP_PICTURE";
const uploadURL =
  baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.UPLOAD_REQUEST_CAR_V3/SAVE";
const emailURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.SMT_SEND_EMAIL/SAVE";

//PHUOC ADD MORE 2023-08-09
const LoginURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.USER_LOGIN_SELECT";
const UserRegisterURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.USER_REGISTER_SAVE/SAVE";
const historyURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.USER_REQUEST_HISTORY";

export {
  downloadURL,
  uploadURL,
  imageURL,
  emailURL,
  LoginURL,
  UserRegisterURL,
  historyURL
};
