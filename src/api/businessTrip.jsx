import {
  CanteenAttendanceCallProcedureURL as BusinessTripCallProcedureURL,
} from './index';

/**
 * Call Oracle procedure via call-procedure API
 */
const callProcedure = async (procedureName, params = {}) => {
  try {
    if (Array.isArray(params) && params.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Invalid params for ${procedureName}: params is empty array`);
      }
      return {
        success: false,
        error: { message: 'Invalid params: params cannot be an empty array' },
        data: null,
      };
    }

    const validParams = Array.isArray(params) ? {} : (params || {});

    const body = {
      dbName: 'LMES',
      packageName: 'PKG_GA_SYSTEM_REQUEST',
      procedureName: procedureName,
      params: validParams,
    };

    const response = await fetch(BusinessTripCallProcedureURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData = null;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // If response is not JSON, use error text
      }

      if (process.env.NODE_ENV === 'development' && response.status !== 400) {
        console.warn(`API call failed for ${procedureName}:`, response.status, errorData || errorText);
      }

      return {
        success: false,
        error: errorData || { message: errorText, status: response.status },
        data: null,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Network error calling procedure ${procedureName}:`, error.message);
    }
    return {
      success: false,
      error: { message: error.message },
      data: null,
    };
  }
};

/**
 * Save B Registration by calling SMT_SAVE_CAN_REG procedure
 * Uses MERGE to INSERT or UPDATE based on key: EMP_NO + REG_TYPE + REG_DATE + MEAL_TYPE
 * @param {Object} registrationData - Registration data object
 * @param {string} registrationData.argEmpNo - Employee number
 * @param {string} registrationData.argRegType - Registration type (SELF/VISITOR)
 * @param {string} registrationData.argVisitorDept - Visitor department
 * @param {string} registrationData.argRemarks - Remarks
 * @param {string} registrationData.argCreatedBy - Created by (user ID)
 * @param {Array} registrationData.argDetailJson - Array of meal detail objects
 * @param {string} registrationData.argDetailJson[].regDate - Registration date (YYYY-MM-DD)
 * @param {string} registrationData.argDetailJson[].mealType - Meal type
 * @param {string} registrationData.argDetailJson[].factoryCode - Factory code
 * @param {string} registrationData.argDetailJson[].factoryCost - Factory cost
 * @param {string} registrationData.argDetailJson[].mealNote - Meal note
 * @param {number} registrationData.argDetailJson[].isSelected - Is selected (1 or 0)
 * @param {number} registrationData.argDetailJson[].visitorCnt - Visitor count per meal
 * @returns {Promise<{success: boolean, data: object|null, error: object|null}>}
 */
export const saveBusinessRegistration = async (registrationData) => {
  try {
    const {
      argEmpNo,
      argRegType,
      argVisitorDept,
      argRemarks,
      argCreatedBy,
      argDetailJson = [],
    } = registrationData;

    const detailJsonString = JSON.stringify(argDetailJson);

    const data = await callProcedure('SMT_SAVE_BUSINESS_REG', {
      ARG_EMP_NO: { value: String(argEmpNo), type: "IN" },
      ARG_REG_TYPE: { value: String(argRegType), type: "IN" },
      ARG_VISITOR_DEPT: { value: String(argVisitorDept || ''), type: "IN" },
      ARG_REMARKS: { value: String(argRemarks || ''), type: "IN" },
      ARG_CREATED_BY: { value: String(argCreatedBy), type: "IN" },
      ARG_DETAIL_JSON: { value: detailJsonString, type: "IN" },
      OUT_REG_ID: { type: "OUT", dataType: "NUMBER" },
      OUT_STATUS: { type: "OUT", dataType: "VARCHAR2" },
      OUT_MSG: { type: "OUT", dataType: "VARCHAR2" },
    });

    if (data && data.success && data.data) {
      return {
        success: data.data.OUT_STATUS === 'SUCCESS',
        data: {
          regId: data.data.OUT_REG_ID,
          status: data.data.OUT_STATUS,
          message: data.data.OUT_MSG,
        },
        error: data.data.OUT_STATUS !== 'SUCCESS'
          ? { message: data.data.OUT_MSG }
          : null,
      };
    }

    return {
      success: false,
      data: null,
      error: data?.error || { message: 'No data returned from procedure' },
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error saving Business Trip registration:', error);
    }
    return {
      success: false,
      data: null,
      error: { message: error.message },
    };
  }
};

/**
 * Get Canteen Attendance Registration data by calling SMT_GET_CAN_REG procedure
 * @param {Object} params - Query parameters
 * @param {number|null} params.argRegId - Registration ID (optional)
 * @param {string|null} params.argEmpNo - Employee number (optional)
 * @param {string} params.argRegType - Registration type (SELF/VISITOR) - REQUIRED
 * @param {string|null} params.argFromDate - From date in format YYYY-MM-DD (optional)
 * @param {string|null} params.argToDate - To date in format YYYY-MM-DD (optional)
 * @param {string|null} params.argVisitorDept - Visitor department filter (optional)
 * @param {string|null} params.argStatus - Status filter (optional)
 * @returns {Promise<{success: boolean, data: array|null, error: object|null}>}
 */
export const getBusinessRegistration = async ({
  argFromDate = null,
  argToDate = null,
  argVisitorDept = null,
  argVisitorName = null,
  argStatus = null,
} = {}) => {
  try {
    const data = await callProcedure('SMT_GET_BUSINESS_REG', {
      ARG_FROM_DATE: { value: argFromDate, type: "IN" },
      ARG_TO_DATE: { value: argToDate, type: "IN" },
      ARG_VISITOR_DEPT: { value: argVisitorDept, type: "IN" },
      ARG_VISITOR_NAME: { value: argVisitorName, type: "IN" },
      ARG_STATUS: { value: argStatus, type: "IN" },
      OUT_CURSOR: { type: "OUT", dataType: "CURSOR" },
    });

    if (data && data.success && data.data && data.data.OUT_CURSOR) {
      return {
        success: true,
        data: Array.isArray(data.data.OUT_CURSOR) ? data.data.OUT_CURSOR : [],
        error: null,
      };
    }

    return {
      success: false,
      data: null,
      error: data?.error || { message: 'No data returned from procedure' },
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting Business Trip registration:', error);
    }
    return {
      success: false,
      data: null,
      error: { message: error.message },
    };
  }
};
