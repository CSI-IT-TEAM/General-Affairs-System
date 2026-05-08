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
const MedicalBankImageUploadURL =
  "http://vjweb.dskorea.com:9000/GA_MEDICAL_BANK_IMAGE_UPLOAD";
const MedicalImageListSelectURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.MEDICAL_IMAGE_LIST_SELECT";
const MedicalAccountBankDocURL =
  baseURL + "LMES/PKG_MEDICAL_FEE_SYSTEM.ACC_BANK_DOC_SELECT";
const SendEmailURL = "http://vjweb.dskorea.com/send-email";

// Pickleball Booking API URLs
const PickleballCallProcedureURL = "http://vjweb.dskorea.com:9090/api/call-procedure";
const PickleballSaveProcedureURL = "http://vjweb.dskorea.com:9090/api/save-procedure";
const PickleballDeleteProcedureURL = "http://vjweb.dskorea.com:9090/api/delete-procedure";
const PickleballEmployeeInfoURL = "http://vjweb.dskorea.com:9090/api/common/employee-info";

// Meeting Room Booking API URLs
const MeetingRoomCallProcedureURL = "http://vjweb.dskorea.com:9090/api/call-procedure";
const MeetingRoomSaveProcedureURL = "http://vjweb.dskorea.com:9090/api/save-procedure";
const MeetingRoomDeleteProcedureURL = "http://vjweb.dskorea.com:9090/api/delete-procedure";
const MeetingRoomEmployeeInfoURL = "http://vjweb.dskorea.com:9090/api/common/employee-info";

// Car Booking API URLs
const CarBookingCallProcedureURL = "http://vjweb.dskorea.com:9090/api/call-procedure";

// Canteen Attendance API URLs
const CanteenAttendanceCallProcedureURL = "http://vjweb.dskorea.com:9090/api/call-procedure";

// Temporary Residence API URLs
const TemporaryResidenceCallProcedureURL = "http://vjweb.dskorea.com:9090/api/call-procedure";
const TemporaryResidenceSaveProcedureURL = "http://vjweb.dskorea.com:9090/api/save-procedure";
const TemporaryResidenceDeleteProcedureURL = "http://vjweb.dskorea.com:9090/api/delete-procedure";
const TemporaryResidenceEmployeeInfoURL = "http://vjweb.dskorea.com:9090/api/common/employee-info";

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
  MedicalBankImageUploadURL,
  MedicalImageListSelectURL,
  MedicalAccountBankDocURL,
  SendEmailURL,
  PickleballCallProcedureURL,
  PickleballSaveProcedureURL,
  PickleballDeleteProcedureURL,
  PickleballEmployeeInfoURL,
  MeetingRoomCallProcedureURL,
  MeetingRoomSaveProcedureURL,
  MeetingRoomDeleteProcedureURL,
  MeetingRoomEmployeeInfoURL,
  CarBookingCallProcedureURL,
  CanteenAttendanceCallProcedureURL,
  TemporaryResidenceCallProcedureURL,
  TemporaryResidenceSaveProcedureURL,
  TemporaryResidenceDeleteProcedureURL,
  TemporaryResidenceEmployeeInfoURL,
};
