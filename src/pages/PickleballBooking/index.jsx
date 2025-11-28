import React, { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
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
    
    // Cấu hình danh sách sân Pickleball (có thể dễ dàng thay đổi)
    const pickleballCourts = Array.from({ length: 10 }, (_, i) => ({
        value: `Pickleball Court ${i + 1}`,
        label: `Pickleball Court ${i + 1}`
    }));

    const eventTitles = [
        'Chơi Pickleball buổi sáng', 'Chơi Pickleball buổi chiều', 'Giải đấu Pickleball', 'Luyện tập Pickleball',
        'Chơi Pickleball với bạn bè', 'Chơi Pickleball cuối tuần', 'Giải đấu nội bộ', 'Luyện tập cá nhân',
        'Chơi Pickleball nhóm', 'Chơi Pickleball đơn', 'Chơi Pickleball đôi', 'Chơi Pickleball giải trí'
    ];
    const colorSwatches = [
        '#FFB6C1', '#FFD700', '#90EE90', '#87CEFA', '#FFA07A', '#DDA0DD', '#00CED1', '#FF69B4', '#B0E0E6', '#F08080',
        '#FFDAB9', '#E6E6FA', '#FFFACD', '#C1FFC1', '#ADD8E6', '#A0522D', '#40E0D0', '#FF6347', '#7B68EE', '#FF8C00'
    ];
    function randomInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function randomPick(arr) { return arr[randomInt(0, arr.length - 1)]; }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const eventsMock = Array.from({ length: 50 }, (_, i) => {
        const day = randomInt(1, 28);
        const startHour = randomInt(7, 15);
        const startMinute = [0, 15, 30, 45][randomInt(0, 3)];
        const endHour = Math.min(startHour + randomInt(1, 3), 17);
        const endMinute = startMinute;
        const start = new Date(year, month, day, startHour, startMinute);
        const end = new Date(year, month, day, endHour, endMinute);
        const court = randomPick(pickleballCourts);
        const title = randomPick(eventTitles) + ' ' + (i + 1);
        return {
            id: i + 1,
            court: court.value,
            title,
            cardNumber: randomInt(100000, 999999).toString(),
            start,
            end,
            description: `Mô tả cho sự kiện ${title}`,
            bgColor: randomPick(colorSwatches)
        };
    });
    const [events, setEvents] = useState(eventsMock);
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

    const handleSelectSlot = ({ start, end }) => {
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
        setStartTime(format(start, 'HH:mm'));
        setEndTime(format(end, 'HH:mm'));
        setIsDialogOpen(true);
    };
    const openAddEventDialog = () => {
        const now = new Date();
        setStartDate(format(now, 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        setStartTime('07:30');
        setEndTime('16:30');
        setIsDialogOpen(true);
    };
    const handleAddEvent = (eventsData) => {
        setEvents(prev => {
            let nextId = prev.length + 1;
            const newEvents = eventsData.map(ev => ({ ...ev, id: nextId++ }));
            return [...prev, ...newEvents];
        });
        setIsDialogOpen(false);
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

    const handleDeleteEvent = () => {
        if (selectedEvent) {
            setEvents(prev => prev.filter(event => event.id !== selectedEvent.id));
            setIsEventDetailOpen(false);
            setSelectedEvent(null);
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
            <div className="flex flex-col text-xs leading-tight max-h-[90px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
                {showTime && (<div className='text-blue-900 font-bold'>{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</div>)}
                <div className="font-mono font-bold truncate">
                    {event.court}: {event.title}
                </div>
            </div>
        );
    };

    const DateCellWrapper = ({ children }) => (
        <div style={{ maxHeight: 110, overflowY: 'auto' }} className="scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
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
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
            agenda: 'Lịch trình'
        };

        const messages = toolbar.messages || {
            previous: "Trước",
            today: "Hôm nay",
            next: "Tiếp"
        };

        return (
            <div className="flex items-center justify-between p-4 border-b bg-background">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={goToPrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        {messages.today}
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center space-x-2">
                    <MonthPickerPopover
                        value={selectedDate}
                        onChange={handleDateChange}
                    />
                </div>

                <div className="flex items-center space-x-1">
                    {toolbar.views && toolbar.views.map(view => (
                        <Button
                            key={view}
                            variant={toolbar.view === view ? "default" : "outline"}
                            size="sm"
                            onClick={() => toolbar.onView(view)}
                        >
                            {viewNames[view] || view}
                        </Button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background pt-20">
            <div className="mx-auto p-6">
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-3xl font-extrabold text-primary">{t('pickleball_booking')}</CardTitle>

                        <Button
                            onClick={openAddEventDialog}
                            className="bg-primary hover:bg-primary/90"
                            size="lg"
                        >
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {t('pickleball_add_booking')}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-2">
                        <div className="h-[calc(100vh-200px)]">
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
                                    next: "Tiếp",
                                    previous: "Trước",
                                    today: "Hôm nay",
                                    month: "Tháng",
                                    week: "Tuần",
                                    day: "Ngày",
                                    agenda: "Lịch trình",
                                    date: "Ngày",
                                    time: "Thời gian",
                                    event: "Sự kiện",
                                    noEventsInRange: "Không có sự kiện nào trong khoảng thời gian này.",
                                    showMore: total => `+ Xem thêm ${total} sự kiện`
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
                                            Thời gian
                                        </Label>
                                        <div className="pl-6 space-y-1">
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-semibold">Ngày:</span> {format(selectedEvent.start, 'dd/MM/yyyy')} đến {format(selectedEvent.end, 'dd/MM/yyyy')}
                                            </p>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-semibold">Giờ:</span> {format(selectedEvent.start, 'HH:mm')} đến {format(selectedEvent.end, 'HH:mm')}
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
                                        Xóa
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

