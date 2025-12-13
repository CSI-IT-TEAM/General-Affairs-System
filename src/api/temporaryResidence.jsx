import {
  TemporaryResidenceCallProcedureURL,
  TemporaryResidenceSaveProcedureURL,
  TemporaryResidenceDeleteProcedureURL,
  TemporaryResidenceEmployeeInfoURL,
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
      dbName: 'HUBIC',
      packageName: 'PW_TEMP_RES_REG_EVENT',
      procedureName: procedureName,
      params: validParams,
    };

    const response = await fetch(TemporaryResidenceCallProcedureURL, {
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
 * Save/Update Temporary Residence event via save-procedure API
 */
export const saveTemporaryResidenceEvent = async (eventData) => {
  try {
    const {
      id = null,
      startDate,
      endDate,
      title = 'Temporary Residence Registration', // Title mặc định
      color,
      description = '',
      department = '',
      userId,
      empId,
      userLogin,
    } = eventData;

    // Validate required fields
    if (!userId || !userLogin) {
      throw new Error('Thiếu thông tin người dùng (USER_ID hoặc USER_LOGIN)');
    }
    if (!empId) {
      throw new Error('Thiếu thông tin EMP_ID');
    }
    if (!startDate || !endDate) {
      throw new Error('Thiếu thông tin ngày (START_DATE hoặc END_DATE)');
    }

    const body = {
      dbName: 'HUBIC',
      packageName: 'PW_TEMP_RES_REG_EVENT',
      procedureName: 'MERGE_EVENT',
      params: {
        P_ID: { value: id, type: "IN" },
        P_START_DATE: { value: String(startDate), type: "IN" },
        P_END_DATE: { value: String(endDate), type: "IN" },
        P_START_TIME: { value: '00:00', type: "IN" }, // Mặc định 00:00
        P_END_TIME: { value: '00:00', type: "IN" }, // Mặc định 00:00
        P_TITLE: { value: String(title || 'Temporary Residence Registration'), type: "IN" },
        P_COLOR: { value: String(color || '#8b5cf6'), type: "IN" },
        P_DESCRIPTION: { value: String(description || ""), type: "IN" },
        P_DEPARTMENT: { value: String(department || ""), type: "IN" },
        P_USER_ID: { value: String(userId), type: "IN" },
        P_EMP_ID: { value: String(empId), type: "IN" },
        P_USER_LOGIN: { value: String(userLogin), type: "IN" },
        P_OUT_ID: { type: "OUT", dataType: "NUMBER" }
      },
    };

    // Log request in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Saving Temporary Residence event - Request body:', JSON.stringify(body, null, 2));
    }

    const response = await fetch(TemporaryResidenceCallProcedureURL, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Try to get error message from response
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData = null;

      try {
        const errorText = await response.text();
        try {
          errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (e) {
          // If not JSON, use text as error message
          if (errorText) {
            errorMessage = errorText;
          }
        }
      } catch (e) {
        // If can't read response, use status
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const data = await response.json();

    // Log response in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Save Temporary Residence event - Response:', data);
    }

    // Extract OUT parameter if available
    if (data && data.data && data.data.P_OUT_ID !== undefined) {
      return {
        ...data,
        outId: data.data.P_OUT_ID
      };
    }

    return data;
  } catch (error) {
    // Log full error details in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('Error saving Temporary Residence event:', {
        message: error.message,
        status: error.status,
        data: error.data,
        eventData: eventData,
      });
    }
    throw error;
  }
};

/**
 * Delete Temporary Residence event via delete-procedure API
 */
export const deleteTemporaryResidenceEvent = async (eventId) => {
  try {
    const body = {
      dbName: 'HUBIC',
      packageName: 'PW_TEMP_RES_REG_EVENT',
      procedureName: 'DELETE_EVENT',
      params: {
        P_ID: { value: eventId, type: "IN" },
      },
    };

    const response = await fetch(TemporaryResidenceDeleteProcedureURL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting Temporary Residence event:', error);
    throw error;
  }
};

/**
 * Get list of Temporary Residence events
 */
export const getTemporaryResidenceEvents = async (fromDate, toDate) => {
  try {
    const data = await callProcedure('SELECT_EVENT_LIST', {
      P_FROM_DATE: { value: String(fromDate), type: "IN" },
      P_TO_DATE: { value: String(toDate), type: "IN" },
      OUT_CURSOR: { type: "OUT", dataType: "CURSOR" }
    });

    // Transform data to match frontend format
    // Response structure: { success: true, data: { OUT_CURSOR: [...] } }
    if (data && data.success && data.data && data.data.OUT_CURSOR && Array.isArray(data.data.OUT_CURSOR)) {
      return data.data.OUT_CURSOR.map((item) => ({
        id: item.ID,
        title: item.TITLE,
        cardNumber: String(item.USER_ID), // Convert to string
        userName: item.USER_NAME,
        start: new Date(item.START_DATE),
        end: new Date(item.END_DATE),
        description: item.DESCRIPTION || '',
        bgColor: item.COLOR || '#8b5cf6',
        department: item.DEPT || item.DEPARTMENT || '', // Ưu tiên DEPT (code) từ SELECT_EVENT_LIST
        DEPT: item.DEPT || '', // Lưu thêm DEPT riêng để đảm bảo
      }));
    }

    // Return empty array if API fails or no data
    return [];
  } catch (error) {
    // This should not happen now since callProcedure doesn't throw, but keep for safety
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting Temporary Residence events:', error);
    }
    return [];
  }
};

/**
 * Get user info by EMPID
 */
export const getTemporaryResidenceUserInfo = async (empId, langCd = 'ENG') => {
  try {
    const payload = {
      serviceId: 'VJ',
      langCd: langCd,
      empId: empId,
    };

    const response = await fetch(TemporaryResidenceEmployeeInfoURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
};

