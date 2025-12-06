import {
  MeetingRoomCallProcedureURL,
  MeetingRoomSaveProcedureURL,
  MeetingRoomDeleteProcedureURL,
  MeetingRoomEmployeeInfoURL,
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
      packageName: 'PW_MEETING_ROOM_EVENT',
      procedureName: procedureName,
      params: validParams,
    };

    const response = await fetch(MeetingRoomCallProcedureURL, {
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
 * Save/Update Meeting Room event via save-procedure API
 */
export const saveMeetingRoomEvent = async (eventData) => {
  try {
    const {
      id = null,
      startDate,
      endDate,
      startTime,
      endTime,
      title,
      color,
      description = '',
      department = '',
      userId,
      meetingRoom,
      court, // Keep for backward compatibility
      userLogin,
    } = eventData;

    // Use meetingRoom if provided, otherwise fallback to court for backward compatibility
    const room = meetingRoom;

    // Map room name to short code (VARCHAR2(10) limit in Oracle procedure)
    const getRoomCode = (roomName) => {
      if (!roomName) return 'MR1';
      // If already a short code (<= 10 chars), use as is
      if (roomName.length <= 10) return roomName;
      // Map long names to short codes
      const roomMap = {
        'Meeting Room 1': 'MR1',
        'Meeting Room 2': 'MR2',
        'Meeting Room 3': 'MR3',
      };
      return roomMap[roomName] || roomName.substring(0, 10);
    };

    const roomCode = getRoomCode(room);

    // Validate required fields
    if (!userId || !userLogin) {
      throw new Error('Thiếu thông tin người dùng (USER_ID hoặc USER_LOGIN)');
    }
    if (!room) {
      throw new Error('Thiếu thông tin phòng (ROOM)');
    }
    if (!title) {
      throw new Error('Thiếu tiêu đề sự kiện (TITLE)');
    }
    if (!startDate || !endDate) {
      throw new Error('Thiếu thông tin ngày (START_DATE hoặc END_DATE)');
    }
    if (!startTime || !endTime) {
      throw new Error('Thiếu thông tin giờ (START_TIME hoặc END_TIME)');
    }

    const body = {
      dbName: 'HUBIC',
      packageName: 'PW_MEETING_ROOM_EVENT',
      procedureName: 'MERGE_EVENT',
      params: {
        P_ID: { value: id, type: "IN" },
        P_START_DATE: { value: String(startDate), type: "IN" },
        P_END_DATE: { value: String(endDate), type: "IN" },
        P_START_TIME: { value: String(startTime), type: "IN" },
        P_END_TIME: { value: String(endTime), type: "IN" },
        P_TITLE: { value: String(title), type: "IN" },
        P_COLOR: { value: String(color || '#FFB6C1'), type: "IN" },
        P_DESCRIPTION: { value: String(description || ""), type: "IN" },
        P_DEPARTMENT: { value: String(department || ""), type: "IN" },
        P_USER_ID: { value: String(userId), type: "IN" },
        P_MEETING_ROOM: { value: String(meetingRoom), type: "IN" },
        P_USER_LOGIN: { value: String(userLogin), type: "IN" },
        P_OUT_ID: { type: "OUT", dataType: "NUMBER" }
      },
    };

    // Log request in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Saving Meeting Room event - Request body:', JSON.stringify(body, null, 2));
    }

    const response = await fetch(MeetingRoomCallProcedureURL, {
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
      console.log('Save Meeting Room event - Response:', data);
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
      console.error('Error saving Meeting Room event:', {
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
 * Delete Meeting Room event via delete-procedure API
 */
export const deleteMeetingRoomEvent = async (eventId) => {
  try {
    const body = {
      dbName: 'HUBIC',
      packageName: 'PW_MEETING_ROOM_EVENT',
      procedureName: 'DELETE_EVENT',
      params: {
        P_ID: { value: eventId, type: "IN" },
      },
    };

    const response = await fetch(MeetingRoomDeleteProcedureURL, {
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
    console.error('Error deleting Meeting Room event:', error);
    throw error;
  }
};

/**
 * Get list of Meeting Room events
 */
export const getMeetingRoomEvents = async (fromDate, toDate) => {
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
        meetingRoom: item.MEETING_ROOM , // Use MEETING_ROOM from API
        cardNumber: String(item.USER_ID), // Convert to string
        userName: item.USER_NAME,
        start: new Date(`${item.START_DATE}T${item.START_TIME}`),
        end: new Date(`${item.END_DATE}T${item.END_TIME}`),
        description: item.DESCRIPTION || '',
        bgColor: item.COLOR || '#FFB6C1',
        department: item.DEPARTMENT || '',
      }));
    }

    // Return empty array if API fails or no data
    return [];
  } catch (error) {
    // This should not happen now since callProcedure doesn't throw, but keep for safety
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting Meeting Room events:', error);
    }
    return [];
  }
};

/**
 * Get user info by EMPID
 */
export const getMeetingRoomUserInfo = async (empId, langCd = 'ENG') => {
  try {
    const payload = {
      serviceId: 'VJ',
      langCd: langCd,
      empId: empId,
    };

    const response = await fetch(MeetingRoomEmployeeInfoURL, {
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

/**
 * Get list of bookers (users who have booked events)
 */
export const getMeetingRoomBookerList = async () => {
  try {
    const data = await callProcedure('BOOKER_LIST_SELECT', {});

    if (data.success && data.data && Array.isArray(data.data)) {
      return data.data.map((item) => ({
        userId: item.USER_ID,
        name: item.NAME,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error getting booker list:', error);
    return [];
  }
};

/**
 * Get list of Meeting Room rooms
 */
export const getMeetingRoomList = async () => {
  try {
    // Procedure BOOKING_ROOM_LIST_SELECT cần OUT_CURSOR, không phải params rỗng
    const data = await callProcedure('BOOKING_ROOM_LIST_SELECT', {
      OUT_CURSOR: { type: "OUT", dataType: "CURSOR" }
    });

    // Response structure: { success: true, data: { OUT_CURSOR: [...] } }
    if (data && data.success && data.data && data.data.OUT_CURSOR && Array.isArray(data.data.OUT_CURSOR) && data.data.OUT_CURSOR.length > 0) {
      return data.data.OUT_CURSOR.map((item) => ({
        value: item.ROOM_CODE || item.COURT_CODE,
        label: item.ROOM_NAME || item.COURT_NAME,
        gradientColor: item.GRADIENT_COLOR || null, // Lấy gradient color từ procedure
      }));
    }

    // Fallback to default room if API fails or returns no data
    // This ensures the app still works when backend is not ready
    return [
      {
        value: 'MEETING_ROOM_1',
        label: 'Meeting Room 1',
        gradientColor: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%)', // Default gradient for Room 1
      },
    ];
  } catch (error) {
    // This should not happen now since callProcedure doesn't throw, but keep for safety
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting room list:', error);
    }
    // Return default room as fallback
    return [
      {
        value: 'Meeting Room 1',
        label: 'Meeting Room 1',
      },
    ];
  }
};

/**
 * Get list of departments
 */
export const getMeetingRoomDepartmentList = async () => {
  try {
    const data = await callProcedure('DEPARTMENT_LIST_SELECT', {});

    if (data && data.success && data.data && Array.isArray(data.data)) {
      return data.data.map((item) => ({
        value: item.DEPT_CODE,
        label: item.DEPT_NAME,
      }));
    }

    return [];
  } catch (error) {
    // This should not happen now since callProcedure doesn't throw, but keep for safety
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting department list:', error);
    }
    return [];
  }
};

/**
 * Get user login info by EMPID and LANG_CD
 */
export const getMeetingRoomUserLoginInfo = async (empId, langCd = 'ENG') => {
  try {
    const data = await callProcedure('EVENT_USER_LOGIN_SELECT', {
      P_EMPID: empId,
      P_LANG_CD: langCd,
    });

    if (data && data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0];
    }

    return null;
  } catch (error) {
    // This should not happen now since callProcedure doesn't throw, but keep for safety
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting user login info:', error);
    }
    return null;
  }
};

/**
 * Check if a date is a holiday by calling CALENDAR_DAY_CHECK_SELECT procedure
 * Procedure có thể nằm trong package khác, nên tạo hàm riêng
 * @param {string} dateStr - Date in format YYYY-MM-DD
 * @returns {Promise<{isHoliday: boolean, data: object|null}>}
 */
export const checkCalendarDay = async (dateStr) => {
  try {
    // Convert YYYY-MM-DD to YYYYMMDD
    const dateFormatted = dateStr.replace(/-/g, '');
    
    // Gọi procedure - có thể cần package name khác, tạm thời dùng PW_MEETING_ROOM_EVENT
    // Nếu procedure nằm trong package khác, cần cập nhật packageName
    const body = {
      dbName: 'HUBIC',
      packageName: 'PW_MEETING_ROOM_EVENT', // Có thể cần thay đổi nếu procedure nằm trong package khác
      procedureName: 'CALENDAR_DAY_CHECK_SELECT',
      params: {
        P_DATE: { value: dateFormatted, type: "IN" },
        OUT_CURSOR: { type: "OUT", dataType: "CURSOR" }
      },
    };

    const response = await fetch(MeetingRoomCallProcedureURL, {
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

      if (process.env.NODE_ENV === 'development' && response.status !== 400) {
        console.warn(`API call failed for CALENDAR_DAY_CHECK_SELECT:`, response.status, errorData || errorText);
      }

      // Default to regular day if error
      return {
        isHoliday: false,
        data: null
      };
    }

    const data = await response.json();

    // Response structure: { success: true, data: { OUT_CURSOR: [...] } }
    if (data && data.success && data.data && data.data.OUT_CURSOR && Array.isArray(data.data.OUT_CURSOR) && data.data.OUT_CURSOR.length > 0) {
      const calendarData = data.data.OUT_CURSOR[0];
      const isHoliday = calendarData.OFF_YN === 'Y';
      return {
        isHoliday: isHoliday,
        data: calendarData
      };
    }

    // If no data found, assume it's a regular day
    return {
      isHoliday: false,
      data: null
    };
  } catch (error) {
    // Network errors or other issues
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error checking calendar day:', error);
    }
    // Default to regular day if error
    return {
      isHoliday: false,
      data: null
    };
  }
};

