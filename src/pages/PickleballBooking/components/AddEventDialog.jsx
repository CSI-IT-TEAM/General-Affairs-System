import React, { useState } from 'react';
import { useFormik } from 'formik';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '../../../components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../../../components/ui/command';
import { Calendar as CalendarIcon, Clock, User, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { DatePickerDay } from '../../../components/ui/date-picker-day';
import { useTranslation } from 'react-i18next';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const AddEventDialog = ({
    isOpen,
    onClose,
    onSubmit,
    initialStartDate,
    initialEndDate,
    initialStartTime,
    initialEndTime,
    colorSwatches,
    events = [],
    courts = [],
    isHoliday = false // Nhận thông tin ngày nghỉ từ props
}) => {
    const { t } = useTranslation();
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [startTime, setStartTime] = useState(initialStartTime);
    const [endTime, setEndTime] = useState(initialEndTime);
    const [color, setColor] = useState(colorSwatches[0]);
    const [isEndTimeManual, setIsEndTimeManual] = useState(false); // Flag để theo dõi người dùng có chỉnh thủ công endTime không

    // Tính toán thời gian bắt đầu dựa trên ngày: Chủ nhật/ngày nghỉ = 07:00, ngày thường = 17:00
    const getDefaultStartTime = (dateStr) => {
        if (!dateStr) return '17:00'; // Default cho ngày thường
        if (isWeekendOrHoliday(dateStr)) {
            return '07:00'; // Chủ nhật/ngày nghỉ = 07:00
        }
        return '17:00'; // Ngày thường = 17:00
    };

    // Tính toán max time cho endTime (startTime + 2 giờ, nhưng tối đa là 23:59)
    // Nếu startTime từ 22:00 (10:00 PM) trở đi, maxEndTime luôn là 23:59
    const getMaxEndTime = () => {
        if (!startTime) return '23:59';
        const [hours, minutes] = startTime.split(':').map(Number);
        
        // Nếu startTime từ 22:00 (10:00 PM) trở đi, maxEndTime luôn là 23:59
        if (hours >= 22) {
            return '23:59';
        }
        
        const maxTime = dayjs().hour(hours).minute(minutes).add(2, 'hour');
        const maxHour = maxTime.hour();
        const maxMinute = maxTime.minute();
        
        // Giới hạn tối đa là 23:59 để tránh tràn sang ngày hôm sau
        if (maxHour >= 24 || (maxHour === 23 && maxMinute >= 59)) {
            return '23:59';
        }
        
        return `${String(maxHour).padStart(2, '0')}:${String(maxMinute).padStart(2, '0')}`;
    };

    // Xử lý khi startTime thay đổi - tự động tính endTime = startTime + 2 giờ (chỉ khi người dùng chưa chỉnh thủ công)
    // Không validate khi nhập, chỉ validate khi submit
    const handleStartTimeChange = (newStartTime) => {
        if (!newStartTime) {
            setStartTime(newStartTime);
            return;
        }

        // Cập nhật state ngay lập tức - không validate
        setStartTime(newStartTime);

        // Chỉ tự động tính endTime nếu người dùng chưa chỉnh thủ công
        // Validate format trước khi tính toán
        const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (newStartTime && newStartTime.trim() !== '' && timePattern.test(newStartTime) && !isEndTimeManual) {
            const calculatedEndTime = calculateEndTime(newStartTime);
            if (calculatedEndTime) {
                setEndTime(calculatedEndTime);
            }
        }
    };

    // Xử lý khi endTime thay đổi thủ công - kiểm tra không vượt quá 2 giờ và tối đa 23:59
    const handleEndTimeChange = (newEndTime) => {
        setIsEndTimeManual(true); // Đánh dấu người dùng đã chỉnh thủ công

        if (!startTime || !newEndTime) {
            setEndTime(newEndTime);
            return;
        }

        const [startHours] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = newEndTime.split(':').map(Number);
        
        // Nếu startTime từ 22:00 (10:00 PM) trở đi, maxEndTime luôn là 23:59
        const maxEndTime2359 = dayjs(`2000-01-01T23:59`, 'YYYY-MM-DDTHH:mm');
        let actualMaxEnd;
        
        if (startHours >= 22) {
            // Nếu startTime >= 22:00, maxEndTime luôn là 23:59
            actualMaxEnd = maxEndTime2359;
        } else {
            // Nếu startTime < 22:00, tính maxEndTime = startTime + 2 giờ, tối đa 23:59
            const start = dayjs(`2000-01-01T${startTime}`, 'YYYY-MM-DDTHH:mm');
            const maxEnd = start.add(2, 'hour');
            actualMaxEnd = maxEnd.isAfter(maxEndTime2359) ? maxEndTime2359 : maxEnd;
        }
        
        const end = dayjs(`2000-01-01T${newEndTime}`, 'YYYY-MM-DDTHH:mm');
        
        // Kiểm tra nếu endTime là 00:00 (12:00 AM) và startTime >= 22:00, giới hạn lại 23:59
        if (endHours === 0 && startHours >= 22) {
            setEndTime('23:59');
            return;
        }

        // Nếu vượt quá maxEndTime, giới hạn ở giá trị thấp hơn
        if (end.isAfter(actualMaxEnd)) {
            const maxTime = actualMaxEnd.format('HH:mm');
            setEndTime(maxTime);
            if (startHours >= 22) {
                alert(t('pickleball_max_duration_error') || 'Thời gian kết thúc không được vượt quá 2 giờ sau thời gian bắt đầu và tối đa là 23:59!');
            } else {
                alert(t('pickleball_max_duration_error') || 'Thời gian kết thúc không được vượt quá 2 giờ sau thời gian bắt đầu!');
            }
        } else {
            setEndTime(newEndTime);
        }
    };

    // Combobox sân Pickleball có filter thực tế
    const [courtInput, setCourtInput] = useState("");
    const [openCourt, setOpenCourt] = useState(false);
    const filteredCourts = courts.filter(court =>
        court.label.toLowerCase().includes(courtInput.toLowerCase())
    );

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

    // Kiểm tra ngày được chọn có phải ngày nghỉ hoặc chủ nhật không
    // Sử dụng isHoliday từ props (lấy từ API) thay vì từ userData
    const isWeekendOrHoliday = (dateStr) => {
        if (!dateStr) return false;
        const date = dayjs(dateStr);
        const dayOfWeek = date.day(); // 0 = Sunday, 1-6 = Monday-Saturday
        // Kiểm tra nếu là ngày được chọn (startDate) thì dùng isHoliday từ props
        // Nếu là ngày khác trong vòng lặp, cần gọi API riêng (tạm thời dùng isHoliday từ props)
        return dayOfWeek === 0 || isHoliday; // Chủ nhật hoặc ngày nghỉ (từ API)
    };

    // Lấy min time cho startTime dựa trên ngày được chọn
    const getMinStartTime = (dateStr) => {
        if (isWeekendOrHoliday(dateStr)) {
            return null; // Không giới hạn cho ngày nghỉ/chủ nhật
        }
        return '17:00'; // Ngày thường: từ 17:00 trở đi
    };

    const formik = useFormik({
        initialValues: {
            title: getCurrentEmpName(), // Lấy EMP_NM từ userData
            cardNumber: getCurrentEmpId(),
            court: courts.length > 0 ? courts[0].value : '', // Mặc định Court 1
            description: '' // Mặc định rỗng
        },
        onSubmit: (values, { resetForm }) => {
            if (!values.title) {
                alert(t('pickleball_please_fill_all_fields'));
                return;
            }
            
            // Kiểm tra startTime cho ngày thường: phải >= 17:00
            if (!isWeekendOrHoliday(startDate)) {
                const minTime = dayjs(`2000-01-01T17:00`, 'YYYY-MM-DDTHH:mm');
                const selectedStartTime = dayjs(`2000-01-01T${startTime}`, 'YYYY-MM-DDTHH:mm');
                if (selectedStartTime.isBefore(minTime)) {
                    alert(t('pickleball_weekday_time_error'));
                    return;
                }
            }
            
            // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu (chỉ kiểm tra cho cùng một ngày)
            // Nếu startDate và endDate khác nhau, không cần kiểm tra này vì mỗi ngày sẽ được kiểm tra riêng trong vòng lặp
            if (startDate === endDate) {
                const startDay = dayjs(`${startDate}T${startTime}`, 'YYYY-MM-DDTHH:mm');
                const endDay = dayjs(`${endDate}T${endTime}`, 'YYYY-MM-DDTHH:mm');
                if (endDay.isBefore(startDay)) {
                    alert(t('pickleball_end_time_after_start_error'));
                    return;
                }

                // Kiểm tra thời gian kết thúc không quá 2 giờ sau thời gian bắt đầu và tối đa là 23:59 (chỉ cho cùng một ngày)
                // Cho phép bằng đúng 2 giờ (chỉ báo lỗi nếu lớn hơn 2 giờ)
                const maxEndTime = startDay.add(2, 'hour');
                const maxEndTime2359 = dayjs(`${startDate}T23:59`, 'YYYY-MM-DDTHH:mm');
                const actualMaxEnd = maxEndTime.isAfter(maxEndTime2359) ? maxEndTime2359 : maxEndTime;
                
                if (endDay.isAfter(actualMaxEnd)) {
                    alert(t('pickleball_max_duration_error') || 'Thời gian kết thúc không được vượt quá 2 giờ sau thời gian bắt đầu và tối đa là 23:59!');
                    return;
                }
            }

            // Debug: Log để kiểm tra
            console.log('=== Checking conflicts ===');
            console.log('New booking:', {
                startDate,
                endDate,
                startTime,
                endTime,
                court: values.court
            });
            console.log('Total existing events:', events.length);
            console.log('Existing events:', events.map(ev => ({
                id: ev.id,
                title: ev.title,
                start: ev.start ? dayjs(ev.start).format('YYYY-MM-DD HH:mm') : 'N/A',
                end: ev.end ? dayjs(ev.end).format('YYYY-MM-DD HH:mm') : 'N/A',
                court: ev.court
            })));

            // Tạo event cho từng ngày trong khoảng
            const eventsToAdd = [];
            let current = dayjs(startDate);
            const last = dayjs(endDate);
            let hasConflict = false;
            let conflictDate = null;
            while (current.isSameOrBefore(last, 'day')) {
                const eventStart = current.hour(Number(startTime.split(':')[0])).minute(Number(startTime.split(':')[1])).second(0).millisecond(0);
                const eventEnd = current.hour(Number(endTime.split(':')[0])).minute(Number(endTime.split(':')[1])).second(0).millisecond(0);

                // Kiểm tra startTime cho ngày thường: phải >= 17:00
                const currentDateStr = current.format('YYYY-MM-DD');
                if (!isWeekendOrHoliday(currentDateStr)) {
                    const minTime = current.hour(17).minute(0).second(0).millisecond(0);
                    if (eventStart.isBefore(minTime)) {
                        hasConflict = true;
                        conflictDate = current.format('DD/MM/YYYY');
                        alert(t('pickleball_weekday_time_error_with_date', { date: conflictDate }));
                        break;
                    }
                }

                // Kiểm tra thời gian kết thúc không quá 2 giờ sau thời gian bắt đầu và tối đa là 23:59
                // Cho phép bằng đúng 2 giờ (chỉ báo lỗi nếu lớn hơn 2 giờ)
                const maxEndTime = eventStart.add(2, 'hour');
                const maxEndTime2359 = current.hour(23).minute(59).second(0).millisecond(0);
                const actualMaxEnd = maxEndTime.isAfter(maxEndTime2359) ? maxEndTime2359 : maxEndTime;
                
                if (eventEnd.isAfter(actualMaxEnd)) {
                    hasConflict = true;
                    conflictDate = current.format('DD/MM/YYYY');
                    alert(t('pickleball_max_duration_error') || 'Thời gian kết thúc không được vượt quá 2 giờ sau thời gian bắt đầu và tối đa là 23:59!');
                    break;
                }

                // Kiểm tra trùng giờ - chỉ có 1 sân nên không cần kiểm tra court
                // Nếu khung giờ đó đã được booked trong ngày đó, thì không được book lại
                const conflict = events.some(ev => {
                    if (!ev || !ev.start || !ev.end) return false;

                    const evStart = dayjs(ev.start);
                    const evEnd = dayjs(ev.end);

                    // Kiểm tra cùng ngày
                    const isSameDay = evStart.isSame(current, 'day');
                    if (!isSameDay) return false;

                    // Kiểm tra overlap thời gian: khung giờ mới có overlap với khung giờ đã có
                    // Overlap xảy ra khi: (eventStart < evEnd) && (eventEnd > evStart)
                    // Tức là: eventStart phải trước evEnd VÀ eventEnd phải sau evStart
                    // Không overlap nếu: eventEnd <= evStart hoặc eventStart >= evEnd
                    const hasTimeOverlap = eventStart.isBefore(evEnd) && eventEnd.isAfter(evStart);

                    if (hasTimeOverlap) {
                        console.log('⚠️ Conflict detected:', {
                            day: current.format('YYYY-MM-DD'),
                            newEvent: {
                                start: eventStart.format('YYYY-MM-DD HH:mm'),
                                end: eventEnd.format('YYYY-MM-DD HH:mm')
                            },
                            existingEvent: {
                                id: ev.id,
                                title: ev.title,
                                start: evStart.format('YYYY-MM-DD HH:mm'),
                                end: evEnd.format('YYYY-MM-DD HH:mm')
                            }
                        });
                    }

                    return hasTimeOverlap;
                });

                if (conflict) {
                    hasConflict = true;
                    conflictDate = current.format('DD/MM/YYYY');
                    console.log('❌ Conflict found on:', conflictDate);
                    break;
                } else {
                    console.log('✅ No conflict on:', current.format('YYYY-MM-DD'));
                }
                eventsToAdd.push({
                    title: values.title,
                    cardNumber: values.cardNumber,
                    court: values.court,
                    start: eventStart.toDate(),
                    end: eventEnd.toDate(),
                    startTime: startTime, // Store original time string
                    endTime: endTime, // Store original time string
                    description: values.description,
                    bgColor: color
                });
                current = current.add(1, 'day');
            }
            if (hasConflict) {
                console.log('🚫 Booking blocked due to conflict');
                window.alert(`${t('pickleball_conflict_error')} ${conflictDate ? `(Ngày: ${conflictDate})` : ''}`);
                return;
            }

            console.log('✅ No conflicts found. Creating', eventsToAdd.length, 'event(s)');
            onSubmit(eventsToAdd);
            resetForm();
            setColor(colorSwatches[0]);
            setStartDate(initialStartDate);
            setEndDate(initialEndDate);
            setStartTime(initialStartTime);
            setEndTime(initialEndTime);
        }
    });

    // Tính toán endTime = startTime + 2 giờ, nhưng tối đa là 23:59
    // Nếu startTime từ 22:00 (10:00 PM) trở đi, endTime luôn là 23:59
    const calculateEndTime = (startTimeStr) => {
        if (!startTimeStr) return '19:00'; // Default fallback
        const [hours, minutes] = startTimeStr.split(':').map(Number);
        
        // Nếu startTime từ 22:00 (10:00 PM) trở đi, endTime luôn là 23:59
        if (hours >= 22) {
            return '23:59';
        }
        
        const endTimeObj = dayjs().hour(hours).minute(minutes).add(2, 'hour');
        let endHour = endTimeObj.hour();
        let endMinute = endTimeObj.minute();
        
        // Giới hạn tối đa là 23:59 để tránh tràn sang ngày hôm sau
        if (endHour >= 24 || (endHour === 23 && endMinute >= 59)) {
            endHour = 23;
            endMinute = 59;
        }
        
        return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    };

    // Tự động tính endTime mỗi khi startTime thay đổi - CHỈ khi người dùng chưa chỉnh thủ công
    React.useEffect(() => {
        if (startTime && startTime.trim() !== '' && !isEndTimeManual) {
            const calculatedEndTime = calculateEndTime(startTime);
            if (calculatedEndTime) {
                setEndTime(calculatedEndTime);
            }
        }
        // eslint-disable-next-line
    }, [startTime]);

    // Cập nhật thời gian khi startDate thay đổi
    React.useEffect(() => {
        if (isOpen && startDate) {
            const defaultStartTimeForDate = getDefaultStartTime(startDate);
            // Chỉ cập nhật nếu startTime chưa được set hoặc không khớp với logic ngày
            // Nếu người dùng đã chọn thủ công thì không override
            if (!initialStartTime) {
                setStartTime(defaultStartTimeForDate);
                // endTime sẽ tự động được tính trong useEffect trên
            }
        }
        // eslint-disable-next-line
    }, [startDate, isOpen]);

    React.useEffect(() => {
        if (isOpen) {
            // Khi dialog mở, startDate và endDate đều bằng ngày được chọn
            setStartDate(initialStartDate);
            setEndDate(initialStartDate); // Set endDate = startDate (ngày được chọn)

            // Tính toán startTime dựa trên ngày được chọn
            const defaultStartTimeForDate = getDefaultStartTime(initialStartDate);

            // Nếu có initialStartTime và nó hợp lệ (không phải 00:00 và >= defaultStartTime), dùng nó
            // Ngược lại, dùng defaultStartTime theo ngày
            let finalStartTime;
            if (initialStartTime && initialStartTime !== '00:00') {
                const defaultTime = dayjs(`2000-01-01T${defaultStartTimeForDate}`, 'YYYY-MM-DDTHH:mm');
                const initialTime = dayjs(`2000-01-01T${initialStartTime}`, 'YYYY-MM-DDTHH:mm');
                
                // Kiểm tra thêm: nếu là ngày thường và initialStartTime < 17:00, dùng defaultStartTime
                if (!isWeekendOrHoliday(initialStartDate)) {
                    const minTime = dayjs(`2000-01-01T17:00`, 'YYYY-MM-DDTHH:mm');
                    if (initialTime.isBefore(minTime)) {
                        finalStartTime = defaultStartTimeForDate;
                    } else if (initialTime.isSameOrAfter(defaultTime)) {
                        finalStartTime = initialStartTime;
                    } else {
                        finalStartTime = defaultStartTimeForDate;
                    }
                } else {
                    // Ngày nghỉ/chủ nhật: chỉ cần >= defaultStartTime
                    if (initialTime.isSameOrAfter(defaultTime)) {
                        finalStartTime = initialStartTime;
                    } else {
                        finalStartTime = defaultStartTimeForDate;
                    }
                }
            } else {
                finalStartTime = defaultStartTimeForDate;
            }

            setStartTime(finalStartTime);

            // Tính toán endTime
            let defaultEndTime;
            if (initialEndTime && initialEndTime !== '00:00') {
                const start = dayjs(`2000-01-01T${finalStartTime}`, 'YYYY-MM-DDTHH:mm');
                const end = dayjs(`2000-01-01T${initialEndTime}`, 'YYYY-MM-DDTHH:mm');
                const maxEnd = start.add(2, 'hour');
                // Nếu initialEndTime hợp lệ (<= 2 giờ và sau startTime), dùng nó
                // Cho phép bằng đúng 2 giờ (isSameOrBefore)
                if (end.isSameOrBefore(maxEnd) && (end.isAfter(start) || end.isSame(start))) {
                    defaultEndTime = initialEndTime;
                } else {
                    // Nếu không hợp lệ, tính toán từ startTime + 2 giờ
                    defaultEndTime = calculateEndTime(finalStartTime);
                }
            } else {
                // Không có initialEndTime, tính toán từ startTime + 2 giờ
                defaultEndTime = calculateEndTime(finalStartTime);
            }

            setEndTime(defaultEndTime);
            setColor(colorSwatches[0]);
            setIsEndTimeManual(false); // Reset flag khi dialog mở
            const currentEmpId = getCurrentEmpId();
            const currentEmpName = getCurrentEmpName();
            formik.resetForm({
                values: {
                    title: currentEmpName, // Lấy EMP_NM từ userData
                    cardNumber: currentEmpId,
                    court: courts.length > 0 ? courts[0].value : '', // Mặc định Court 1
                    description: '' // Mặc định rỗng
                }
            });
            if (courts.length > 0) {
                formik.setFieldValue('court', courts[0].value);
            }
        }
        // eslint-disable-next-line
    }, [isOpen, initialStartDate, initialEndDate, initialStartTime, initialEndTime, courts]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 pt-12 sm:pt-12"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-md sm:max-w-2xl max-h-[calc(100vh-4rem)] sm:max-h-[calc(90vh-6rem)] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <Card className="flex flex-col max-h-full overflow-hidden">
                            <CardHeader className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            <span className="truncate">{t('pickleball_add_booking')}</span>
                                        </CardTitle>
                                        {/* Hiển thị EMP_NM */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600 ml-6">
                                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            <span className="font-medium">{getCurrentEmpName()}</span>
                                        </div>
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
                            <form onSubmit={formik.handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <CardContent className="space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0 px-4 py-3 sm:px-6 sm:py-4">
                                    {/* Tạm ẩn Title */}
                                    {/* <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="title" className="flex items-center gap-2 text-sm sm:text-base">
                                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                            {t('pickleball_booking_title')}
                                        </Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formik.values.title}
                                            onChange={formik.handleChange}
                                            placeholder={t('pickleball_booking_title_placeholder')}
                                            className="text-sm sm:text-base h-9 sm:h-10"
                                        />
                                    </div> */}
                                    
                                    {/* Tạm ẩn Select Pickleball Court */}
                                    {/* <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="court" className="flex items-center gap-2 text-sm sm:text-base">
                                            <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                            {t('pickleball_court_select')}
                                        </Label>
                                        <Popover open={openCourt} onOpenChange={setOpenCourt}>
                                            <PopoverTrigger asChild>
                                                <div className="w-full">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-between h-9 sm:h-11 text-sm sm:text-base font-normal"
                                                        type="button"
                                                    >
                                                        {formik.values.court
                                                            ? courts.find(c => c.value === formik.values.court)?.label
                                                            : t('pickleball_court_placeholder')}
                                                    </Button>
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent align="start" side="bottom" sideOffset={4} alignOffset={0} className="w-[--radix-popover-trigger-width] p-0">
                                                <Command shouldFilter={false} className="max-h-[300px] overflow-y-auto">
                                                    <CommandInput
                                                        value={courtInput}
                                                        onValueChange={setCourtInput}
                                                        placeholder={t('search')}
                                                        className="h-11 px-4 text-base"
                                                    />
                                                    <CommandList className="text-base">
                                                        {filteredCourts.length > 0 ? (
                                                            filteredCourts.map(court => (
                                                                <CommandItem
                                                                    key={court.value}
                                                                    value={court.value}
                                                                    onSelect={() => {
                                                                        formik.setFieldValue('court', court.value);
                                                                        setCourtInput("");
                                                                        setOpenCourt(false);
                                                                    }}
                                                                    className="cursor-pointer py-2 px-4"
                                                                >
                                                                    {court.label}
                                                                </CommandItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-gray-500 text-sm">{t('no_results')}</div>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div> */}
                                    
                                    {/* Tạm ẩn Start Date và End Date */}
                                    {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="startDate" className="flex items-center gap-2 text-sm sm:text-base">
                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                {t('pickleball_start_date')}
                                            </Label>
                                            <DatePickerDay
                                                value={startDate}
                                                onChange={setStartDate}
                                                id="startDate"
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="endDate" className="flex items-center gap-2 text-sm sm:text-base">
                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                {t('pickleball_end_date')}
                                            </Label>
                                            <DatePickerDay
                                                value={endDate}
                                                onChange={setEndDate}
                                                id="endDate"
                                            />
                                        </div>
                                    </div> */}
                                    {/* Dòng 2: Giờ bắt đầu - Giờ kết thúc */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="startTime" className="flex items-center gap-2 text-sm sm:text-base">
                                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                <span className="text-xs sm:text-sm">{t('pickleball_start_time')}</span>
                                            </Label>
                                            <Input
                                                id="startTime"
                                                format="HH:mm"
                                                type="time"
                                                step="900"
                                                lang="en-GB"  // ép 24h
                                                value={startTime}
                                                onChange={e => handleStartTimeChange(e.target.value)}
                                                min={getMinStartTime(startDate)} // Giới hạn min time cho ngày thường (chỉ hiển thị, không validate)
                                                className="text-sm sm:text-base h-9 sm:h-10"
                                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="endTime" className="flex items-center gap-2 text-sm sm:text-base">
                                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                <span className="text-xs sm:text-sm">{t('pickleball_end_time')}</span>
                                            </Label>
                                            <Input
                                                id="endTime"
                                                format="HH:mm"
                                                type="time"
                                                step="900"
                                                lang="en-GB"  // ép 24h
                                                value={endTime}
                                                onChange={e => handleEndTimeChange(e.target.value)}
                                                max={getMaxEndTime()}
                                                className="text-sm sm:text-base h-9 sm:h-10"
                                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                            />
                                        </div>
                                    </div>
                                    {/* Tạm ẩn Select Color */}
                                    {/* <div className="mb-2 sm:mb-4">
                                        <Card className=''>
                                            <CardHeader className="px-3 py-2 sm:px-6 sm:py-4">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm sm:text-md">{t('pickleball_color_select')}</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-4 px-3 py-2 sm:px-6 sm:py-4">
                                                {colorSwatches.map((c, idx) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-100 ${color === c ? 'border-black scale-110 shadow-lg' : 'border-gray-300'}`}
                                                        style={{ background: c }}
                                                        onClick={() => setColor(c)}
                                                        aria-label={`${t('pickleball_select_color')} ${idx + 1}`}
                                                    >
                                                        {color === c && (
                                                            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                                                                <path d="M4 8.5l3 3 5-5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </div> */}
                                    
                                    {/* Tạm ẩn Description */}
                                    {/* <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="description" className="flex items-center gap-2 text-sm sm:text-base">
                                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                            {t('pickleball_description')}
                                        </Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formik.values.description}
                                            onChange={formik.handleChange}
                                            placeholder={t('pickleball_description_placeholder')}
                                            className="text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
                                        />
                                    </div> */}
                                </CardContent>
                                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 p-3 sm:p-6 pt-3 sm:pt-4 flex-shrink-0 border-t bg-background sticky bottom-0">
                                    <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10">{t('btn_cancel')}</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10">{t('pickleball_create_booking')}</Button>
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

