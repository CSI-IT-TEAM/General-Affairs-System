import React, { useState, useEffect, useRef } from 'react';
import { format, parse, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isSameWeek } from 'date-fns';
import './MeetingRoomBooking.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, FileText, X, Trash, Search, Plus } from 'lucide-react';
import { Select } from '../../components/ui/select';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import AddEventDialog from './components/AddEventDialog';
import { useTranslation } from 'react-i18next';
import {
    getMeetingRoomEvents,
    saveMeetingRoomEvent,
    deleteMeetingRoomEvent,
    getMeetingRoomList,
    getGroupBookingRoomList,
    checkCalendarDay,
} from '../../api/meetingRoomBooking';
import backgroundImage from '../../assets/images/background.png';
import pageBackground from '../../assets/images/meeting_room_bg.jpeg';

dayjs.extend(isSameOrBefore);

// Component Gantt Chart cho Report
const GanttChart = ({ weekDays, events, format, t, selectedMeetingRoomFilter, meetingRooms }) => {
    // Giờ bắt đầu và kết thúc: 07:30 đến 16:30
    const startHour = 7;
    const startMinute = 30;
    const endHour = 16;
    const endMinute = 30;

    // Mỗi slot = 60 phút (1 giờ)
    const minutesPerSlot = 60;
    const slotsPerHour = 1;
    
    // Tạo mảng giờ từ 07:30 đến 16:30 (mỗi slot = 60 phút)
    // Bao gồm: 07:30, 08:30, 09:30, 10:30, 11:30, 12:30, 13:30, 14:30, 15:30, 16:30
    const hours = [];
    // Từ 07:30 đến 16:30 (mỗi giờ cách nhau 60 phút)
    for (let h = startHour; h <= endHour; h++) {
        hours.push({ hour: h, minute: startMinute });
    }
    
    // Tính totalSlots = số phần tử trong mảng hours
    const totalSlots = hours.length; // 10 slots

    // Tên các ngày trong tuần
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Hàm tính toán vị trí và độ rộng của bar dựa trên thời gian
    // Tính chính xác dựa trên phút (mỗi slot = 60 phút)
    const calculateBarPosition = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Lấy giờ và phút
        let startHourValue = start.getHours();
        let startMinuteValue = start.getMinutes();
        let endHourValue = end.getHours();
        let endMinuteValue = end.getMinutes();

        // Tính tổng số phút từ 00:00
        let startTotalMinutes = startHourValue * 60 + startMinuteValue;
        let endTotalMinutes = endHourValue * 60 + endMinuteValue;
        const baseMinutes = startHour * 60 + startMinute; // 07:30 = 450 phút
        const endBaseMinutes = endHour * 60 + endMinute; // 16:30 = 990 phút

        // Đảm bảo trong khoảng 07:30-16:30
        // Nếu booking bắt đầu trước 07:30, chỉ hiển thị từ 07:30
        if (startTotalMinutes < baseMinutes) {
            startTotalMinutes = baseMinutes;
        }
        // Nếu booking bắt đầu sau 16:30, không hiển thị
        if (startTotalMinutes > endBaseMinutes) {
            return { left: 0, width: 0 };
        }
        // Nếu booking kết thúc sau 16:30, chỉ hiển thị đến 16:30
        if (endTotalMinutes > endBaseMinutes) {
            endTotalMinutes = endBaseMinutes;
        }

        // Tính index của slot (0-based), mỗi slot = 60 phút
        // Tính vị trí chính xác trong slot (0-1)
        const startOffsetMinutes = startTotalMinutes - baseMinutes;
        const endOffsetMinutes = endTotalMinutes - baseMinutes;
        
        const startSlotIndex = Math.floor(startOffsetMinutes / minutesPerSlot);
        
        // Tính endSlotIndex và endPositionInSlot
        // Nếu endOffsetMinutes chia hết cho minutesPerSlot (ví dụ: 60, 120, ...)
        // thì bar kết thúc tại cuối slot hiện tại (endPositionInSlot = 1)
        // Nếu không, bar kết thúc trong slot hiện tại với vị trí tương ứng
        let endSlotIndex;
        let endPositionInSlot;
        
        if (endOffsetMinutes % minutesPerSlot === 0 && endOffsetMinutes > 0) {
            // Kết thúc tại ranh giới slot (ví dụ: 08:30, 09:30, ...)
            // endSlotIndex = slot hiện tại (không phải slot tiếp theo)
            endSlotIndex = (endOffsetMinutes / minutesPerSlot) - 1;
            endPositionInSlot = 1; // Cuối slot
        } else if (endOffsetMinutes === 0) {
            // Trường hợp đặc biệt: kết thúc ngay tại 07:30
            endSlotIndex = 0;
            endPositionInSlot = 0;
        } else {
            // Kết thúc trong slot (không phải tại ranh giới)
            endSlotIndex = Math.floor(endOffsetMinutes / minutesPerSlot);
            endPositionInSlot = (endOffsetMinutes % minutesPerSlot) / minutesPerSlot;
        }
        
        // Tính vị trí chính xác trong slot cho start
        const startPositionInSlot = (startOffsetMinutes % minutesPerSlot) / minutesPerSlot;

        // Đảm bảo trong phạm vi hợp lệ
        if (startSlotIndex < 0 || startSlotIndex >= totalSlots) {
            return { left: 0, width: 0 };
        }
        if (endSlotIndex <= startSlotIndex && endSlotIndex >= totalSlots) {
            return { left: 0, width: 0 };
        }
        if (endSlotIndex < startSlotIndex) {
            return { left: 0, width: 0 };
        }

        // Tính vị trí và độ rộng (theo %)
        // Mỗi slot chiếm 1/totalSlots của width
        const slotWidth = 100 / totalSlots;
        
        // Tính left: vị trí bắt đầu của slot + vị trí trong slot
        const left = (startSlotIndex * slotWidth) + (startPositionInSlot * slotWidth);
        
        // Tính width: từ start đến end
        let width;
        if (startSlotIndex === endSlotIndex) {
            // Cùng 1 slot
            width = (endPositionInSlot - startPositionInSlot) * slotWidth;
        } else {
            // Nhiều slot
            const startSlotRemaining = (1 - startPositionInSlot) * slotWidth;
            const endSlotUsed = endPositionInSlot * slotWidth;
            const middleSlots = (endSlotIndex - startSlotIndex - 1) * slotWidth;
            width = startSlotRemaining + middleSlots + endSlotUsed;
        }

        return { left, width, startHour: startHourValue, endHour: endHourValue };
    };

    // Lấy events cho một meetingRoom cụ thể trong tuần
    const getEventsForMeetingRoom = (meetingRoomValue) => {
        return events.filter(event => {
            const eventRoom = String(event.meetingRoom || '').trim();
            const roomValue = String(meetingRoomValue || '').trim();
            const roomMatches = eventRoom === roomValue || 
                               eventRoom.toLowerCase() === roomValue.toLowerCase();
            
            // Kiểm tra event có trong tuần hiện tại không
            const eventDate = format(event.start, 'yyyy-MM-dd');
            const weekStart = format(weekDays[0], 'yyyy-MM-dd');
            const weekEnd = format(weekDays[6], 'yyyy-MM-dd');
            const dateInWeek = eventDate >= weekStart && eventDate <= weekEnd;
            
            // Nếu có filter phòng họp, chỉ lấy phòng được chọn
            if (selectedMeetingRoomFilter && selectedMeetingRoomFilter !== '') {
                const filterRoom = String(selectedMeetingRoomFilter).trim();
                return roomMatches && dateInWeek && 
                       (eventRoom === filterRoom || eventRoom.toLowerCase() === filterRoom.toLowerCase());
            }
            
            return roomMatches && dateInWeek;
        }).sort((a, b) => {
            return a.start.getTime() - b.start.getTime();
        });
    };

    // Lấy tên meetingRoom từ meetingRooms list
    const getMeetingRoomName = (meetingRoomValue) => {
        if (!meetingRooms || meetingRooms.length === 0) {
            return String(meetingRoomValue || '').trim();
        }
        
        const roomValue = String(meetingRoomValue || '').trim();
        const meetingRoomItem = meetingRooms.find(room => {
            const rValue = String(room.value || '').trim();
            return rValue === roomValue || 
                   rValue.toLowerCase() === roomValue.toLowerCase();
        });
        
        return meetingRoomItem ? meetingRoomItem.label : roomValue;
    };

    // Lấy events cho một ngày cụ thể (có filter theo phòng họp nếu được chọn)
    const getEventsForDay = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return events.filter(event => {
            const eventDateKey = format(event.start, 'yyyy-MM-dd');
            const dateMatches = eventDateKey === dateKey;
            
            // Nếu có filter phòng họp, kiểm tra thêm
            if (selectedMeetingRoomFilter && selectedMeetingRoomFilter !== '') {
                const eventRoom = String(event.meetingRoom || '').trim();
                const filterRoom = String(selectedMeetingRoomFilter).trim();
                const roomMatches = eventRoom === filterRoom || 
                                   eventRoom.toLowerCase() === filterRoom.toLowerCase();
                return dateMatches && roomMatches;
            }
            
            return dateMatches;
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

    // Lấy events cho một ngày cụ thể, nhóm theo meetingRoom
    const getEventsForDayByRoom = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayEvents = events.filter(event => {
            const eventDateKey = format(event.start, 'yyyy-MM-dd');
            const dateMatches = eventDateKey === dateKey;
            
            // Nếu có filter phòng họp, kiểm tra thêm
            if (selectedMeetingRoomFilter && selectedMeetingRoomFilter !== '') {
                const eventRoom = String(event.meetingRoom || '').trim();
                const filterRoom = String(selectedMeetingRoomFilter).trim();
                const roomMatches = eventRoom === filterRoom || 
                                   eventRoom.toLowerCase() === filterRoom.toLowerCase();
                return dateMatches && roomMatches;
            }
            
            return dateMatches;
        });
        
        // Nhóm events theo meetingRoom
        const eventsByRoom = {};
        dayEvents.forEach(event => {
            const roomValue = String(event.meetingRoom || '').trim();
            if (!eventsByRoom[roomValue]) {
                eventsByRoom[roomValue] = [];
            }
            eventsByRoom[roomValue].push(event);
        });
        
        return eventsByRoom;
    };

    // Kiểm tra xem có filter phòng cụ thể không
    const hasRoomFilter = selectedMeetingRoomFilter && selectedMeetingRoomFilter.trim() !== '';

    return (
        <div className="w-full h-full max-h-[600px] flex flex-col">
            <div className="flex-1 overflow-auto border border-gray-300 rounded-lg bg-white/50">
                {/* Header với các giờ - giống PickleballBooking */}
                <div className="sticky top-0 z-20 bg-gray-100 border-b">
                    <div className="flex min-w-[600px] sm:min-w-[800px]">
                        {/* Cột đầu tiên: Date - empty trong header */}
                        <div className="w-16 sm:w-24 md:w-32 lg:w-40 border-r bg-gray-100 p-0.5 sm:p-1 md:p-2 font-semibold text-[8px] sm:text-[10px] md:text-xs">
                            {/* Header cell cho tên ngày */}
                        </div>
                        {/* Cột thứ hai: Meeting Room - chỉ hiển thị khi không có filter */}
                        {!hasRoomFilter && (
                            <div className="w-16 sm:w-24 md:w-32 lg:w-40 border-r bg-gray-100 p-0.5 sm:p-1 md:p-2 font-semibold text-[8px] sm:text-[10px] md:text-xs">
                                {/* Header cell cho meeting room */}
                            </div>
                        )}
                        {/* Header giờ từ 07:30 đến 16:30 - chỉ có 9 cột */}
                        <div className="flex-1 grid min-w-[500px] sm:min-w-[720px]" style={{ gridTemplateColumns: `repeat(${totalSlots}, 1fr)` }}>
                            {hours.map((hourSlot, hourIndex) => (
                                <div
                                    key={`header-${hourSlot.hour}-${hourSlot.minute}`}
                                    className="border-r-2 border-dashed border-blue-950/50 p-0.5 sm:p-1 md:p-2 text-center font-semibold text-[8px] sm:text-[10px] md:text-xs lg:text-sm"
                                >
                                    {String(hourSlot.hour).padStart(2, '0')}:{String(hourSlot.minute).padStart(2, '0')}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Các hàng cho từng ngày - mỗi ngày có các dòng meetingRoom - dùng table với rowspan */}
                <table className="w-full min-w-[600px] sm:min-w-[800px] border-collapse">
                    <tbody>
                        {weekDays.map((day, dayIndex) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const dayName = dayNames[dayIndex];
                            
                            // Nếu có filter phòng, lấy tất cả events trong ngày (đã được filter theo phòng rồi)
                            // Nếu không có filter, nhóm theo phòng
                            let dayEvents = [];
                            let roomKeys = [];
                            
                            if (hasRoomFilter) {
                                // Có filter phòng: lấy tất cả events trong ngày (chỉ có 1 phòng)
                                dayEvents = getEventsForDay(day);
                            } else {
                                // Không có filter: nhóm theo phòng
                                const dayEventsByRoom = getEventsForDayByRoom(day);
                                roomKeys = Object.keys(dayEventsByRoom);
                            }
                            
                            // Nếu có filter phòng và không có events, hiển thị 1 dòng trống
                            if (hasRoomFilter && dayEvents.length === 0) {
                                return (
                                    <tr key={dateKey} className="border-b border-gray-200">
                                        <td className="w-16 sm:w-24 md:w-32 lg:w-40 border-r p-0.5 sm:p-1 md:p-2 sticky left-0 z-10 bg-white/50 backdrop-blur-sm align-middle">
                                            <div className="flex flex-col justify-center h-full">
                                                <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-600">
                                                    {dayName}
                                                </div>
                                                <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-600">
                                                    {format(day, 'MM/dd')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="relative h-[40px] sm:h-[50px] min-w-[500px] sm:min-w-[720px]">
                                            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalSlots}, 1fr)` }}>
                                                {hours.map((hourSlot, hourIndex) => (
                                                    <div
                                                        key={`${dayIndex}-${hourSlot.hour}-${hourSlot.minute}`}
                                                        className="border-r border-dashed border-gray-400"
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            
                            // Nếu không có filter và không có events, hiển thị 1 dòng trống
                            if (!hasRoomFilter && roomKeys.length === 0) {
                                return (
                                    <tr key={dateKey} className="border-b border-gray-200">
                                        <td className="w-16 sm:w-24 md:w-32 lg:w-40 border-r p-0.5 sm:p-1 md:p-2 sticky left-0 z-10 bg-white/50 backdrop-blur-sm align-middle">
                                            <div className="flex flex-col justify-center h-full">
                                                <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-600">
                                                    {dayName}
                                                </div>
                                                <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-600">
                                                    {format(day, 'MM/dd')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="w-16 sm:w-24 md:w-32 lg:w-40 border-r p-0.5 sm:p-1 md:p-2 sticky left-0 z-10 bg-white/50 backdrop-blur-sm">
                                        </td>
                                        <td className="relative h-[40px] sm:h-[50px] min-w-[500px] sm:min-w-[720px]">
                                            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalSlots}, 1fr)` }}>
                                                {hours.map((hourSlot, hourIndex) => (
                                                    <div
                                                        key={`${dayIndex}-${hourSlot.hour}-${hourSlot.minute}`}
                                                        className="border-r border-dashed border-gray-400"
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            
                            // Nếu có filter phòng: hiển thị 1 dòng cho tất cả events trong ngày
                            if (hasRoomFilter) {
                                return (
                                    <tr key={dateKey} className="border-b border-gray-200">
                                        <td className="w-16 sm:w-24 md:w-32 lg:w-40 border-r p-0.5 sm:p-1 md:p-2 sticky left-0 z-10 bg-white/50 backdrop-blur-sm align-middle">
                                            <div className="flex flex-col justify-center h-full">
                                                <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-600">
                                                    {dayName}
                                                </div>
                                                <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-600">
                                                    {format(day, 'MM/dd')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="relative h-[40px] sm:h-[50px] min-w-[500px] sm:min-w-[720px]">
                                            {/* Grid lines cho các slot 60 phút */}
                                            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalSlots}, 1fr)` }}>
                                                {hours.map((hourSlot, hourIndex) => (
                                                    <div
                                                        key={`${dayIndex}-${hourSlot.hour}-${hourSlot.minute}`}
                                                        className="border-r border-dashed border-gray-400"
                                                    />
                                                ))}
                                            </div>

                                            {/* Vẽ các events trong ngày */}
                                            {dayEvents.map((event, eventIndex) => {
                                                const barPosition = calculateBarPosition(event.start, event.end);
                                                if (!barPosition || barPosition.width <= 0) return null;

                                                const eventColor = event.bgColor || '#13005f';

                                                return (
                                                    <div
                                                        key={`event-${event.id || eventIndex}`}
                                                        className="absolute h-4 sm:h-5 md:h-6 lg:h-8 shadow-md border-2 border-white/80 flex items-center justify-center cursor-pointer transition-all z-0"
                                                        style={{
                                                            left: `${Math.max(0, Math.min(barPosition.left, 100))}%`,
                                                            width: `${Math.max(0, Math.min(barPosition.width, 100 - Math.max(0, barPosition.left)))}%`,
                                                            backgroundColor: eventColor,
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                        }}
                                                        title={`${format(event.start, 'dd/MM HH:mm')} - ${format(event.end, 'HH:mm')} ${event.title || ''} ${event.department || ''}`}
                                                    >
                                                        <span className="text-[7px] sm:text-[9px] md:text-xs font-semibold whitespace-nowrap px-0.5 sm:px-1">
                                                            {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </td>
                                    </tr>
                                );
                            }
                            
                            // Không có filter: hiển thị các dòng cho từng meetingRoom trong ngày
                            return (
                                <React.Fragment key={`day-group-${dayIndex}`}>
                                    {roomKeys.map((roomValue, roomIndex) => {
                                        const dayEventsByRoom = getEventsForDayByRoom(day);
                                        const roomEvents = dayEventsByRoom[roomValue];
                                        const roomName = getMeetingRoomName(roomValue);
                                        
                                        return (
                                            <tr
                                                key={`${dateKey}-${roomValue}-${roomIndex}`}
                                                className="border-b border-gray-200"
                                            >
                                                {/* Cột đầu tiên: Thứ và ngày - chỉ render ở dòng đầu tiên với rowspan */}
                                                {roomIndex === 0 && (
                                                    <td 
                                                        rowSpan={roomKeys.length}
                                                        className="w-16 sm:w-24 md:w-32 lg:w-40 border-r p-0.5 sm:p-1 md:p-2 sticky left-0 z-10 bg-white/50 backdrop-blur-sm align-middle"
                                                    >
                                                        <div className="flex flex-col justify-center h-full">
                                                            <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-600">
                                                                {dayName}
                                                            </div>
                                                            <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-600">
                                                                {format(day, 'MM/dd')}
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                
                                                {/* Cột thứ hai: Tên meetingRoom - chỉ hiển thị khi không có filter */}
                                                <td className="w-16 sm:w-24 md:w-32 lg:w-40 border-r p-0.5 sm:p-1 md:p-2 sticky left-0 z-10 bg-white/50 backdrop-blur-sm">
                                                    <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-600 break-words">
                                                        {roomName || ''}
                                                    </div>
                                                </td>

                                                {/* Grid giờ từ 07:30 đến 16:30 */}
                                                <td className="relative h-[40px] sm:h-[50px] min-w-[500px] sm:min-w-[720px]">
                                                    {/* Grid lines cho các slot 60 phút */}
                                                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalSlots}, 1fr)` }}>
                                                        {hours.map((hourSlot, hourIndex) => (
                                                            <div
                                                                key={`${dayIndex}-${roomValue}-${hourSlot.hour}-${hourSlot.minute}`}
                                                                className="border-r border-dashed border-gray-400"
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* Vẽ các events của meetingRoom này trong ngày */}
                                                    {roomEvents.map((event, eventIndex) => {
                                                        const barPosition = calculateBarPosition(event.start, event.end);
                                                        if (!barPosition || barPosition.width <= 0) return null;

                                                        const eventColor = event.bgColor || '#13005f';

                                                        return (
                                                            <div
                                                                key={`event-${event.id || eventIndex}`}
                                                                className="absolute h-4 sm:h-5 md:h-6 lg:h-8  shadow-md border-2 border-white/80 flex items-center justify-center cursor-pointer transition-all z-0"
                                                                style={{
                                                                    left: `${Math.max(0, Math.min(barPosition.left, 100))}%`,
                                                                    width: `${Math.max(0, Math.min(barPosition.width, 100 - Math.max(0, barPosition.left)))}%`,
                                                                    backgroundColor: eventColor,
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
                                                                }}
                                                                title={`${format(event.start, 'dd/MM HH:mm')} - ${format(event.end, 'HH:mm')} ${event.title || ''} ${event.department || ''}`}
                                                            >
                                                                <span className="text-[7px] sm:text-[9px] md:text-xs font-semibold whitespace-nowrap px-0.5 sm:px-1">
                                                                    {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MeetingRoomBooking = () => {
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
    const [meetingRooms, setMeetingRooms] = useState([]);
    const [groupBookingRooms, setGroupBookingRooms] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
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
    const [selectedMeetingRoomFilter, setSelectedMeetingRoomFilter] = useState('');

    // Tạo mảng 7 ngày trong tuần (Sun - Sat)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        weekDays.push(addDays(currentWeekStart, i));
    }

    // Load group booking rooms on mount
    useEffect(() => {
        const loadGroups = async () => {
            try {
                const groups = await getGroupBookingRoomList();
                if (groups && groups.length > 0) {
                    setGroupBookingRooms(groups);
                    // Set default group to first one
                    if (!selectedGroup && groups.length > 0) {
                        setSelectedGroup(groups[0].value);
                    }
                }
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Error loading group booking rooms:', error);
                }
            }
        };

        loadGroups();
    }, []);

    // Load meeting rooms when selectedGroup changes
    useEffect(() => {
        const loadMeetingRooms = async () => {
            if (selectedGroup) {
                try {
                    const rooms = await getMeetingRoomList(selectedGroup);
                    if (rooms && rooms.length > 0) {
                        setMeetingRooms(rooms);
                        // Set default room to first room when group changes
                        setSelectedMeetingRoomFilter(rooms[0].value);
                    } else {
                        setMeetingRooms([]);
                        setSelectedMeetingRoomFilter('');
                    }
                } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('Error loading meeting rooms:', error);
                    }
                    setMeetingRooms([]);
                    setSelectedMeetingRoomFilter('');
                }
            } else {
                setMeetingRooms([]);
                setSelectedMeetingRoomFilter('');
            }
        };

        loadMeetingRooms();
    }, [selectedGroup]);

    // Load events and meeting rooms on mount and when week changes
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load events for current week (Chủ nhật đến Thứ bảy)
                const weekStart = new Date(currentWeekStart); // Chủ nhật của tuần đã chọn
                const weekEnd = new Date(currentWeekStart);
                weekEnd.setDate(weekEnd.getDate() + 6); // Thứ bảy của tuần đã chọn

                const fromDate = format(weekStart, 'yyyy-MM-dd');
                const toDate = format(weekEnd, 'yyyy-MM-dd');
                const eventsData = await getMeetingRoomEvents(fromDate, toDate);
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
    }, [currentWeekStart]);

    // Lấy events cho một ngày cụ thể (có filter theo phòng họp nếu được chọn)
    const getEventsForDay = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return events.filter(event => {
            const eventDateKey = format(event.start, 'yyyy-MM-dd');
            const dateMatches = eventDateKey === dateKey;
            
            // Nếu có filter phòng họp, kiểm tra thêm
            if (selectedMeetingRoomFilter && selectedMeetingRoomFilter !== '') {
                const eventRoom = String(event.meetingRoom || '').trim();
                const filterRoom = String(selectedMeetingRoomFilter).trim();
                const roomMatches = eventRoom === filterRoom || 
                                   eventRoom.toLowerCase() === filterRoom.toLowerCase();
                return dateMatches && roomMatches;
            }
            
            return dateMatches;
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
            alert(t('meeting_room_day_full_alert') || 'Ngày này đã full lịch, không thể book thêm!');
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
            // Load meeting rooms for selected group
            if (selectedGroup) {
                const rooms = await getMeetingRoomList(selectedGroup);
                if (rooms && rooms.length > 0) {
                    setMeetingRooms(rooms);
                }
            }

            // Load events for current week (Chủ nhật đến Thứ bảy)
            const weekStart = new Date(currentWeekStart); // Chủ nhật của tuần đã chọn
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6); // Thứ bảy của tuần đã chọn

            const fromDate = format(weekStart, 'yyyy-MM-dd');
            const toDate = format(weekEnd, 'yyyy-MM-dd');

            if (!fromDate || !toDate || fromDate === 'Invalid Date' || toDate === 'Invalid Date') {
                setLoading(false);
                return;
            }

            const eventsData = await getMeetingRoomEvents(fromDate, toDate);
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
            alert(t('meeting_room_day_full_alert') || 'Ngày này đã full lịch, không thể book thêm!');
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

        // Mặc định startTime là 07:30, endTime là startTime + 1 giờ
        const defaultStartTime = '07:30';

        const [hours, minutes] = defaultStartTime.split(':').map(Number);
        const endTimeObj = new Date();
        endTimeObj.setHours(hours + 1, minutes, 0, 0);
        const defaultEndTime = format(endTimeObj, 'HH:mm');

        setStartTime(defaultStartTime);
        setEndTime(defaultEndTime);
        setIsDialogOpen(true);
    };

    // Ref để lưu selection từ dialog
    const dialogSelectionRef = useRef({ group: null, meetingRoom: null });

    // Handler để cập nhật selectedGroup và selectedMeetingRoomFilter từ AddEventDialog
    const handleSelectionChange = (selection) => {
        if (selection) {
            // Lưu vào ref để sử dụng trong handleAddEvent
            dialogSelectionRef.current = {
                group: selection.group || null,
                meetingRoom: selection.meetingRoom || null
            };
            
            // Cập nhật state
            if (selection.group) {
                setSelectedGroup(selection.group);
            }
            if (selection.meetingRoom) {
                setSelectedMeetingRoomFilter(selection.meetingRoom);
            }
        }
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
                    meetingRoom: eventData.meetingRoom,
                    userLogin: userInfo.userLogin,
                };

                if (!eventPayload.userId || !eventPayload.userLogin) {
                    throw new Error('Thiếu thông tin người dùng. Vui lòng đăng nhập lại!');
                }
                if (!eventPayload.meetingRoom) {
                    throw new Error('Vui lòng chọn phòng họp!');
                }
                    console.log('eventPayload', eventPayload);
                const result = await saveMeetingRoomEvent(eventPayload);

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
            // Sử dụng khoảng ngày của tuần hiện tại (Chủ nhật đến Thứ bảy)
            try {
                const weekStart = new Date(currentWeekStart); // Chủ nhật của tuần đã chọn
                const weekEnd = new Date(currentWeekStart);
                weekEnd.setDate(weekEnd.getDate() + 6); // Thứ bảy của tuần đã chọn

                const fromDate = format(weekStart, 'yyyy-MM-dd');
                const toDate = format(weekEnd, 'yyyy-MM-dd');
                
                // Thêm một chút delay nhỏ để đảm bảo database đã commit
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Reload events và meeting rooms để cập nhật dữ liệu mới nhất
                // Sử dụng group từ dialog nếu có, nếu không thì dùng selectedGroup hiện tại
                const groupToUse = dialogSelectionRef.current.group || selectedGroup;
                const [reloadedEvents, reloadedMeetingRooms] = await Promise.all([
                    getMeetingRoomEvents(fromDate, toDate),
                    groupToUse ? getMeetingRoomList(groupToUse) : Promise.resolve([])
                ]);
                
                const eventsWithColors = assignColorsToEvents(reloadedEvents || []);
                setEvents(eventsWithColors);
                
                // Cập nhật meeting rooms nếu có thay đổi
                if (reloadedMeetingRooms && reloadedMeetingRooms.length > 0) {
                    setMeetingRooms(reloadedMeetingRooms);
                }
                
                // Reset ref sau khi đã sử dụng
                dialogSelectionRef.current = { group: null, meetingRoom: null };
                
                if (process.env.NODE_ENV === 'development') {
                    console.log('Events reloaded after save:', eventsWithColors.length, 'events');
                }
            } catch (reloadError) {
                console.error('Error reloading events after save:', reloadError);
                // Không throw error ở đây để không ảnh hưởng đến flow chính
            }
        } catch (error) {
            console.error('Error saving event:', error);
            let errorMessage = t('meeting_room_conflict_error') || 'Có lỗi xảy ra khi lưu sự kiện. Vui lòng thử lại!';

            if (error.message) {
                if (error.message.includes('conflict') || error.message.includes('trùng')) {
                    errorMessage = t('meeting_room_conflict_error') || 'Khung giờ này đã có lịch họp trong phòng này. Vui lòng chọn khung giờ khác!';
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
                const result = await deleteMeetingRoomEvent(selectedEvent.id);

                if (result && result.success) {
                    setIsEventDetailOpen(false);
                    setSelectedEvent(null);

                    // Reload events for current week (Chủ nhật đến Thứ bảy)
                    const weekStart = new Date(currentWeekStart); // Chủ nhật của tuần đã chọn
                    const weekEnd = new Date(currentWeekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6); // Thứ bảy của tuần đã chọn

                    const fromDate = format(weekStart, 'yyyy-MM-dd');
                    const toDate = format(weekEnd, 'yyyy-MM-dd');
                    const reloadedEvents = await getMeetingRoomEvents(fromDate, toDate);
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

    // Hàm tính số phút đã được book trong một khoảng thời gian (có xử lý overlap)
    const calculateBookedMinutes = (events, startTotalMinutes, endTotalMinutes) => {
        if (!events || events.length === 0) return 0;

        // Tạo mảng các khoảng thời gian đã được book (đã loại bỏ overlap)
        const timeRanges = [];
        
        events.forEach(event => {
            if (!event || !event.start || !event.end) return;

            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
            const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();

            // Chỉ tính các phút trong khung giờ cho phép (07:30 - 16:30)
            const eventStartMinutes = Math.max(startMinutes, startTotalMinutes);
            const eventEndMinutes = Math.min(endMinutes, endTotalMinutes);

            if (eventEndMinutes > eventStartMinutes) {
                timeRanges.push({
                    start: eventStartMinutes,
                    end: eventEndMinutes
                });
            }
        });

        if (timeRanges.length === 0) return 0;

        // Sắp xếp theo thời gian bắt đầu
        timeRanges.sort((a, b) => a.start - b.start);

        // Merge các khoảng overlap
        const mergedRanges = [];
        let currentRange = { ...timeRanges[0] };

        for (let i = 1; i < timeRanges.length; i++) {
            const nextRange = timeRanges[i];
            
            // Nếu overlap hoặc tiếp nối (cách nhau <= 1 phút)
            if (nextRange.start <= currentRange.end + 1) {
                // Merge: lấy end lớn hơn
                currentRange.end = Math.max(currentRange.end, nextRange.end);
            } else {
                // Không overlap, lưu range hiện tại và chuyển sang range mới
                mergedRanges.push(currentRange);
                currentRange = { ...nextRange };
            }
        }
        mergedRanges.push(currentRange);

        // Tính tổng số phút đã book (đã loại bỏ overlap)
        return mergedRanges.reduce((total, range) => {
            return total + (range.end - range.start);
        }, 0);
    };

    // Kiểm tra xem một ngày có full lịch hay không
    const isDayFull = (date) => {
        const dayEvents = getEventsForDay(date);
        
        // Nếu không có meeting rooms, không thể kiểm tra full
        if (!meetingRooms || meetingRooms.length === 0) return false;

        // Khung giờ: 07:30 - 16:30 cho tất cả các ngày
        const startHour = 7;
        const startMinute = 30;
        const endHour = 16;
        const endMinute = 30;

        const startTotalMinutes = startHour * 60 + startMinute; // 07:30 = 450 phút
        const endTotalMinutes = endHour * 60 + endMinute; // 16:30 = 990 phút
        const minutesPerMeetingRoom = endTotalMinutes - startTotalMinutes; // 540 phút (9 giờ)

        // Nếu có filter phòng họp, chỉ kiểm tra phòng đó
        if (selectedMeetingRoomFilter && selectedMeetingRoomFilter !== '') {
            // Lọc events của phòng được chọn
            const filterRoom = String(selectedMeetingRoomFilter).trim();
            const roomEvents = dayEvents.filter(event => {
                const eventRoom = String(event.meetingRoom || '').trim();
                return eventRoom === filterRoom || 
                       eventRoom.toLowerCase() === filterRoom.toLowerCase();
            });

            // Tính số phút đã book cho phòng này (có xử lý overlap)
            const bookedMinutes = calculateBookedMinutes(roomEvents, startTotalMinutes, endTotalMinutes);
            
            // Full nếu đã book hết 540 phút
            return bookedMinutes >= minutesPerMeetingRoom;
        }

        // Không có filter: kiểm tra tất cả các phòng
        // Full khi TẤT CẢ các phòng đều full
        const roomsToCheck = meetingRooms.map(room => room.value);
        
        for (const roomValue of roomsToCheck) {
            // Lọc events của phòng này
            const roomEvents = dayEvents.filter(event => {
                const eventRoom = String(event.meetingRoom || '').trim();
                const checkRoom = String(roomValue).trim();
                return eventRoom === checkRoom || 
                       eventRoom.toLowerCase() === checkRoom.toLowerCase();
            });

            // Tính số phút đã book cho phòng này (có xử lý overlap)
            const bookedMinutes = calculateBookedMinutes(roomEvents, startTotalMinutes, endTotalMinutes);
            
            // Nếu có ít nhất 1 phòng chưa full, thì ngày chưa full
            if (bookedMinutes < minutesPerMeetingRoom) {
                return false;
            }
        }

        // Tất cả các phòng đều full
        return true;
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
                                {t('meeting_room_booking_tab') || 'Đặt Lịch'}
                            </button>
                            <button
                                onClick={() => setActiveTab('report')}
                                className={`flex-1 px-4 py-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'report'
                                    ? 'bg-primary text-white border-b-2 border-primary'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                                    }`}
                            >
                                {t('meeting_room_report_tab') || 'Report'}
                            </button>
                        </div>

                        {/* Header với title và buttons */}
                        <div className="p-2 sm:p-4 border-b bg-background/40 backdrop-blur-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-0">
                                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary">
                                    {activeTab === 'booking' ? t('meeting_room_booking') : (t('meeting_room_report_tab') || 'Report')}
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
                                            <span className="text-sm sm:text-base">{t('meeting_room_add_booking')}</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Header với navigation */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-4 border-b bg-background/40 backdrop-blur-sm gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                                <Button variant="outline" size="sm" onClick={goToPrevWeek} className="h-8 w-8 p-0 flex-shrink-0">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm sm:text-lg md:text-2xl font-semibold px-2 whitespace-nowrap flex-shrink-0">{weekHeader}</div>
                                <Button variant="outline" size="sm" onClick={goToNextWeek} className="h-8 w-8 p-0 flex-shrink-0">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-2 text-xs sm:text-sm flex-shrink-0">
                                    {t('today')}
                                </Button>
                                <Select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="h-8 px-2 py-0 text-xs sm:text-sm min-w-[120px] sm:min-w-[150px] max-w-[200px] flex-shrink-0 leading-normal"
                                    style={{ lineHeight: '32px', paddingTop: '0', paddingBottom: '0' }}
                                >
                                    {groupBookingRooms.map((group) => (
                                        <option key={group.value} value={group.value}>
                                            {group.label}
                                        </option>
                                    ))}
                                </Select>
                                <Select
                                    value={selectedMeetingRoomFilter}
                                    onChange={(e) => setSelectedMeetingRoomFilter(e.target.value)}
                                    className="h-8 px-2 py-0 text-xs sm:text-sm min-w-[120px] sm:min-w-[150px] max-w-[200px] flex-shrink-0 leading-normal"
                                    style={{ lineHeight: '32px', paddingTop: '0', paddingBottom: '0' }}
                                    disabled={!selectedGroup}
                                >
                                    {meetingRooms.map((room) => (
                                        <option key={room.value} value={room.value}>
                                            {room.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            {/* Chú thích màu sắc - chỉ hiển thị khi tab booking */}
                            {activeTab === 'booking' && (
                                <div className="hidden sm:flex items-center gap-4 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                        <span className="text-gray-700">{t('meeting_room_available') || 'Còn chỗ'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                        <span className="text-gray-700">{t('meeting_room_full')}</span>
                                    </div>
                                </div>
                            )}
                            {/* Chú thích số lượng booking - chỉ hiển thị khi tab report */}
                            {/* {activeTab === 'report' && (
                                <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs sm:text-sm font-extrabold bg-red-600 text-white rounded-full px-2 py-0.5 inline-block">1</span>
                                        <span className="text-gray-700">{t('meeting_room_booking_count_legend')}</span>
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
                                                                {/* {dayFull ? t('meeting_room_full') : ''} */}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Day Columns with Events */}
                                        <div
                                            className="grid grid-cols-7 border-b meeting-room-day-columns"
                                            style={{ maxHeight: 'calc(100vh - 365px)' }}
                                        >
                                            {weekDays.map((day, dayIndex) => {
                                                const dayEvents = getEventsForDay(day);
                                                const past = isPastDate(day);

                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className={`p-0 border-r flex flex-col meeting-room-day-cell  ${past ? 'bg-gray-100/40 backdrop-blur-sm opacity-50' : 'bg-white/60 backdrop-blur-sm'} ${isToday(day) ? 'bg-blue-50/60 backdrop-blur-sm' : ''}`}
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
                                                                        {event.meetingRoom && (() => {
                                                                                // Try to find matching room (case-insensitive, trimmed)
                                                                                const meetingRoomValue = String(event.meetingRoom).trim();
                                                                                const meetingRoomItem = meetingRooms.find(room => {
                                                                                    const roomValue = String(room.value || '').trim();
                                                                                    return roomValue === meetingRoomValue || 
                                                                                           roomValue.toLowerCase() === meetingRoomValue.toLowerCase();
                                                                                });
                                                                                const roomName = meetingRoomItem ? meetingRoomItem.label : meetingRoomValue;
                                                                                // Sử dụng gradient color từ procedure, fallback về gradient mặc định nếu không có
                                                                                const gradientColor = meetingRoomItem?.gradientColor || 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #1a1a1a 100%)';
                                                                                return (
                                                                                    <div 
                                                                                        className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold text-white shadow-lg mt-1"
                                                                                        style={{
                                                                                            background: gradientColor,
                                                                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                                                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
                                                                                        }}
                                                                                    >
                                                                                        {roomName}
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                            <div className="font-extrabold text-xs sm:text-sm md:text-2xl text-gray-900 drop-shadow-sm whitespace-nowrap">
                                                                                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                                                                            </div>
                                                                            <div className="text-[8px] sm:text-xs md:text-lg text-gray-800 sm:font-semibold font-light truncate drop-shadow-sm text-right mt-0.5 sm:mt-1">{event.title}</div>
                                                                            {event.department && (
                                                                                <div className="text-[7px] sm:text-[10px] md:text-sm text-gray-700 font-medium truncate drop-shadow-sm text-right mt-0.5 sm:mt-1 opacity-90">
                                                                                    {event.department}
                                                                                </div>
                                                                            )}
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
                                                                <span>{t('meeting_room_click_to_add_event')}</span>
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
                                        selectedMeetingRoomFilter={selectedMeetingRoomFilter}
                                        meetingRooms={meetingRooms}
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
                meetingRooms={meetingRooms}
                isHoliday={isHoliday}
                defaultMeetingRoom={selectedMeetingRoomFilter || undefined}
                onSelectionChange={handleSelectionChange}
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
                                        <CardTitle className="text-xl md:text-2xl lg:text-3xl">{t('meeting_room_booking_detail')}</CardTitle>
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
                                            {/* {t('meeting_room_booking_title')} */}
                                            {t('meeting_room_title')}
                                        </Label>
                                        <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6 font-bold">{selectedEvent.title}</p>
                                    </div>

                                    {selectedEvent.userName && (
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                                <User className="h-4 w-4 text-primary" />
                                                {t('meeting_room_booker_name') || 'Người đặt'}
                                            </Label>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6 font-bold">{selectedEvent.userName}</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                            <Clock className="h-4 w-4 text-primary" />
                                            {t('meeting_room_time')}
                                        </Label>
                                        <div className="pl-6 space-y-1">
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-extrabold">{t('meeting_room_date')}</span> {format(selectedEvent.start, 'dd/MM/yyyy')}
                                            </p>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                                                <span className="font-extrabold">{t('meeting_room_booking_from')}</span> {format(selectedEvent.start, 'HH:mm')}  <span className="font-extrabold">{t('meeting_room_booking_to')}</span> {format(selectedEvent.end, 'HH:mm')}
                                            </p>
                                            
                                        </div>
                                    </div>

                                    {selectedEvent.meetingRoom && (() => {
                                        // Try to find matching room (case-insensitive, trimmed)
                                        const meetingRoomValue = String(selectedEvent.meetingRoom).trim();
                                        const meetingRoomItem = meetingRooms.find(room => {
                                            const roomValue = String(room.value || '').trim();
                                            return roomValue === meetingRoomValue || 
                                                   roomValue.toLowerCase() === meetingRoomValue.toLowerCase();
                                        });
                                        const roomName = meetingRoomItem ? meetingRoomItem.label : meetingRoomValue;
                                        
                                        return (
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                                    {t('meeting_room_name')}
                                                </Label>
                                                <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6 font-bold">{roomName}</p>
                                            </div>
                                        );
                                    })()}

                                    {selectedEvent.department && (
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                                <User className="h-4 w-4 text-primary" />
                                                {t('frm_depart')}
                                            </Label>
                                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground pl-6 font-bold">{selectedEvent.department}</p>
                                        </div>
                                    )}

                                    {selectedEvent.description && (
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {t('meeting_room_description')}
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
                                        const currentUserEmpId = userInfo?.empId || '';

                                        // Kiểm tra emp_id của event (có thể là cardNumber hoặc userId)
                                        const eventEmpId = selectedEvent.cardNumber || selectedEvent.userId || '';
                                        
                                        // So sánh case-insensitive và trim
                                        const currentUserEmpIdNormalized = String(currentUserEmpId).trim().toUpperCase();
                                        const eventEmpIdNormalized = String(eventEmpId).trim().toUpperCase();
                                        const isOwner = currentUserEmpIdNormalized && eventEmpIdNormalized &&
                                            currentUserEmpIdNormalized === eventEmpIdNormalized;

                                        // Debug log (chỉ trong development)
                                        if (process.env.NODE_ENV === 'development') {
                                            console.log('Delete button check:', {
                                                isPastEvent,
                                                isOwner,
                                                currentUserEmpId: currentUserEmpIdNormalized,
                                                eventEmpId: eventEmpIdNormalized,
                                                selectedEvent: {
                                                    id: selectedEvent.id,
                                                    cardNumber: selectedEvent.cardNumber,
                                                    userId: selectedEvent.userId
                                                }
                                            });
                                        }

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
                                                    {t('meeting_room_delete')}
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

export default MeetingRoomBooking;
