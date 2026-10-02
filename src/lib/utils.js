import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

// Convert REQ_KEY thành format hiển thị
// Hỗ trợ cả format cũ và format mới:
// - Format cũ (timestamp): "1734437595012" → "CS-IT-241217-193315-12" (giữ nguyên prefix)
// - Format mới (YYYYMMDDXXX): "20260107001" → "20260107-001" (không có prefix)
// - Format legacy: "CS-IT-..." → giữ nguyên
export const formatReqKeyForDisplay = (timestampKey) => {
    if (!timestampKey) return '-';
    
    // Nếu là format legacy (bắt đầu bằng "CS-IT-") thì giữ nguyên
    if (timestampKey.startsWith('CS-IT-')) {
        return timestampKey;
    }
    
    // Format mới: 11 ký tự số (YYYYMMDD + 3 digits sequence)
    // VD: "20260107001" → "20260107-001" (KHÔNG có CS-IT-)
    if (/^\d{11}$/.test(timestampKey)) {
        const datePart = timestampKey.substring(0, 8);  // YYYYMMDD
        const seqPart = timestampKey.substring(8);       // 001, 002, ...
        return `${datePart}-${seqPart}`;
    }
    
    // Format cũ: timestamp (13 ký tự số)
    // VD: "1734437595012" → "CS-IT-241217-193315-12" (CÓ prefix CS-IT-)
    if (/^\d{13}$/.test(timestampKey)) {
        const timestamp = parseInt(timestampKey, 10);
        if (!isNaN(timestamp)) {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                const dateStr = format(date, 'yyMMdd');  // e.g., "241217"
                const timeStr = format(date, 'HHmmss');  // e.g., "193315"
                const msStr = String(date.getMilliseconds()).padStart(2, '0');
                return `CS-IT-${dateStr}-${timeStr}-${msStr}`;
            }
        }
    }
    
    // Fallback: trả về nguyên nếu không match format nào
    return timestampKey;
};

// Helper function: Parse date string (YYYYMMDD or YYYYMMDDHHMMSS) to Date object
export const parseDateString = (dateStr) => {
    if (!dateStr || !dateStr.trim()) return null;

    // Format: YYYYMMDDHHMMSS (14 ký tự)
    if (dateStr.length === 14 && /^\d{14}$/.test(dateStr)) {
        return new Date(
            parseInt(dateStr.substring(0, 4)),      // year
            parseInt(dateStr.substring(4, 6)) - 1,  // month (0-indexed)
            parseInt(dateStr.substring(6, 8)),      // day
            parseInt(dateStr.substring(8, 10)),     // hour
            parseInt(dateStr.substring(10, 12)),    // minute
            parseInt(dateStr.substring(12, 14))     // second
        );
    }
    // Format: YYYYMMDD (8 ký tự)
    if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
        return new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8)),
            23, 59, 59  // Set to end of day for comparison
        );
    }
    // Fallback: parse standard format
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};