import { date_to_yyyymmdd } from "../function/getDate";
import { removeVietnamese } from "../function/getFormat";
import { v4 as uuidv4 } from "uuid";

const uploadMedicalData = async (data) => {
  return {
    ARG_TYPE: "U",
    ARG_TREAT_DATE: data.TREAT_DATE,
    ARG_EMP_ID: data.EMP_ID,
    ARG_EMP_NAME_EN: data.EMP_NAME_EN,
    ARG_EMP_NAME_KOR: data.EMP_NAME_KOR,
    ARG_CUSTOMER_CODE: data.CUSTOMER_CODE,
    ARG_BIRTHDAY: date_to_yyyymmdd(data.BIRTHDATE),
    ARG_PASSPORT: data.PASSPORT,
    ARG_EMAIL_ADDRESS: data.EMAIL_ADDRESS,
    ARG_ACCOUNT_NAME: data.ACCOUNT_NAME,
    ARG_ACCOUNT_NO: data.ACCOUNT_NO,
    ARG_BANK_CD: data.BANK_CD,
    ARG_BANK_NAME: data.BANK_NAME,
    ARG_RELATIONSHIP: removeVietnamese(data.RELATIONSHIP),
    ARG_SERVICE_TYPE: removeVietnamese(data.SERVICE_TYPE),
    ARG_SERVICE_NAME: removeVietnamese(data.SERVICE_NAME),
    ARG_MEDICAL_CD: data.MEDICAL_CD,
    ARG_MEDICAL_NAME: removeVietnamese(data.MEDICAL_NAME),
    ARG_IS_MEDICAL_NEW: data.IS_CLINIC_NEW,
    ARG_UNIT_CD: data.UNIT_CD,
    ARG_QTY: data.QTY,
    ARG_CURRENCY: data.CURRENCY,
    ARG_EXCHANGE_RATE: data.EXCHANGE_RATE,
    ARG_SERVICE_NAME_TL: removeVietnamese(data.SERVICE_NAME_TL),
    ARG_UNIT_PRICE: data.UNIT_PRICE,
    ARG_DISCOUNT_QTY: data.DISCOUNT_QTY,
    ARG_AMOUNT_QTY: data.AMOUNT_QTY,
    ARG_REMARKS: removeVietnamese(data.REMARKS),
    ARG_MEMO_TL: removeVietnamese(data.MEMO_TL),
    ARG_HOSPITAL_TYPE_CD: data.HOSPITAL_TYPE_CD,
    ARG_INVOICE_PIC_NAME: uuidv4(),
    ARG_CREATOR: data.CREATOR,
    ARG_CREATE_PC: data.CREATE_PC,
    ARG_CREATE_PROGRAM_ID: data.CREATE_PROGRAM_ID,
    OUT_CURSOR: "",
  };
};

const uploadMedicalFormData = async (data) => {
  let _formData = new FormData();
  _formData.append("ARG_TYPE", "U");
  _formData.append("ARG_TREAT_DATE", data.TREAT_DATE);
  _formData.append("ARG_EMP_ID", data.EMP_ID);
  _formData.append("ARG_EMP_NAME_EN", data.EMP_NAME_EN);
  _formData.append("ARG_EMP_NAME_KOR", data.EMP_NAME_KOR);
  _formData.append("ARG_CUSTOMER_CODE", data.CUSTOMER_CODE);
  _formData.append("ARG_BIRTHDAY", date_to_yyyymmdd(data.BIRTHDATE));
  _formData.append("ARG_PASSPORT", data.PASSPORT);
  _formData.append("ARG_EMAIL_ADDRESS", data.EMAIL_ADDRESS);
  _formData.append("ARG_RELATIONSHIP", data.RELATIONSHIP);
  _formData.append("ARG_SERVICE_TYPE", removeVietnamese(data.SERVICE_TYPE));
  _formData.append("ARG_SERVICE_NAME", removeVietnamese(data.SERVICE_NAME));
  _formData.append("ARG_MEDICAL_CD", data.MEDICAL_CD);
  _formData.append("ARG_MEDICAL_NAME", removeVietnamese(data.MEDICAL_NAME));
  _formData.append("ARG_IS_MEDICAL_NEW", data.IS_CLINIC_NEW);
  _formData.append("ARG_UNIT_CD", data.UNIT_CD);
  _formData.append("ARG_QTY", data.QTY);
  _formData.append("ARG_CURRENCY", data.CURRENCY);
  _formData.append("ARG_EXCHANGE_RATE", data.EXCHANGE_RATE);
  _formData.append(
    "ARG_SERVICE_NAME_TL",
    removeVietnamese(data.SERVICE_NAME_TL)
  );
  _formData.append("ARG_UNIT_PRICE", data.UNIT_PRICE);
  _formData.append("ARG_DISCOUNT_QTY", data.DISCOUNT_QTY);
  _formData.append("ARG_AMOUNT_QTY", data.AMOUNT_QTY);
  _formData.append("ARG_REMARKS", removeVietnamese(data.REMARKS));
  _formData.append("ARG_MEMO_TL", removeVietnamese(data.MEMO_TL));
  _formData.append("ARG_HOSPITAL_TYPE_CD", data.HOSPITAL_TYPE_CD);
  _formData.append("ARG_PIC_NAME", uuidv4());
  _formData.append("ARG_CREATOR", data.CREATOR);
  _formData.append("ARG_CREATE_PC", data.CREATE_PC);
  _formData.append("ARG_CREATE_PROGRAM_ID", data.CREATE_PROGRAM_ID);
  _formData.append("ARG_INVOICE_PIC", data.INVOICE_PIC);

  return _formData;
};

const uploadMedicalImageFormData = async (data, file) => {
  let _formData = new FormData();
  _formData.append("ARG_TYPE", data.TYPE);
  _formData.append("ARG_TREAT_DATE", data.TREAT_DATE);
  _formData.append("ARG_TREAT_SEQ", data.TREAT_SEQ);
  _formData.append("ARG_EMP_ID", data.EMP_ID);

  _formData.append("ARG_CREATOR", data.CREATOR);
  _formData.append("ARG_CREATE_PC", data.CREATE_PC);
  _formData.append("ARG_CREATE_PROGRAM_ID", data.CREATE_PROGRAM_ID);
  _formData.append("ARG_INVOICE_PIC", data.INVOICE_PIC);
  _formData.append("ARG_PIC_NAME", data.INVOICE_PIC_NAME);
  _formData.append("ARG_IMAGE", file.blobFile, file.blobFile.name);

  return _formData;
};

const uploadImageListData = async (data) => {
  return {
    ARG_TYPE: "Q",
    ARG_TREAT_DATE: data.TREAT_DATE,
    ARG_TREAT_SEQ: data.TREAT_SEQ,
    ARG_EMP_ID: data.EMP_ID,
    OUT_CURSOR: "",
  };
};

export {
  uploadMedicalData,
  uploadMedicalFormData,
  uploadMedicalImageFormData,
  uploadImageListData,
};
