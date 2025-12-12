import React, { useState, useEffect } from 'react';
import { format, addDays, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, getDaysInMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import './TemporaryResidence.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Plus, X, Trash, FileText, User, PlaneTakeoff } from 'lucide-react';
import AddEventDialog from './components/AddEventDialog';
import { useTranslation } from 'react-i18next';
import {
    getTemporaryResidenceEvents,
    saveTemporaryResidenceEvent,
    deleteTemporaryResidenceEvent,
} from '../../api/temporaryResidence';
import { MonthPickerPopover } from '../../components/ui/month-picker';
import pageBackground from '../../assets/images/house_bg.webp';
import dayjs from 'dayjs';

const TemporaryResidence = () => {
    const { t } = useTranslation();

    // Danh sách màu cho booking events
    const colorSwatches = [
        '#8b5cf6', // Purple - Màu chính
        '#FFB6C1', // Light Pink
        '#FFD700', // Gold
        '#90EE90', // Light Green
        '#87CEFA', // Light Sky Blue
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

            // Sắp xếp events theo thời gian bắt đầu
            dayEvents.sort((a, b) => {
                return a.start.getTime() - b.start.getTime();
            });

            // Gán màu theo thứ tự
            dayEvents.forEach((event, index) => {
                const colorIndex = index % colorSwatches.length;
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
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(() => {
        return new Date();
    });
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return format(now, 'yyyy-MM-dd');
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        return format(now, 'yyyy-MM-dd');
    });

    // Tạo mảng các ngày trong tháng
    const monthDays = React.useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }, [currentMonth]);

    // Load events on mount and when month changes
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load events for current month
                const monthStart = startOfMonth(currentMonth);
                const monthEnd = endOfMonth(currentMonth);

                const fromDate = format(monthStart, 'yyyy-MM-dd');
                const toDate = format(monthEnd, 'yyyy-MM-dd');
                const eventsData = await getTemporaryResidenceEvents(fromDate, toDate);
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

        loadData();
    }, [currentMonth]);

    // Lấy events cho một ngày cụ thể
    const getEventsForDay = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return events.filter(event => {
            const eventStartKey = format(event.start, 'yyyy-MM-dd');
            const eventEndKey = format(event.end, 'yyyy-MM-dd');
            // Event nằm trong ngày nếu start hoặc end trùng với ngày, hoặc ngày nằm trong khoảng start-end
            return eventStartKey === dateKey ||
                eventEndKey === dateKey ||
                (eventStartKey <= dateKey && eventEndKey >= dateKey);
        }).sort((a, b) => {
            return a.start.getTime() - b.start.getTime();
        });
    };

    // Group events theo userName
    const getEventsByUser = React.useMemo(() => {
        const eventsByUser = {};
        events.forEach(event => {
            const userName = event.userName || 'Unknown';
            if (!eventsByUser[userName]) {
                eventsByUser[userName] = [];
            }
            eventsByUser[userName].push(event);
        });
        return eventsByUser;
    }, [events]);

    // Lấy events của một user cho một ngày cụ thể
    const getUserEventsForDay = (userName, date) => {
        const userEvents = getEventsByUser[userName] || [];
        const dateKey = format(date, 'yyyy-MM-dd');
        return userEvents.filter(event => {
            const eventStartKey = format(event.start, 'yyyy-MM-dd');
            const eventEndKey = format(event.end, 'yyyy-MM-dd');
            return eventStartKey === dateKey ||
                eventEndKey === dateKey ||
                (eventStartKey <= dateKey && eventEndKey >= dateKey);
        });
    };

    // Hàm nhóm các periods liền kề
    const groupConsecutivePeriods = (events) => {
        if (!events || events.length === 0) return [];

        // Sắp xếp events theo start date
        const sortedEvents = [...events].sort((a, b) => 
            a.start.getTime() - b.start.getTime()
        );

        const groupedPeriods = [];
        let currentGroup = {
            start: sortedEvents[0].start,
            end: sortedEvents[0].end
        };

        for (let i = 1; i < sortedEvents.length; i++) {
            // Lấy end date của group hiện tại và start date của event tiếp theo
            const prevEndDate = new Date(currentGroup.end);
            prevEndDate.setHours(0, 0, 0, 0);
            
            const nextStartDate = new Date(sortedEvents[i].start);
            nextStartDate.setHours(0, 0, 0, 0);
            
            // Tính số ngày chênh lệch (end date + 1 ngày = start date tiếp theo)
            // Ví dụ: end 05/01, start tiếp theo 06/01 => chênh lệch 1 ngày (liền kề)
            const prevEndPlusOne = addDays(prevEndDate, 1);
            const daysDiff = Math.floor((nextStartDate - prevEndPlusOne) / (1000 * 60 * 60 * 24));

            // Nếu liền kề (chênh lệch <= 0 ngày, tức là nextStart <= prevEnd + 1), merge vào group hiện tại
            if (daysDiff <= 0) {
                // Cập nhật end date nếu event mới có end date lớn hơn
                if (sortedEvents[i].end > currentGroup.end) {
                    currentGroup.end = sortedEvents[i].end;
                }
            } else {
                // Không liền kề (có khoảng cách), lưu group hiện tại và bắt đầu group mới
                groupedPeriods.push({ ...currentGroup });
                currentGroup = {
                    start: sortedEvents[i].start,
                    end: sortedEvents[i].end
                };
            }
        }

        // Thêm group cuối cùng
        groupedPeriods.push(currentGroup);

        return groupedPeriods;
    };

    // Xử lý click vào ngày để thêm event
    const handleDayClick = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const slotDate = new Date(date);
        slotDate.setHours(0, 0, 0, 0);
        if (slotDate < today) {
            return;
        }

        const dateStr = format(date, 'yyyy-MM-dd');
        setStartDate(dateStr);
        setEndDate(dateStr);
        setIsDialogOpen(true);
    };

    // Xử lý click vào event để xem chi tiết
    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsEventDetailOpen(true);
    };

    // Navigation tháng
    const goToPrevMonth = () => {
        const prevMonth = new Date(currentMonth);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        setCurrentMonth(prevMonth);
    };

    const goToNextMonth = () => {
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setCurrentMonth(nextMonth);
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    const handleMonthChange = (date) => {
        if (date) {
            setCurrentMonth(date);
        }
    };

    // Hàm xử lý search
    const handleSearch = async () => {
        setLoading(true);
        try {
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);

            const fromDate = format(monthStart, 'yyyy-MM-dd');
            const toDate = format(monthEnd, 'yyyy-MM-dd');

            if (!fromDate || !toDate || fromDate === 'Invalid Date' || toDate === 'Invalid Date') {
                setLoading(false);
                return;
            }

            const eventsData = await getTemporaryResidenceEvents(fromDate, toDate);
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

    const openAddEventDialog = () => {
        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd');
        setStartDate(dateStr);
        setEndDate(dateStr);
        setIsDialogOpen(true);
    };

    const handleAddEvent = async (eventsData) => {
        const userInfo = getCurrentUserInfo();

        try {
            for (const eventData of eventsData) {
                const eventPayload = {
                    id: null,
                    startDate: format(eventData.start, 'yyyy-MM-dd'),
                    endDate: format(eventData.end, 'yyyy-MM-dd'),
                    title: eventData.title || 'Temporary Residence Registration', // Title mặc định
                    color: eventData.bgColor || colorSwatches[0],
                    description: eventData.description || '',
                    department: eventData.department || userInfo.department,
                    userId: eventData.cardNumber || userInfo.empId,
                    empId: userInfo.empId, // Thêm EMP_ID
                    userLogin: userInfo.userLogin,
                };

                if (!eventPayload.userId || !eventPayload.userLogin || !eventPayload.empId) {
                    throw new Error('Thiếu thông tin người dùng. Vui lòng đăng nhập lại!');
                }

                console.log('eventPayload', eventPayload);
                const result = await saveTemporaryResidenceEvent(eventPayload);

                // Kiểm tra nếu có lỗi rõ ràng trong response
                if (result && result.success === false) {
                    const errorMsg = result.error?.message || result.error || 'Có lỗi xảy ra khi lưu sự kiện';
                    throw new Error(errorMsg);
                }

                // Log để debug (chỉ trong development)
                if (process.env.NODE_ENV === 'development') {
                    console.log('Save event result:', result);
                }
            }

            setIsDialogOpen(false);

            // Reload events ngay lập tức để cập nhật danh sách booking
            try {
                const monthStart = startOfMonth(currentMonth);
                const monthEnd = endOfMonth(currentMonth);

                const fromDate = format(monthStart, 'yyyy-MM-dd');
                const toDate = format(monthEnd, 'yyyy-MM-dd');

                // Thêm một chút delay nhỏ để đảm bảo database đã commit
                await new Promise(resolve => setTimeout(resolve, 200));

                // Reload events để cập nhật dữ liệu mới nhất
                const reloadedEvents = await getTemporaryResidenceEvents(fromDate, toDate);
                const eventsWithColors = assignColorsToEvents(reloadedEvents || []);
                setEvents(eventsWithColors);

                if (process.env.NODE_ENV === 'development') {
                    console.log('Events reloaded after save:', eventsWithColors.length, 'events');
                }
            } catch (reloadError) {
                console.error('Error reloading events after save:', reloadError);
            }
        } catch (error) {
            console.error('Error saving event:', error);
            let errorMessage = 'Có lỗi xảy ra khi lưu sự kiện. Vui lòng thử lại!';

            if (error.message) {
                if (error.message.includes('conflict') || error.message.includes('trùng')) {
                    errorMessage = 'Khoảng thời gian này đã có khai báo. Vui lòng chọn khoảng thời gian khác!';
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
                const result = await deleteTemporaryResidenceEvent(selectedEvent.id);

                if (result && result.success) {
                    setIsEventDetailOpen(false);
                    setSelectedEvent(null);

                    // Reload events for current month
                    const monthStart = startOfMonth(currentMonth);
                    const monthEnd = endOfMonth(currentMonth);

                    const fromDate = format(monthStart, 'yyyy-MM-dd');
                    const toDate = format(monthEnd, 'yyyy-MM-dd');
                    const reloadedEvents = await getTemporaryResidenceEvents(fromDate, toDate);
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

    // Format header: "December 2024"
    const monthHeader = format(currentMonth, 'MMMM yyyy');
    const userNames = Object.keys(getEventsByUser).sort();

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
                        {/* Header với title và buttons */}
                        <div className="p-2 sm:p-4 border-b bg-background/40 backdrop-blur-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-0">
                                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary">
                                    {t('temporary_residence_title') || 'Khai Báo Tạm Trú Tạm Vắng'}
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
                                    <Button
                                        onClick={openAddEventDialog}
                                        className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                                        size="sm"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base">{t('register_now') || 'Đăng Ký Ngay'}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Header với navigation */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-4 border-b bg-background/40 backdrop-blur-sm gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                                <Button variant="outline" size="sm" onClick={goToPrevMonth} className="h-8 w-8 p-0 flex-shrink-0">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <MonthPickerPopover value={currentMonth} onChange={handleMonthChange} />
                                <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-8 w-8 p-0 flex-shrink-0">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-2 text-xs sm:text-sm flex-shrink-0">
                                    {t('today')}
                                </Button>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto flex flex-col">
                            <div className="min-w-full">
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                                        <tr>
                                            <th className="border p-2 text-left font-semibold bg-gray-50/60 backdrop-blur-sm min-w-[150px] sticky left-0 z-20">
                                                {t('meeting_room_booker_name') || 'Người đăng ký'}
                                            </th>
                                            <th className="border p-2 text-left font-semibold bg-gray-50/60 backdrop-blur-sm min-w-[200px] sticky left-[150px] z-20">
                                                {t('period') || 'Period'}
                                            </th>
                                            {monthDays.map((day, index) => {
                                                const isTodayDate = isToday(day);
                                                const past = isPastDate(day);
                                                const textColor = past ? 'text-gray-400' :
                                                    isTodayDate ? 'text-blue-600' : 'text-green-600';
                                                return (
                                                    <th
                                                        key={index}
                                                        className={`border p-1 sm:p-2 text-center font-semibold min-w-[80px] relative z-0 ${isTodayDate ? 'bg-blue-100/60 backdrop-blur-sm' : 'bg-gray-50/60 backdrop-blur-sm'}`}
                                                    >
                                                        <div className="text-[10px] sm:text-xs text-gray-600">{format(day, 'EEE')}</div>
                                                        <div className={`text-xs sm:text-sm md:text-base ${textColor}`}>
                                                            {format(day, 'dd')}
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userNames.length > 0 ? (
                                            userNames.map((userName, userIndex) => {
                                                // Lấy tất cả events của user
                                                const userEvents = getEventsByUser[userName] || [];
                                                // Nhóm các periods liền kề
                                                const groupedPeriods = groupConsecutivePeriods(userEvents);
                                                
                                                return (
                                                <tr key={userIndex} className="hover:bg-gray-50/30">
                                                    <td className="border p-2 font-medium bg-gray-50/40 backdrop-blur-sm sticky left-0 z-15 align-top">
                                                        {userName}
                                                    </td>
                                                    <td className="border p-2 font-medium bg-gray-50/40 backdrop-blur-sm sticky left-[150px] z-15 align-top">
                                                        {groupedPeriods.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {groupedPeriods.map((period, periodIdx) => (
                                                                    <div 
                                                                        key={periodIdx}
                                                                        className="text-xs sm:text-sm text-gray-700 whitespace-nowrap"
                                                                    >
                                                                        {format(period.start, 'dd/MM/yyyy')} - {format(period.end, 'dd/MM/yyyy')}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs sm:text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    {monthDays.map((day, dayIndex) => {
                                                        const userDayEvents = getUserEventsForDay(userName, day);
                                                        const past = isPastDate(day);
                                                        const isTodayDate = isToday(day);

                                                        return (
                                                            <td
                                                                key={dayIndex}
                                                                className={`py-1 sm:py-2 text-center align-top min-h-[60px] relative z-0 ${past ? 'bg-gray-100/40 backdrop-blur-sm opacity-50' : 'bg-white/60 backdrop-blur-sm'} ${isTodayDate ? 'bg-blue-50/60 backdrop-blur-sm' : ''}`}
                                                                style={{
                                                                    cursor: past ? 'not-allowed' : 'pointer',
                                                                    zIndex: -1,
                                                                }}
                                                                onClick={() => !past && handleDayClick(day)}
                                                            >
                                                                {userDayEvents.length > 0 && (
                                                                    <div className="space-y-1 relative" style={{ zIndex: 0 }}>
                                                                        {userDayEvents.map((event, eventIndex) => (
                                                                            <div
                                                                                key={event.id || eventIndex}
                                                                                className=" text-[10px] sm:text-xs cursor-pointer relative overflow-hidden"
                                                                                style={{
                                                                                    backgroundColor: "navy",
                                                                                    zIndex: 0,
                                                                                    position: "relative",
                                                                                }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleEventClick(event);
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center justify-center" style={{ zIndex: 0 }} title={`${format(event.start, 'dd/MM/yyyy')} - ${format(event.end, 'dd/MM/yyyy')}`}>
                                                                                    <PlaneTakeoff style={{
                                                                                        color:"navy",
                                                                                    }} className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow-sm" />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={monthDays.length + 2} className="border p-4 text-center text-gray-500">
                                                    {t('no_data') || 'Không có dữ liệu'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
                colorSwatches={colorSwatches}
                events={events}
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
                                        <CardTitle className="text-xl md:text-2xl lg:text-3xl">{t('temporary_residence_title') || 'Chi Tiết Khai Báo'}</CardTitle>
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

                                    {selectedEvent.userName && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                                <User className="h-4 w-4 text-primary" />
                                                {t('temporary_residence_booker_name') || 'Người đăng ký'}
                                            </div>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6 font-bold">{selectedEvent.userName}</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                            <CalendarIcon className="h-4 w-4 text-primary" />
                                            {t('meeting_room_date') || 'Ngày'}
                                        </div>
                                        <div className="pl-6 space-y-1">
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-extrabold">{t('meeting_room_booking_from') || 'Từ'}</span> {format(selectedEvent.start, 'dd/MM/yyyy')}
                                            </p>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-extrabold">{t('meeting_room_booking_to') || 'Đến'}</span> {format(selectedEvent.end, 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedEvent.department && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                                <User className="h-4 w-4 text-primary" />
                                                {t('frm_depart') || 'Phòng ban'}
                                            </div>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6 font-bold">{selectedEvent.department}</p>
                                        </div>
                                    )}

                                    {selectedEvent.description && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {t('meeting_room_description') || 'Mô tả'}
                                            </div>
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
                                        const currentUserEmpId = userInfo?.empId || '';

                                        // Kiểm tra emp_id của event
                                        const eventEmpId = selectedEvent.cardNumber || selectedEvent.userId || '';

                                        // So sánh case-insensitive và trim
                                        const currentUserEmpIdNormalized = String(currentUserEmpId).trim().toUpperCase();
                                        const eventEmpIdNormalized = String(eventEmpId).trim().toUpperCase();
                                        const isOwner = currentUserEmpIdNormalized && eventEmpIdNormalized &&
                                            currentUserEmpIdNormalized === eventEmpIdNormalized;

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
                                                    {t('meeting_room_delete') || 'Xóa'}
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

export default TemporaryResidence;

