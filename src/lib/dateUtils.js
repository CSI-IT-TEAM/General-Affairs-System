/**
 * Date utility functions
 * Các hàm xử lý ngày tháng dùng chung cho toàn ứng dụng
 */

import { format } from 'date-fns';

/**
 * Format Date to YYYYMMDD string for Oracle
 */
export const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
};

export const formatDateToYYYYMM = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
};

/**
 * Format Date to Oracle timestamp format (YYYYMMDDHHmmss)
 */
export const formatDateToTimestamp = (date) => {
    return date ? format(date, 'yyyyMMddHHmmss') : '';
};

/**
 * Parse date string (handles ISO, YYYYMMDD, and YYYYMMDDHHMMSS formats)
 * 
 * QUAN TRỌNG: Database Oracle lưu local time (Vietnam UTC+7) nhưng có thể truyền
 * xuống với suffix Z hoặc không. Hàm này parse thủ công để tránh timezone conversion.
 */
export const parseDate = (dateStr) => {
    if (!dateStr) return undefined;
    try {
        // Handle YYYYMMDDHHMMSS format (14 characters - Oracle timestamp)
        if (dateStr.length === 14 && /^\d{14}$/.test(dateStr)) {
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            const hours = parseInt(dateStr.substring(8, 10));
            const minutes = parseInt(dateStr.substring(10, 12));
            const seconds = parseInt(dateStr.substring(12, 14));
            return new Date(year, month, day, hours, minutes, seconds);
        }
        // Handle YYYYMMDD format (8 characters)
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            return new Date(year, month, day);
        }
        
        // Handle ISO string - Parse thủ công để tránh timezone conversion
        // Database Oracle lưu local time (Vietnam UTC+7) nhưng có thể truyền với Z suffix
        // Ví dụ: "2025-12-18T18:16:00Z" → Cần parse thành 18:16 local time, KHÔNG chuyển sang UTC+7
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (isoMatch) {
            const [, year, month, day, hours, minutes, seconds] = isoMatch;
            // Tạo Date từ các thành phần, sẽ tự động dùng local timezone
            return new Date(
                parseInt(year),
                parseInt(month) - 1,  // month is 0-indexed
                parseInt(day),
                parseInt(hours),
                parseInt(minutes),
                parseInt(seconds)
            );
        }
        
        // Fallback: try standard Date parsing (chỉ cho các format khác)
        // CHÚ Ý: Nếu có suffix Z, JS sẽ convert sang local time → có thể sai
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
    } catch {
        return undefined;
    }
};

/**
 * Format date for display (dd/MM or dd/MM HH:mm)
 * Xử lý đặc biệt cho ISO string từ Oracle database (lưu local time Vietnam)
 */
export const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    
    try {
        // Handle YYYYMMDD format
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            return `${day}/${month}`;
        }
        
        // Handle YYYYMMDDHHMMSS format (14 characters - Oracle timestamp)
        if (dateStr.length === 14 && /^\d{14}$/.test(dateStr)) {
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const hours = dateStr.substring(8, 10);
            const minutes = dateStr.substring(10, 12);
            return `${day}/${month} ${hours}:${minutes}`;
        }
        
        // Handle ISO string - Parse thủ công để tránh timezone conversion
        // Database Oracle lưu local time (Vietnam UTC+7) nhưng có thể truyền xuống với suffix Z
        // Nên cần parse thủ công phần date/time thay vì dùng new Date()
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (isoMatch) {
            const [, , month, day, hours, minutes] = isoMatch;
            return `${day}/${month} ${hours}:${minutes}`;
        }
        
        // Fallback: try standard Date parsing (for other formats)
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return format(date, 'dd/MM HH:mm');
        }
        
        return dateStr;
    } catch {
        return dateStr;
    }
};

/**
 * Get yesterday's date (end of day)
 */
export const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    return yesterday;
};

/**
 * Get today's date (end of day)
 */
export const getToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
};

/**
 * Check if a date is in the past
 */
export const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
};

/**
 * Check if a dateRange is in same month
 * dateRange.from is 1st date of month
 * dateRange.to is last date of month
 */
export const isFullMonthRange = (dateRange) => {
  if (!dateRange?.from || !dateRange?.to) return false;

  const from = new Date(dateRange.from);
  const to = new Date(dateRange.to);

  const firstDayOfMonth = new Date(from.getFullYear(), from.getMonth(), 1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const lastDayOfMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  lastDayOfMonth.setHours(23, 59, 59, 999);

  const fromCheck = new Date(from);
  fromCheck.setHours(0, 0, 0, 0);

  const toCheck = new Date(to);
  toCheck.setHours(23, 59, 59, 999);

  const sameMonth =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth();

  return (
    sameMonth &&
    fromCheck.getTime() === firstDayOfMonth.getTime() &&
    toCheck.getTime() === lastDayOfMonth.getTime()
  );
};