import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, subMonths, addMonths } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './PickleballBooking.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, FileText, X, Trash } from 'lucide-react';
import { MonthPickerPopover } from '../../components/ui/month-picker';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import AddEventDialog from './components/AddEventDialog';
import { useTranslation } from 'react-i18next';
import {
    getPickleballEvents,
    savePickleballEvent,
    deletePickleballEvent,
    getPickleballCourtList,
} from '../../api/pickleballBooking';

dayjs.extend(isSameOrBefore);

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

const PickleballBooking = () => {
    const { t } = useTranslation();
    
    const colorSwatches = [
        '#FFB6C1', '#FFD700', '#90EE90', '#87CEFA', '#FFA07A', '#DDA0DD', '#00CED1', '#FF69B4', '#B0E0E6', '#F08080',
        '#FFDAB9', '#E6E6FA', '#FFFACD', '#C1FFC1', '#ADD8E6', '#A0522D', '#40E0D0', '#FF6347', '#7B68EE', '#FF8C00'
    ];
    
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
    const [currentView, setCurrentView] = useState('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
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

    // Load events and courts on mount and when date changes
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load courts (with fallback to default court if API fails)
                const courts = await getPickleballCourtList();
                if (courts && courts.length > 0) {
                    setPickleballCourts(courts);
                }

                // Load events for current month ± 1 month
                // Returns empty array if API fails, which is fine
                const fromDate = format(subMonths(selectedDate, 1), 'yyyy-MM-dd');
                const toDate = format(addMonths(selectedDate, 1), 'yyyy-MM-dd');
                const eventsData = await getPickleballEvents(fromDate, toDate);
                setEvents(eventsData || []);
            } catch (error) {
                // This should rarely happen now since API functions handle errors gracefully
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Error loading data:', error);
                }
                // Ensure we have at least default court
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
    }, [selectedDate]);

    const handleSelectSlot = ({ start, end }) => {
        const startDateStr = format(start, 'yyyy-MM-dd');
        const endDateStr = format(end, 'yyyy-MM-dd');
        setStartDate(startDateStr);
        setEndDate(endDateStr);
        
        // Lấy thời gian từ slot, nhưng nếu không hợp lệ thì dùng default theo ngày
        const slotStartTime = format(start, 'HH:mm');
        const slotEndTime = format(end, 'HH:mm');
        
        // Tính toán thời gian mặc định dựa trên ngày bắt đầu
        const dayOfWeek = start.getDay(); // 0 = Sunday, 1-6 = Monday-Saturday
        const defaultStartTime = dayOfWeek === 0 ? '07:00' : '17:00';
        
        // Nếu thời gian từ slot hợp lệ (không phải 00:00 hoặc quá sớm), dùng nó
        // Ngược lại, dùng thời gian mặc định theo ngày
        const finalStartTime = (slotStartTime !== '00:00' && slotStartTime >= defaultStartTime) 
            ? slotStartTime 
            : defaultStartTime;
        
        // Tính toán endTime: nếu có slotEndTime hợp lệ và không quá 2 giờ, dùng nó
        // Ngược lại, tính từ startTime + 2 giờ
        let finalEndTime;
        if (slotEndTime !== '00:00' && slotEndTime > finalStartTime) {
            const startTimeObj = new Date(`2000-01-01T${finalStartTime}`);
            const endTimeObj = new Date(`2000-01-01T${slotEndTime}`);
            const maxEndTime = new Date(startTimeObj);
            maxEndTime.setHours(maxEndTime.getHours() + 2);
            
            // Nếu slotEndTime không quá 2 giờ, dùng nó
            if (endTimeObj <= maxEndTime) {
                finalEndTime = slotEndTime;
            } else {
                // Nếu quá 2 giờ, tính từ startTime + 2 giờ
                const calculatedEnd = new Date(startTimeObj);
                calculatedEnd.setHours(calculatedEnd.getHours() + 2);
                finalEndTime = format(calculatedEnd, 'HH:mm');
            }
        } else {
            // Tính từ startTime + 2 giờ
            const calculatedEnd = new Date(`2000-01-01T${finalStartTime}`);
            calculatedEnd.setHours(calculatedEnd.getHours() + 2);
            finalEndTime = format(calculatedEnd, 'HH:mm');
        }
        
        setStartTime(finalStartTime);
        setEndTime(finalEndTime);
        setIsDialogOpen(true);
    };
    const openAddEventDialog = () => {
        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd');
        setStartDate(dateStr);
        setEndDate(dateStr);
        
        // Tính toán thời gian bắt đầu dựa trên ngày: Chủ nhật = 07:00, ngày thường = 17:00
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1-6 = Monday-Saturday
        const defaultStartTime = dayOfWeek === 0 ? '07:00' : '17:00';
        
        // Tính toán endTime = startTime + 2 giờ
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
            // Save each event to API
            for (const eventData of eventsData) {
                // Use stored startTime/endTime if available, otherwise format from Date
                const eventStartTime = eventData.startTime || format(eventData.start, 'HH:mm');
                const eventEndTime = eventData.endTime || format(eventData.end, 'HH:mm');
                
                const eventPayload = {
                    id: null, // New event - null for insert
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
                
                // Validate required fields
                if (!eventPayload.userId || !eventPayload.userLogin) {
                    throw new Error('Thiếu thông tin người dùng. Vui lòng đăng nhập lại!');
                }
                if (!eventPayload.court) {
                    throw new Error('Vui lòng chọn sân Pickleball!');
                }

                const result = await savePickleballEvent(eventPayload);
                
                // Check if save was successful
                if (result && !result.success) {
                    const errorMsg = result.error?.message || result.error || 'Có lỗi xảy ra khi lưu sự kiện';
                    throw new Error(errorMsg);
                }
            }
            
            setIsDialogOpen(false);
            
            // Reload events to ensure consistency
            const fromDate = format(subMonths(selectedDate, 1), 'yyyy-MM-dd');
            const toDate = format(addMonths(selectedDate, 1), 'yyyy-MM-dd');
            const reloadedEvents = await getPickleballEvents(fromDate, toDate);
            setEvents(reloadedEvents);
        } catch (error) {
            console.error('Error saving event:', error);
            
            // Show user-friendly error message
            let errorMessage = t('pickleball_conflict_error') || 'Có lỗi xảy ra khi lưu sự kiện. Vui lòng thử lại!';
            
            if (error.message) {
                // If error message is in English, try to translate or use Vietnamese
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

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setIsEventDetailOpen(true);
    };

    const handleViewChange = (view) => {
        setCurrentView(view);
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    const handleDeleteEvent = async () => {
        if (selectedEvent && selectedEvent.id) {
            try {
                const result = await deletePickleballEvent(selectedEvent.id);
                
                if (result && result.success) {
                    setEvents(prev => prev.filter(event => event.id !== selectedEvent.id));
                    setIsEventDetailOpen(false);
                    setSelectedEvent(null);
                } else {
                    alert('Có lỗi xảy ra khi xóa sự kiện. Vui lòng thử lại!');
                }
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Có lỗi xảy ra khi xóa sự kiện. Vui lòng thử lại!');
            }
        }
    };

    const eventStyleGetter = (event) => {
        return {
            style: {
                backgroundColor: event.bgColor || 'hsl(var(--primary))',
                borderRadius: '6px',
                opacity: 0.9,
                color: '#222',
                border: '0px',
                display: 'block',
                padding: '2px 4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
            }
        };
    };

    const CustomEvent = ({ event }) => {
        const showTime = currentView === 'month';
        return (
            <div className="flex flex-col text-[10px] sm:text-xs leading-tight max-h-[70px] sm:max-h-[90px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
                {showTime && (
                    <div className='text-blue-900 font-bold text-[9px] sm:text-xs'>
                        {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                    </div>
                )}
                <div className="font-mono font-bold truncate text-[9px] sm:text-xs">
                    <span className="hidden sm:inline">{event.court}: </span>
                    <span className="sm:hidden">{event.court?.substring(0, 2) || ''}: </span>
                    {event.title}
                </div>
            </div>
        );
    };

    const DateCellWrapper = ({ children }) => (
        <div className="scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent" style={{ maxHeight: 110, overflowY: 'auto' }}>
            {children}
        </div>
    );

    const CustomToolbar = (toolbar) => {
        const goToToday = () => {
            toolbar.onNavigate('TODAY');
        };

        const goToPrev = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

            const viewNames = {
                month: t('month'),
                week: t('week'),
                day: t('day'),
                agenda: t('agenda')
            };

        const messages = toolbar.messages || {
            previous: t('previous'),
            today:  t('today'),
            next: t('next')
        };

        return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2 sm:p-4 border-b bg-background">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button variant="outline" size="sm" onClick={goToPrev} className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">{t('previous')}</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                            {messages.today}
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToNext} className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                            <ChevronRight className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">{t('next')}</span>
                        </Button>
                    </div>
                    <div className="flex items-center flex-1 sm:flex-initial">
                        <MonthPickerPopover
                            value={selectedDate}
                            onChange={handleDateChange}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-1 w-full sm:w-auto justify-end sm:justify-start">
                    {toolbar.views && toolbar.views.map(view => (
                        <Button
                            key={view}
                            variant={toolbar.view === view ? "default" : "outline"}
                            size="sm"
                            onClick={() => toolbar.onView(view)}
                            className="h-8 px-2 sm:px-3 text-xs sm:text-sm flex-1 sm:flex-initial"
                        >
                            <span className="hidden sm:inline">{viewNames[view] || view}</span>
                            <span className="sm:hidden">{viewNames[view]?.charAt(0) || view.charAt(0)}</span>
                        </Button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background pt-16 sm:pt-20">
            <div className="mx-auto p-2 sm:p-4 md:p-6">
                <div className="mb-2 sm:mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary">{t('pickleball_booking')}</CardTitle>

                        <Button
                            onClick={openAddEventDialog}
                            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                            size="sm"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-sm sm:text-base">{t('pickleball_add_booking')}</span>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-1 sm:p-2">
                        <div className="h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] md:h-[calc(100vh-220px)]">
                            <BigCalendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: '100%' }}
                                selectable
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                                eventPropGetter={eventStyleGetter}
                                views={['month', 'week', 'day', 'agenda']}
                                view={currentView}
                                onView={handleViewChange}
                                defaultView="month"
                                date={selectedDate}
                                onNavigate={handleDateChange}
                                components={{
                                    toolbar: CustomToolbar,
                                    event: CustomEvent,
                                    dateCellWrapper: DateCellWrapper
                                }}
                                messages={{
                                    next: t('next'),
                                    previous: t('previous'),
                                    today: t('today'),
                                    month: t('month'),
                                    week: t('week'),
                                    day: t('day'),
                                    agenda: t('agenda'),
                                    date: t('date'),
                                    time: t('time'),
                                    event: t('event'),
                                    noEventsInRange: t('no_events_in_range'),
                                    showMore: total => t('show_more', { total })
                                }}
                                popup
                                culture='en-US'
                            />
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
                                            <User className="h-4 w-4 text-primary" />
                                            {t('pickleball_card_number')}
                                        </Label>
                                        <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6">{selectedEvent.cardNumber}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                            <CalendarIcon className="h-4 w-4 text-primary" />
                                            {t('pickleball_court')}
                                        </Label>
                                        <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6 font-bold">{selectedEvent.court}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                            <Clock className="h-4 w-4 text-primary" />
                                            {t('pickleball_time')}
                                        </Label>
                                        <div className="pl-6 space-y-1">
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-semibold">{t('pickleball_date')}</span> {format(selectedEvent.start, 'dd/MM/yyyy')} {t('pickleball_to')} {format(selectedEvent.end, 'dd/MM/yyyy')}
                                            </p>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-semibold">{t('pickleball_time_label')}</span> {format(selectedEvent.start, 'HH:mm')} {t('pickleball_to')} {format(selectedEvent.end, 'HH:mm')}
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
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteEvent}
                                        size="lg"
                                        className="px-6 py-3 text-lg font-bold flex items-center gap-2"
                                    >
                                        <Trash className="h-5 w-5" />
                                        {t('pickleball_delete')}
                                    </Button>
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

