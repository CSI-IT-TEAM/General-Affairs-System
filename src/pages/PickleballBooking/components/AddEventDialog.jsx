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

    // Tính toán max time cho endTime (startTime + 2 giờ, nhưng tối đa là 22:00)
    // Nếu startTime từ 20:00 trở đi, maxEndTime luôn là 22:00
    const getMaxEndTime = () => {
        if (!startTime) return '22:00';
        const [hours, minutes] = startTime.split(':').map(Number);
        
        // Nếu startTime từ 20:00 trở đi, maxEndTime luôn là 22:00
        if (hours >= 20) {
            return '22:00';
        }
        
        const maxTime = dayjs().hour(hours).minute(minutes).add(2, 'hour');
        const maxHour = maxTime.hour();
        const maxMinute = maxTime.minute();
        
        // Giới hạn tối đa là 22:00
        if (maxHour >= 22) {
            return '22:00';
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

    // Xử lý khi endTime thay đổi thủ công - kiểm tra không vượt quá 2 giờ và tối đa 22:00
    const handleEndTimeChange = (newEndTime) => {
        setIsEndTimeManual(true); // Đánh dấu người dùng đã chỉnh thủ công

        if (!startTime || !newEndTime) {
            setEndTime(newEndTime);
            return;
        }

        const [startHours] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = newEndTime.split(':').map(Number);
        
        // Nếu startTime từ 20:00 trở đi, maxEndTime luôn là 22:00
        const maxEndTime2200 = dayjs(`2000-01-01T22:00`, 'YYYY-MM-DDTHH:mm');
        let actualMaxEnd;
        
        if (startHours >= 20) {
            // Nếu startTime >= 20:00, maxEndTime luôn là 22:00
            actualMaxEnd = maxEndTime2200;
        } else {
            // Nếu startTime < 20:00, tính maxEndTime = startTime + 2 giờ, tối đa 22:00
            const start = dayjs(`2000-01-01T${startTime}`, 'YYYY-MM-DDTHH:mm');
            const maxEnd = start.add(2, 'hour');
            actualMaxEnd = maxEnd.isAfter(maxEndTime2200) ? maxEndTime2200 : maxEnd;
        }
        
        const end = dayjs(`2000-01-01T${newEndTime}`, 'YYYY-MM-DDTHH:mm');
        
        // Kiểm tra nếu endTime vượt quá 22:00, giới hạn lại 22:00
        if (endHours > 22 || (endHours === 22 && endMinutes > 0)) {
            setEndTime('22:00');
            return;
        }

        // Nếu vượt quá maxEndTime, giới hạn ở giá trị thấp hơn
        if (end.isAfter(actualMaxEnd)) {
            const maxTime = actualMaxEnd.format('HH:mm');
            setEndTime(maxTime);
            alert(t('pickleball_max_duration_error') || 'Thời gian kết thúc không được vượt quá 2 giờ sau thời gian bắt đầu và tối đa là 22:00!');
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

    // State cho time pickers
    const [openStartTime, setOpenStartTime] = useState(false);
    const [openEndTime, setOpenEndTime] = useState(false);
    const [selectedStartHour, setSelectedStartHour] = useState(null);
    const [selectedStartMinute, setSelectedStartMinute] = useState(null);
    const [selectedEndHour, setSelectedEndHour] = useState(null);
    const [selectedEndMinute, setSelectedEndMinute] = useState(null);

    // Kiểm tra xem một thời điểm (hour:minute) có bị chiếm bởi event nào không
    const isTimeSlotBooked = (hour, minute, isStartTime = true) => {
        if (!startDate || !events || events.length === 0) return false;
        
        const checkTime = dayjs(`${startDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, 'YYYY-MM-DDTHH:mm');
        
        return events.some(event => {
            if (!event || !event.start || !event.end) return false;
            
            const eventStart = dayjs(event.start);
            const eventEnd = dayjs(event.end);
            
            // Kiểm tra cùng ngày
            if (!eventStart.isSame(dayjs(startDate), 'day')) return false;
            
            // Kiểm tra xem thời điểm có nằm trong khoảng thời gian của event không
            // Không cho phép bất kỳ thời điểm nào nằm trong khoảng [event.start, event.end]
            // Điều này đảm bảo không có overlap giữa các booking
            // Start time: không được nằm trong [event.start, event.end)
            // End time: không được nằm trong (event.start, event.end]
            if (isStartTime) {
                // Start time: không được nằm trong khoảng [event.start, event.end)
                return checkTime.isSameOrAfter(eventStart) && checkTime.isBefore(eventEnd);
            } else {
                // End time: không được nằm trong khoảng (event.start, event.end]
                return checkTime.isAfter(eventStart) && checkTime.isSameOrBefore(eventEnd);
            }
        });
    };

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

    // Tìm khung giờ kế tiếp khả dụng
    const findNextAvailableTimeSlot = (dateStr, defaultStartTimeStr) => {
        if (!dateStr || !defaultStartTimeStr) return defaultStartTimeStr;
        
        let current = dayjs(`${dateStr}T${defaultStartTimeStr}`, 'YYYY-MM-DDTHH:mm');
        
        // Làm tròn xuống slot 30 phút gần nhất (0 hoặc 30)
        const currentMinute = current.minute();
        const roundedMinute = currentMinute < 30 ? 0 : 30;
        current = current.minute(roundedMinute).second(0).millisecond(0);
        
        // Giới hạn tối đa: 22:00
        const maxTime = dayjs(`${dateStr}T22:00`, 'YYYY-MM-DDTHH:mm');
        
        // Tìm khung giờ khả dụng, tăng dần 30 phút mỗi lần
        while (current.isBefore(maxTime) || current.isSame(maxTime, 'minute')) {
            const currentHour = current.hour();
            const currentMinute = current.minute();
            
            // Tính endTime (current + 2 giờ, tối đa 22:00)
            let endTime = current.add(2, 'hour');
            if (endTime.isAfter(maxTime)) {
                endTime = maxTime;
            }
            
            const startTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            const endTimeStr = `${String(endTime.hour()).padStart(2, '0')}:${String(endTime.minute()).padStart(2, '0')}`;
            
            // Kiểm tra khung giờ này có bị book không
            if (!isTimeRangeBooked(dateStr, startTimeStr, endTimeStr)) {
                return startTimeStr;
            }
            
            // Tăng 30 phút và thử lại
            current = current.add(30, 'minute');
            
            // Nếu vượt quá 22:00, dừng lại
            if (current.isAfter(maxTime)) {
                break;
            }
        }
        
        // Nếu không tìm thấy khung giờ khả dụng, trả về default
        return defaultStartTimeStr;
    };

    // Tạo danh sách giờ dựa trên ngày và lọc các giờ đã bị đặt
    const getAvailableHours = () => {
        let hours = [];
        if (isWeekendOrHoliday(startDate)) {
            // Ngày nghỉ: từ 7:00 đến 22:00
            hours = Array.from({ length: 16 }, (_, i) => i + 7);
        } else {
            // Ngày thường: từ 17:00 đến 22:00
            hours = Array.from({ length: 6 }, (_, i) => i + 17);
        }
        
        // Lọc các giờ có ít nhất một phút khả dụng
        return hours.filter(hour => {
            // Kiểm tra xem giờ này có ít nhất một phút khả dụng không
            return availableMinutes.some(minute => !isTimeSlotBooked(hour, minute, true));
        });
    };

    // Tạo danh sách phút (cách nhau 30 phút)
    const availableMinutes = [0, 30];
    
    // Tạo danh sách tất cả các slot thời gian cho start time
    const getAllStartTimeSlots = () => {
        let hours = [];
        if (isWeekendOrHoliday(startDate)) {
            // Ngày nghỉ: từ 7:00 đến 22:00
            hours = Array.from({ length: 16 }, (_, i) => i + 7);
        } else {
            // Ngày thường: từ 17:00 đến 22:00
            hours = Array.from({ length: 6 }, (_, i) => i + 17);
        }
        
        const slots = [];
        hours.forEach(hour => {
            availableMinutes.forEach(minute => {
                // Nếu là 22:00, chỉ cho phép phút 00
                if (hour === 22 && minute === 30) return;
                
                const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const isAvailable = !isTimeSlotBooked(hour, minute, true);
                
                slots.push({
                    hour,
                    minute,
                    timeStr,
                    isAvailable
                });
            });
        });
        
        return slots;
    };
    
    // Lấy danh sách phút khả dụng cho start time dựa trên giờ đã chọn (giữ lại cho tương thích)
    const getAvailableStartMinutes = (hour) => {
        if (hour === null || hour === undefined) return availableMinutes;
        
        // Nếu startTime là 22:00, chỉ cho phép chọn phút 00 (không cho 30)
        if (hour === 22) {
            return [0].filter(minute => !isTimeSlotBooked(hour, minute, true));
        }
        
        // Lọc các phút chưa bị đặt
        return availableMinutes.filter(minute => !isTimeSlotBooked(hour, minute, true));
    };

    // Format time để hiển thị
    const formatTimeDisplay = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':').map(Number);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    // Xử lý chọn slot cho start time
    const handleStartTimeSlotSelect = (timeStr) => {
        if (!timeStr) return;
        handleStartTimeChange(timeStr);
        const [hour, minute] = timeStr.split(':').map(Number);
        setSelectedStartHour(hour);
        setSelectedStartMinute(minute);
    };

    // Xử lý chọn giờ cho start time (giữ lại cho tương thích)
    const handleStartHourSelect = (hour) => {
        setSelectedStartHour(hour);
        // Lấy phút từ startTime hiện tại hoặc mặc định là 0
        const currentMinute = startTime ? parseInt(startTime.split(':')[1]) : (selectedStartMinute !== null ? selectedStartMinute : 0);
        const newTime = `${String(hour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        handleStartTimeChange(newTime);
        setSelectedStartMinute(currentMinute);
    };

    // Xử lý chọn phút cho start time (giữ lại cho tương thích)
    const handleStartMinuteSelect = (minute) => {
        setSelectedStartMinute(minute);
        // Lấy giờ từ startTime hiện tại hoặc mặc định
        const currentHour = startTime ? parseInt(startTime.split(':')[0]) : (selectedStartHour !== null ? selectedStartHour : (isWeekendOrHoliday(startDate) ? 7 : 17));
        const newTime = `${String(currentHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        handleStartTimeChange(newTime);
        setSelectedStartHour(currentHour);
    };

    // Xử lý chọn slot cho end time
    const handleEndTimeSlotSelect = (timeStr) => {
        if (!timeStr) return;
        handleEndTimeChange(timeStr);
        const [hour, minute] = timeStr.split(':').map(Number);
        setSelectedEndHour(hour);
        setSelectedEndMinute(minute);
    };

    // Xử lý chọn giờ cho end time (giữ lại cho tương thích)
    const handleEndHourSelect = (hour) => {
        setSelectedEndHour(hour);
        // Lấy phút từ endTime hiện tại hoặc mặc định là 0
        const currentMinute = endTime ? parseInt(endTime.split(':')[1]) : (selectedEndMinute !== null ? selectedEndMinute : 0);
        const newTime = `${String(hour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        handleEndTimeChange(newTime);
        setSelectedEndMinute(currentMinute);
    };

    // Xử lý chọn phút cho end time (giữ lại cho tương thích)
    const handleEndMinuteSelect = (minute) => {
        setSelectedEndMinute(minute);
        // Lấy giờ từ endTime hiện tại hoặc mặc định
        const currentHour = endTime ? parseInt(endTime.split(':')[0]) : (selectedEndHour !== null ? selectedEndHour : (startTime ? parseInt(startTime.split(':')[0]) + 1 : 17));
        const newTime = `${String(currentHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        handleEndTimeChange(newTime);
        setSelectedEndHour(currentHour);
    };

    // Lấy danh sách giờ cho end time (đã lọc các giờ đã bị đặt)
    const getAvailableEndHours = () => {
        if (!startTime) return [];
        const slots = getAvailableEndTimeSlots();
        const hours = [...new Set(slots.map(s => s.hour))].sort((a, b) => a - b);
        // Lọc các giờ có ít nhất một phút khả dụng
        return hours.filter(hour => {
            const minutesForHour = slots.filter(s => s.hour === hour).map(s => s.minute);
            return minutesForHour.some(minute => !isTimeSlotBooked(hour, minute, false));
        });
    };

    // Lấy danh sách phút cho end time dựa trên giờ đã chọn (đã lọc các phút đã bị đặt)
    const getAvailableEndMinutes = (selectedHour) => {
        if (!startTime || selectedHour === null) return availableMinutes;
        const slots = getAvailableEndTimeSlots();
        const minutes = slots.filter(s => s.hour === selectedHour).map(s => s.minute).sort((a, b) => a - b);
        // Lọc các phút chưa bị đặt
        const availableMinutesForHour = minutes.length > 0 ? minutes : availableMinutes;
        return availableMinutesForHour.filter(minute => !isTimeSlotBooked(selectedHour, minute, false));
    };

    // Lấy danh sách time slots hợp lệ cho end time (dựa trên startTime)
    const getAvailableEndTimeSlots = () => {
        if (!startTime) return [];
        
        const startTimeObj = dayjs(`2000-01-01T${startTime}`, 'YYYY-MM-DDTHH:mm');
        const maxEndTime = startTimeObj.add(2, 'hour');
        const maxEndTime2200 = dayjs(`2000-01-01T22:00`, 'YYYY-MM-DDTHH:mm');
        
        // Giới hạn tối đa là 22:00
        const actualMaxEnd = maxEndTime.isAfter(maxEndTime2200) ? maxEndTime2200 : maxEndTime;
        
        const slots = [];
        let current = startTimeObj.add(30, 'minute'); // Bắt đầu từ startTime + 30 phút
        
        while (current.isSameOrBefore(actualMaxEnd)) {
            const hour = current.hour();
            const minute = current.minute();
            
            // Chỉ thêm nếu phút là bội số của 30 và không vượt quá 22:00
            if (minute % 30 === 0 && hour <= 22) {
                if (hour === 22 && minute > 0) {
                    break; // Không cho phép sau 22:00
                }
                slots.push({ hour, minute });
            }
            
            current = current.add(30, 'minute');
        }
        
        // Nếu maxEndTime là 22:00, thêm nó vào
        if (actualMaxEnd.hour() === 22 && actualMaxEnd.minute() === 0) {
            const exists = slots.some(s => s.hour === 22 && s.minute === 0);
            if (!exists) {
                slots.push({ hour: 22, minute: 0 });
            }
        }
        
        return slots;
    };
    
    // Tạo danh sách tất cả các slot thời gian cho end time
    const getAllEndTimeSlots = () => {
        if (!startTime) return [];
        
        const slots = getAvailableEndTimeSlots();
        
        return slots.map(slot => {
            const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
            const isAvailable = !isTimeSlotBooked(slot.hour, slot.minute, false);
            
            return {
                ...slot,
                timeStr,
                isAvailable
            };
        });
    };

    // Nhóm time slots theo giờ
    const groupTimeSlotsByHour = (slots) => {
        const grouped = {};
        slots.forEach(slot => {
            if (!grouped[slot.hour]) {
                grouped[slot.hour] = [];
            }
            grouped[slot.hour].push(slot.minute);
        });
        return grouped;
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

                // Kiểm tra thời gian kết thúc không quá 2 giờ sau thời gian bắt đầu và tối đa là 22:00 (chỉ cho cùng một ngày)
                // Cho phép bằng đúng 2 giờ (chỉ báo lỗi nếu lớn hơn 2 giờ)
                const maxEndTime = startDay.add(2, 'hour');
                const maxEndTime2200 = dayjs(`${startDate}T22:00`, 'YYYY-MM-DDTHH:mm');
                const actualMaxEnd = maxEndTime.isAfter(maxEndTime2200) ? maxEndTime2200 : maxEndTime;
                
                if (endDay.isAfter(actualMaxEnd)) {
                    alert(t('pickleball_max_duration_error') || 'Thời gian kết thúc không được vượt quá 2 giờ sau thời gian bắt đầu và tối đa là 22:00!');
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

                // Kiểm tra thời gian kết thúc không quá 2 giờ sau thời gian bắt đầu và tối đa là 22:00
                // Cho phép bằng đúng 2 giờ (chỉ báo lỗi nếu lớn hơn 2 giờ)
                const maxEndTime = eventStart.add(2, 'hour');
                const maxEndTime2200 = current.hour(22).minute(0).second(0).millisecond(0);
                const actualMaxEnd = maxEndTime.isAfter(maxEndTime2200) ? maxEndTime2200 : maxEndTime;
                
                if (eventEnd.isAfter(actualMaxEnd)) {
                    hasConflict = true;
                    conflictDate = current.format('DD/MM/YYYY');
                    alert(t('pickleball_max_duration_error') || 'Thời gian kết thúc không được vượt quá 2 giờ sau thời gian bắt đầu và tối đa là 22:00!');
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

    // Tính toán endTime = startTime + 2 giờ, nhưng tối đa là 22:00
    // Nếu startTime từ 20:00 trở đi, endTime luôn là 22:00
    const calculateEndTime = (startTimeStr) => {
        if (!startTimeStr) return '19:00'; // Default fallback
        const [hours, minutes] = startTimeStr.split(':').map(Number);
        
        // Nếu startTime từ 20:00 trở đi, endTime luôn là 22:00
        if (hours >= 20) {
            return '22:00';
        }
        
        const endTimeObj = dayjs().hour(hours).minute(minutes).add(2, 'hour');
        let endHour = endTimeObj.hour();
        let endMinute = endTimeObj.minute();
        
        // Giới hạn tối đa là 22:00
        if (endHour >= 22) {
            endHour = 22;
            endMinute = 0;
        }
        
        return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    };

    // Tự động tính endTime mỗi khi startTime thay đổi - CHỈ khi người dùng chưa chỉnh thủ công
    React.useEffect(() => {
        if (startTime && startTime.trim() !== '' && !isEndTimeManual) {
            const calculatedEndTime = calculateEndTime(startTime);
            if (calculatedEndTime) {
                setEndTime(calculatedEndTime);
                // Cập nhật selected end hour và minute
                const [endHour, endMinute] = calculatedEndTime.split(':').map(Number);
                setSelectedEndHour(endHour);
                setSelectedEndMinute(endMinute);
            }
        }
        // Cập nhật selected start hour và minute khi startTime thay đổi
        if (startTime) {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            setSelectedStartHour(startHour);
            setSelectedStartMinute(startMinute);
        }
        // eslint-disable-next-line
    }, [startTime]);
    
    // Cập nhật selected end hour và minute khi endTime thay đổi
    React.useEffect(() => {
        if (endTime) {
            const [endHour, endMinute] = endTime.split(':').map(Number);
            setSelectedEndHour(endHour);
            setSelectedEndMinute(endMinute);
        }
        // eslint-disable-next-line
    }, [endTime]);

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

            // Bắt đầu từ defaultStartTime và tìm khung giờ khả dụng đầu tiên
            // endTime sẽ luôn = startTime + 2 giờ
            let finalStartTime = defaultStartTimeForDate;
            
            // Kiểm tra xem khung giờ mặc định có bị book chưa
            // Nếu bị book, tìm khung giờ kế tiếp khả dụng
            const calculatedEndTime = calculateEndTime(finalStartTime);
            if (isTimeRangeBooked(initialStartDate, finalStartTime, calculatedEndTime)) {
                // Tìm khung giờ kế tiếp khả dụng
                finalStartTime = findNextAvailableTimeSlot(initialStartDate, finalStartTime);
            }

            // Tính toán endTime luôn dựa trên startTime + 2 giờ
            const finalEndTime = calculateEndTime(finalStartTime);

            setStartTime(finalStartTime);
            setEndTime(finalEndTime);
            
            // Set selected hour và minute cho start time
            const [startHour, startMinute] = finalStartTime.split(':').map(Number);
            setSelectedStartHour(startHour);
            setSelectedStartMinute(startMinute);

            // Set selected hour và minute cho end time
            const [endHour, endMinute] = finalEndTime.split(':').map(Number);
            setSelectedEndHour(endHour);
            setSelectedEndMinute(endMinute);
            
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
    }, [isOpen, initialStartDate, initialEndDate, initialStartTime, initialEndTime, courts, events, startDate]);

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
                                            <span className="truncate">{t('pickleball_add_booking')}</span>
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
                                                <span>{t('pickleball_booking_for')} {dayjs(startDate).format('DD/MM/YYYY')}</span>
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
                                            <Popover open={openStartTime} onOpenChange={setOpenStartTime}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-between h-9 sm:h-10 text-sm sm:text-base font-normal"
                                                        type="button"
                                                    >
                                                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                            {startTime ? formatTimeDisplay(startTime) : '--:--'}
                                                        </span>
                                                        <Clock className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent align="start" side="bottom" sideOffset={4} className="w-auto p-3">
                                                    <div className="max-h-[250px] overflow-y-auto">
                                                        <div className="flex flex-col gap-2">
                                                            {getAllStartTimeSlots().map((slot) => {
                                                                const isSelected = startTime === slot.timeStr;
                                                                return (
                                                                    <button
                                                                        key={slot.timeStr}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (slot.isAvailable) {
                                                                                handleStartTimeSlotSelect(slot.timeStr);
                                                                                setOpenStartTime(false);
                                                                            }
                                                                        }}
                                                                        disabled={!slot.isAvailable}
                                                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left ${
                                                                            isSelected
                                                                                ? 'bg-primary text-white hover:bg-primary/90'
                                                                                : slot.isAvailable
                                                                                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 cursor-pointer'
                                                                                : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                                                                        }`}
                                                                    >
                                                                        {slot.timeStr}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="endTime" className="flex items-center gap-2 text-sm sm:text-base">
                                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                                <span className="text-xs sm:text-sm">{t('pickleball_end_time')}</span>
                                            </Label>
                                            <Popover open={openEndTime} onOpenChange={setOpenEndTime}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-between h-9 sm:h-10 text-sm sm:text-base font-normal"
                                                        type="button"
                                                        disabled={!startTime}
                                                    >
                                                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                            {endTime ? formatTimeDisplay(endTime) : '--:--'}
                                                        </span>
                                                        <Clock className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent align="start" side="bottom" sideOffset={4} className="w-auto p-3">
                                                    {!startTime ? (
                                                        <div className="p-3 text-sm text-gray-500 text-center">
                                                            {t('pickleball_select_start_time_first') || 'Vui lòng chọn giờ bắt đầu trước'}
                                                        </div>
                                                    ) : (
                                                        <div className="max-h-[250px] overflow-y-auto">
                                                            <div className="flex flex-col gap-2">
                                                                {getAllEndTimeSlots().map((slot) => {
                                                                    const isSelected = endTime === slot.timeStr;
                                                                    return (
                                                                        <button
                                                                            key={slot.timeStr}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (slot.isAvailable) {
                                                                                    handleEndTimeSlotSelect(slot.timeStr);
                                                                                    setOpenEndTime(false);
                                                                                }
                                                                            }}
                                                                            disabled={!slot.isAvailable}
                                                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left ${
                                                                                isSelected
                                                                                    ? 'bg-primary text-white hover:bg-primary/90'
                                                                                    : slot.isAvailable
                                                                                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 cursor-pointer'
                                                                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                                                                            }`}
                                                                        >
                                                                            {slot.timeStr}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </PopoverContent>
                                            </Popover>
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

