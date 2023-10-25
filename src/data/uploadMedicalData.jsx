import { removeVietnamese } from "../function/getFormat";

const uploadMedicalData = async (data) => {
  console.log(data);
  return {
    ARG_TYPE: "U",
    ARG_TREAT_DATE: data.TREAT_DATE,
    ARG_EMP_ID: data.EMP_ID,
    ARG_EMP_NAME_EN: data.EMP_NAME_EN,
    ARG_EMP_NAME_KOR: data.EMP_NAME_KOR,
    ARG_CUSTOMER_CODE: data.CUSTOMER_CODE,
    ARG_BIRTHDAY: data.BIRTHDATE,
    ARG_PASSPORT: data.PASSPORT,
    ARG_RELATIONSHIP: removeVietnamese(data.RELATIONSHIP),
    ARG_SERVICE_TYPE: removeVietnamese(data.SERVICE_TYPE),
    ARG_SERVICE_NAME: removeVietnamese(data.SERVICE_NAME),
    ARG_MEDICAL_CD: data.MEDICAL_CD,
    ARG_MEDICAL_NAME: removeVietnamese(data.MEDICAL_NAME),
    ARG_IS_MEDICAL_NEW:data.IS_CLINIC_NEW,
    ARG_UNIT_CD: data.UNIT_CD,
    ARG_QTY: data.QTY,
    ARG_UNIT_PRICE: data.UNIT_PRICE,
    ARG_DISCOUNT_QTY: data.DISCOUNT_QTY,
    ARG_AMOUNT_QTY: data.AMOUNT_QTY,
    ARG_REMARKS: removeVietnamese(data.REMARKS),
    ARG_CREATOR: data.CREATOR,
    ARG_CREATE_PC: data.CREATE_PC,
    ARG_CREATE_PROGRAM_ID: data.CREATE_PROGRAM_ID,
  };
};

export default uploadMedicalData;
