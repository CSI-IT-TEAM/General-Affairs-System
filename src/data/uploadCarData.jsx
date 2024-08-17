import { formatHMS_00 } from "../function/getDate";
import {
  removeVietnamese,
  formatPassengerList,
  formatPassengerDropOffList,
  getMainPassenger,
} from "../function/getFormat";

const uploadCarData = async (data, passengerList, passengerCount) => {
  return {
    ARG_TYPE: "SAVE",
    ARG_REQ_DATE: data.REQ_DATE,
    ARG_PLANT_CD: data.PLANT_CD,
    ARG_DEPT_CD: data.DEPT_CD,
    ARG_DEPT_NM: data.DEPT_NM,
    ARG_REQ_EMP: data.REQ_EMP,
    ARG_REQ_EMP_NM: data.REQ_EMP_NM,
    ARG_EMAIL_ADDRESS: data.EMAIL_ADDRESS,
    ARG_GO_DATE: data.GO_DATE,
    ARG_GO_TIME: formatHMS_00(data.GO_TIME),
    ARG_COMEBACK_DATE: data.COMEBACK_DATE,
    ARG_COMEBACK_TIME: formatHMS_00(data.COMEBACK_TIME),
    ARG_DEPART_CD: data.DEPART_CD,
    ARG_DEPART_NM: removeVietnamese(data.DEPART_NM.trim()),
    ARG_ARRIVAL: data.ARRIVAL,
    ARG_MAN_QTY: passengerCount, // data.MAN_QTY,
    ARG_MAN_LIST: formatPassengerList(passengerList[0]),
    ARG_MAN_KR_LIST: formatPassengerList(passengerList[2]),
    ARG_MAIN_REASON_CD: data.MAIN_REASON_CD,
    ARG_SUB_REASON_CD: data.SUB_REASON_CD,
    ARG_DROP_OFF_CD: "", //passengerList[0].dropOff,
    ARG_DROP_OFF_LIST: "", //formatPassengerDropOffList(passengerList),
    ARG_PASSENGERS: getMainPassenger(passengerList[0]),
    
    ARG_ADDRESS_MEMO: data.ADDRESS_MEMO,
    ARG_CREATOR: data.CREATOR,
    ARG_CREATE_PC: "PHUOC.IT",
    ARG_CREATE_PROGRAM_ID: data.CREATE_PROGRAM_ID,
  };
};

export default uploadCarData;
