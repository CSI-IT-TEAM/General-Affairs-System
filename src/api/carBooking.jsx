import {
  CarBookingCallProcedureURL,
} from './index';

/**
 * Call Oracle procedure via call-procedure API
 */
const callProcedure = async (procedureName, params = {}) => {
  try {
    // Chặn trường hợp params là array rỗng
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

    // Đảm bảo params là object, không phải array
    const validParams = Array.isArray(params) ? {} : (params || {});

    const body = {
      dbName: 'LMES',
      packageName: 'PKG_GA_SYSTEM_REQUEST', // Package name for car booking procedures
      procedureName: procedureName,
      params: validParams,
    };

    const response = await fetch(CarBookingCallProcedureURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Return error object instead of throwing for graceful handling
      const errorText = await response.text();
      let errorData = null;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // If response is not JSON, use error text
      }

      // Only log in development mode or if it's not a 400 error (which might be expected when data doesn't exist)
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
    // Network errors or other issues
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
 * Get Driver Schedule Report data by calling DRIVER_SCHEDULE_REPORT_GANTT_SELECT procedure
 * @param {string} argType - Type parameter (default: 'Q')
 * @param {string} argDateF - Date from in format YYYYMMDD
 * @param {string} argDateT - Date to in format YYYYMMDD
 * @returns {Promise<{success: boolean, data: array|null, error: object|null}>}
 */
export const getDriverScheduleReport = async (argType = 'Q', argDateF, argDateT) => {
  try {
    const data = await callProcedure('DRIVER_SCHEDULE_REPORT_GANTT', {
      ARG_TYPE: { value: String(argType), type: "IN" },
      ARG_DATEF: { value: String(argDateF), type: "IN" },
      ARG_DATET: { value: String(argDateT), type: "IN" },
      OUT_CURSOR: { type: "OUT", dataType: "CURSOR" }
    });

    // Response structure: { success: true, data: { OUT_CURSOR: [...] } }
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
    // This should not happen now since callProcedure doesn't throw, but keep for safety
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting driver schedule report:', error);
    }
    return {
      success: false,
      data: null,
      error: { message: error.message },
    };
  }
};

