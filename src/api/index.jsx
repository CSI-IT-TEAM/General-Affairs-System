const baseURL = "http://vjweb.dskorea.com/";
const downloadURL = baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.SMT_DOWNLOAD";
const imageURL = baseURL + "HUBIC/SP_GET_EMP_PICTURE";
const uploadURL =
  baseURL + "LMES/PKG_GA_SYSTEM_REQUEST.UPLOAD_REQUEST_CAR_V4/SAVE";
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
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.HISTORY_LIST_SELECT_V2";
const HospitalTypeListURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.HOSPITAL_TYPE_LIST_SELECT";

const MedicalClinicSaveURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.MEDICAL_CLINIC_SAVE_V4";

const MedicalClinicSaveWithImageURL =
  "http://vjweb.dskorea.com:9000/MEDICAL_SYSTEM_WEB_SAVE";
// const MedicalClinicSaveWithImageURL =
//   "http://172.30.30.41:4000/MEDICAL_SYSTEM_WEB_SAVE";
const MedicalHistoryDeleteURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.HISTORY_DELETE/SAVE";

const ExchangeRateSelectURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.EXCHANGE_RATE_SELECT";
const MedicalImageUploadURL =
  "http://vjweb.dskorea.com:9000/GA_MEDICAL_IMAGE_UPLOAD";

  const MedicalImageListSelectURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.MEDICAL_IMAGE_LIST_SELECT";

  const SendEmailURL = "http://vjweb.dskorea.com/send-email";

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
  MedicalHistoryDeleteURL,
  HospitalTypeListURL,
  ExchangeRateSelectURL,
  MedicalImageUploadURL,
  MedicalImageListSelectURL,
  SendEmailURL
};
