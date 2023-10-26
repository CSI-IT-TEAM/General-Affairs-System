const baseURL = "http://172.30.10.120/";

const downloadURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.SMT_DOWNLOAD";
const imageURL = baseURL + "HUBIC/SP_GET_EMP_PICTURE";
const uploadURL =
  baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.UPLOAD_REQUEST_CAR_V3/SAVE";
const emailURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.SMT_SEND_EMAIL/SAVE";

//PHUOC ADD MORE 2023-08-09
const LoginURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.USER_LOGIN_SELECT";
const UserRegisterURL =
  baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.USER_REGISTER_SAVE/SAVE";
const historyURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.USER_REQUEST_HISTORY";
const CancelRequestURL =
  baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.USER_CANCEL_REQUEST_SAVE/SAVE";

const ClinicListURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.HOSPITAL_LIST_SELECT";
const UnitListURL = baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.UNIT_LIST_SELECT";
const RelationListURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.RELATION_LIST_SELECT";
const HistoryListURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.HISTORY_LIST_SELECT";
const MedicalClinicSaveURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.MEDICAL_CLINIC_SAVE/SAVE";

const MedicalClinicSaveWithImageURL =
  "http://172.30.10.120:9000/MEDICAL_SYSTEM_WEB_SAVE";
// const MedicalClinicSaveWithImageURL =
//   "http://172.30.30.41:4000/MEDICAL_SYSTEM_WEB_SAVE";

export {
  downloadURL,
  uploadURL,
  imageURL,
  emailURL,
  LoginURL,
  UserRegisterURL,
  historyURL,
  CancelRequestURL,
  ClinicListURL,
  UnitListURL,
  MedicalClinicSaveURL,
  MedicalClinicSaveWithImageURL,
  HistoryListURL,
  RelationListURL,
};
