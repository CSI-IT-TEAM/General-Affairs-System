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
import { DatePickerDay } from '../../../components/ui/date-picker-day';
import { useTranslation } from 'react-i18next';

dayjs.extend(isSameOrBefore);

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
    courts = []
}) => {
    const { t } = useTranslation();
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [startTime, setStartTime] = useState(initialStartTime);
    const [endTime, setEndTime] = useState(initialEndTime);
    const [color, setColor] = useState(colorSwatches[0]);

    // Combobox sân Pickleball có filter thực tế
    const [courtInput, setCourtInput] = useState("");
    const [openCourt, setOpenCourt] = useState(false);
    const filteredCourts = courts.filter(court =>
        court.label.toLowerCase().includes(courtInput.toLowerCase())
    );

    const formik = useFormik({
        initialValues: {
            title: '',
            cardNumber: '',
            court: courts.length > 0 ? courts[0].value : '',
            description: ''
        },
        onSubmit: (values, { resetForm }) => {
            if (!values.title || !values.cardNumber) {
                alert('Vui lòng điền đầy đủ thông tin!');
                return;
            }
            const startDay = dayjs(`${startDate}T${startTime}`, 'YYYY-MM-DDTHH:mm');
            const endDay = dayjs(`${endDate}T${endTime}`, 'YYYY-MM-DDTHH:mm');
            if (endDay.isBefore(startDay)) {
                alert('Thời gian kết thúc phải sau thời gian bắt đầu!');
                return;
            }
            // Tạo event cho từng ngày trong khoảng
            const eventsToAdd = [];
            let current = dayjs(startDate);
            const last = dayjs(endDate);
            let hasConflict = false;
            while (current.isSameOrBefore(last, 'day')) {
                const eventStart = current.hour(Number(startTime.split(':')[0])).minute(Number(startTime.split(':')[1])).second(0).millisecond(0);
                const eventEnd = current.hour(Number(endTime.split(':')[0])).minute(Number(endTime.split(':')[1])).second(0).millisecond(0);
                // Kiểm tra trùng giờ sân Pickleball
                const conflict = events.some(ev =>
                    ev.court === values.court &&
                    dayjs(ev.start).isSame(current, 'day') &&
                    (
                        (eventStart.isBefore(dayjs(ev.end)) && eventEnd.isAfter(dayjs(ev.start)))
                    )
                );
                if (conflict) {
                    hasConflict = true;
                    break;
                }
                eventsToAdd.push({
                    title: values.title,
                    cardNumber: values.cardNumber,
                    court: values.court,
                    start: eventStart.toDate(),
                    end: eventEnd.toDate(),
                    description: values.description,
                    bgColor: color
                });
                current = current.add(1, 'day');
            }
            if (hasConflict) {
                window.alert(t('pickleball_conflict_error'));
                return;
            }
            onSubmit(eventsToAdd);
            resetForm();
            setColor(colorSwatches[0]);
            setStartDate(initialStartDate);
            setEndDate(initialEndDate);
            setStartTime(initialStartTime);
            setEndTime(initialEndTime);
        }
    });

    React.useEffect(() => {
        if (isOpen) {
            setStartDate(initialStartDate);
            setEndDate(initialEndDate);
            setStartTime('07:30');
            setEndTime('16:30');
            setColor(colorSwatches[0]);
            formik.resetForm();
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
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-md sm:max-w-2xl max-h-screen overflow-y-auto p-2 sm:p-0"
                        onClick={e => e.stopPropagation()}
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5 text-primary" />
                                        {t('pickleball_add_booking')}
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClose}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <form onSubmit={formik.handleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            {t('pickleball_booking_title')}
                                        </Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formik.values.title}
                                            onChange={formik.handleChange}
                                            placeholder={t('pickleball_booking_title_placeholder')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="court" className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-primary" />
                                            {t('pickleball_court_select')}
                                        </Label>
                                        <Popover open={openCourt} onOpenChange={setOpenCourt}>
                                            <PopoverTrigger asChild>
                                                <div className="w-full">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-between h-11 text-base font-normal"
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
                                                        placeholder="Tìm kiếm..."
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
                                                            <div className="p-3 text-gray-500 text-sm">Không tìm thấy...</div>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cardNumber" className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-primary" />
                                            {t('pickleball_card_number')}
                                        </Label>
                                        <Input
                                            id="cardNumber"
                                            name="cardNumber"
                                            value={formik.values.cardNumber}
                                            onChange={formik.handleChange}
                                            placeholder={t('pickleball_card_number_placeholder')}
                                        />
                                    </div>
                                    {/* Dòng 1: Ngày bắt đầu - Ngày kết thúc */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="startDate" className="flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4 text-primary" />
                                                Ngày bắt đầu
                                            </Label>
                                            <DatePickerDay
                                                value={startDate}
                                                onChange={setStartDate}
                                                id="startDate"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="endDate" className="flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4 text-primary" />
                                                Ngày kết thúc
                                            </Label>
                                            <DatePickerDay
                                                value={endDate}
                                                onChange={setEndDate}
                                                id="endDate"
                                            />
                                        </div>
                                    </div>
                                    {/* Dòng 2: Giờ bắt đầu - Giờ kết thúc */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="startTime" className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                                Giờ bắt đầu (áp dụng cho mỗi ngày)
                                            </Label>
                                            <Input
                                                id="startTime"
                                                type="time"
                                                step="900"
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="endTime" className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                                Giờ kết thúc (áp dụng cho mỗi ngày)
                                            </Label>
                                            <Input
                                                id="endTime"
                                                type="time"
                                                step="900"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <Card className=''>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-md">{t('pickleball_color_select')}</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className=" grid grid-cols-12 gap-4">
                                                {colorSwatches.map((c, idx) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-100 ${color === c ? 'border-black scale-110 shadow-lg' : 'border-gray-300'}`}
                                                        style={{ background: c }}
                                                        onClick={() => setColor(c)}
                                                        aria-label={`Chọn màu ${idx + 1}`}
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
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            {t('pickleball_description')}
                                        </Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formik.values.description}
                                            onChange={formik.handleChange}
                                            placeholder={t('pickleball_description_placeholder')}
                                        />
                                    </div>
                                </CardContent>
                                <div className="flex justify-end space-x-2 p-6 pt-0">
                                    <Button type="button" variant="outline" onClick={onClose}>{t('btn_cancel')}</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/90">{t('pickleball_create_booking')}</Button>
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

