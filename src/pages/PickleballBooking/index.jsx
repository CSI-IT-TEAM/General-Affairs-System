import React, { useState, useEffect } from 'react';
import { format, parse, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isSameWeek } from 'date-fns';
import './PickleballBooking.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, FileText, X, Trash, Search, Plus } from 'lucide-react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import AddEventDialog from './components/AddEventDialog';
import { useTranslation } from 'react-i18next';
import {
    getPickleballEvents,
    savePickleballEvent,
    deletePickleballEvent,
    getPickleballCourtList,
    checkCalendarDay,
} from '../../api/pickleballBooking';
import pickleballBannerBg from '../../assets/images/pickleball_banner_bg.jpg';
import backgroundImage from '../../assets/images/background.png';
import pageBackground from '../../assets/images/background.webp';

dayjs.extend(isSameOrBefore);

// Component Gantt Chart cho Report
const GanttChart = ({ weekDays, events, format, t }) => {
    // Giờ bắt đầu và kết thúc
    const startHour = 7;
    const endHour = 22;
    const totalHours = endHour - startHour + 1; // 16 giờ (07-22)

    // Mỗi giờ chia thành 2 khoảng 30 phút: 0, 30
    const minutesPerSlot = 30;
    const slotsPerHour = 2;
    const totalSlots = totalHours * slotsPerHour; // 16 * 2 = 32 slots

    // Tạo mảng giờ từ 07 đến 22 (để hiển thị header)
    const hours = [];
    for (let h = startHour; h <= endHour; h++) {
        hours.push(h);
    }

    // Tạo mảng các khoảng thời gian (slots) mỗi 30 phút
    const timeSlots = [];
    for (let h = startHour; h <= endHour; h++) {
        for (let m = 0; m < 60; m += minutesPerSlot) {
            timeSlots.push({ hour: h, minute: m });
        }
    }

    // Tên các ngày trong tuần
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Hàm tính toán vị trí và độ rộng của bar dựa trên thời gian
    // Tính chính xác dựa trên phút (chia thành các khoảng 30 phút)
    const calculateBarPosition = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Lấy giờ và phút
        let startHourValue = start.getHours();
        let startMinuteValue = start.getMinutes();
        let endHourValue = end.getHours();
        let endMinuteValue = end.getMinutes();

        // Làm tròn start xuống khoảng 30 phút gần nhất (0, 30)
        const startSlot = Math.floor(startMinuteValue / minutesPerSlot) * minutesPerSlot;
        startMinuteValue = startSlot;

        // Làm tròn end lên khoảng 30 phút gần nhất
        const endSlot = Math.ceil(endMinuteValue / minutesPerSlot) * minutesPerSlot;
        if (endSlot >= 60) {
            endHourValue += 1;
            endMinuteValue = 0;
        } else {
            endMinuteValue = endSlot;
        }

        // Đảm bảo trong khoảng 07:00-22:00
        // Nếu booking bắt đầu trước 07:00, chỉ hiển thị từ 07:00
        if (startHourValue < startHour || (startHourValue === startHour && startMinuteValue < 0)) {
            startHourValue = startHour;
            startMinuteValue = 0;
        }
        // Nếu booking bắt đầu sau 22:00, không hiển thị
        if (startHourValue > endHour || (startHourValue === endHour && startMinuteValue > 0)) {
            return { left: 0, width: 0 };
        }
        // Nếu booking kết thúc sau 22:00, chỉ hiển thị đến 22:00
        if (endHourValue > endHour || (endHourValue === endHour && endMinuteValue > 0)) {
            endHourValue = endHour;
            endMinuteValue = 0;
        }

        // Tính số slot từ start đến end
        const startTotalMinutes = startHourValue * 60 + startMinuteValue;
        const endTotalMinutes = endHourValue * 60 + endMinuteValue;
        const baseMinutes = startHour * 60; // 07:00 = 420 phút

        // Tính index của slot (0-based)
        const startSlotIndex = Math.floor((startTotalMinutes - baseMinutes) / minutesPerSlot);
        // End slot index bao gồm cả slot cuối cùng (exclusive end)
        const endSlotIndex = Math.ceil((endTotalMinutes - baseMinutes) / minutesPerSlot);

        // Đảm bảo trong phạm vi hợp lệ
        if (startSlotIndex < 0 || startSlotIndex >= totalSlots) {
            return { left: 0, width: 0 };
        }
        if (endSlotIndex <= startSlotIndex || endSlotIndex > totalSlots) {
            return { left: 0, width: 0 };
        }

        // Tính vị trí và độ rộng (theo %)
        const left = (startSlotIndex / totalSlots) * 100;
        const width = ((endSlotIndex - startSlotIndex) / totalSlots) * 100;

        return { left, width, startHour: startHourValue, endHour: endHourValue };
    };

    // Lấy events cho một ngày cụ thể
    const getEventsForDay = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return events.filter(event => {
            const eventDateKey = format(event.start, 'yyyy-MM-dd');
            return eventDateKey === dateKey;
        }).sort((a, b) => {
            return a.start.getTime() - b.start.getTime();
        });
    };

    // Tính toán các bars từ bookings trong ngày
    // Mỗi booking hoặc nhóm booking liên tiếp sẽ có 1 bar riêng
    const calculateDayBars = (dayEvents) => {
        if (!dayEvents || dayEvents.length === 0) {
            return [];
        }

        // Sắp xếp events theo thời gian bắt đầu
        const sortedEvents = [...dayEvents].sort((a, b) => a.start.getTime() - b.start.getTime());

        // Nhóm các bookings liên tiếp (overlap hoặc touch)
        const barGroups = [];
        let currentGroup = [sortedEvents[0]];

        for (let i = 1; i < sortedEvents.length; i++) {
            const currentEvent = sortedEvents[i];

            // Lấy event cuối cùng trong group hiện tại
            const lastEventInGroup = currentGroup[currentGroup.length - 1];

            // Kiểm tra xem currentEvent có overlap hoặc touch với group không
            // Overlap: currentEvent.start < lastEventInGroup.end
            // Touch: khoảng cách rất nhỏ (<= 1 phút)
            const gap = currentEvent.start.getTime() - lastEventInGroup.end.getTime();
            const hasOverlap = currentEvent.start.getTime() < lastEventInGroup.end.getTime();

            // Nếu overlap hoặc touch (gap <= 1 phút), gộp vào nhóm hiện tại
            if (hasOverlap || gap <= 60000) { // 1 phút = 60000 ms
                currentGroup.push(currentEvent);
            } else {
                // Có khoảng trống rõ ràng, tạo nhóm mới
                barGroups.push(currentGroup);
                currentGroup = [currentEvent];
            }
        }

        // Thêm nhóm cuối cùng
        if (currentGroup.length > 0) {
            barGroups.push(currentGroup);
        }

        // Tính toán bar position cho mỗi nhóm
        return barGroups.map(group => {
            // Tìm start sớm nhất và end muộn nhất trong nhóm
            let groupStart = group[0].start;
            let groupEnd = group[0].end;

            group.forEach(event => {
                if (event.start < groupStart) {
                    groupStart = event.start;
                }
                if (event.end > groupEnd) {
                    groupEnd = event.end;
                }
            });

            return {
                barPosition: calculateBarPosition(groupStart, groupEnd),
                events: group,
                start: groupStart,
                end: groupEnd
            };
        });
    };

    return (
        <div className="w-full h-full max-h-[450px] flex flex-col">
            <div className="flex-1 overflow-auto border border-gray-300 rounded-lg bg-white/50">
                {/* Header với các giờ */}
                <div className="sticky top-0 z-10 bg-gray-100 border-b">
                    <div className="flex min-w-[800px]">
                        <div className="w-20 sm:w-32 md:w-40 border-r bg-gray-100 p-1 sm:p-2 font-semibold text-[10px] sm:text-xs">
                            {/* Header cell cho tên ngày */}
                        </div>
                        <div className="flex-1 grid min-w-[720px]" style={{ gridTemplateColumns: `repeat(${totalSlots}, 1fr)` }}>
                            {hours.map((hour, hourIndex) => {
                                // Tính vị trí slot đầu tiên của giờ này trong grid
                                const slotStartIndex = hourIndex * slotsPerHour;
                                return (
                                    <div
                                        key={`header-${hour}`}
                                        className="border-r-2 border-dashed border-blue-950/50 p-1 sm:p-2 text-center font-semibold text-[10px] sm:text-xs md:text-sm"
                                        style={{
                                            gridColumnStart: slotStartIndex + 1,
                                            gridColumnEnd: slotStartIndex + slotsPerHour + 1
                                        }}
                                    >
                                        {String(hour).padStart(2, '0')}{t('pickleball_hh')}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Các hàng cho từng ngày */}
                <div>
                    {weekDays.map((day, dayIndex) => {
                        const dayEvents = getEventsForDay(day);
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayName = dayNames[dayIndex];

                        return (
                            <div
                                key={dateKey}
                                className="relative min-h-[50px] flex items-center border-b border-gray-200 min-w-[800px]"
                            >
                                {/* Tên ngày */}
                                <div className="w-20 sm:w-32 md:w-40 border-r p-1 sm:p-2 flex flex-col justify-center sticky left-0 z-10 bg-white/50 backdrop-blur-sm">
                                    <div className="text-[10px] sm:text-xs font-semibold text-gray-600">
                                        {dayName}
                                    </div>
                                    <div className="text-[10px] sm:text-xs font-semibold text-gray-600">
                                        {format(day, 'MM/dd')}
                                    </div>
                                </div>

                                <div className="flex-1 relative h-full min-w-[720px]">
                                    {/* Grid lines cho các khoảng 30 phút */}
                                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalSlots}, 1fr)` }}>
                                        {timeSlots.map((slot, index) => {
                                            // Đường kẻ đậm cho mỗi giờ (0, 30 đầu tiên của giờ)
                                            const isHourMark = slot.minute === 0;
                                            return (
                                                <div
                                                    key={`${slot.hour}-${slot.minute}`}
                                                    className={isHourMark ? 'border-r-2 border-gray-400' : 'border-r border-gray-200'}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Vẽ mỗi event là 1 bar riêng, cùng ngày nằm cùng dòng */}
                                    {dayEvents.map((event, eventIndex) => {
                                        const barPosition = calculateBarPosition(event.start, event.end);
                                        if (!barPosition || barPosition.width <= 0) return null;

                                        // Sử dụng màu từ event.bgColor (đã được gán bởi assignColorsToEvents)
                                        const eventColor = event.bgColor || '#13005f';

                                        // Tạo tooltip với thông tin chi tiết
                                        const tooltipParts = [];
                                        if (event.title) {
                                            tooltipParts.push(`Booker: ${event.title}`);
                                        }
                                        tooltipParts.push(`Ngày: ${format(event.start, 'dd/MM/yyyy')}`);
                                        tooltipParts.push(`Thời gian: ${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`);
                                       
                                        if (event.description) {
                                            tooltipParts.push(`Mô tả: ${event.description}`);
                                        }
                                        const tooltipText = tooltipParts.join('\n');

                                        return (
                                            <div
                                                key={`event-${event.id || eventIndex}`}
                                                className="absolute h-5 sm:h-6 md:h-8 rounded-lg shadow-md border-2 border-white/80 flex items-center justify-center cursor-pointer transition-all"
                                                style={{
                                                    left: `${Math.max(0, barPosition.left)}%`,
                                                    width: `${Math.max(0, Math.min(barPosition.width, 100 - Math.max(0, barPosition.left)))}%`,
                                                    backgroundColor: eventColor,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                }}
                                                title={tooltipText}
                                            >
                                                <span className="text-[9px] sm:text-xs font-semibold  whitespace-nowrap">{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const PickleballBooking = () => {
    const { t } = useTranslation();

    // Danh sách 20 màu cho booking events
    const colorSwatches = [
        '#FFB6C1', // Light Pink - Màu 1
        '#FFD700', // Gold - Màu 2
        '#90EE90', // Light Green - Màu 3
        '#87CEFA', // Light Sky Blue - Màu 4
        '#FFA07A', // Light Salmon - Màu 5
        '#DDA0DD', // Plum - Màu 6
        '#00CED1', // Dark Turquoise - Màu 7
        '#FF69B4', // Hot Pink - Màu 8
        '#B0E0E6', // Powder Blue - Màu 9
        '#F08080', // Light Coral - Màu 10
        '#FFDAB9', // Peach Puff - Màu 11
        '#E6E6FA', // Lavender - Màu 12
        '#FFFACD', // Lemon Chiffon - Màu 13
        '#C1FFC1', // Honeydew - Màu 14
        '#ADD8E6', // Light Blue - Màu 15
        '#A0522D', // Sienna - Màu 16
        '#40E0D0', // Turquoise - Màu 17
        '#FF6347', // Tomato - Màu 18
        '#7B68EE', // Medium Slate Blue - Màu 19
        '#FF8C00'  // Dark Orange - Màu 20
    ];

    // Hàm gán màu cho events dựa trên thứ tự trong cùng một ngày
    const assignColorsToEvents = (eventsList) => {
        if (!eventsList || eventsList.length === 0) return eventsList;

        // Nhóm events theo ngày (start date)
        const eventsByDate = {};
        eventsList.forEach(event => {
            const dateKey = format(event.start, 'yyyy-MM-dd');
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push(event);
        });

        // Sắp xếp và gán màu cho events trong mỗi ngày
        Object.keys(eventsByDate).forEach(dateKey => {
            const dayEvents = eventsByDate[dateKey];

            // Sắp xếp events theo thời gian bắt đầu (start time)
            dayEvents.sort((a, b) => {
                const timeA = format(a.start, 'HH:mm');
                const timeB = format(b.start, 'HH:mm');
                return timeA.localeCompare(timeB);
            });

            // Gán màu theo thứ tự: event đầu tiên = màu 0, event thứ 2 = màu 1, ...
            dayEvents.forEach((event, index) => {
                const colorIndex = index % colorSwatches.length; // Lặp lại nếu > 20 events
                event.bgColor = colorSwatches[colorIndex];
            });
        });

        return eventsList;
    };

    // Lấy EMPID và user info từ sessionStorage
    const getCurrentUserInfo = () => {
        try {
            const userData = JSON.parse(sessionStorage.getItem("userData"));
            return {
                empId: userData?.EMPID || '',
                userLogin: userData?.EMPID || '',
                department: userData?.DEPT || '',
            };
        } catch (error) {
            return {
                empId: '',
                userLogin: '',
                department: '',
            };
        }
    };

    const [events, setEvents] = useState([]);
    const [pickleballCourts, setPickleballCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('booking'); // 'booking' hoặc 'report'
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        // Bắt đầu từ Chủ nhật của tuần hiện tại
        const today = new Date();
        const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...
        const diff = today.getDate() - day; // Số ngày cần trừ để về Chủ nhật
        const sunday = new Date(today.setDate(diff));
        sunday.setHours(0, 0, 0, 0);
        return sunday;
    });
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return format(now, 'yyyy-MM-dd');
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        return format(now, 'yyyy-MM-dd');
    });
    const [startTime, setStartTime] = useState('07:30');
    const [endTime, setEndTime] = useState('16:30');
    const [isHoliday, setIsHoliday] = useState(false);

    // Tạo mảng 7 ngày trong tuần (Sun - Sat)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        weekDays.push(addDays(currentWeekStart, i));
    }

    // Load events and courts on mount and when week changes
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load courts
                const courts = await getPickleballCourtList();
                if (courts && courts.length > 0) {
                    setPickleballCourts(courts);
                }

                // Load events for current week ± 1 week
                const weekStart = new Date(currentWeekStart);
                weekStart.setDate(weekStart.getDate() - 7);
                const weekEnd = new Date(currentWeekStart);
                weekEnd.setDate(weekEnd.getDate() + 14);

                const fromDate = format(weekStart, 'yyyy-MM-dd');
                const toDate = format(weekEnd, 'yyyy-MM-dd');
                const eventsData = await getPickleballEvents(fromDate, toDate);
                const eventsWithColors = assignColorsToEvents(eventsData || []);
                setEvents(eventsWithColors);
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Error loading data:', error);
                }
                if (pickleballCourts.length === 0) {
                    setPickleballCourts([{
                        value: 'Pickleball Court 1',
                        label: 'Pickleball Court 1'
                    }]);
                }
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentWeekStart]);

    // Lấy events cho một ngày cụ thể
    const getEventsForDay = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return events.filter(event => {
            const eventDateKey = format(event.start, 'yyyy-MM-dd');
            return eventDateKey === dateKey;
        }).sort((a, b) => {
            return a.start.getTime() - b.start.getTime();
        });
    };

    // Xử lý click vào ngày để thêm event
    const handleDayClick = async (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const slotDate = new Date(date);
        slotDate.setHours(0, 0, 0, 0);
        if (slotDate < today) {
            return;
        }

        // Kiểm tra xem ngày này đã full chưa
        if (isDayFull(date)) {
            alert(t('pickleball_day_full_alert') || 'Ngày này đã full lịch, không thể book thêm!');
            return;
        }

        const dateStr = format(date, 'yyyy-MM-dd');

        try {
            const calendarCheck = await checkCalendarDay(dateStr);
            setIsHoliday(calendarCheck.isHoliday);
        } catch (error) {
            setIsHoliday(false);
        }

        setStartDate(dateStr);
        setEndDate(dateStr);

        const dayOfWeek = date.getDay();
        const defaultStartTime = dayOfWeek === 0 ? '07:00' : '17:00';

        const [hours, minutes] = defaultStartTime.split(':').map(Number);
        const endTimeObj = new Date();
        endTimeObj.setHours(hours + 2, minutes, 0, 0);
        const defaultEndTime = format(endTimeObj, 'HH:mm');

        setStartTime(defaultStartTime);
        setEndTime(defaultEndTime);
        setIsDialogOpen(true);
    };

    // Xử lý click vào event để xem chi tiết
    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsEventDetailOpen(true);
    };

    // Navigation tuần
    const goToPrevWeek = () => {
        setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    };

    const goToNextWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    };

    const goToToday = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day;
        const sunday = new Date(today.setDate(diff));
        sunday.setHours(0, 0, 0, 0);
        setCurrentWeekStart(sunday);
    };

    // Hàm xử lý search
    const handleSearch = async () => {
        setLoading(true);
        try {
            const courts = await getPickleballCourtList();
            if (courts && courts.length > 0) {
                setPickleballCourts(courts);
            }

            const weekStart = new Date(currentWeekStart);
            weekStart.setDate(weekStart.getDate() - 7);
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 14);

            const fromDate = format(weekStart, 'yyyy-MM-dd');
            const toDate = format(weekEnd, 'yyyy-MM-dd');

            if (!fromDate || !toDate || fromDate === 'Invalid Date' || toDate === 'Invalid Date') {
                setLoading(false);
                return;
            }

            const eventsData = await getPickleballEvents(fromDate, toDate);
            const eventsWithColors = assignColorsToEvents(eventsData || []);
            setEvents(eventsWithColors);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Error loading data:', error);
            }
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const openAddEventDialog = async () => {
        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd');

        // Kiểm tra xem ngày hôm nay đã full chưa
        if (isDayFull(now)) {
            alert(t('pickleball_day_full_alert') || 'Ngày này đã full lịch, không thể book thêm!');
            return;
        }

        try {
            const calendarCheck = await checkCalendarDay(dateStr);
            setIsHoliday(calendarCheck.isHoliday);
        } catch (error) {
            setIsHoliday(false);
        }

        setStartDate(dateStr);
        setEndDate(dateStr);

        const dayOfWeek = now.getDay();
        const defaultStartTime = dayOfWeek === 0 ? '07:00' : '17:00';

        const [hours, minutes] = defaultStartTime.split(':').map(Number);
        const endTimeObj = new Date();
        endTimeObj.setHours(hours + 2, minutes, 0, 0);
        const defaultEndTime = format(endTimeObj, 'HH:mm');

        setStartTime(defaultStartTime);
        setEndTime(defaultEndTime);
        setIsDialogOpen(true);
    };

    const handleAddEvent = async (eventsData) => {
        const userInfo = getCurrentUserInfo();

        try {
            for (const eventData of eventsData) {
                const eventStartTime = eventData.startTime || format(eventData.start, 'HH:mm');
                const eventEndTime = eventData.endTime || format(eventData.end, 'HH:mm');

                const eventPayload = {
                    id: null,
                    startDate: format(eventData.start, 'yyyy-MM-dd'),
                    endDate: format(eventData.end, 'yyyy-MM-dd'),
                    startTime: eventStartTime,
                    endTime: eventEndTime,
                    title: eventData.title,
                    color: eventData.bgColor || colorSwatches[0],
                    description: eventData.description || '',
                    department: eventData.department || userInfo.department,
                    userId: eventData.cardNumber || userInfo.empId,
                    court: eventData.court,
                    userLogin: userInfo.userLogin,
                };

                if (!eventPayload.userId || !eventPayload.userLogin) {
                    throw new Error('Thiếu thông tin người dùng. Vui lòng đăng nhập lại!');
                }
                if (!eventPayload.court) {
                    throw new Error('Vui lòng chọn sân Pickleball!');
                }

                const result = await savePickleballEvent(eventPayload);

                if (result && !result.success) {
                    const errorMsg = result.error?.message || result.error || 'Có lỗi xảy ra khi lưu sự kiện';
                    throw new Error(errorMsg);
                }
            }

            setIsDialogOpen(false);

            // Reload events
            const weekStart = new Date(currentWeekStart);
            weekStart.setDate(weekStart.getDate() - 7);
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 14);

            const fromDate = format(weekStart, 'yyyy-MM-dd');
            const toDate = format(weekEnd, 'yyyy-MM-dd');
            const reloadedEvents = await getPickleballEvents(fromDate, toDate);
            const eventsWithColors = assignColorsToEvents(reloadedEvents || []);
            setEvents(eventsWithColors);
        } catch (error) {
            console.error('Error saving event:', error);
            let errorMessage = t('pickleball_conflict_error') || 'Có lỗi xảy ra khi lưu sự kiện. Vui lòng thử lại!';

            if (error.message) {
                if (error.message.includes('conflict') || error.message.includes('trùng')) {
                    errorMessage = t('pickleball_conflict_error') || 'Khung giờ này đã có lịch chơi trong sân này. Vui lòng chọn khung giờ khác!';
                } else if (error.message.includes('HTTP error')) {
                    errorMessage = 'Lỗi kết nối server. Vui lòng thử lại sau!';
                } else {
                    errorMessage = error.message;
                }
            }

            alert(errorMessage);
        }
    };

    const handleDeleteEvent = async () => {
        if (selectedEvent && selectedEvent.id) {
            try {
                const result = await deletePickleballEvent(selectedEvent.id);

                if (result && result.success) {
                    setIsEventDetailOpen(false);
                    setSelectedEvent(null);

                    // Reload events
                    const weekStart = new Date(currentWeekStart);
                    weekStart.setDate(weekStart.getDate() - 7);
                    const weekEnd = new Date(currentWeekStart);
                    weekEnd.setDate(weekEnd.getDate() + 14);

                    const fromDate = format(weekStart, 'yyyy-MM-dd');
                    const toDate = format(weekEnd, 'yyyy-MM-dd');
                    const reloadedEvents = await getPickleballEvents(fromDate, toDate);
                    const eventsWithColors = assignColorsToEvents(reloadedEvents || []);
                    setEvents(eventsWithColors);
                } else {
                    alert('Có lỗi xảy ra khi xóa sự kiện. Vui lòng thử lại!');
                }
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Có lỗi xảy ra khi xóa sự kiện. Vui lòng thử lại!');
            }
        }
    };

    // Kiểm tra xem một ngày có phải là quá khứ không
    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    // Kiểm tra xem một ngày có phải là hôm nay không
    const isToday = (date) => {
        return isSameDay(date, new Date());
    };

    // Kiểm tra xem một ngày có full lịch hay không
    const isDayFull = (date) => {
        const dayEvents = getEventsForDay(date);
        if (dayEvents.length === 0) return false;

        // Nếu không có courts, không thể kiểm tra full
        if (!pickleballCourts || pickleballCourts.length === 0) return false;

        const numCourts = pickleballCourts.length;
        const dayOfWeek = date.getDay();

        // Ngày nghỉ (Chủ nhật): 07:00 - 22:00
        // Ngày thường: 17:00 - 22:00 (05:00 PM = 17:00)
        const startHour = dayOfWeek === 0 ? 7 : 17;
        const startMinute = 0;
        const endHour = 22;
        const endMinute = 0;

        // Tính chính xác tổng số phút có thể book trong ngày
        // Từ startHour:startMinute đến endHour:endMinute
        // Ví dụ: 17:00 (1020 phút) đến 22:00 (1320 phút) = 300 phút
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;

        // Số phút khả dụng cho 1 court (từ startHour đến endHour)
        const minutesPerCourt = endTotalMinutes - startTotalMinutes;

        // Tổng số phút khả dụng cho tất cả courts
        const totalAvailableMinutes = minutesPerCourt * numCourts;

        // Tính tổng số phút đã được book
        // Lấy giờ kết thúc trừ giờ bắt đầu của mỗi event, sau đó sum tổng lại
        let totalBookedMinutes = 0;
        const validEvents = [];

        dayEvents.forEach(event => {
            if (!event || !event.start || !event.end) return;

            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            // Kiểm tra xem event có cùng ngày không
            const eventDateKey = format(eventStart, 'yyyy-MM-dd');
            const checkDateKey = format(date, 'yyyy-MM-dd');
            if (eventDateKey !== checkDateKey) return;

            const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
            const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();

            // Chỉ tính các phút trong khung giờ cho phép (từ startHour đến endHour)
            const eventStartMinutes = Math.max(startMinutes, startTotalMinutes);
            const eventEndMinutes = Math.min(endMinutes, endTotalMinutes);

            const duration = Math.max(0, eventEndMinutes - eventStartMinutes);
            if (duration > 0) {
                totalBookedMinutes += duration;
                validEvents.push({
                    start: eventStartMinutes,
                    end: eventEndMinutes,
                    duration
                });
            }
        });

        // Thêm tolerance nhỏ (2 phút) để xử lý sai số làm tròn và các khoảng trống nhỏ
        const tolerance = 0;

        // Debug log (chỉ trong development)
        if (process.env.NODE_ENV === 'development') {
            console.log('isDayFull check:', {
                date: format(date, 'yyyy-MM-dd'),
                dayOfWeek,
                numCourts,
                minutesPerCourt,
                totalAvailableMinutes,
                totalBookedMinutes,
                dayEventsCount: dayEvents.length,
                validEventsCount: validEvents.length,
                isFull: totalBookedMinutes >= (totalAvailableMinutes - tolerance),
                events: validEvents.map(e => ({
                    start: `${Math.floor(e.start / 60)}:${String(e.start % 60).padStart(2, '0')}`,
                    end: `${Math.floor(e.end / 60)}:${String(e.end % 60).padStart(2, '0')}`,
                    duration: e.duration
                }))
            });
        }

        // Nếu tổng số phút đã book >= (tổng số phút khả dụng - tolerance), coi là full
        // Điều này có nghĩa là nếu đã book gần như toàn bộ thời gian khả dụng, coi là full
        return totalBookedMinutes >= (totalAvailableMinutes - tolerance);
    };

    // Format header: "Dec 01 - Dec 07"
    const weekHeader = `${format(weekDays[0], 'MMM dd')} - ${format(weekDays[6], 'MMM dd')}`;

    return (
        <div
            className="h-screen pt-20 xs:pt-20 sm:pt-20 md:pt-16 relative overflow-hidden"
            style={{
                backgroundImage: `url(${pageBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        >
            {/* Overlay để đảm bảo nội dung dễ đọc */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-none"></div>
            <div className="relative z-10 mx-auto p-1 sm:p-2 md:p-4 lg:p-6 h-full flex flex-col">
                <Card className="border-white shadow-lg bg-background/10 backdrop-blur-sm flex flex-col h-full overflow-hidden">
                    <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b bg-background/40 backdrop-blur-sm">
                            <button
                                onClick={() => setActiveTab('booking')}
                                className={`flex-1 px-4 py-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'booking'
                                    ? 'bg-primary text-white border-b-2 border-primary'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                                    }`}
                            >
                                {t('pickleball_booking_tab') || 'Đặt Lịch'}
                            </button>
                            <button
                                onClick={() => setActiveTab('report')}
                                className={`flex-1 px-4 py-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'report'
                                    ? 'bg-primary text-white border-b-2 border-primary'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                                    }`}
                            >
                                {t('pickleball_report_tab') || 'Report'}
                            </button>
                        </div>

                        {/* Header với title và buttons */}
                        <div className="p-2 sm:p-4 border-b bg-background/40 backdrop-blur-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-0">
                                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary">
                                    {activeTab === 'booking' ? t('pickleball_booking') : (t('pickleball_report_tab') || 'Report')}
                                </CardTitle>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button
                                        onClick={handleSearch}
                                        className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                                        size="sm"
                                        disabled={loading}
                                    >
                                        <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base">{t('search')}</span>
                                    </Button>
                                    {activeTab === 'booking' && (
                                        <Button
                                            onClick={openAddEventDialog}
                                            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                                            size="sm"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base">{t('pickleball_add_booking')}</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Header với navigation */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-4 border-b bg-background/40 backdrop-blur-sm gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                <Button variant="outline" size="sm" onClick={goToPrevWeek} className="h-8 w-8 p-0">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm sm:text-lg md:text-2xl font-semibold px-2">{weekHeader}</div>
                                <Button variant="outline" size="sm" onClick={goToNextWeek} className="h-8 w-8 p-0">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-2 text-xs sm:text-sm ml-1 sm:ml-2">
                                    {t('today')}
                                </Button>
                            </div>
                            {/* Chú thích màu sắc - chỉ hiển thị khi tab booking */}
                            {activeTab === 'booking' && (
                                <div className="hidden sm:flex items-center gap-4 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                        <span className="text-gray-700">{t('pickleball_available') || 'Còn chỗ'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                        <span className="text-gray-700">{t('pickleball_full')}</span>
                                    </div>
                                </div>
                            )}
                            {/* Chú thích số lượng booking - chỉ hiển thị khi tab report */}
                            {/* {activeTab === 'report' && (
                                <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs sm:text-sm font-extrabold bg-red-600 text-white rounded-full px-2 py-0.5 inline-block">1</span>
                                        <span className="text-gray-700">{t('pickleball_booking_count_legend')}</span>
                                    </div>
                                </div>
                            )} */}
                        </div>

                        {/* Tab Content */}

                        {/* Tab Content */}
                        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                            {activeTab === 'booking' && (
                                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden flex flex-col -mx-2 sm:mx-0">
                                    <div className="min-w-[700px] sm:min-w-0 flex-1 flex flex-col min-h-0">
                                        {/* Day Headers */}
                                        <div className="grid grid-cols-7 border-b flex-shrink-0">
                                            {weekDays.map((day, index) => {
                                                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                const isTodayDate = isToday(day);
                                                const past = isPastDate(day);
                                                const dayFull = !past && isDayFull(day);
                                                // Ưu tiên màu đỏ khi full, bất kể có phải today hay không
                                                const textColor = past ? 'text-gray-400' :
                                                    dayFull ? 'text-red-600' :
                                                        isTodayDate ? 'text-blue-600' : 'text-green-600';
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`p-1 sm:p-2 border-r text-center ${isTodayDate ? 'bg-blue-100/60 backdrop-blur-sm font-bold' : 'bg-gray-50/60 backdrop-blur-sm'}`}
                                                    >
                                                        <div className="text-[10px] sm:text-xs text-gray-600">{dayNames[index]}</div>
                                                        <div className={`text-xs sm:text-sm md:text-lg font-semibold ${textColor}`}>
                                                            {format(day, 'MM/dd')}
                                                        </div>
                                                        {!past && (
                                                            <div className={`text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 ${dayFull ? 'text-red-500' : 'text-green-500'
                                                                }`}>
                                                                {/* {dayFull ? t('pickleball_full') : ''} */}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Day Columns with Events */}
                                        <div
                                            className="grid grid-cols-7 border-b pickleball-day-columns"
                                            style={{ maxHeight: 'calc(100vh - 365px)' }}
                                        >
                                            {weekDays.map((day, dayIndex) => {
                                                const dayEvents = getEventsForDay(day);
                                                const past = isPastDate(day);

                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className={`p-0 border-r flex flex-col pickleball-day-cell  ${past ? 'bg-gray-100/40 backdrop-blur-sm opacity-50' : 'bg-white/60 backdrop-blur-sm'} ${isToday(day) ? 'bg-blue-50/60 backdrop-blur-sm' : ''}`}
                                                        style={{
                                                            cursor: past ? 'not-allowed' : 'pointer',
                                                            maxHeight: 'calc(100vh - 365px)'
                                                        }}
                                                        onClick={() => !past && handleDayClick(day)}
                                                    >
                                                        {/* Events container - có thể cuộn */}
                                                        <div className="flex-1 space-y-1 sm:space-y-2 overflow-y-auto min-h-0 p-1 sm:p-2 pr-0.5 sm:pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                                            {dayEvents.length > 0 && (
                                                                dayEvents.map((event, eventIndex) => (
                                                                    <div
                                                                        key={event.id || eventIndex}
                                                                        className="rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-xs cursor-pointer hover:scale-[1.02] transition-all duration-200 shadow-md border border-white/30 sm:border-2 relative overflow-hidden"
                                                                        style={{
                                                                            backgroundColor: event.bgColor || colorSwatches[0],
                                                                            backgroundSize: 'cover, cover, cover',
                                                                            backgroundPosition: 'center, center, center',
                                                                            backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
                                                                            backgroundBlendMode: 'normal, multiply, overlay',
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEventClick(event);
                                                                        }}
                                                                    >
                                                                        {/* Decorative corner accent */}
                                                                        <div
                                                                            className="absolute top-0 right-0 w-8 h-8 sm:w-16 sm:h-16 opacity-30"
                                                                            style={{
                                                                                background: `linear-gradient(135deg, transparent 0%, ${event.bgColor || colorSwatches[0]} 100%)`,
                                                                            }}
                                                                        />

                                                                        {/* Content */}
                                                                        <div className="relative z-10">
                                                                            <div className="font-extrabold text-xs sm:text-sm md:text-2xl text-gray-900 drop-shadow-sm whitespace-nowrap">
                                                                                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                                                                            </div>
                                                                            <div className="text-[8px] sm:text-xs md:text-lg text-gray-800 sm:font-semibold font-light truncate drop-shadow-sm text-right mt-0.5 sm:mt-1">{event.title}</div>
                                                                            {/* {event.court && (
                                                                        <div className="text-gray-700 text-[10px] mt-1 truncate">
                                                                            {event.court}
                                                                        </div>
                                                                    )} */}
                                                                        </div>

                                                                        {/* Bottom accent line */}
                                                                        <div
                                                                            className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 opacity-70"
                                                                            style={{
                                                                                background: `linear-gradient(90deg, transparent 0%, ${event.bgColor || colorSwatches[0]} 50%, transparent 100%)`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                        {/* Click to add event - luôn ở bottom */}
                                                        {!past && (
                                                            <div className="text-[10px] sm:text-xs text-gray-400 text-center py-1 sm:py-2 px-1 sm:px-2 border-t border-gray-200 flex-shrink-0 flex items-center justify-center gap-1 hover:text-primary transition-colors bg-white/80 backdrop-blur-sm">
                                                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                <span>{t('pickleball_click_to_add_event')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'report' && (
                                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto p-1 sm:p-2 md:p-4">
                                    <GanttChart
                                        weekDays={weekDays}
                                        events={events}
                                        format={format}
                                        t={t}
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Popup thêm event */}
            <AddEventDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={handleAddEvent}
                initialStartDate={startDate}
                initialEndDate={endDate}
                initialStartTime={startTime}
                initialEndTime={endTime}
                colorSwatches={colorSwatches}
                events={events}
                courts={pickleballCourts}
                isHoliday={isHoliday}
            />

            {/* Popup chi tiết event */}
            <AnimatePresence>
                {isEventDetailOpen && selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-lg"
                        onClick={() => setIsEventDetailOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl md:text-2xl lg:text-3xl">{t('pickleball_booking_detail')}</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEventDetailOpen(false)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 md:space-y-8 p-4 md:p-8 lg:p-10">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                            <FileText className="h-4 w-4 text-primary" />
                                            {t('pickleball_booking_title')}
                                        </Label>
                                        <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6 font-bold">{selectedEvent.title}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                            <Clock className="h-4 w-4 text-primary" />
                                            {t('pickleball_time')}
                                        </Label>
                                        <div className="pl-6 space-y-1">
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-semibold">{t('pickleball_date')}</span> {format(selectedEvent.start, 'dd/MM/yyyy')}
                                            </p>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-semibold">{t('pickleball_time_label')}</span> {format(selectedEvent.start, 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedEvent.description && (
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {t('pickleball_description')}
                                            </Label>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6">{selectedEvent.description}</p>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="flex justify-end space-x-2 p-4 md:p-8 lg:p-10 pt-0">
                                    {(() => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const eventDate = new Date(selectedEvent.start);
                                        eventDate.setHours(0, 0, 0, 0);
                                        const isPastEvent = eventDate < today;

                                        // Lấy thông tin user đăng nhập
                                        const userInfo = getCurrentUserInfo();
                                        const currentUserEmpId = userInfo.empId;

                                        // Kiểm tra emp_id của event (có thể là cardNumber hoặc userId)
                                        const eventEmpId = selectedEvent.cardNumber || selectedEvent.userId;
                                        const isOwner = currentUserEmpId && eventEmpId &&
                                            String(currentUserEmpId).trim() === String(eventEmpId).trim();

                                        // Chỉ hiển thị nút xóa nếu: không phải event quá khứ VÀ là chủ sở hữu
                                        if (!isPastEvent && isOwner) {
                                            return (
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDeleteEvent}
                                                    size="lg"
                                                    className="px-6 py-3 text-lg font-bold flex items-center gap-2"
                                                >
                                                    <Trash className="h-5 w-5" />
                                                    {t('pickleball_delete')}
                                                </Button>
                                            );
                                        }
                                        return null;
                                    })()}
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEventDetailOpen(false)}
                                        size="lg"
                                        className="px-6 py-3 text-lg font-bold flex items-center gap-2"
                                    >
                                        <X className="h-5 w-5" />
                                        {t('btn_close')}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PickleballBooking;
