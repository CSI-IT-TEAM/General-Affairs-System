import React, { useState } from 'react';
import { useFormik } from 'formik';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select } from '../../../components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '../../../components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../../../components/ui/command';
import { Calendar as CalendarIcon, Clock, User, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { DatePickerDay } from '../../../components/ui/date-picker-day';
import { DatePicker } from 'rsuite';
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
    meetingRooms = [],
    isHoliday = false // Nhận thông tin ngày nghỉ từ props
}) => {
    const { t } = useTranslation();
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    // Khởi tạo với giá trị mặc định 07:30, không phụ thuộc vào initialStartTime
    const defaultStartTime = '07:30'; // Giá trị mặc định
    const defaultEndTime = '08:30'; // 07:30 + 1 giờ
    const [startTime, setStartTime] = useState(defaultStartTime);
    const [endTime, setEndTime] = useState(defaultEndTime);
    const [color, setColor] = useState(colorSwatches[0]);
    const [isEndTimeManual, setIsEndTimeManual] = useState(false); // Flag để theo dõi người dùng có chỉnh thủ công endTime không
    

    // Tính toán thời gian bắt đầu mặc định: 07:30
    const getDefaultStartTime = (dateStr) => {
        return '07:30'; // Default 07:30
    };
    
    // Danh sách giờ: từ 07 đến 16
    const availableHours = Array.from({ length: 10 }, (_, i) => i + 7); // [7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    
    // Danh sách phút: từ 00 đến 59
    const getAvailableMinutes = (hour) => {
        const allMinutes = Array.from({ length: 60 }, (_, i) => i); // [0, 1, 2, ..., 59]
        
        // Nếu chọn 16 giờ thì chỉ cho phép phút từ 00 đến 30
        if (hour === 16) {
            return allMinutes.filter(m => m <= 30); // [0, 1, 2, ..., 30]
        }
        
        return allMinutes; // [0, 1, 2, ..., 59]
    };

    // Tính toán max time cho endTime (startTime + 2 giờ)
    // Giới hạn: không vượt quá 16:30
    const getMaxEndTime = () => {
        if (!startTime) return '16:30';
        const { hour, minute } = parseTime(startTime);
        if (hour === null || minute === null) return '16:30';
        
        const start = dayjs(`2000-01-01T${startTime}`, 'YYYY-MM-DDTHH:mm');
        const maxEnd = start.add(2, 'hour');
        
        // Giới hạn tối đa là 16:30
        const maxTime1630 = dayjs(`2000-01-01T16:30`, 'YYYY-MM-DDTHH:mm');
        const actualMaxEnd = maxEnd.isAfter(maxTime1630) ? maxTime1630 : maxEnd;
        
        return actualMaxEnd.format('HH:mm');
    };

    // Xử lý khi startTime thay đổi - tự động tính endTime = startTime + 1 giờ (chỉ khi người dùng chưa chỉnh thủ công)
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

    // Xử lý khi endTime thay đổi thủ công - kiểm tra không vượt quá 16:30 và phải sau startTime
    const handleEndTimeChange = (newEndTime) => {
        setIsEndTimeManual(true); // Đánh dấu người dùng đã chỉnh thủ công

        if (!startTime || !newEndTime) {
            setEndTime(newEndTime);
            return;
        }

        const { hour: endHour, minute: endMinute } = parseTime(newEndTime);
        
        // Kiểm tra nếu endTime vượt quá 16:30
        if (endHour > 16 || (endHour === 16 && endMinute > 30)) {
            setEndTime('16:30');
            alert(t('meeting_room_max_duration_error') || 'Thời gian kết thúc không được vượt quá 16:30!');
            return;
        }
        
        // Kiểm tra endTime phải sau startTime
        const start = dayjs(`2000-01-01T${startTime}`, 'YYYY-MM-DDTHH:mm');
        const end = dayjs(`2000-01-01T${newEndTime}`, 'YYYY-MM-DDTHH:mm');
        const maxTime1630 = dayjs(`2000-01-01T16:30`, 'YYYY-MM-DDTHH:mm');
        
        if (end.isBefore(start) || end.isSame(start)) {
            // EndTime phải sau startTime, nếu không thì set = startTime + 1 giờ
            const defaultEnd = start.add(1, 'hour');
            const finalEnd = defaultEnd.isAfter(maxTime1630) ? maxTime1630 : defaultEnd;
            setEndTime(finalEnd.format('HH:mm'));
            alert(t('meeting_room_end_time_error') || 'Thời gian kết thúc phải sau thời gian bắt đầu!');
            return;
        }

        // Không giới hạn thời lượng, chỉ giới hạn tối đa 16:30
        if (end.isAfter(maxTime1630)) {
            setEndTime('16:30');
            alert(t('meeting_room_max_duration_error') || 'Thời gian kết thúc không được vượt quá 16:30!');
        } else {
            setEndTime(newEndTime);
        }
    };

    // Combobox phòng họp có filter thực tế
    const [meetingRoomInput, setMeetingRoomInput] = useState("");
    const [openMeetingRoom, setOpenMeetingRoom] = useState(false);
    const filteredMeetingRooms = meetingRooms.filter(meetingRoom =>
        meetingRoom.label.toLowerCase().includes(meetingRoomInput.toLowerCase())
    );

    // Lấy giờ hiện tại từ startTime/endTime (format HH:MM)
    const getHourFromTime = (timeStr) => {
        if (!timeStr) return '';
        const [hour] = timeStr.split(':');
        return hour || '';
    };

    // Parse giờ và phút từ time string
    const parseTime = (timeStr) => {
        if (!timeStr) return { hour: null, minute: null };
        const [hour, minute] = timeStr.split(':').map(Number);
        return { hour, minute };
    };
    
    // Tạo time string từ giờ và phút
    const createTimeString = (hour, minute) => {
        if (hour === null || hour === undefined || minute === null || minute === undefined) return '';
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };
    
    // Chuyển time string (HH:mm) thành Date object cho rsuite DatePicker
    const getTimeAsDate = (timeStr) => {
        if (!timeStr) return null;
        try {
            const [hour, minute] = timeStr.split(':').map(Number);
            const date = new Date();
            date.setHours(hour || 0, minute || 0, 0, 0);
            return date;
        } catch {
            return null;
        }
    };

    // Chuyển Date object từ rsuite DatePicker về time string (HH:mm)
    const getDateAsTime = (date) => {
        if (!date) return '';
        try {
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            return `${hour}:${minute}`;
        } catch {
            return '';
        }
    };

    // Xử lý khi startTime thay đổi từ rsuite DatePicker
    const handleStartTimePickerChange = (date) => {
        const timeStr = getDateAsTime(date);
        if (timeStr) {
            handleStartTimeChange(timeStr);
        }
    };

    // Xử lý khi endTime thay đổi từ rsuite DatePicker
    const handleEndTimePickerChange = (date) => {
        const timeStr = getDateAsTime(date);
        if (timeStr) {
            handleEndTimeChange(timeStr);
        }
    };

    // Lấy các event đã book cho meetingRoom đã chọn trong khoảng từ startDate đến endDate
    const getBookedEventsForRoom = () => {
        if (!formik.values.meetingRoom || !startDate || !endDate || !events || events.length === 0) {
            return [];
        }

        const start = dayjs(startDate);
        const end = dayjs(endDate);

        return events.filter(event => {
            if (!event || !event.start || !event.end || event.meetingRoom !== formik.values.meetingRoom) {
                return false;
            }

            const eventStart = dayjs(event.start);
            const eventEnd = dayjs(event.end);

            // Kiểm tra xem event có nằm trong khoảng startDate-endDate không
            return (eventStart.isSameOrAfter(start, 'day') && eventStart.isSameOrBefore(end, 'day')) ||
                   (eventEnd.isSameOrAfter(start, 'day') && eventEnd.isSameOrBefore(end, 'day')) ||
                   (eventStart.isBefore(start, 'day') && eventEnd.isAfter(end, 'day'));
        });
    };

    // Kiểm tra xem một khung giờ có overlap với event đã book không
    // Điều kiện kiểm tra: Meeting Room + Ngày + Giờ (overlap)
    // getBookedEventsForRoom() đã lọc theo Meeting Room rồi, nên chỉ cần kiểm tra Ngày + Giờ
    const isTimeRangeBookedForRoom = (dateStr, startTimeStr, endTimeStr) => {
        const bookedEvents = getBookedEventsForRoom(); // Đã lọc theo Meeting Room
        if (bookedEvents.length === 0) return false;

        const testStart = dayjs(`${dateStr}T${startTimeStr}`, 'YYYY-MM-DDTHH:mm');
        const testEnd = dayjs(`${dateStr}T${endTimeStr}`, 'YYYY-MM-DDTHH:mm');

        return bookedEvents.some(event => {
            if (!event || !event.start || !event.end) return false;

            const eventStart = dayjs(event.start);
            const eventEnd = dayjs(event.end);

            // Điều kiện 1: Kiểm tra cùng ngày (đã được lọc từ getBookedEventsForRoom nên meetingRoom đã đúng)
            if (!eventStart.isSame(testStart, 'day')) {
                return false;
            }

            // Điều kiện 2: Kiểm tra overlap thời gian
            // Overlap xảy ra khi hai khoảng thời gian có phần chung
            // Overlap khi: start < eventEnd && end > eventStart (bao gồm cả trường hợp chạm nhau)
            // Sử dụng isSameOrBefore và isSameOrAfter để bao gồm trường hợp chạm nhau
            return testStart.isBefore(eventEnd) && testEnd.isAfter(eventStart);
        });
    };

    // Tìm giờ khả dụng gần nhất từ 07:30 đến 16:30
    const findNextAvailableStartTime = (meetingRoomValue, startDateValue, endDateValue) => {
        // Nếu chưa có meetingRoom hoặc startDate, trả về mặc định 07:30
        if (!meetingRoomValue || !startDateValue) {
            return '07:30';
        }

        // Bắt đầu từ 07:30, kiểm tra từng phút (chỉ kiểm tra phút 00 và 30 để tối ưu)
        for (let hour = 7; hour <= 16; hour++) {
            // Giờ 7 chỉ từ phút 30 trở đi, giờ 16 chỉ đến phút 30
            const minMinute = hour === 7 ? 30 : 0;
            const maxMinute = hour === 16 ? 30 : 59;
            const minutesToCheck = hour === 7 ? [30] : (hour === 16 ? [0, 30] : [0, 30]);
            
            for (const minute of minutesToCheck) {
                if (minute < minMinute || minute > maxMinute) continue;
                
                const testStartTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                
                // Kiểm tra từng ngày trong khoảng startDate-endDate
                const start = dayjs(startDateValue);
                const end = dayjs(endDateValue || startDateValue);
                let isAvailable = true;
                let current = start;

                while (current.isSameOrBefore(end, 'day') && isAvailable) {
                    const dateStr = current.format('YYYY-MM-DD');
                    
                    // Tính endTime mặc định: startTime + 1 giờ, tối đa 16:30
                    const testStart = dayjs(`${dateStr}T${testStartTime}`, 'YYYY-MM-DDTHH:mm');
                    const testEnd = testStart.add(1, 'hour');
                    const maxTime = dayjs(`${dateStr}T16:30`, 'YYYY-MM-DDTHH:mm');
                    const testEndTime = testEnd.isAfter(maxTime) ? '16:30' : testEnd.format('HH:mm');

                    // Lấy booked events cho meetingRoom này
                    const bookedEvents = events.filter(event => {
                        if (!event || !event.start || !event.end || event.meetingRoom !== meetingRoomValue) {
                            return false;
                        }
                        const eventStart = dayjs(event.start);
                        const eventEnd = dayjs(event.end);
                        return (eventStart.isSameOrAfter(start, 'day') && eventStart.isSameOrBefore(end, 'day')) ||
                               (eventEnd.isSameOrAfter(start, 'day') && eventEnd.isSameOrBefore(end, 'day')) ||
                               (eventStart.isBefore(start, 'day') && eventEnd.isAfter(end, 'day'));
                    });

                    const testStartDate = dayjs(`${dateStr}T${testStartTime}`, 'YYYY-MM-DDTHH:mm');
                    const testEndDate = dayjs(`${dateStr}T${testEndTime}`, 'YYYY-MM-DDTHH:mm');

                    const hasOverlap = bookedEvents.some(event => {
                        if (!event || !event.start || !event.end) return false;

                        const eventStart = dayjs(event.start);
                        const eventEnd = dayjs(event.end);

                        if (!eventStart.isSame(testStartDate, 'day')) return false;

                        return testStartDate.isBefore(eventEnd) && testEndDate.isAfter(eventStart);
                    });

                    if (hasOverlap) {
                        isAvailable = false;
                    }

                    current = current.add(1, 'day');
                }

                if (isAvailable) {
                    return testStartTime;
                }
            }
        }

        // Nếu không tìm thấy giờ khả dụng, trả về mặc định 07:30
        return '07:30';
    };

    // Kiểm tra xem một phút cụ thể có bị disable không (helper function)
    const isMinuteDisabledForStartTime = (hour, minute) => {
        // Nếu giờ là 7, chỉ cho phép phút từ 30-59 (07:30 trở đi)
        if (hour === 7 && minute < 30) {
            return true;
        }
        
        // Nếu giờ là 16, chỉ cho phép phút từ 0-30 (đến 16:30)
        if (hour === 16 && minute > 30) {
            return true;
        }

        // Kiểm tra nếu meetingRoom đã được chọn và có event đã book
        if (!formik.values.meetingRoom || !startDate) {
            return false;
        }

        const testStartTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        // Kiểm tra từng ngày trong khoảng startDate-endDate
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        let current = start;

        // KIỂM TRA QUAN TRỌNG: Nếu BẤT KỲ ngày nào trong khoảng startDate-endDate bị book
        // thì thời gian đó phải bị disable
        while (current.isSameOrBefore(end, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');
            
            // Tính endTime để kiểm tra overlap
            let testEndTime;
            if (endTime) {
                const endTimeDate = dayjs(`${dateStr}T${endTime}`, 'YYYY-MM-DDTHH:mm');
                const testStartTimeDate = dayjs(`${dateStr}T${testStartTime}`, 'YYYY-MM-DDTHH:mm');
                
                if (endTimeDate.isAfter(testStartTimeDate)) {
                    testEndTime = endTime;
                } else {
                    const testStart = dayjs(`${dateStr}T${testStartTime}`, 'YYYY-MM-DDTHH:mm');
                    const testEnd = testStart.add(1, 'hour');
                    const maxTime = dayjs(`${dateStr}T16:30`, 'YYYY-MM-DDTHH:mm');
                    testEndTime = testEnd.isAfter(maxTime) ? '16:30' : testEnd.format('HH:mm');
                }
            } else {
                const testStart = dayjs(`${dateStr}T${testStartTime}`, 'YYYY-MM-DDTHH:mm');
                const testEnd = testStart.add(1, 'hour');
                const maxTime = dayjs(`${dateStr}T16:30`, 'YYYY-MM-DDTHH:mm');
                testEndTime = testEnd.isAfter(maxTime) ? '16:30' : testEnd.format('HH:mm');
            }

            // Lấy các event đã book cho meetingRoom này (không chỉ trong khoảng startDate-endDate)
            const bookedEvents = events.filter(event => {
                if (!event || !event.start || !event.end) return false;
                // Điều kiện 1: Meeting Room phải giống nhau
                const evMeetingRoom = String(event.meetingRoom || '').trim();
                const newMeetingRoom = String(formik.values.meetingRoom || '').trim();
                return evMeetingRoom.toLowerCase() === newMeetingRoom.toLowerCase();
            });

            const testStart = dayjs(`${dateStr}T${testStartTime}`, 'YYYY-MM-DDTHH:mm');
            const testEnd = dayjs(`${dateStr}T${testEndTime}`, 'YYYY-MM-DDTHH:mm');

            // Kiểm tra overlap với các event đã book trong ngày này
            const hasOverlap = bookedEvents.some(event => {
                if (!event || !event.start || !event.end) return false;

                const eventStart = dayjs(event.start);
                const eventEnd = dayjs(event.end);

                // Điều kiện 2: Kiểm tra cùng ngày
                if (!eventStart.isSame(testStart, 'day')) {
                    return false;
                }

                // Điều kiện 3: Kiểm tra overlap thời gian
                return testStart.isBefore(eventEnd) && testEnd.isAfter(eventStart);
            });

            // Nếu BẤT KỲ ngày nào trong khoảng bị overlap, disable thời gian này
            if (hasOverlap) {
                return true;
            }

            current = current.add(1, 'day');
        }

        return false;
    };

    // Disable các giờ không hợp lệ (ngoài 7-16) và các giờ mà tất cả phút đều bị disable
    const shouldDisableHourForStartTime = (hour) => {
        // Disable giờ ngoài phạm vi 7-16
        if (hour < 7 || hour > 16) {
            return true;
        }

        // Kiểm tra nếu meetingRoom đã được chọn và có event đã book
        if (!formik.values.meetingRoom || !startDate) {
            return false;
        }

        // Kiểm tra xem có ít nhất một phút nào trong giờ này có thể dùng được không
        // Nếu tất cả các phút đều bị disable, thì disable luôn giờ này
        const minMinute = hour === 7 ? 30 : 0; // Giờ 7 chỉ từ phút 30 trở đi
        const maxMinute = hour === 16 ? 30 : 59; // Giờ 16 chỉ đến phút 30
        let hasAvailableMinute = false;

        for (let minute = minMinute; minute <= maxMinute; minute++) {
            if (!isMinuteDisabledForStartTime(hour, minute)) {
                hasAvailableMinute = true;
                break;
            }
        }

        // Nếu không có phút nào khả dụng, disable luôn giờ này
        return !hasAvailableMinute;
    };

    const shouldDisableHourForEndTime = (hour) => {
        // Disable giờ ngoài phạm vi 7-16
        if (hour < 7 || hour > 16) {
            return true;
        }

        // Nếu chưa có startTime, không disable (trừ khi là giờ 7 với phút < 30 hoặc giờ 16 với phút > 30)
        if (!startTime || !formik.values.meetingRoom || !startDate) {
            // Nếu giờ 7, kiểm tra xem có phút nào khả dụng không (phải >= 30)
            if (hour === 7) {
                // Giờ 7 chỉ có phút 30-59, nhưng chưa có startTime để kiểm tra, nên không disable
                return false;
            }
            return false;
        }

        // Kiểm tra từng ngày trong khoảng startDate-endDate
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        let current = start;

        while (current.isSameOrBefore(end, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');
            
            // Kiểm tra các phút khả dụng trong giờ này
            const minMinute = hour === 7 ? 30 : 0; // Giờ 7 chỉ từ phút 30
            const maxMinute = hour === 16 ? 30 : 59; // Giờ 16 chỉ đến phút 30
            
            let hasAvailableMinute = false;
            
            // Kiểm tra các phút 00 và 30 (hoặc các phút hợp lệ cho giờ 7 và 16)
            const minutesToCheck = hour === 7 ? [30] : (hour === 16 ? [0, 30] : [0, 30]);
            
            for (const minute of minutesToCheck) {
                if (minute < minMinute || minute > maxMinute) continue;
                
                const testEndTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                
                if (!isTimeRangeBookedForRoom(dateStr, startTime, testEndTime)) {
                    hasAvailableMinute = true;
                    break;
                }
            }
            
            // Nếu không có phút nào khả dụng trong ngày này, tiếp tục kiểm tra ngày khác
            if (!hasAvailableMinute) {
                current = current.add(1, 'day');
                continue;
            }
            
            // Nếu có phút khả dụng trong ít nhất một ngày, không disable giờ này
            return false;
        }

        // Nếu tất cả các phút trong giờ này đều bị disable cho tất cả các ngày, disable giờ này
        return true;
    };

    // Disable các phút không hợp lệ cho giờ 16 (chỉ cho phép 0-30) và các phút đã bị book - cho startTime
    const shouldDisableMinuteForStartTime = (minute, date) => {
        if (!date) return false;
        const currentHour = date.getHours();
        return isMinuteDisabledForStartTime(currentHour, minute);
    };

    // Disable các phút không hợp lệ cho giờ 7 (chỉ từ 30 trở đi) và giờ 16 (chỉ đến 30) và các phút đã bị book - cho endTime
    const shouldDisableMinuteForEndTime = (minute, date) => {
        if (!date) return false;

        const currentHour = date.getHours();
        
        // Nếu giờ là 7, chỉ cho phép phút từ 30-59 (07:30 trở đi)
        if (currentHour === 7 && minute < 30) {
            return true;
        }
        
        // Nếu giờ là 16, chỉ cho phép phút từ 0-30 (đến 16:30)
        if (currentHour === 16 && minute > 30) {
            return true;
        }

        // Nếu chưa có startTime, không disable
        if (!startTime || !formik.values.meetingRoom || !startDate) {
            return false;
        }

        // Kiểm tra từng ngày trong khoảng startDate-endDate
        // Nếu BẤT KỲ ngày nào trong khoảng bị book thì disable thời gian này
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        let current = start;

        while (current.isSameOrBefore(end, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');
            const testEndTime = `${String(currentHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

            // Nếu ngày này bị book, disable thời gian này
            if (isTimeRangeBookedForRoom(dateStr, startTime, testEndTime)) {
                return true;
            }

            current = current.add(1, 'day');
        }

        return false;
    };

    // Thêm CSS để giảm chiều cao popover DatePicker và ẩn các phần tử disabled
    React.useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .rs-picker-popup.rs-picker-popup-time {
                max-height: 300px !important;
                overflow-y: auto !important;
            }
            .rs-picker-popup-time .rs-calendar-time-dropdown {
                max-height: 250px !important;
            }
            .rs-picker-popup-time .rs-calendar-time-dropdown-row {
                padding: 4px 8px !important;
            }
            .rs-picker-popup-time .rs-calendar-time-dropdown-cell {
                padding: 2px 4px !important;
                font-size: 13px !important;
            }
            .rs-picker-popup-time .rs-calendar-time-dropdown-cell-content {
                padding: 4px 8px !important;
            }
            /* Ẩn các phần tử disabled thay vì chỉ làm mờ */
            .rs-picker-popup-time .rs-calendar-time-dropdown-cell-disabled,
            .rs-picker-popup-time .rs-calendar-time-dropdown-cell[aria-disabled="true"],
            .rs-picker-popup-time .rs-calendar-time-dropdown-cell.rs-calendar-time-dropdown-cell-disabled {
                display: none !important;
            }
            /* Ẩn các giờ disabled */
            .rs-picker-popup-time .rs-calendar-time-dropdown-row:has(.rs-calendar-time-dropdown-cell-disabled) {
                /* Giữ lại row nhưng ẩn cell disabled */
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Kiểm tra xem một khung giờ (startTime, endTime) có bị book không
    const isTimeRangeBooked = (dateStr, startTimeStr, endTimeStr) => {
        if (!dateStr || !startTimeStr || !endTimeStr || !events || events.length === 0) return false;
        
        const start = dayjs(`${dateStr}T${startTimeStr}`, 'YYYY-MM-DDTHH:mm');
        const end = dayjs(`${dateStr}T${endTimeStr}`, 'YYYY-MM-DDTHH:mm');
        
        // Kiểm tra xem có event nào overlap với khung giờ này không
        return events.some(event => {
            if (!event || !event.start || !event.end) return false;
            
            const eventStart = dayjs(event.start);
            const eventEnd = dayjs(event.end);
            
            // Kiểm tra cùng ngày
            if (!eventStart.isSame(dayjs(dateStr), 'day')) return false;
            
            // Kiểm tra overlap: (start < eventEnd) && (end > eventStart)
            return start.isBefore(eventEnd) && end.isAfter(eventStart);
        });
    };

    // Format time để hiển thị
    const formatTimeDisplay = (timeStr) => {
        if (!timeStr) return '--:--';
        const [hours, minutes] = timeStr.split(':');
        return `${String(hours).padStart(2, '0')}:${String(minutes || '00').padStart(2, '0')}`;
    };

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


    const formik = useFormik({
        initialValues: {
            title: getCurrentEmpName(), // Lấy EMP_NM từ userData
            cardNumber: getCurrentEmpId(),
            meetingRoom: meetingRooms.length > 0 ? meetingRooms[0].value : '', // Mặc định Meeting Room 1
            description: '' // Mặc định rỗng
        },
        onSubmit: (values, { resetForm }) => {
            if (!values.title) {
                alert(t('meeting_room_please_fill_all_fields'));
                return;
            }
            
            // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu (chỉ kiểm tra cho cùng một ngày)
            // Nếu startDate và endDate khác nhau, không cần kiểm tra này vì mỗi ngày sẽ được kiểm tra riêng trong vòng lặp
            if (startDate === endDate) {
                const startDay = dayjs(`${startDate}T${startTime}`, 'YYYY-MM-DDTHH:mm');
                const endDay = dayjs(`${endDate}T${endTime}`, 'YYYY-MM-DDTHH:mm');
                if (endDay.isBefore(startDay) || endDay.isSame(startDay)) {
                    alert(t('meeting_room_end_time_after_start_error'));
                    return;
                }

                // Kiểm tra thời gian kết thúc không vượt quá 16:30 (chỉ cho cùng một ngày)
                const maxTime1630 = dayjs(`${startDate}T16:30`, 'YYYY-MM-DDTHH:mm');
                
                if (endDay.isAfter(maxTime1630)) {
                    alert(t('meeting_room_max_duration_error') || 'Thời gian kết thúc không được vượt quá 16:30!');
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
                meetingRoom: values.meetingRoom
            });
            console.log('Total existing events:', events.length);
            console.log('Existing events:', events.map(ev => ({
                id: ev.id,
                title: ev.title,
                start: ev.start ? dayjs(ev.start).format('YYYY-MM-DD HH:mm') : 'N/A',
                end: ev.end ? dayjs(ev.end).format('YYYY-MM-DD HH:mm') : 'N/A',
                meetingRoom: ev.meetingRoom
            })));

            // Tạo event cho từng ngày trong khoảng Start Date - End Date
            // Kiểm tra trùng lịch cho TẤT CẢ các ngày trong khoảng này
            // Điều kiện kiểm tra: Meeting Room + Ngày + Giờ (overlap)
            const eventsToAdd = [];
            let current = dayjs(startDate);
            const last = dayjs(endDate);
            let hasConflict = false;
            let conflictDate = null;
            while (current.isSameOrBefore(last, 'day')) {
                // Parse giờ và phút từ startTime và endTime
                const { hour: startHour, minute: startMinute } = parseTime(startTime);
                const { hour: endHour, minute: endMinute } = parseTime(endTime);
                const eventStart = current.hour(startHour).minute(startMinute).second(0).millisecond(0);
                const eventEnd = current.hour(endHour).minute(endMinute).second(0).millisecond(0);
                
                // Debug log để kiểm tra
                console.log(`🔍 Checking day ${current.format('YYYY-MM-DD')}:`, {
                    eventStart: eventStart.format('YYYY-MM-DD HH:mm:ss'),
                    eventEnd: eventEnd.format('YYYY-MM-DD HH:mm:ss'),
                    meetingRoom: values.meetingRoom
                });

                // Kiểm tra thời gian kết thúc không vượt quá 16:30
                const maxTime1630 = current.hour(16).minute(30).second(0).millisecond(0);
                
                if (eventEnd.isAfter(maxTime1630)) {
                    hasConflict = true;
                    conflictDate = current.format('DD/MM/YYYY');
                    alert(t('meeting_room_max_duration_error') || 'Thời gian kết thúc không được vượt quá 16:30!');
                    break;
                }

                // Kiểm tra trùng lịch: Meeting Room + Ngày + Giờ (overlap)
                // Phải đảm bảo không có overlap với booking đã có cho:
                // - Cùng Meeting Room
                // - Cùng Ngày (ngày đang kiểm tra trong vòng lặp)
                // - Cùng khung giờ (overlap thời gian)
                const conflict = events.some(ev => {
                    // Điều kiện 1: Kiểm tra Meeting Room phải giống nhau (case-insensitive, trimmed)
                    if (!ev || !ev.start || !ev.end) {
                        return false;
                    }
                    
                    // So sánh meetingRoom (case-insensitive và trimmed để tránh vấn đề về format)
                    const evMeetingRoom = String(ev.meetingRoom || '').trim();
                    const newMeetingRoom = String(values.meetingRoom || '').trim();
                    
                    if (evMeetingRoom.toLowerCase() !== newMeetingRoom.toLowerCase()) {
                        return false;
                    }

                    const evStart = dayjs(ev.start);
                    const evEnd = dayjs(ev.end);
                    
                    // Điều kiện 2: Kiểm tra cùng ngày - event cũ phải cùng ngày với ngày đang kiểm tra
                    if (!evStart.isSame(eventStart, 'day')) {
                        return false;
                    }
                    
                    // Debug log để kiểm tra thời gian
                    console.log('🔍 Comparing times:', {
                        day: current.format('YYYY-MM-DD'),
                        newEvent: `${eventStart.format('HH:mm')}-${eventEnd.format('HH:mm')}`,
                        existingEvent: `${evStart.format('HH:mm')}-${evEnd.format('HH:mm')}`,
                        'eventStart < evEnd': eventStart.isBefore(evEnd),
                        'eventEnd > evStart': eventEnd.isAfter(evStart)
                    });
                    
                    // Điều kiện 3: Kiểm tra overlap thời gian
                    // Overlap xảy ra khi hai khoảng thời gian có phần chung
                    // Công thức chuẩn: !(eventEnd <= evStart || eventStart >= evEnd)
                    // Tương đương: eventStart < evEnd && eventEnd > evStart
                    // 
                    // Test case 1: Trùng hoàn toàn
                    // Event mới: 08:30-09:30, Event cũ: 08:30-09:30
                    // eventStart.isBefore(evEnd): 08:30 < 09:30 → true
                    // eventEnd.isAfter(evStart): 09:30 > 08:30 → true
                    // Kết quả: true && true = true ✓ (phải phát hiện được)
                    const hasTimeOverlap = eventStart.isBefore(evEnd) && eventEnd.isAfter(evStart);
                    
                    if (hasTimeOverlap) {
                        console.log('⚠️ Conflict detected:', {
                            day: current.format('YYYY-MM-DD'),
                            meetingRoom: values.meetingRoom,
                            newEvent: {
                                start: eventStart.format('YYYY-MM-DD HH:mm'),
                                end: eventEnd.format('YYYY-MM-DD HH:mm')
                            },
                            existingEvent: {
                                id: ev.id,
                                title: ev.title,
                                meetingRoom: ev.meetingRoom,
                                start: evStart.format('YYYY-MM-DD HH:mm'),
                                end: evEnd.format('YYYY-MM-DD HH:mm')
                            },
                            overlapCheck: {
                                'eventStart < evEnd': eventStart.isBefore(evEnd),
                                'eventEnd > evStart': eventEnd.isAfter(evStart),
                                'result': hasTimeOverlap
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
                    meetingRoom: values.meetingRoom,
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
                window.alert(`${t('meeting_room_conflict_error')} ${conflictDate ? `(Ngày: ${conflictDate})` : ''}`);
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

    // Tính toán endTime = startTime + 1 giờ, nhưng tối đa là 16:30
    const calculateEndTime = (startTimeStr) => {
        if (!startTimeStr) return '08:30'; // Default fallback
        const start = dayjs(`2000-01-01T${startTimeStr}`, 'YYYY-MM-DDTHH:mm');
        const maxEnd = start.add(1, 'hour');
        
        // Giới hạn tối đa là 16:30
        const maxTime1630 = dayjs(`2000-01-01T16:30`, 'YYYY-MM-DDTHH:mm');
        const actualMaxEnd = maxEnd.isAfter(maxTime1630) ? maxTime1630 : maxEnd;
        
        return actualMaxEnd.format('HH:mm');
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

    // Đảm bảo endDate không nhỏ hơn startDate
    React.useEffect(() => {
        if (startDate && endDate) {
            const start = dayjs(startDate);
            const end = dayjs(endDate);
            if (end.isBefore(start, 'day')) {
                // Nếu endDate nhỏ hơn startDate, tự động set endDate = startDate
                setEndDate(startDate);
            }
        }
        // eslint-disable-next-line
    }, [startDate, endDate]);

    // Ref để theo dõi date range trước đó để phát hiện sự thay đổi
    const prevDateRangeRef = React.useRef({ startDate: null, endDate: null });

    // Cập nhật startTime mặc định khi startDate hoặc endDate thay đổi
    // Tìm giờ khả dụng gần nhất cho khoảng ngày mới
    React.useEffect(() => {
        if (isOpen && startDate && endDate && formik.values.meetingRoom) {
            // Kiểm tra nếu đây là lần đầu khởi tạo (ref chưa có giá trị)
            const isInitialized = prevDateRangeRef.current.startDate !== null && 
                                  prevDateRangeRef.current.endDate !== null;
            
            // Nếu đã khởi tạo, kiểm tra xem date range có thay đổi không
            if (isInitialized) {
                const hasStartDateChanged = prevDateRangeRef.current.startDate !== startDate;
                const hasEndDateChanged = prevDateRangeRef.current.endDate !== endDate;
                const hasDateRangeChanged = hasStartDateChanged || hasEndDateChanged;
                
                // Nếu date range đã thay đổi, tính lại startTime
                if (hasDateRangeChanged) {
                    // Tìm giờ khả dụng gần nhất cho khoảng ngày mới
                    const availableStartTime = findNextAvailableStartTime(
                        formik.values.meetingRoom,
                        startDate,
                        endDate
                    );
                    const calculatedEndTime = calculateEndTime(availableStartTime);
                    
                    setStartTime(availableStartTime);
                    setEndTime(calculatedEndTime);
                    setIsEndTimeManual(false); // Reset flag khi date range thay đổi
                    
                    console.log('🔄 Date range changed, updating startTime:', {
                        startDate,
                        endDate,
                        availableStartTime,
                        hasStartDateChanged,
                        hasEndDateChanged,
                        prevDateRange: prevDateRangeRef.current
                    });
                }
            }
            
            // Cập nhật ref sau khi đã xử lý (luôn cập nhật để theo dõi giá trị hiện tại)
            // Lưu ý: Cập nhật ref ngay cả khi chưa tính lại startTime (để đảm bảo ref luôn đồng bộ)
            prevDateRangeRef.current = {
                startDate: startDate,
                endDate: endDate
            };
        }
        // eslint-disable-next-line
    }, [startDate, endDate, formik.values.meetingRoom, isOpen]);

    React.useEffect(() => {
        if (isOpen) {
            // Reset ref khi dialog mở
            prevMeetingRoomRef.current = null;
            prevDateRangeRef.current = { startDate: null, endDate: null };
            
            // Khi dialog mở, startDate và endDate đều bằng ngày được chọn
            setStartDate(initialStartDate);
            setEndDate(initialStartDate); // Set endDate = startDate (ngày được chọn)
            
            setColor(colorSwatches[0]);
            setIsEndTimeManual(false); // Reset flag khi dialog mở
            const currentEmpId = getCurrentEmpId();
            const currentEmpName = getCurrentEmpName();
            
            // Set meetingRoom trước để có thể tìm giờ khả dụng
            const defaultMeetingRoom = meetingRooms.length > 0 ? meetingRooms[0].value : '';
            formik.resetForm({
                values: {
                    title: currentEmpName, // Lấy EMP_NM từ userData
                    cardNumber: currentEmpId,
                    meetingRoom: defaultMeetingRoom, // Mặc định Meeting Room 1
                    description: '' // Mặc định rỗng
                }
            });
            
            // Sau khi set meetingRoom, tìm giờ khả dụng gần nhất
            // Sử dụng setTimeout để đảm bảo formik đã được cập nhật
            setTimeout(() => {
                const availableStartTime = findNextAvailableStartTime(
                    defaultMeetingRoom,
                    initialStartDate,
                    initialStartDate
                );
                const finalEndTime = calculateEndTime(availableStartTime);
                
                setStartTime(availableStartTime);
                setEndTime(finalEndTime);
                
                // Set ref sau khi đã set startTime và date range
                prevMeetingRoomRef.current = defaultMeetingRoom;
                prevDateRangeRef.current = {
                    startDate: initialStartDate,
                    endDate: initialStartDate
                };
            }, 0);
        }
        // eslint-disable-next-line
    }, [isOpen, initialStartDate, initialEndDate, initialStartTime, initialEndTime, meetingRooms]);

    // Cập nhật startTime khi meetingRoom thay đổi
    // Sử dụng useRef để theo dõi meetingRoom trước đó và chỉ cập nhật khi thực sự thay đổi
    const prevMeetingRoomRef = React.useRef(null);
    
    React.useEffect(() => {
        // Chỉ cập nhật khi dialog đã mở, meetingRoom có giá trị, và meetingRoom đã thay đổi
        if (isOpen && formik.values.meetingRoom && startDate) {
            const currentMeetingRoom = formik.values.meetingRoom;
            
            // Kiểm tra nếu meetingRoom đã thay đổi (không phải lần đầu set)
            if (prevMeetingRoomRef.current !== null && prevMeetingRoomRef.current !== currentMeetingRoom) {
                // Tìm giờ khả dụng gần nhất cho meetingRoom mới
                const availableStartTime = findNextAvailableStartTime(
                    currentMeetingRoom,
                    startDate,
                    endDate || startDate
                );
                const calculatedEndTime = calculateEndTime(availableStartTime);
                
                setStartTime(availableStartTime);
                setEndTime(calculatedEndTime);
                setIsEndTimeManual(false); // Reset flag khi meetingRoom thay đổi
            }
            
            // Cập nhật ref
            prevMeetingRoomRef.current = currentMeetingRoom;
        }
        // eslint-disable-next-line
    }, [formik.values.meetingRoom, isOpen, startDate, endDate]);
    

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
                                            <span className="truncate">{t('meeting_room_add_booking')}</span>
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
                                                <span>{t('meeting_room_booking_from')} {dayjs(startDate).format('DD/MM/YYYY')}</span>
                                                <span>{t('meeting_room_booking_to')} {dayjs(endDate).format('DD/MM/YYYY')}</span>
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
                            <form onSubmit={formik.handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <CardContent className="space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0 px-4 py-3 sm:px-6 sm:py-4">
                                    {/* Tạm ẩn Title */}
                                    {/* <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="title" className="flex items-center gap-2 text-sm sm:text-base">
                                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                            {t('meeting_room_booking_title')}
                                        </Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formik.values.title}
                                            onChange={formik.handleChange}
                                            placeholder={t('meeting_room_booking_title_placeholder')}
                                            className="text-sm sm:text-base h-9 sm:h-10"
                                        />
                                    </div> */}
                                    
                                    {/* Select Meeting Room */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="meetingRoom" className="flex items-center gap-2 text-sm sm:text-base">
                                            <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                            {t('meeting_room_court_select')}
                                        </Label>
                                        <Popover open={openMeetingRoom} onOpenChange={setOpenMeetingRoom}>
                                            <PopoverTrigger asChild>
                                                <div className="w-full">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-between h-9 sm:h-11 text-sm sm:text-base font-normal"
                                                        type="button"
                                                    >
                                                            {formik.values.meetingRoom
                                                            ? meetingRooms.find(m => m.value === formik.values.meetingRoom)?.label
                                                            : t('meeting_room_court_placeholder')}
                                                    </Button>
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent align="start" side="bottom" sideOffset={4} alignOffset={0} className="w-[--radix-popover-trigger-width] p-0">
                                                <Command shouldFilter={false} className="max-h-[300px] overflow-y-auto">
                                                    <CommandInput
                                                        value={meetingRoomInput}
                                                        onValueChange={setMeetingRoomInput}
                                                        placeholder={t('search')}
                                                        className="h-11 px-4 text-base"
                                                    />
                                                    <CommandList className="text-base">
                                                        {filteredMeetingRooms.length > 0 ? (
                                                            filteredMeetingRooms.map(meetingRoom => (
                                                                <CommandItem
                                                                    key={meetingRoom.value}
                                                                    value={meetingRoom.value}
                                                                    onSelect={() => {
                                                                        formik.setFieldValue('meetingRoom', meetingRoom.value);
                                                                        setMeetingRoomInput("");
                                                                        setOpenMeetingRoom(false);
                                                                    }}
                                                                    className="cursor-pointer py-2 px-4"
                                                                >
                                                                    {meetingRoom.label}
                                                                </CommandItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-gray-500 text-sm">{t('no_results')}</div>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    
                                    {/* Start Date và End Date */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="startDate" className="flex items-center gap-2 text-sm sm:text-base">
                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                {t('meeting_room_start_date')}
                                            </Label>
                                            <DatePickerDay
                                                value={startDate}
                                                onChange={(newStartDate) => {
                                                    setStartDate(newStartDate);
                                                    // Nếu startDate mới lớn hơn endDate hiện tại, cập nhật endDate
                                                    if (newStartDate && endDate && newStartDate > endDate) {
                                                        setEndDate(newStartDate);
                                                    }
                                                    // Tính lại startTime ngay khi startDate thay đổi
                                                    setTimeout(() => {
                                                        const effectiveEndDate = (newStartDate && endDate && newStartDate > endDate) 
                                                            ? newStartDate 
                                                            : endDate;
                                                        if (isOpen && newStartDate && effectiveEndDate && formik.values.meetingRoom) {
                                                            const availableStartTime = findNextAvailableStartTime(
                                                                formik.values.meetingRoom,
                                                                newStartDate,
                                                                effectiveEndDate
                                                            );
                                                            const calculatedEndTime = calculateEndTime(availableStartTime);
                                                            
                                                            setStartTime(availableStartTime);
                                                            setEndTime(calculatedEndTime);
                                                            setIsEndTimeManual(false);
                                                            
                                                            // Cập nhật ref để đồng bộ với useEffect
                                                            prevDateRangeRef.current = {
                                                                startDate: newStartDate,
                                                                endDate: effectiveEndDate
                                                            };
                                                            
                                                            console.log('🔄 StartDate changed, updating startTime:', {
                                                                newStartDate,
                                                                effectiveEndDate,
                                                                availableStartTime
                                                            });
                                                        }
                                                    }, 0);
                                                }}
                                                id="startDate"
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="endDate" className="flex items-center gap-2 text-sm sm:text-base">
                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                {t('meeting_room_end_date')}
                                            </Label>
                                            <DatePickerDay
                                                value={endDate}
                                                onChange={(newEndDate) => {
                                                    setEndDate(newEndDate);
                                                    // Tính lại startTime ngay khi endDate thay đổi
                                                    // Sử dụng setTimeout để đảm bảo state đã được cập nhật
                                                    setTimeout(() => {
                                                        if (isOpen && startDate && newEndDate && formik.values.meetingRoom) {
                                                            const availableStartTime = findNextAvailableStartTime(
                                                                formik.values.meetingRoom,
                                                                startDate,
                                                                newEndDate
                                                            );
                                                            const calculatedEndTime = calculateEndTime(availableStartTime);
                                                            
                                                            setStartTime(availableStartTime);
                                                            setEndTime(calculatedEndTime);
                                                            setIsEndTimeManual(false);
                                                            
                                                            // Cập nhật ref để đồng bộ với useEffect
                                                            prevDateRangeRef.current = {
                                                                startDate: startDate,
                                                                endDate: newEndDate
                                                            };
                                                            
                                                            console.log('🔄 EndDate changed, updating startTime:', {
                                                                startDate,
                                                                newEndDate,
                                                                availableStartTime
                                                            });
                                                        }
                                                    }, 0);
                                                }}
                                                id="endDate"
                                                minDate={startDate}
                                            />
                                        </div>
                                    </div>
                                    {/* Dòng 2: Giờ bắt đầu - Giờ kết thúc */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="startTime" className="flex items-center gap-2 text-sm sm:text-base">
                                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                <span className="text-xs sm:text-sm">{t('meeting_room_start_time')}</span>
                                            </Label>
                                            <DatePicker
                                                id="startTime"
                                                value={getTimeAsDate(startTime)}
                                                onChange={handleStartTimePickerChange}
                                                format="HH:mm"
                                                placeholder={t('meeting_room_select_time')}
                                                block
                                                appearance="default"
                                                cleanable
                                                placement="topStart"
                                                editable={false}
                                                style={{ cursor: 'pointer' }}
                                                hideHours={hour => hour < 7 || hour > 16}
                                                shouldDisableHour={shouldDisableHourForStartTime}
                                                hideMinutes={(minute, date) => {
                                                    if (!date) return false;
                                                    const hour = date.getHours();
                                                    // Nếu giờ là 16, chỉ hiển thị phút từ 00-30, ẩn phút > 30
                                                    if (hour === 16) {
                                                        return minute > 30;
                                                    }else if (hour === 7) {
                                                        return minute < 30;
                                                    }
                                                    return false; // Các giờ khác hiển thị tất cả phút
                                                }}
                                                shouldDisableMinute={shouldDisableMinuteForStartTime}
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="endTime" className="flex items-center gap-2 text-sm sm:text-base">
                                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                <span className="text-xs sm:text-sm">{t('meeting_room_end_time')}</span>
                                            </Label>
                                            <DatePicker
                                                id="endTime"
                                                value={getTimeAsDate(endTime)}
                                                onChange={handleEndTimePickerChange}
                                                format="HH:mm"
                                                placeholder={t('meeting_room_select_time')}
                                                block
                                                appearance="default"
                                                cleanable
                                                placement="topStart"
                                                editable={false}
                                                style={{ cursor: 'pointer' }}
                                                disabled={!startTime}
                                                hideHours={hour => hour < 7 || hour > 16}
                                                shouldDisableHour={shouldDisableHourForEndTime}
                                                hideMinutes={(minute, date) => {
                                                    if (!date) return false;
                                                    const hour = date.getHours();
                                                    // Nếu giờ là 7, chỉ hiển thị phút từ 30-59, ẩn phút < 30
                                                    if (hour === 7) {
                                                        return minute < 30;
                                                    }
                                                    // Nếu giờ là 16, chỉ hiển thị phút từ 00-30, ẩn phút > 30
                                                    if (hour === 16) {
                                                        return minute > 30;
                                                    }
                                                    return false; // Các giờ khác hiển thị tất cả phút
                                                }}
                                                shouldDisableMinute={shouldDisableMinuteForEndTime}
                                            />
                                        </div>
                                    </div>
                                    {/* Tạm ẩn Select Color */}
                                    {/* <div className="mb-2 sm:mb-4">
                                        <Card className=''>
                                            <CardHeader className="px-3 py-2 sm:px-6 sm:py-4">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm sm:text-md">{t('meeting_room_color_select')}</CardTitle>
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
                                                        aria-label={`${t('meeting_room_select_color')} ${idx + 1}`}
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
                                            {t('meeting_room_description')}
                                        </Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formik.values.description}
                                            onChange={formik.handleChange}
                                            placeholder={t('meeting_room_description_placeholder')}
                                            className="text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
                                        />
                                    </div> */}
                                </CardContent>
                                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 p-3 sm:p-6 pt-3 sm:pt-4 flex-shrink-0 border-t bg-background sticky bottom-0">
                                    <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10">{t('btn_cancel')}</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10">{t('meeting_room_create_booking')}</Button>
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

