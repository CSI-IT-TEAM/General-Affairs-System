import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Calendar as CalendarIcon, User, X } from 'lucide-react';
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

        // Filter events của empId hiện tại
        const userEvents = events.filter(event => {
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
    }, [events]);

    // Function để check xem một ngày có bị disable không
    const isDateDisabled = React.useCallback((date) => {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return getOccupiedDates.has(dateStr);
    }, [getOccupiedDates]);

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
                setOverlapMessage(
                    `Ngày ${occupiedDate.format('DD/MM/YYYY')} đã có khai báo. Mỗi ngày chỉ được khai báo 1 lần. Vui lòng chọn ngày khác!`
                );
            } else {
                const firstOccupied = dayjs(occupiedDates[0]);
                const lastOccupied = dayjs(occupiedDates[occupiedDates.length - 1]);
                setOverlapMessage(
                    `Các ngày từ ${firstOccupied.format('DD/MM/YYYY')} đến ${lastOccupied.format('DD/MM/YYYY')} đã có khai báo. Mỗi ngày chỉ được khai báo 1 lần. Vui lòng chọn khoảng thời gian khác!`
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
            alert('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!');
            return;
        }

        // Kiểm tra overlap trước khi submit - đảm bảo không có ngày nào trong khoảng đã bị chiếm
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
                alert(`Ngày ${occupiedDate.format('DD/MM/YYYY')} đã có khai báo. Mỗi ngày chỉ được khai báo 1 lần. Vui lòng chọn ngày khác!`);
            } else {
                const firstOccupied = dayjs(occupiedDatesInRange[0]);
                const lastOccupied = dayjs(occupiedDatesInRange[occupiedDatesInRange.length - 1]);
                alert(`Các ngày từ ${firstOccupied.format('DD/MM/YYYY')} đến ${lastOccupied.format('DD/MM/YYYY')} đã có khai báo. Mỗi ngày chỉ được khai báo 1 lần. Vui lòng chọn khoảng thời gian khác!`);
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

    React.useEffect(() => {
        if (isOpen) {
            // Tìm ngày khả dụng tiếp theo
            const nextAvailableDate = getNextAvailableDate();
            
            // Nếu initialStartDate là ngày đã bị chiếm, dùng ngày khả dụng tiếp theo
            const initialStart = initialStartDate && !getOccupiedDates.has(initialStartDate) 
                ? initialStartDate 
                : nextAvailableDate;
            
            setStartDate(initialStart);
            setEndDate(initialEndDate && !getOccupiedDates.has(initialEndDate) 
                ? initialEndDate 
                : initialStart);
            setColor(colorSwatches[0]);
            setHasOverlap(false);
            setOverlapMessage('');
        }
        // eslint-disable-next-line
    }, [isOpen, initialStartDate, initialEndDate, colorSwatches, getOccupiedDates, getNextAvailableDate]);

    // Đảm bảo endDate không nhỏ hơn startDate và không bị chiếm
    React.useEffect(() => {
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
    }, [startDate, endDate, getOccupiedDates]);

    // Kiểm tra overlap khi startDate hoặc endDate thay đổi
    React.useEffect(() => {
        if (startDate && endDate) {
            checkOverlap(startDate, endDate);
        } else {
            setHasOverlap(false);
            setOverlapMessage('');
        }
        // eslint-disable-next-line
    }, [startDate, endDate, events]);

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
                                            <span className="truncate">{t('temporary_residence_title') || 'Khai Báo Tạm Trú Tạm Vắng'}</span>
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
                                                    // Chỉ cho phép chọn nếu ngày không bị chiếm
                                                    if (newStartDate && !getOccupiedDates.has(newStartDate)) {
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
                                                    // Chỉ cho phép chọn nếu ngày không bị chiếm
                                                    if (newEndDate && !getOccupiedDates.has(newEndDate)) {
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
                                    <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10">{t('btn_cancel')}</Button>
                                    <Button 
                                        type="submit" 
                                        className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
                                        disabled={hasOverlap}
                                    >
                                        {t('register_now') || 'Đăng Ký Ngay'}
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

