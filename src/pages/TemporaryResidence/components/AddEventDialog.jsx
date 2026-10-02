import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Calendar as CalendarIcon, User, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { DatePickerDay } from '../../../components/ui/date-picker-day';
import { useTranslation } from 'react-i18next';

const AddEventDialog = ({
    isOpen,
    onClose,
    onSubmit,
    initialStartDate,
    initialEndDate,
    colorSwatches,
    events = [],
    editingEvent = null,
    onDelete = null,
}) => {
    const { t } = useTranslation();
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [color, setColor] = useState(colorSwatches[0]);
    const [hasOverlap, setHasOverlap] = useState(false);
    const [overlapMessage, setOverlapMessage] = useState('');

    // Lấy EMPID từ sessionStorage
    const getCurrentEmpId = () => {
        try {
            const userData = JSON.parse(sessionStorage.getItem("userData"));
            return userData?.EMPID || '';
        } catch (error) {
            console.error('Error getting EMPID:', error);
            return '';
        }
    };

    // Lấy EMP_NM từ sessionStorage
    const getCurrentEmpName = () => {
        try {
            const userData = JSON.parse(sessionStorage.getItem("userData"));
            return userData?.EMP_NM || '--';
        } catch (error) {
            console.error('Error getting EMP_NM:', error);
            return '--';
        }
    };

    // Lấy danh sách các ngày đã bị chiếm (occupied dates) của empId hiện tại
    const getOccupiedDates = React.useMemo(() => {
        const currentEmpId = getCurrentEmpId();
        if (!currentEmpId) return new Set();

        // Filter events của empId hiện tại, loại trừ event đang edit
        const userEvents = events.filter(event => {
            // Loại trừ event đang edit
            if (editingEvent && event.id === editingEvent.id) {
                return false;
            }
            const eventEmpId = String(event.cardNumber || event.userId || '').trim().toUpperCase();
            const currentEmpIdNormalized = String(currentEmpId).trim().toUpperCase();
            return eventEmpId === currentEmpIdNormalized;
        });

        // Tạo Set chứa tất cả các ngày đã bị chiếm
        const occupiedDatesSet = new Set();
        userEvents.forEach(event => {
            const eventStart = dayjs(event.start);
            const eventEnd = dayjs(event.end);
            let current = eventStart;
            while (current.isSameOrBefore(eventEnd, 'day')) {
                occupiedDatesSet.add(current.format('YYYY-MM-DD'));
                current = current.add(1, 'day');
            }
        });

        return occupiedDatesSet;
    }, [events, editingEvent]);

    // Function để check xem một ngày có bị disable không
    // Chỉ disable khi add mode, không disable khi edit mode
    const isDateDisabled = React.useCallback((date) => {
        // Edit mode: không disable ngày nào
        if (editingEvent) {
            return false;
        }
        // Add mode: disable ngày đã bị chiếm
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return getOccupiedDates.has(dateStr);
    }, [getOccupiedDates, editingEvent]);

    // Tìm ngày khả dụng tiếp theo (ngày đầu tiên không có event, từ hôm nay trở đi)
    const getNextAvailableDate = React.useCallback(() => {
        const today = dayjs().startOf('day');
        let checkDate = today;
        const maxDaysToCheck = 365; // Check tối đa 1 năm
        let daysChecked = 0;

        while (daysChecked < maxDaysToCheck) {
            const dateStr = checkDate.format('YYYY-MM-DD');
            if (!getOccupiedDates.has(dateStr)) {
                return dateStr;
            }
            checkDate = checkDate.add(1, 'day');
            daysChecked++;
        }

        // Nếu không tìm thấy ngày khả dụng trong 1 năm, trả về hôm nay
        return today.format('YYYY-MM-DD');
    }, [getOccupiedDates]);

    // Kiểm tra overlap với events hiện có của empId
    const checkOverlap = (start, end) => {
        if (!start || !end) {
            setHasOverlap(false);
            setOverlapMessage('');
            return false;
        }

        const startDateObj = dayjs(start);
        const endDateObj = dayjs(end);

        // Kiểm tra từng ngày trong khoảng có bị chiếm không
        let current = startDateObj;
        const occupiedDates = [];
        while (current.isSameOrBefore(endDateObj, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');
            if (getOccupiedDates.has(dateStr)) {
                occupiedDates.push(dateStr);
            }
            current = current.add(1, 'day');
        }

        if (occupiedDates.length > 0) {
            setHasOverlap(true);
            // Tạo message chi tiết về các ngày đã bị chiếm
            if (occupiedDates.length === 1) {
                const occupiedDate = dayjs(occupiedDates[0]);
                const dateStr = occupiedDate.format('DD/MM/YYYY');
                const message = t('date_already_registered_single');
                setOverlapMessage(
                    message && message !== 'date_already_registered_single'
                        ? message.replace('{{date}}', dateStr)
                        : `Ngày ${dateStr} đã có khai báo. Mỗi ngày chỉ được khai báo 1 lần. Vui lòng chọn ngày khác!`
                );
            } else {
                const firstOccupied = dayjs(occupiedDates[0]);
                const lastOccupied = dayjs(occupiedDates[occupiedDates.length - 1]);
                const startDateStr = firstOccupied.format('DD/MM/YYYY');
                const endDateStr = lastOccupied.format('DD/MM/YYYY');
                const message = t('date_already_registered_range');
                setOverlapMessage(
                    message && message !== 'date_already_registered_range'
                        ? message.replace('{{startDate}}', startDateStr).replace('{{endDate}}', endDateStr)
                        : `Các ngày từ ${startDateStr} đến ${endDateStr} đã có khai báo. Mỗi ngày chỉ được khai báo 1 lần. Vui lòng chọn khoảng thời gian khác!`
                );
            }
            return true;
        }

        setHasOverlap(false);
        setOverlapMessage('');
        return false;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!startDate || !endDate) {
            alert(t('meeting_room_please_fill_all_fields') || 'Vui lòng chọn ngày!');
            return;
        }

        // Kiểm tra endDate phải sau hoặc bằng startDate
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        if (end.isBefore(start, 'day')) {
            alert(t('end_date_must_after_start_date') || 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!');
            return;
        }

        // Kiểm tra overlap trước khi submit - đảm bảo không có ngày nào trong khoảng đã bị chiếm
        // (getOccupiedDates đã loại trừ event đang edit, nên cả Add và Edit mode đều dùng chung logic này)
        const occupiedDatesInRange = [];
        let current = start;
        
        while (current.isSameOrBefore(end, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');
            if (getOccupiedDates.has(dateStr)) {
                occupiedDatesInRange.push(dateStr);
            }
            current = current.add(1, 'day');
        }

        if (occupiedDatesInRange.length > 0) {
            // Có ít nhất 1 ngày trong khoảng đã bị chiếm
            if (occupiedDatesInRange.length === 1) {
                const occupiedDate = dayjs(occupiedDatesInRange[0]);
                const dateStr = occupiedDate.format('DD/MM/YYYY');
                const message = t('date_already_registered_single');
                alert(
                    message && message !== 'date_already_registered_single'
                        ? message.replace('{{date}}', dateStr)
                        : `Ngày ${dateStr} đã có khai báo. Mỗi ngày chỉ được khai báo 1 lần. Vui lòng chọn ngày khác!`
                );
            } else {
                const firstOccupied = dayjs(occupiedDatesInRange[0]);
                const lastOccupied = dayjs(occupiedDatesInRange[occupiedDatesInRange.length - 1]);
                const startDateStr = firstOccupied.format('DD/MM/YYYY');
                const endDateStr = lastOccupied.format('DD/MM/YYYY');
                const message = t('date_already_registered_range');
                alert(
                    message && message !== 'date_already_registered_range'
                        ? message.replace('{{startDate}}', startDateStr).replace('{{endDate}}', endDateStr)
                        : `Các ngày từ ${startDateStr} đến ${endDateStr} đã có khai báo. Mỗi ngày chỉ được khai báo 1 lần. Vui lòng chọn khoảng thời gian khác!`
                );
            }
            return;
        }

        // Tạo 1 event duy nhất từ Start Date đến End Date
        const eventStart = dayjs(startDate).startOf('day').toDate();
        const eventEnd = dayjs(endDate).endOf('day').toDate();

        const eventsToAdd = [{
            title: 'Temporary Residence Registration', // Title mặc định
            cardNumber: getCurrentEmpId(),
            start: eventStart,
            end: eventEnd,
            description: '',
            bgColor: color
        }];

        onSubmit(eventsToAdd);
        setColor(colorSwatches[0]);
        setStartDate(initialStartDate);
        setEndDate(initialEndDate);
    };

    // Chỉ khởi tạo state khi dialog mở lần đầu
    const [isInitialized, setIsInitialized] = React.useState(false);

    React.useEffect(() => {
        if (isOpen && !isInitialized) {
            if (editingEvent) {
                // Edit mode: sử dụng dates từ editingEvent
                // Đảm bảo start và end là Date objects
                const start = editingEvent.start instanceof Date 
                    ? editingEvent.start 
                    : new Date(editingEvent.start);
                const end = editingEvent.end instanceof Date 
                    ? editingEvent.end 
                    : new Date(editingEvent.end);
                
                setStartDate(format(start, 'yyyy-MM-dd'));
                setEndDate(format(end, 'yyyy-MM-dd'));
                setColor(editingEvent.bgColor || colorSwatches[0]);
            } else {
                // Add mode: tìm ngày khả dụng tiếp theo
                const nextAvailableDate = getNextAvailableDate();
                
                // Nếu initialStartDate là ngày đã bị chiếm, dùng ngày khả dụng tiếp theo
                const initialStart = initialStartDate && !getOccupiedDates.has(initialStartDate) 
                    ? initialStartDate 
                    : nextAvailableDate;
                
                setStartDate(initialStart);
                setEndDate(initialEndDate && !getOccupiedDates.has(initialEndDate) 
                    ? initialEndDate 
                    : initialStart);
                
                // Tìm màu tiếp theo dựa trên số events đã có của user
                const currentEmpId = getCurrentEmpId();
                const userEvents = events.filter(event => {
                    const eventEmpId = String(event.cardNumber || event.userId || '').trim().toUpperCase();
                    const currentEmpIdNormalized = String(currentEmpId).trim().toUpperCase();
                    return eventEmpId === currentEmpIdNormalized;
                });
                
                // Số events đã có = index của màu tiếp theo
                const colorIndex = userEvents.length % colorSwatches.length;
                setColor(colorSwatches[colorIndex]);
            }
            setHasOverlap(false);
            setOverlapMessage('');
            setIsInitialized(true);
        } else if (!isOpen) {
            // Reset khi dialog đóng
            setIsInitialized(false);
        }
        // eslint-disable-next-line
    }, [isOpen, initialStartDate, initialEndDate, colorSwatches, getOccupiedDates, getNextAvailableDate, editingEvent, isInitialized]);

    // Đảm bảo endDate không nhỏ hơn startDate và không bị chiếm (chỉ cho add mode)
    React.useEffect(() => {
        // Edit mode: không tự động điều chỉnh dates
        if (editingEvent) {
            return;
        }

        // Add mode: điều chỉnh dates nếu cần
        if (startDate && endDate) {
            const start = dayjs(startDate);
            const end = dayjs(endDate);
            
            // Nếu endDate nhỏ hơn startDate, cập nhật thành startDate
            if (end.isBefore(start, 'day')) {
                // Tìm ngày khả dụng từ startDate
                let nextAvailable = start;
                let found = false;
                for (let i = 0; i < 365; i++) {
                    const dateStr = nextAvailable.format('YYYY-MM-DD');
                    if (!getOccupiedDates.has(dateStr)) {
                        setEndDate(dateStr);
                        found = true;
                        break;
                    }
                    nextAvailable = nextAvailable.add(1, 'day');
                }
                if (!found) {
                    setEndDate(startDate);
                }
            } else if (getOccupiedDates.has(endDate)) {
                // Nếu endDate bị chiếm, tìm ngày khả dụng tiếp theo từ startDate
                let nextAvailable = start;
                let found = false;
                for (let i = 0; i < 365; i++) {
                    const dateStr = nextAvailable.format('YYYY-MM-DD');
                    if (!getOccupiedDates.has(dateStr)) {
                        setEndDate(dateStr);
                        found = true;
                        break;
                    }
                    nextAvailable = nextAvailable.add(1, 'day');
                }
                if (!found) {
                    setEndDate(startDate);
                }
            }
        }
        // eslint-disable-next-line
    }, [startDate, endDate, getOccupiedDates, editingEvent]);

    // Kiểm tra overlap khi startDate hoặc endDate thay đổi (cho cả add và edit mode)
    React.useEffect(() => {
        // Check overlap cho cả Add và Edit mode (getOccupiedDates đã loại trừ event đang edit)
        if (startDate && endDate) {
            checkOverlap(startDate, endDate);
        } else {
            setHasOverlap(false);
            setOverlapMessage('');
        }
        // eslint-disable-next-line
    }, [startDate, endDate, events, editingEvent, getOccupiedDates]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 pt-12 sm:pt-12"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ 
                            type: "spring", 
                            damping: 30, 
                            stiffness: 500,
                            mass: 0.5
                        }}
                        className="w-full max-w-md sm:max-w-2xl max-h-[calc(100vh-4rem)] sm:max-h-[calc(90vh-6rem)] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <Card className="flex flex-col max-h-full overflow-hidden">
                            <CardHeader className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            <span className="truncate">
                                                {editingEvent 
                                                    ? `${t('edit') || 'Chỉnh Sửa'} ${t('temporary_residence_title') || 'Khai Báo Tạm Trú Tạm Vắng'}`
                                                    : (t('temporary_residence_title') || 'Khai Báo Tạm Trú Tạm Vắng')
                                                }
                                            </span>
                                        </CardTitle>
                                        {/* Hiển thị EMP_NM */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600 ml-6">
                                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            <span className="font-medium">{getCurrentEmpName()}</span>
                                        </div>
                                        {/* Hiển thị ngày được chọn */}
                                        {startDate && (
                                            <div className="flex items-center gap-2 text-sm text-primary font-semibold ml-6">
                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                <span>{t('meeting_room_booking_from') || 'Từ'} {dayjs(startDate).format('DD/MM/YYYY')}</span>
                                                {endDate && endDate !== startDate && (
                                                    <span>{t('meeting_room_booking_to') || 'Đến'} {dayjs(endDate).format('DD/MM/YYYY')}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClose}
                                        className="h-8 w-8 p-0 flex-shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <CardContent className="space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0 px-4 py-3 sm:px-6 sm:py-4">
                                    
                                    {/* Start Date và End Date */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="startDate" className="flex items-center gap-2 text-sm sm:text-base">
                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                {t('meeting_room_start_date') || 'Từ ngày'}
                                            </Label>
                                            <DatePickerDay
                                                value={startDate}
                                                onChange={(newStartDate) => {
                                                    if (!newStartDate) return;
                                                    
                                                    // Edit mode: cho phép chọn bất kỳ ngày nào
                                                    if (editingEvent) {
                                                        setStartDate(newStartDate);
                                                        // Nếu startDate mới lớn hơn endDate hiện tại, cập nhật endDate
                                                        if (endDate && newStartDate > endDate) {
                                                            setEndDate(newStartDate);
                                                        }
                                                        return;
                                                    }
                                                    
                                                    // Add mode: chỉ cho phép chọn nếu ngày không bị chiếm
                                                    if (!getOccupiedDates.has(newStartDate)) {
                                                        setStartDate(newStartDate);
                                                        // Nếu startDate mới lớn hơn endDate hiện tại, cập nhật endDate
                                                        if (endDate && newStartDate > endDate) {
                                                            // Tìm ngày khả dụng tiếp theo từ startDate
                                                            let nextAvailable = dayjs(newStartDate);
                                                            let found = false;
                                                            for (let i = 0; i < 365; i++) {
                                                                const dateStr = nextAvailable.format('YYYY-MM-DD');
                                                                if (!getOccupiedDates.has(dateStr)) {
                                                                    setEndDate(dateStr);
                                                                    found = true;
                                                                    break;
                                                                }
                                                                nextAvailable = nextAvailable.add(1, 'day');
                                                            }
                                                            if (!found) {
                                                                setEndDate(newStartDate);
                                                            }
                                                        }
                                                    }
                                                }}
                                                id="startDate"
                                                minDate={dayjs().format('YYYY-MM-DD')}
                                                customDisabledDate={isDateDisabled}
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="endDate" className="flex items-center gap-2 text-sm sm:text-base">
                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                {t('meeting_room_end_date') || 'Đến ngày'}
                                            </Label>
                                            <DatePickerDay
                                                value={endDate}
                                                onChange={(newEndDate) => {
                                                    if (!newEndDate) return;
                                                    
                                                    // Edit mode: cho phép chọn bất kỳ ngày nào (chỉ cần >= startDate)
                                                    if (editingEvent) {
                                                        const start = dayjs(startDate);
                                                        const end = dayjs(newEndDate);
                                                        // Chỉ cập nhật nếu endDate >= startDate
                                                        if (end.isSameOrAfter(start, 'day')) {
                                                            setEndDate(newEndDate);
                                                        } else {
                                                            // Nếu endDate < startDate, cảnh báo nhưng vẫn cho phép trong edit mode
                                                            // (hoặc có thể tự động cập nhật startDate)
                                                            alert(t('end_date_must_after_start_date') || 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!');
                                                        }
                                                        return;
                                                    }
                                                    
                                                    // Add mode: chỉ cho phép chọn nếu ngày không bị chiếm
                                                    if (!getOccupiedDates.has(newEndDate)) {
                                                        setEndDate(newEndDate);
                                                    }
                                                }}
                                                id="endDate"
                                                minDate={startDate}
                                                customDisabledDate={isDateDisabled}
                                            />
                                        </div>
                                    </div>

                                    {/* Warning message nếu có overlap */}
                                    {hasOverlap && overlapMessage && (
                                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-700 font-medium">{overlapMessage}</p>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 p-3 sm:p-6 pt-3 sm:pt-4 flex-shrink-0 border-t bg-background sticky bottom-0">
                                    {editingEvent && onDelete && (
                                        <Button 
                                            type="button" 
                                            variant="destructive" 
                                            onClick={onDelete} 
                                            className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10 order-3 sm:order-1"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('delete') || 'Xóa'}
                                        </Button>
                                    )}
                                    <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10 order-2">{t('btn_cancel')}</Button>
                                    <Button 
                                        type="submit" 
                                        className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10 order-1 sm:order-3"
                                        disabled={hasOverlap}
                                    >
                                        {editingEvent 
                                            ? (t('update') || 'Cập Nhật')
                                            : (t('register_now') || 'Đăng Ký Ngay')
                                        }
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddEventDialog;

