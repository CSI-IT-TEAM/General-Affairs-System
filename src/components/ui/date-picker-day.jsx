import * as React from "react";
import { DatePicker } from "rsuite";
import dayjs from "dayjs";

export function DatePickerDay({ value, onChange, id, minDate }) {
    // Chuyển value từ format YYYY-MM-DD sang Date object
    const selectedDate = React.useMemo(() => {
        if (!value) return null;
        try {
            return dayjs(value).toDate();
        } catch {
            return null;
        }
    }, [value]);

    // Chuyển minDate từ format YYYY-MM-DD sang Date object
    const minDateObj = React.useMemo(() => {
        if (!minDate) return null;
        try {
            return dayjs(minDate).startOf('day').toDate();
        } catch {
            return null;
        }
    }, [minDate]);

    const handleChange = (date) => {
        if (date) {
            // Kiểm tra minDate nếu có
            if (minDateObj) {
                const selectedDateObj = dayjs(date).startOf('day');
                const minDateDayjs = dayjs(minDateObj).startOf('day');
                if (selectedDateObj.isBefore(minDateDayjs, 'day')) {
                    // Nếu chọn ngày nhỏ hơn minDate, không cho phép
                    return;
                }
            }
            // Chuyển Date object về format YYYY-MM-DD
            onChange(dayjs(date).format("YYYY-MM-DD"));
        } else {
            onChange("");
        }
    };

    // Hàm để disable các ngày trước minDate
    const disabledDate = React.useCallback((date) => {
        if (!minDateObj) return false;
        const dateToCheck = dayjs(date).startOf('day');
        const minDateDayjs = dayjs(minDateObj).startOf('day');
        return dateToCheck.isBefore(minDateDayjs, 'day');
    }, [minDateObj]);

    // Thêm style để đảm bảo popover có z-index cao hơn dialog và style cho disabled dates
    React.useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .rs-picker-popup,
            .rs-picker-popup.rs-picker-popup-date,
            .rs-picker-menu,
            .rs-picker-calendar {
                z-index: 9999 !important;
            }
            .rs-calendar-table-cell-disabled {
                opacity: 0.3 !important;
                cursor: not-allowed !important;
                pointer-events: none !important;
            }
            .rs-calendar-table-cell-disabled .rs-calendar-table-cell-content {
                color: #999 !important;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <DatePicker
            id={id}
            value={selectedDate}
            onChange={handleChange}
            format="dd/MM/yyyy"
            placeholder="Chọn ngày"
            block
            appearance="default"
            oneTap
            cleanable
            minDate={minDateObj}
            disabledDate={disabledDate}
            placement="bottomStart"
            editable={false}
            style={{ cursor: 'pointer' }}
            renderValue={(value) => {
                if (!value) return null;
                return dayjs(value).format("DD/MM/YYYY");
            }}
        />
    );
}

