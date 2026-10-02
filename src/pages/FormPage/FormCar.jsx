import {
  Box,
  Container,
  Grid,
  TextField,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Button,
} from "@mui/material";  
//testing upload 11111
import { useState, useEffect, useRef } from "react";
import { Buffer } from "buffer";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18next from "i18next";
import {
  SelectModal,
  ButtonPrimary,
  FormTitle,
  ModalWarning,
  ModalInfo,
  FormDefaultInfo,
  ResponsiveDateTime,
  KoreaPassengerInfo,
  VietnamPassengerInfo,
} from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import InputAdornment from "@mui/material/InputAdornment";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";
import AirlineSeatReclineExtraIcon from "@mui/icons-material/AirlineSeatReclineExtra";
import {
  reqCarData,
  reqCarValidate,
  passengerNum,
  uploadCarData,
} from "../../data";
import {
  getDate,
  getDateTime,
  formatDate,
  formatHMS,
  getDateFormat,
  getDateTimeFormat,
} from "../../function/getDate";
import getDevice from "../../function/getDevice";
import {
  isCombackDate_Validate,
  timeDifference,
} from "../../function/getValidate";
import { getLastName } from "../../function/getLastName";
import { uploadURL } from "../../api";
import { getDriverScheduleReport } from "../../api/carBooking";

import "./Form.scss";
import React from "react";
import { Base64 } from "js-base64";
import { removeVietnamese } from "../../function/getFormat";
import pageBackground from "../../assets/images/background.png";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button as ButtonUI } from "../../components/ui/button";
import moment from "moment";

// Component Gantt Chart cho Driver Schedule Report
const DriverScheduleGanttChart = ({ driverScheduleData, selectedDate, t }) => {
  // Tính toán max height dựa trên viewport height
  const [maxHeight, setMaxHeight] = useState(500);
  const chartContainerRef = useRef(null);

  useEffect(() => {
    const calculateMaxHeight = () => {
      // Lấy viewport height và width để xác định loại màn hình
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Xác định loại màn hình và min/max height tương ứng
      let minHeight = 200; // Default cho mobile
      let maxAllowedHeight = 600; // Giới hạn tối đa để vẫn có thể cuộn
      
      if (viewportWidth >= 1024) {
        // Desktop (lg và xl)
        minHeight = 300;
        maxAllowedHeight = 500; // Giảm height trên màn hình lớn để có thể cuộn
      } else if (viewportWidth >= 768) {
        // Tablet (md)
        minHeight = 280;
        maxAllowedHeight = 450;
      } else if (viewportWidth >= 640) {
        // Small tablet (sm)
        minHeight = 250;
        maxAllowedHeight = 400;
      } else {
        // Mobile (xs)
        minHeight = 200;
        maxAllowedHeight = 350;
      }
      
      // Tìm container cha của gantt chart (tab content container)
      const tabContentContainer = chartContainerRef.current?.closest('[class*="p-3"], [class*="p-4"], [class*="p-6"], [class*="p-8"]');
      
      if (tabContentContainer) {
        // Đo khoảng cách từ top của viewport đến top của tab content container
        const containerRect = tabContentContainer.getBoundingClientRect();
        const distanceFromTop = containerRect.top;
        
        // Đo các phần tử bên trong container trước gantt chart
        let reservedInContainer = 0;
        
        // Title section
        const titleElement = document.getElementById('title_text')?.closest('div');
        if (titleElement && tabContentContainer.contains(titleElement)) {
          reservedInContainer += titleElement.offsetHeight || 60;
        }
        
        // Date navigator (nếu có)
        const dateNavigator = tabContentContainer.querySelector('[class*="flex items-center justify-between mb-4"]');
        if (dateNavigator) {
          reservedInContainer += dateNavigator.offsetHeight || 50;
        }
        
        // Padding bottom của container - responsive
        let containerPaddingBottom = 16; // Mobile
        if (viewportWidth >= 1024) {
          containerPaddingBottom = 32; // Desktop
        } else if (viewportWidth >= 768) {
          containerPaddingBottom = 24; // Tablet
        }
        
        // Tính chiều cao còn lại cho gantt chart, nhưng không vượt quá maxAllowedHeight
        const availableHeight = viewportHeight - distanceFromTop - reservedInContainer - containerPaddingBottom;
        const calculatedHeight = Math.min(maxAllowedHeight, Math.max(minHeight, availableHeight));
        setMaxHeight(calculatedHeight);
      } else {
        // Fallback: tính toán thủ công nếu không tìm thấy container
        let reservedHeight = 0;
        
        // 1. Navbar header - responsive
        const navbar = document.querySelector('header, nav, [role="navigation"]');
        if (navbar) {
          reservedHeight += navbar.offsetHeight || 64;
        } else {
          reservedHeight += 64;
        }
        
        // 2. Container padding và margin - responsive
        if (viewportWidth >= 1024) {
          reservedHeight += 48; // Desktop
        } else if (viewportWidth >= 768) {
          reservedHeight += 32; // Tablet
        } else {
          reservedHeight += 16; // Mobile
        }
        
        // 3. Card padding và border
        reservedHeight += 8;
        
        // 4. Tabs height - responsive
        const tabsElement = document.querySelector('[class*="flex border-b"]');
        if (tabsElement) {
          reservedHeight += tabsElement.offsetHeight || 48;
        } else {
          reservedHeight += 48;
        }
        
        // 5. Title và legend section - responsive
        const titleElement = document.getElementById('title_text')?.closest('div');
        if (titleElement) {
          const titleRect = titleElement.getBoundingClientRect();
          reservedHeight += titleRect.height || 60;
        } else {
          reservedHeight += 60;
        }
        
        // 6. Date navigator (nếu có)
        const dateNavigator = document.querySelector('[class*="flex items-center justify-between mb-4"]');
        if (dateNavigator && dateNavigator.offsetParent !== null) {
          reservedHeight += dateNavigator.offsetHeight || 50;
        }
        
        // 7. Padding của tab content container - responsive
        if (viewportWidth >= 1024) {
          reservedHeight += 64; // Desktop (lg:p-8)
        } else if (viewportWidth >= 768) {
          reservedHeight += 48; // Tablet (md:p-6)
        } else if (viewportWidth >= 640) {
          reservedHeight += 32; // Small (sm:p-4)
        } else {
          reservedHeight += 24; // Mobile (p-3)
        }
        
        // 8. Margin và spacing
        reservedHeight += 24;
        
        // Tính chiều cao còn lại, nhưng không vượt quá maxAllowedHeight
        const availableHeight = viewportHeight - reservedHeight;
        const calculatedHeight = Math.min(maxAllowedHeight, Math.max(minHeight, availableHeight));
        setMaxHeight(calculatedHeight);
      }
    };

    // Tính toán ngay lập tức
    calculateMaxHeight();

    // Tính toán lại sau khi DOM render hoàn toàn (sử dụng requestAnimationFrame)
    const rafId = requestAnimationFrame(() => {
      calculateMaxHeight();
    });

    // Lắng nghe resize để cập nhật lại
    window.addEventListener('resize', calculateMaxHeight);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', calculateMaxHeight);
    };
  }, [selectedDate]); // Recalculate khi selectedDate thay đổi (có thể ảnh hưởng đến layout)

  if (!driverScheduleData || driverScheduleData.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t("not_found") || "No Data Found!!!"}
        </Typography>
      </Box>
    );
  }

  // Filter data by selectedDate - check if selectedDate falls within HMS_S and HMS_E range
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Extract date directly from ISO string to avoid timezone issues
  const extractDateFromISO = (isoString) => {
    if (!isoString) return null;
    const dateMatch = isoString.match(/^(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
  };
  
  const filteredData = driverScheduleData.filter(item => {
    if (!item.HMS_S || !item.HMS_E) return false;
    try {
      // Extract date directly from ISO string to avoid timezone issues
      const startDateStr = extractDateFromISO(item.HMS_S);
      const endDateStr = extractDateFromISO(item.HMS_E);
      
      if (!startDateStr || !endDateStr) {
        // Fallback to Date parsing if regex doesn't match
        const startDate = new Date(item.HMS_S);
        const endDate = new Date(item.HMS_E);
        const startDateStrFallback = format(startDate, 'yyyy-MM-dd');
        const endDateStrFallback = format(endDate, 'yyyy-MM-dd');
        
        // Check if selectedDate falls within the range [startDate, endDate]
        return startDateStrFallback <= selectedDateStr && endDateStrFallback >= selectedDateStr;
      }
      
      // Check if selectedDate falls within the range [startDate, endDate]
      return startDateStr <= selectedDateStr && endDateStr >= selectedDateStr;
    } catch (e) {
      console.warn('Error filtering driver schedule data:', e, item);
      return false;
    }
  });

  if (filteredData.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t("not_found") || "No Data Found!!!"}
        </Typography>
      </Box>
    );
  }

  // Lấy MIN_VAL và MAX_VAL từ dữ liệu đầu tiên (tất cả records có cùng MIN_VAL và MAX_VAL)
  const minVal = filteredData[0]?.MIN_VAL || "06:00";
  const maxVal = filteredData[0]?.MAX_VAL || "22:00";

  // Parse MIN_VAL và MAX_VAL để lấy giờ và phút
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
  };

  const startTime = parseTime(minVal);
  const endTime = parseTime(maxVal);

  // Tạo mảng giờ từ MIN_VAL đến MAX_VAL hoặc 23:00 (mỗi slot = 60 phút)
  // Mở rộng đến 23:00 để hỗ trợ booking kết thúc sau ngày được chọn
  const hours = [];
  const startHour = startTime.hours;
  const startMinute = startTime.minutes;
  const endHour = endTime.hours;
  const endMinute = endTime.minutes;

  // Tính tổng số phút từ 00:00
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  // Mở rộng đến 23:00 nếu cần (để hỗ trợ booking kết thúc sau ngày được chọn)
  const maxDisplayMinutes = Math.max(endTotalMinutes, 23 * 60);

  // Tạo các slot mỗi giờ từ MIN_VAL đến maxDisplayMinutes
  for (let totalMinutes = startTotalMinutes; totalMinutes <= maxDisplayMinutes; totalMinutes += 60) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    hours.push({ hour: h, minute: m });
  }

  const totalSlots = hours.length;
  const minutesPerSlot = 60;

  // Hàm tính toán vị trí và độ rộng của bar dựa trên thời gian
  const calculateBarPosition = (hmsStart, hmsEnd, itemStartDate, itemEndDate) => {
    // Parse HMS_S và HMS_E (format: ISO date string "2025-12-09T08:00:00.000Z")
    // Extract giờ và phút trực tiếp từ ISO string để tránh timezone issues
    const parseHMS = (isoString) => {
      if (!isoString) return 0;
      try {
        // Extract time from ISO string: "2025-12-08T15:00:00.000Z" -> "15:00"
        const timeMatch = isoString.match(/T(\d{2}):(\d{2})/);
        if (timeMatch) {
          const h = parseInt(timeMatch[1], 10);
          const m = parseInt(timeMatch[2], 10);
          return h * 60 + m; // Tổng số phút từ 00:00
        }
        // Fallback to Date parsing if regex doesn't match
        const date = new Date(isoString);
        const h = date.getUTCHours(); // Use UTC to avoid timezone issues
        const m = date.getUTCMinutes();
        return h * 60 + m;
      } catch (e) {
        console.warn('Error parsing HMS:', isoString, e);
        return 0;
      }
    };

    // Parse MIN_VAL và MAX_VAL để lấy base time
    const parseTimeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const baseMinutes = parseTimeToMinutes(minVal); // MIN_VAL in minutes
    const endBaseMinutes = parseTimeToMinutes(maxVal); // MAX_VAL in minutes

    // Check if booking spans multiple days - compare by date strings to avoid timezone issues
    // Extract date directly from ISO string
    const extractDateFromISO = (isoString) => {
      if (!isoString) return null;
      const dateMatch = isoString.match(/^(\d{4}-\d{2}-\d{2})/);
      return dateMatch ? dateMatch[1] : null;
    };
    
    const startDateStr = extractDateFromISO(itemStartDate) || format(new Date(itemStartDate), 'yyyy-MM-dd');
    const endDateStr = extractDateFromISO(itemEndDate) || format(new Date(itemEndDate), 'yyyy-MM-dd');
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

    let startTotalMinutes, endTotalMinutes;

    // If booking starts before selected date and ends after selected date, show full day
    if (startDateStr < selectedDateStr && endDateStr > selectedDateStr) {
      // Booking spans the entire selected day
      startTotalMinutes = baseMinutes; // Start from MIN_VAL
      endTotalMinutes = endBaseMinutes; // End at MAX_VAL
    } else if (startDateStr < selectedDateStr && endDateStr === selectedDateStr) {
      // Booking started before selected date, ends during selected date
      startTotalMinutes = baseMinutes; // Start from MIN_VAL
      endTotalMinutes = parseHMS(hmsEnd); // End at HMS_E time
    } else if (startDateStr === selectedDateStr && endDateStr > selectedDateStr) {
      // Booking starts during selected date, ends after selected date
      // Tô từ thời gian bắt đầu đến 23:00 (cuối ngày)
      startTotalMinutes = parseHMS(hmsStart); // Start at HMS_S time
      endTotalMinutes = 23 * 60; // End at 23:00 (1380 phút)
    } else if (startDateStr === selectedDateStr && endDateStr === selectedDateStr) {
      // Booking is entirely within selected date
      startTotalMinutes = parseHMS(hmsStart);
      endTotalMinutes = parseHMS(hmsEnd);
    } else {
      // Should not happen if filter is correct, but handle gracefully
      startTotalMinutes = parseHMS(hmsStart);
      endTotalMinutes = parseHMS(hmsEnd);
    }

    // Đảm bảo trong khoảng MIN_VAL - MAX_VAL (hoặc đến 23:00 nếu booking kết thúc sau ngày được chọn)
    if (startTotalMinutes < baseMinutes) {
      startTotalMinutes = baseMinutes;
    }
    
    // Tính maxDisplayMinutes dựa trên hours array (có thể đến 23:00)
    const maxDisplayMinutes = hours.length > 0 ? (hours[hours.length - 1].hour * 60 + hours[hours.length - 1].minute) : endBaseMinutes;
    
    if (startTotalMinutes > maxDisplayMinutes) {
      return { left: 0, width: 0 };
    }
    
    // Nếu booking kết thúc sau ngày được chọn, cho phép vượt quá MAX_VAL đến 23:00
    // Nếu không, giới hạn trong MAX_VAL
    const isEndDateAfterSelected = endDateStr > selectedDateStr;
    if (!isEndDateAfterSelected && endTotalMinutes > endBaseMinutes) {
      endTotalMinutes = endBaseMinutes;
    }
    // Nếu endTotalMinutes vượt quá maxDisplayMinutes, giới hạn ở maxDisplayMinutes
    if (endTotalMinutes > maxDisplayMinutes) {
      endTotalMinutes = maxDisplayMinutes;
    }

    // Tính offset từ start
    const startOffsetMinutes = startTotalMinutes - baseMinutes;
    const endOffsetMinutes = endTotalMinutes - baseMinutes;

    // Tính slot index và position trong slot
    const startSlotIndex = Math.floor(startOffsetMinutes / minutesPerSlot);
    const startPositionInSlot = (startOffsetMinutes % minutesPerSlot) / minutesPerSlot;
    
    // Tính end slot index và position
    // Nếu endOffsetMinutes chính xác bằng một slot boundary, nó nên kết thúc ở cuối slot trước đó
    const endSlotFloat = endOffsetMinutes / minutesPerSlot;
    let endSlotIndex;
    let endPositionInSlot;
    
    // Kiểm tra xem có phải là slot boundary chính xác không (sai số < 0.001 phút)
    const remainder = endOffsetMinutes % minutesPerSlot;
    if (Math.abs(remainder) < 0.001 && endOffsetMinutes > 0) {
      // Chính xác ở slot boundary - kết thúc ở cuối slot trước đó
      // Ví dụ: endOffsetMinutes = 60, slot = 60 => kết thúc ở cuối slot 0 (index 0)
      endSlotIndex = Math.max(0, Math.floor(endSlotFloat) - 1);
      endPositionInSlot = 1.0; // 100% của slot
    } else {
      // Nằm giữa slot hoặc ở đầu slot
      endSlotIndex = Math.floor(endSlotFloat);
      endPositionInSlot = remainder / minutesPerSlot;
    }
    
    // Nếu booking kết thúc sau ngày được chọn và endTotalMinutes = 23:00, 
    // đảm bảo bar đi qua hết slot 23:00
    if (endDateStr > selectedDateStr && endTotalMinutes >= 23 * 60) {
      // Tìm slot index của 23:00
      const slot23Index = Math.floor((23 * 60 - baseMinutes) / minutesPerSlot);
      // Đảm bảo endSlotIndex bao gồm cả slot 23:00 (slot23Index + 1)
      endSlotIndex = Math.min(slot23Index + 1, totalSlots); // Không vượt quá totalSlots
      endPositionInSlot = 1.0; // 100% của slot cuối để bar kéo dài đến cuối
    }

    // Đảm bảo trong phạm vi hợp lệ
    if (startSlotIndex < 0 || startSlotIndex >= totalSlots) {
      return { left: 0, width: 0 };
    }
    
    // Đảm bảo endSlotIndex hợp lệ
    if (endSlotIndex < startSlotIndex) {
      return { left: 0, width: 0 };
    }
    
    // Cho phép endSlotIndex = totalSlots nếu booking kết thúc sau ngày được chọn
    if (endSlotIndex > totalSlots) {
      endSlotIndex = totalSlots;
      endPositionInSlot = 1.0;
    }
    
    // Nếu endSlotIndex = startSlotIndex và endPositionInSlot < startPositionInSlot, không hợp lệ
    if (endSlotIndex === startSlotIndex && endPositionInSlot <= startPositionInSlot) {
      return { left: 0, width: 0 };
    }

    // Tính vị trí và độ rộng (theo %)
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
      const actualEndSlotIndex = Math.min(endSlotIndex, totalSlots);
      const endSlotUsed = endPositionInSlot * slotWidth;
      const middleSlots = (actualEndSlotIndex - startSlotIndex - 1) * slotWidth;
      width = startSlotRemaining + middleSlots + endSlotUsed;
    }

    return { left, width };
  };

  return (
    <div ref={chartContainerRef} className="w-full flex flex-col" style={{ maxHeight: `${maxHeight}px`, height: `${maxHeight}px` }}>
      <div className="flex-1 overflow-auto border border-gray-300 rounded-lg bg-white/50" style={{ maxHeight: `${maxHeight - 2}px` }}>
        {/* Header với các giờ */}
        <div className="sticky top-0 z-20 bg-gray-100 border-b">
          <div className="flex min-w-[600px] sm:min-w-[800px]">
            {/* Cột đầu tiên: Driver */}
            <div className="w-32 sm:w-40 md:w-48 lg:w-56 border-r bg-gray-100 p-0.5 sm:p-1 md:p-2 font-semibold text-[8px] sm:text-[10px] md:text-xs">
              {t("driver") || "Driver"}
            </div>
            {/* Header giờ từ MIN_VAL đến MAX_VAL */}
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

        {/* Các hàng cho từng driver */}
        <table className="w-full min-w-[600px] sm:min-w-[800px] border-collapse">
          <tbody>
            {(() => {
              // Nhóm dữ liệu theo DRIVER
              const groupedByDriver = filteredData.reduce((acc, item) => {
                const driver = item.DRIVER || '-';
                if (!acc[driver]) {
                  acc[driver] = [];
                }
                acc[driver].push(item);
                return acc;
              }, {});

              // Chuyển đổi object thành array và map qua từng driver
              return Object.entries(groupedByDriver).map(([driver, items], driverIndex) => {
                return (
                  <tr key={driverIndex} className="border-b border-gray-200">
                    {/* Cột Driver */}
                    <td className="w-32 sm:w-40 md:w-48 lg:w-56 border-r p-0.5 sm:p-1 md:p-2 sticky left-0 z-10 bg-white/50 backdrop-blur-sm align-middle">
                      <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-700 whitespace-pre-line break-words">
                        {driver}
                      </div>
                    </td>

                    {/* Grid giờ */}
                    <td className="relative h-[50px] sm:h-[60px] md:h-[70px] min-w-[500px] sm:min-w-[720px]">
                      {/* Grid lines cho các slot 60 phút */}
                      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalSlots}, 1fr)` }}>
                        {hours.map((hourSlot, hourIndex) => (
                          <div
                            key={`${driverIndex}-${hourSlot.hour}-${hourSlot.minute}`}
                            className="border-r border-dashed border-gray-400"
                          />
                        ))}
                      </div>

                      {/* Vẽ tất cả các bar cho driver này */}
                      {(() => {
                        // Sắp xếp items theo thời gian bắt đầu
                        const sortedItems = [...items].sort((a, b) => {
                          const timeA = a.HMS_S ? new Date(a.HMS_S).getTime() : 0;
                          const timeB = b.HMS_S ? new Date(b.HMS_S).getTime() : 0;
                          return timeA - timeB;
                        });

                        // Tính toán bar positions và lanes cho tất cả items
                        const itemsWithPositions = sortedItems.map((item) => {
                          const barPosition = calculateBarPosition(item.HMS_S, item.HMS_E, item.HMS_S, item.HMS_E);
                          return {
                            item,
                            barPosition,
                            startTime: item.HMS_S ? new Date(item.HMS_S).getTime() : 0,
                            endTime: item.HMS_E ? new Date(item.HMS_E).getTime() : 0,
                          };
                        }).filter(item => item.barPosition && item.barPosition.width > 0);

                        // Phân bổ các bar vào các lanes để tránh overlap
                        const lanes = [];
                        itemsWithPositions.forEach((itemWithPos) => {
                          // Tìm lane đầu tiên không có overlap
                          let assignedLane = -1;
                          for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
                            const laneItems = lanes[laneIndex];
                            // Kiểm tra xem có overlap với bất kỳ item nào trong lane này không
                            const hasOverlap = laneItems.some((existingItem) => {
                              // Overlap nếu: startTime < existing.endTime && endTime > existing.startTime
                              // Nhưng nếu endTime của event trước = startTime của event sau thì không overlap (tiếp nối)
                              // Cho phép sai số 1 giây (1000ms) để xử lý các trường hợp tiếp nối
                              const isConsecutive = Math.abs(itemWithPos.startTime - existingItem.endTime) < 1000;
                              return (
                                itemWithPos.startTime < existingItem.endTime &&
                                itemWithPos.endTime > existingItem.startTime &&
                                !isConsecutive
                              );
                            });
                            if (!hasOverlap) {
                              assignedLane = laneIndex;
                              break;
                            }
                          }
                          
                          // Nếu không tìm thấy lane phù hợp, tạo lane mới
                          if (assignedLane === -1) {
                            assignedLane = lanes.length;
                            lanes.push([]);
                          }
                          
                          lanes[assignedLane].push(itemWithPos);
                        });

                        // Render các bars
                        return itemsWithPositions.map((itemWithPos, itemIndex) => {
                          // Tìm lane của item này
                          const laneIndex = lanes.findIndex((lane) => lane.includes(itemWithPos));
                          const eventColor = itemWithPos.item.STATUS === "CUR" ? "#f97316" : itemWithPos.item.STATUS === "DONE" ? "silver" : "#3b82f6";
                          
                          // Tính toán top position dựa trên lane index
                          // Mỗi lane cách nhau một khoảng, căn giữa theo chiều dọc
                          const barHeight = 28; // Khoảng chiều cao bar (h-7 = 28px base)
                          const laneSpacing = 6; // Khoảng cách giữa các lane
                          const totalLanes = lanes.length;
                          
                          // Tính offset từ giữa (50%)
                          // Nếu có 1 lane: offset = 0 (giữa)
                          // Nếu có 2 lanes: offset = -1*(barHeight+spacing)/2 và +1*(barHeight+spacing)/2
                          // Nếu có 3 lanes: offset = -1*(barHeight+spacing), 0, +1*(barHeight+spacing)
                          const centerOffset = (laneIndex - (totalLanes - 1) / 2) * (barHeight + laneSpacing);

                          return (
                            <div
                              key={`${driverIndex}-${itemIndex}`}
                              className="absolute rounded-lg h-6 sm:h-7 md:h-8 lg:h-10 shadow-md border-2 border-white/80 flex items-center justify-center cursor-pointer transition-all z-0"
                              style={{
                                left: `${Math.max(0, Math.min(itemWithPos.barPosition.left, 100))}%`,
                                width: `${Math.max(0, Math.min(itemWithPos.barPosition.width, 100 - Math.max(0, itemWithPos.barPosition.left)))}%`,
                                backgroundColor: eventColor,
                                top: `calc(50% + ${centerOffset}px)`,
                                transform: 'translateY(-50%)',
                              }}
                              title={`${itemWithPos.item.HMS_S ? moment(itemWithPos.item.HMS_S).utc().format('YYYY-MM-DD HH:mm:ss') : ''} - ${itemWithPos.item.HMS_E ? moment(itemWithPos.item.HMS_E).utc().format('YYYY-MM-DD HH:mm:ss') : ''} ${itemWithPos.item.ARRIVAL || ''} ${itemWithPos.item.REQ_EMP_NM || ''}`}
                            >
                              <span className="text-[7px] sm:text-[9px] md:text-xs font-semibold whitespace-nowrap px-0.5 sm:px-1 text-white">
                                {itemWithPos.item.ARRIVAL || ''}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FormCar = () => {
  const navigate = useNavigate();
  const _specificTime = " 160000";

  /////// Handle Checkbox
  const [isInclude, setIsInclude] = useState(false);

  /////// Handle Radio Korean or Vietnamese
  const [PassengerNameList, setPassengerNameList] = useState("Korea");

  /////// Open Text Field for Pick Up: ETC
  const [openPickUp, setOpenPickUp] = useState(false);

  /////// Translate Lang
  const { t } = useTranslation();
  const langCookie = i18next.language;
  const [lang, setLang] = useState(langCookie);

  useEffect(() => {
    setLang(i18next.language);
  }, [langCookie]);

  const [type, setType] = useState("connect-failed");

  /////// Request Data
  const [data, setData] = useState(reqCarData);
  const [validate, setValidate] = useState(reqCarValidate);
  const [reason, setReason] = useState(null);
  const [passengerList, setPassengerList] = useState([]);
  const [passengerSelectList, setpassengerSelectList] = useState([]);
  const [PassengerCount, setPassengerCount] = useState(1);
  const [PassengerDeptCount, setPassengerDeptCount] = useState(1);
  const [DeptName, setDeptName] = useState("");
  const [addressMemo, setaddressMemo] = useState("");
  /////// Handle Warning Modal
  const [openWarn, setOpenWarn] = useState(false);
  const handleOpenWarn = () => setOpenWarn(true);
  const handleCloseWarn = () => setOpenWarn(false);

  /////// Handle Warning Modal
  const [openInfo, setOpenInfo] = useState(false);
  const handleCloseInfo = () => setOpenInfo(false);

  /////// Handle Active Tab
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' or 'report'

  /////// Driver Schedule Report Data
  const [driverScheduleData, setDriverScheduleData] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Selected date for report

  ////// List Data From Session
  let _mainReason = JSON.parse(sessionStorage.getItem("mainReason"));
  let _subReason = JSON.parse(sessionStorage.getItem("subReason"));
  let _departList = JSON.parse(sessionStorage.getItem("departList"));
  let _dropOffList = JSON.parse(sessionStorage.getItem("dropOffList"));
  let _deptEmpList = JSON.parse(sessionStorage.getItem("deptEmpList"));
  let _EXPList = JSON.parse(sessionStorage.getItem("EXPList"));
  let _DEPTList = JSON.parse(sessionStorage.getItem("DeptList"));

  ////// Search EMP ID
  const [empID, setEmpID] = useState("");
  const [empName, setempName] = useState("");

  async function CalcPassengers() {
    try {
      var PassengerCounts = 1;
      const empData = JSON.parse(sessionStorage.getItem("userData"));
      var _arrList = [];
      var _arrKoreansList = [];
      if (isInclude) {
        console.log("Bao gồm tôi");
        _arrList.push({
          id: empData.EMPID,
          name: empData.EMP_NM,
          validate: true,
          dropOff: "",
          validDropOff: true,
        });
      }

      //If selected Korea, then add Korean Passengers
      if (passengerSelectList !== null && passengerSelectList.length > 0) {
        for (var i = 0; i < passengerSelectList.length; i++) {
          var EMPID = passengerSelectList[i];
          var EXPs = _EXPList.filter((item) => item.EMPID === EMPID);
          if (EXPs.length > 0) {
            _arrList.push({
              id: EMPID,
              name: EXPs[0].NAME,
              validate: true,
              dropOff: "",
              validDropOff: true,
            });
            _arrKoreansList.push({
              id: EMPID,
              name: EXPs[0].NAME,
              validate: true,
              dropOff: "",
              validDropOff: true,
            });
          }
        }
      }
      //if selected dept then add dept to the list
      if (DeptName && PassengerDeptCount !== "") {
        _arrList.push({
          id: DeptName,
          // name: DeptName + "-" + PassengerDeptCount,
          name: DeptName,
          validate: true,
          dropOff: "",
          validDropOff: true,
        });
      }

      PassengerCounts =
        parseInt(passengerSelectList.length) +
        parseInt(
          DeptName === "" || PassengerDeptCount === "" ? 0 : PassengerDeptCount
        ) +
        (isInclude ? 1 : 0);
      console.log(PassengerCounts);
    } catch (e) {
      console.log(e.message);
      return [];
    }

    return [_arrList, PassengerCounts, _arrKoreansList];
  }
  const handleClearClick = () => {
    setpassengerSelectList([]);
  };

  const handlePassengerList = (value) => {
    const _result = passengerList.map((item) => {
      if (item.id === "passenger_1") {
        return {
          ...item,
          name: value,
          validate: value === "" ? false : true,
        };
      } else {
        return item;
      }
    });

    setPassengerList((prevData) => _result);
  };
  ///PassengerKorean List Select
  const handlePassengerSelect = (
    event: React.SelectChangeEvent<HTMLInputElement>
  ) => {
    setpassengerSelectList(event);
  };
  //Passenger IN Dept Select
  const handleDeptSelect = (
    event: React.SelectChangeEvent<HTMLInputElement>
  ) => {
    //typeof value === "string" ? value.split(",") : value
    console.log(event);
    setDeptName(event);
  };

  //Number Of Passenger in Dept
  const HandlePassengerChange = (event) => {
    setPassengerDeptCount(event.target.value);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isInclude) {
      if (_deptEmpList !== null && _deptEmpList.length > 0) {
        let _searchResult = _deptEmpList.filter((item) =>
          item.EMPID.includes(event.target.value)
        );

        if (
          _searchResult !== null &&
          _searchResult !== "" &&
          _searchResult.length > 0
        ) {
          handlePassengerList(_searchResult[0].EMP_NM);
        } else {
          handlePassengerList("");
        }
      }
    }
    // setEmpID(event.target.value);

    // if (event.target.value === "") {
    //   handlePassengerList("");
    // } else {
    //   if (_deptEmpList !== null && _deptEmpList.length > 0) {
    //     let _searchResult = _deptEmpList.filter((item) =>
    //       item.EMPID.includes(event.target.value)
    //     );

    //     if (
    //       _searchResult !== null &&
    //       _searchResult !== "" &&
    //       _searchResult.length > 0
    //     ) {
    //       handlePassengerList(_searchResult[0].EMP_NM);
    //     } else {
    //       handlePassengerList("");
    //     }
    //   }
    // }
  };
  //   for(let iCount = 1; iCount <= _result; iCount++){
  //     _arrList.push({
  //         id: "passenger_" + iCount,
  //         name: iCount === 1 && isInclude ? empData.EMP_NM : "",
  //         validate: iCount === 1 && isInclude ? true : false,
  //         dropOff: "",
  //         validDropOff: false,
  //     });
  // }
  ////// Handle Include Myself Event
  const handleIsInclude = () => {
    setIsInclude((isInclude) => !isInclude);
    const empData = JSON.parse(sessionStorage.getItem("userData"));
    if (!isInclude) {
      setempName(empData.EMP_NM);
    } else {
      setempName("");
    }
  };

  const scrollToTop = () => {
    // window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document
      .getElementById("title_text")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  ////// Handle Include Myself Event
  const handleRadPassList = (event) => {
    console.log(event.target.value);
    setPassengerNameList(event.target.value);
    //setPassengerList([]);
    // setData((prevData) => {
    //   return {
    //     ...prevData,
    //     ["PASSENGERS_LIST_RD"]: event.target.value,
    //     ["PASSENGERS_COUNT"]: 0,
    //   };
    // });
  };

  /////// Handle Default Data
  const handleDefault = async () => {
    const empData = JSON.parse(sessionStorage.getItem("userData"));

    setOpenPickUp(false);
    setIsInclude(false);
    setPassengerList([]);
    setPassengerDeptCount(1);
    setPassengerList([]);
    setpassengerSelectList([]);
    setaddressMemo("");
    setDeptName("");
    setEmpID("");

    if (empData != null) {
      setData((prevData) => {
        return {
          ...prevData,
          REQ_DATE: getDate(),
          PLANT_CD: empData.PLANT_CD,
          PLANT_NM: empData.PLANT_NM,
          DEPT_CD: empData.DEPT,
          DEPT_NM: empData.DEPT_NM,
          REQ_EMP: empData.EMPID,
          REQ_EMP_NM: empData.EMP_NM,
          EMAIL_ADDRESS: empData.EMAIL,
          CREATOR: getLastName(empData.EMP_NM),
          CREATE_PROGRAM_ID: "GA_SYSTEM_REQUEST",
        };
      });
    } else {
      navigate("/signin");
    }
  };

  useEffect(() => {
    handleDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /////// Function to fetch Driver Schedule Report
  const fetchDriverSchedule = async () => {
    if (activeTab === 'report') {
      setLoadingSchedule(true);
      setScheduleError(null);
      
      try {
        // Get selected date in YYYYMMDD format
        const dateStr = format(selectedDate, 'yyyyMMdd');
        
        // Call API with selected date as both from and to date
        const result = await getDriverScheduleReport('Q', dateStr, dateStr);
        
        if (result.success) {
          setDriverScheduleData(result.data || []);
        } else {
          setScheduleError(result.error?.message || 'Failed to load driver schedule');
          setDriverScheduleData([]);
        }
      } catch (error) {
        setScheduleError(error.message || 'An error occurred');
        setDriverScheduleData([]);
      } finally {
        setLoadingSchedule(false);
      }
    }
  };

  /////// Fetch Driver Schedule Report when activeTab is 'report' or selectedDate changes
  useEffect(() => {
    fetchDriverSchedule();
  }, [activeTab, selectedDate]);

  /////// Date Navigation Functions
  const goToPrevDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  //////// Handle Set Controlled Data
  const handleChange = (event) => {
    // if (event.target.value === "") {
    //   handleSetValidate(event.target.name, false);
    // } else {
    //   handleSetValidate(event.target.name, true);
    // }
    if (event.target.name === "ADDRESS_MEMO") {
      setaddressMemo(event.target.value);
      // console.log(Buffer.from(event.target.value,"utf8").toString("base64"));
      // console.log(
      //   Buffer.from(
      //     Buffer.from(Buffer.from(event.target.value,"utf8").toString("base64"),"base64")
      //   ).toString("utf8")
      // );
      setData((prevData) => {
        return {
          ...prevData,
          [event.target.name]:
            event.target.value.length > 0
              ?  Buffer.from(removeVietnamese(event.target.value)).toString("base64")
              : event.target.value,
        };
      });

      if (event.target.value.length > 0) {
        handleSetValidate("ADDRESS_MEMO", true);
      } else {
        handleSetValidate("ADDRESS_MEMO", false);
      }
    } else {
      setData((prevData) => {
        return {
          ...prevData,
          [event.target.name]: event.target.value,
        };
      });
    }
  };

  const handleChangeSub = (name, value) => {
    let _result = "";

    switch (name) {
      case "GO_DATE":
      case "COMEBACK_DATE": {
        _result = formatDate(value);
        break;
      }
      case "GO_TIME":
      case "COMEBACK_TIME": {
        _result = formatHMS(value);
        break;
      }
      default: {
        console.log(name);
        console.log(value);
        _result = value;
        break;
      }
    }

    switch (name) {
      case "GO_DATE": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            GO_DATE_FULL: value,
          };
        });

        /////// If Depart Date is Today && Current Time >= 14:00 PM => Invalidate
        const _currentDateTime = getDateTime();
        let _specificDateTime = getDate() + _specificTime;
        let _checkValidate = isCombackDate_Validate(
          _currentDateTime,
          _specificDateTime
        );

        if (_result === getDate() && !_checkValidate) {
          handleSetValidate(
            "GO_DATE",
            false,
            "The depart date must start from tomorrow",
            "Ngày xuất phát phải từ ngày mai trở đi"
          );
          break;
        } else {
          handleSetValidate("GO_DATE", true);
        }

        /////// If Depart Date > Current Time
        let _depart = getDateTimeFormat(_result + " " + data["GO_TIME"]);
        let _isValidate = timeDifference(_depart);

        if (_isValidate) {
          handleSetValidate("GO_DATE", true);
          handleSetValidate("GO_TIME", true);
        } else {
          handleSetValidate(
            "GO_DATE",
            false,
            "The return date and time must be 3 hours greater than the present time",
            "Ngày giờ xuất phát phải lớn hơn 3 tiếng so với hiện tại"
          );
          handleSetValidate(
            "GO_TIME",
            false,
            "The return date and time must be 3 hours greater than the present time",
            "Ngày giờ xuất phát phải lớn hơn 3 tiếng so với hiện tại"
          );
          break;
        }

        break;
      }
      case "COMEBACK_DATE": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            COMEBACK_DATE_FULL: value,
          };
        });

        let _isValidate = isCombackDate_Validate(
          getDateFormat(data["GO_DATE"]),
          getDateFormat(_result)
        );
        if (_isValidate) {
          handleSetValidate(name, true);
        } else {
          handleSetValidate(
            name,
            false,
            "Comback Date must equal or greater than Depart Date",
            "Ngày về phải lớn hơn hoặc bằng Ngày xuất phát"
          );
        }

        break;
      }
      case "GO_TIME": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            GO_TIME_FULL: value,
          };
        });

        /////// If Depart Date is Today && Current Time >= 14:00 PM => Invalidate
        const _currentDateTime = getDateTime();
        let _specificDateTime = getDate() + _specificTime;
        let _checkValidate = isCombackDate_Validate(
          _currentDateTime,
          _specificDateTime
        );

        if (data["GO_DATE"] === getDate() && !_checkValidate) {
          handleSetValidate(
            "GO_DATE",
            false,
            "The depart date must start from tomorrow",
            "Ngày xuất phát phải từ ngày mai trở đi"
          );
          break;
        } else {
          handleSetValidate("GO_DATE", true);
        }

        /////// If Depart Date Time > Current Date Time
        let _depart = getDateTimeFormat(data["GO_DATE"] + " " + _result);
        let _isValidate = timeDifference(_depart);

        if (_isValidate) {
          handleSetValidate("GO_DATE", true);
          handleSetValidate("GO_TIME", true);
        } else {
          handleSetValidate(
            "GO_DATE",
            false,
            "The return date and time must be 3 hours greater than the present time",
            "Ngày giờ xuất phát phải lớn hơn 3 tiếng so với hiện tại"
          );
          handleSetValidate(
            "GO_TIME",
            false,
            "The return date and time must be 3 hours greater than the present time",
            "Ngày giờ xuất phát phải lớn hơn 3 tiếng so với hiện tại"
          );
        }

        break;
      }
      case "COMEBACK_TIME": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            COMEBACK_TIME_FULL: value,
          };
        });

        let _depart = getDateTimeFormat(
          data["GO_DATE"] + " " + data["GO_TIME"]
        );
        let _comeback = getDateTimeFormat(
          data["COMEBACK_DATE"] + " " + _result
        );
        let _isValidate = isCombackDate_Validate(_depart, _comeback);

        if (_isValidate) {
          handleSetValidate(name, true);
        } else {
          handleSetValidate(
            name,
            false,
            "Comback Time must equal or greater than Depart Time",
            "Giờ về phải lớn hơn hoặc bằng Giờ xuất phát"
          );
        }

        break;
      }
      case "MAIN_REASON_CD": {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            SUB_REASON_CD: "",
            ARRIVAL: "",
          };
        });
        setReason((prevData) => []);
        setReason((prevData) =>
          _subReason.filter((val) => val.MAIN_REASON_CD === _result)
        );

        if (_result === "") {
          handleSetValidate(name, false);
        } else {
          handleSetValidate(name, true);
        }

        break;
      }
      case "SUB_REASON_CD": {
        let data = _subReason.filter((val) => val.SUB_REASON_CD === _result);

        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
            ARRIVAL: data[0].SUB_REASON_NM,
          };
        });

        if (_result === "") {
          handleSetValidate(name, false);
        } else {
          handleSetValidate(name, true);
        }

        break;
      }

      case "DEPART_CD": {
        let data = _departList.filter((val) => val.DEPART_CD === _result);

        if (_result !== "ETC") {
          setOpenPickUp(false);
          setData((prevData) => {
            return {
              ...prevData,
              [name]: _result,
              DEPART_NM: data[0].DEPART_NM,
            };
          });
        } else {
          setOpenPickUp(true);
          setData((prevData) => {
            return {
              ...prevData,
              [name]: _result,
              DEPART_NM: "",
            };
          });
        }

        if (_result === "") {
          handleSetValidate(name, false);
        } else {
          handleSetValidate(name, true);
        }

        break;
      }
      //case "MAN_QTY":
      // setPassengerList((prevData) => []);
      // let _arrList = [];
      // const empData = JSON.parse(sessionStorage.getItem("userData"));

      // for (let iCount = 1; iCount <= _result; iCount++) {
      //   _arrList.push({
      //     id: "passenger_" + iCount,
      //     name: iCount === 1 && isInclude ? empData.EMP_NM : "",
      //     validate: iCount === 1 && isInclude ? true : false,
      //     dropOff: "",
      //     validDropOff: false,
      //   });
      // }

      // setPassengerList((prevData) => _arrList);
      // setData((prevData) => {
      //   return {
      //     ...prevData,
      //     [name]: _result,
      //   };
      // });

      // if (_result === "") {
      //   handleSetValidate(name, false);
      // } else {
      //   handleSetValidate(name, true);
      // }
      // handleSetValidate(name, true);
      //break;

      default: {
        setData((prevData) => {
          return {
            ...prevData,
            [name]: _result,
          };
        });

        break;
      }
    }
  };

  ///// Handle Passenger Name
  const handlePassengerName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const _result = passengerList.map((item) => {
      if (item.id === event.target.name) {
        return {
          ...item,
          name: event.target.value,
          validate: event.target.value === "" ? false : true,
        };
      } else {
        return item;
      }
    });

    setPassengerList((prevData) => _result);
  };

  ///// Handle Passenger Drop-off Place huỳnh
  // const handlePassengerDropOff = (name, value) => {
  //   const _result = passengerList.map((item) => {
  //     if (name.indexOf(item.id) > -1) {
  //       return {
  //         ...item,
  //         dropOff: value,
  //         validDropOff: true,
  //       };
  //     } else {
  //       return item;
  //     }
  //   });

  //   setPassengerList((prevData) => _result);
  // };
  ///// Handle Passenger Drop-off Place PHUOC EDIT
  const handlePassengerDropOff = (name, value) => {
    console.log(name + ": " + value);
  };

  //////Cancel Fetch API After Timeout
  const Timeout = (time) => {
    let controller = new AbortController();
    setTimeout(() => controller.abort(), time * 1000);
    return controller;
  };

  //////// Handle Upload Data
  const handleSubmit = async () => {
    // await CalcPassengers().then(async (result) => {
    //   if (result !== null && result.length > 0 && result[1] > 0) {
    //     await uploadCarData(data, result[0], result[1]).then(
    //       (uploadData) => {
    //         console.log(uploadData);
    //         // fetchUpload(uploadData);
    //       }
    //     );
    //   } else {
    //     alert(t("no_passengers_error"));
    //   }
    // });

    if (handleVaidate()) {
      if (handleValidateDepart()) {
        await CalcPassengers().then(async (result) => {
          if (result !== null && result.length > 0 && PassengerDeptCount > 0) {
            await uploadCarData(data, result, PassengerDeptCount).then(
              (uploadData) => {
                console.log(uploadData);
                fetchUpload(uploadData);
              }
            );
          } else {
            alert(t("no_passengers_error"));
          }
        });
      }
    }
  };

  const fetchUpload = async (dataConfig) => {
    fetch(uploadURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataConfig),
      signal: Timeout(5).signal,
    })
      .then((response) => {
        if (response.status === 200) {
          setType("upload-success");
          setOpenInfo(true);

          ///// Clear Form Data to Default
          setData((prev) => reqCarData);
          setValidate((prev) => reqCarValidate);
          handleDefault();
          scrollToTop();
        } else {
          handleOpenWarn();
        }
      })
      .catch((error) => {
        setType("connect-failed");
        setOpenInfo(true);
      });
  };

  /////// Handle Validate Form Data
  const handleVaidate = () => {
    let _result = true;
    for (const property in data) {
      switch (property) {
        case "MAIN_REASON_CD":
        case "SUB_REASON_CD":
        case "GO_DATE":
        case "GO_TIME":
        case "DEPART_CD":
        case "ADDRESS_MEMO":
        case "DEPART_NM":
          if (data[property] === "") {
            _result = false;

            handleSetValidate(property, false);
          } else {
            handleSetValidate(property, true);
          }
          break;
        case "COMEBACK_DATE":
          if (data[property] === "") {
            _result = false;

            handleSetValidate(property, false);
          } else {
            let _isValidate = isCombackDate_Validate(
              getDateFormat(data["GO_DATE"]),
              getDateFormat(data["COMEBACK_DATE"])
            );
            if (_isValidate) {
              handleSetValidate(property, true);
            } else {
              _result = false;
              handleSetValidate(
                property,
                false,
                "Comback Date must equal or greater than Depart Date",
                "Ngày về phải lớn hơn hoặc bằng Ngày xuất phát"
              );
            }
          }
          break;
        case "COMEBACK_TIME":
          if (data[property] === "") {
            _result = false;
            handleSetValidate(property, false);
          } else {
            let _depart = getDateTimeFormat(
              data["GO_DATE"] + " " + data["GO_TIME"]
            );
            let _comeback = getDateTimeFormat(
              data["COMEBACK_DATE"] + " " + data["COMEBACK_TIME"]
            );
            let _isValidate = isCombackDate_Validate(_depart, _comeback);

            if (_isValidate) {
              handleSetValidate(property, true);
            } else {
              _result = false;
              handleSetValidate(
                property,
                false,
                "Comback Time must equal or greater than Depart Time",
                "Giờ về phải lớn hơn hoặc bằng Giờ xuất phát"
              );
            }
          }
          break;
        // case "MAN_QTY":
        //   if (data[property] === "" || isNaN(data[property])) {
        //     _result = false;
        //     handleSetValidate(property, false);
        //   } else {
        //     if (Number(data[property]) < 0) {
        //       _result = false;
        //       handleSetValidate(property, false);
        //     } else {
        //       handleSetValidate(property, true);
        //     }
        //   }
        //   break;
        default:
          break;
      }
    }
    // console.log(passengerList);

    ////// Validate Passenger List
    // for (let iCount = 0; iCount < passengerList.length; iCount++) {
    //   if (
    //     passengerList[iCount].validate === false ||
    //     passengerList[iCount].validDropOff === false
    //   ) {
    //     _result = false;
    //     break;
    //   }
    // }

    console.log(_result);
    return _result;
  };

  /////// Handle Validate Data
  const handleSetValidate = (name, value, message = "", messageVN = "") => {
    setValidate((prevData) => {
      return {
        ...prevData,
        [name]: {
          validate: value,
          message: message !== "" ? message : validate[name].message,
          messageVN: messageVN !== "" ? messageVN : validate[name].messageVN,
        },
      };
    });
  };

  const handleValidateDepart = () => {
    if (data["GO_DATE"] === "" || data["GO_TIME"] === "") return false;
    let _result = true;

    let _depart = getDateTimeFormat(data["GO_DATE"] + " " + data["GO_TIME"]);
    let _isValidate = timeDifference(_depart);

    if (_isValidate) {
      handleSetValidate("GO_DATE", true);
      handleSetValidate("GO_TIME", true);
    } else {
      _result = false;
      handleSetValidate(
        "GO_DATE",
        false,
        "The return date and time must be 3 hours greater than the present time",
        "Ngày giờ xuất phát phải lớn hơn 3 tiếng so với hiện tại"
      );
      handleSetValidate(
        "GO_TIME",
        false,
        "The return date and time must be 3 hours greater than the present time",
        "Ngày giờ xuất phát phải lớn hơn 3 tiếng so với hiện tại"
      );
    }

    /////// If Depart Date is Today && Current Time >= 14:00 PM => Invalidate
    const _currentDateTime = getDateTime();
    let _specificDateTime = getDate() + _specificTime;
    let _checkValidate = isCombackDate_Validate(
      _currentDateTime,
      _specificDateTime
    );

    if (data["GO_DATE"] === getDate() && !_checkValidate) {
      _result = false;
      handleSetValidate(
        "GO_DATE",
        false,
        "The depart date must start from tomorrow",
        "Ngày xuất phát phải từ ngày mai trở đi"
      );
    } else {
      handleSetValidate("GO_DATE", true);
    }

    return _result;
  };

  // React.useEffect(() => {
  //   console.log("Effect Change!");
  //   if (handleVaidate()) {
  //     if (handleValidateDepart()) {
  //     }
  //   }
  // }, []);

  return (
    <>
      <div
        className="min-h-screen pt-16 xs:pt-16 sm:pt-16 md:pt-16 relative overflow-auto"
       
      >
        {/* Overlay để đảm bảo nội dung dễ đọc */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-none"></div>
        <div className="relative z-10 mx-auto p-1 sm:p-2 md:p-4 lg:p-6 min-h-full">
          <Card className="border-white shadow-lg bg-background/10 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Tabs */}
              <div className="flex border-b bg-background/40 backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab('booking')}
                  className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold transition-colors ${
                    activeTab === 'booking'
                      ? 'bg-primary text-white border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {t("car_booking_tab") || "Car Booking"}
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold transition-colors ${
                    activeTab === 'report'
                      ? 'bg-primary text-white border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {t("car_report_tab") || "Report"}
                </button>
              </div>

              {/* Tab Content Container */}
              <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
                {/* Title */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary" id="title_text">
                    {activeTab === 'booking' ? (
                      <>
                        {t("request")} <span>{t("vehicle")}</span>
                      </>
                    ) : (
                      <>{t("driver_schedule_report")}</>
                    )}
                  </CardTitle>
                  {activeTab === 'report' && (
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
                        <span className="text-xs sm:text-sm text-gray-700">{t("driver_schedule_current") || "Đang đi"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                        <span className="text-xs sm:text-sm text-gray-700">{t("driver_schedule_scheduled") || "Lịch trình"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'silver' }}></div>
                        <span className="text-xs sm:text-sm text-gray-700">{t("driver_schedule_completed") || "Hoàn thành"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tab Content */}
                {activeTab === 'booking' && (
                  <form>
                  <Stack direction="column" spacing={{ xs: 3, sm: 4, md: 5 }}>
              {/* Section 1: Default Info */}
              <Box 
                sx={{ 
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  p: { xs: 2, sm: 3, md: 4 },
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <FormTitle order="1" title={t("title_first")} />
                <Box sx={{ mt: 2 }}>
                  <FormDefaultInfo data={data} />
                </Box>
              </Box>

              {/* Section 2: Booking Details */}
              <Box 
                sx={{ 
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  p: { xs: 2, sm: 3, md: 4 },
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <FormTitle order="2" title={t("title_second")} />
                <Box sx={{ mt: 3 }}>
                  {/* Reason Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        mb: 1.5,
                        color: 'text.primary',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      {t("frm_reason")} <span style={{ color: 'red' }}>(*)</span>
                    </Typography>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                      <Grid item xs={12} md={4} xl={3}>
                        <SelectModal
                          name="MAIN_REASON_CD"
                          data={_mainReason}
                          placeholder={t("frm_reason_placeholder")}
                          cValue={data.MAIN_REASON_CD}
                          handleEvent={handleChangeSub}
                          isValidate={validate.MAIN_REASON_CD.validate}
                          message={
                            lang === "en"
                              ? validate.MAIN_REASON_CD.message
                              : validate.MAIN_REASON_CD.messageVN
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={8} xl={9}>
                        <SelectModal
                          name="SUB_REASON_CD"
                          data={reason}
                          placeholder={t("frm_reason_detail_placeholder")}
                          cValue={data.SUB_REASON_CD}
                          handleEvent={handleChangeSub}
                          isValidate={validate.SUB_REASON_CD.validate}
                          message={
                            lang === "en"
                              ? validate.SUB_REASON_CD.message
                              : validate.SUB_REASON_CD.messageVN
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  {/* Address Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        mb: 1.5,
                        color: 'text.primary',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      {t("frm_memo_address_detail")} <span style={{ color: 'red' }}>(*)</span>
                    </Typography>
                    <TextField
                      multiline
                      maxRows={4}
                      name="ADDRESS_MEMO"
                      disabled={false}
                      placeholder={t("frm_address")}
                      color="info"
                      fullWidth
                      value={addressMemo}
                      onChange={handleChange}
                      error={!validate.ADDRESS_MEMO.validate}
                      helperText={
                        !validate.ADDRESS_MEMO.validate 
                          ? (lang === "en" ? validate.ADDRESS_MEMO.message : validate.ADDRESS_MEMO.messageVN)
                          : t("frm_address_helper")
                      }
                      FormHelperTextProps={{
                        sx: { 
                          color: !validate.ADDRESS_MEMO.validate ? 'error.main' : 'text.secondary',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <PlaceOutlinedIcon sx={{ color: 'action.active' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Box>
                  {/* Date & Time Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        mb: 2,
                        color: 'text.primary',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      {t("frm_depart_date")} & {t("frm_depart_time")}
                    </Typography>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <ResponsiveDateTime
                          type="DATE"
                          title={t("frm_depart_date")}
                          placeholder={t("frm_depart_date_placeholder")}
                          name="GO_DATE"
                          cValue={data.GO_DATE_FULL}
                          handleChange={handleChangeSub}
                          isValidate={validate.GO_DATE.validate}
                          validMessage={
                            lang === "en"
                              ? validate.GO_DATE.message
                              : validate.GO_DATE.messageVN
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ResponsiveDateTime
                          type="TIME"
                          title={t("frm_depart_time")}
                          placeholder={t("frm_depart_time_placeholder")}
                          name="GO_TIME"
                          cValue={data.GO_TIME_FULL}
                          handleChange={handleChangeSub}
                          isValidate={validate.GO_TIME.validate}
                          validMessage={
                            lang === "en"
                              ? validate.GO_TIME.message
                              : validate.GO_TIME.messageVN
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        mb: 2,
                        color: 'text.primary',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      {t("frm_cb_date")} & {t("frm_cb_time")}
                    </Typography>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <ResponsiveDateTime
                          type="DATE"
                          title={t("frm_cb_date")}
                          placeholder={t("frm_cb_date_placeholder")}
                          name="COMEBACK_DATE"
                          cValue={data.COMEBACK_DATE_FULL}
                          handleChange={handleChangeSub}
                          isValidate={validate.COMEBACK_DATE.validate}
                          validMessage={
                            lang === "en"
                              ? validate.COMEBACK_DATE.message
                              : validate.COMEBACK_DATE.messageVN
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ResponsiveDateTime
                          type="TIME"
                          title={t("frm_cb_time")}
                          placeholder={t("frm_cb_time_placeholder")}
                          name="COMEBACK_TIME"
                          cValue={data.COMEBACK_TIME_FULL}
                          handleChange={handleChangeSub}
                          isValidate={validate.COMEBACK_TIME.validate}
                          validMessage={
                            lang === "en"
                              ? validate.COMEBACK_TIME.message
                              : validate.COMEBACK_TIME.messageVN
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Pickup Location Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        mb: 1.5,
                        color: 'text.primary',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      {t("frm_pickup")} <span style={{ color: 'red' }}>(*)</span>
                    </Typography>
                    <SelectModal
                      name="DEPART_CD"
                      data={_departList}
                      placeholder={t("frm_pickup_placeholder")}
                      cValue={data.DEPART_CD}
                      handleEvent={handleChangeSub}
                      isValidate={validate.DEPART_CD.validate}
                      message={
                        lang === "en"
                          ? validate.DEPART_CD.message
                          : validate.DEPART_CD.messageVN
                      }
                    />
                    {openPickUp && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          name="DEPART_NM"
                          disabled={false}
                          placeholder="Type place to pick up"
                          color="info"
                          fullWidth
                          value={data.DEPART_NM}
                          onChange={handleChange}
                          error={!validate.DEPART_NM.validate}
                          helperText={!validate.DEPART_NM.validate ? t("frm_required") : ''}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <PlaceOutlinedIcon sx={{ color: 'action.active' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>

                  {/* Passenger Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        mb: 2,
                        color: 'text.primary',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      {t("frm_txt_total_passenger")} <span style={{ color: 'red' }}>(*)</span>
                    </Typography>
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="PASSSENGER_COUNT"
                          disabled={false}
                          placeholder="Total Number Of Passengers"
                          color="info"
                          type="number"
                          value={PassengerDeptCount}
                          onChange={HandlePassengerChange}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <AirlineSeatReclineExtraIcon sx={{ color: 'action.active' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isInclude}
                              sx={{ 
                                "& .MuiSvgIcon-root": { 
                                  fontSize: { xs: 24, sm: 28 } 
                                } 
                              }}
                              onChange={handleIsInclude}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                              {t("frm_include_me")}
                            </Typography>
                          }
                        />
                        {isInclude && (
                          <TextField
                            disabled={true}
                            placeholder={t("frm_pass_placeholder")}
                            color="info"
                            fullWidth
                            value={empName}
                            sx={{ 
                              mt: 1.5,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Korean Passengers Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        mb: 2,
                        color: 'text.primary',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      {t("frm_passengers_korean_list")}
                    </Typography>
                    <KoreaPassengerInfo
                      cValue={passengerSelectList}
                      expList={_EXPList}
                      handleName={handleSearch}
                      handlePassengerSelect={handlePassengerSelect}
                      handleClearClick={handleClearClick}
                    />
                  </Box>

                  {/* Vietnamese Passengers Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        mb: 2,
                        color: 'text.primary',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      {t("frm_passengers_vietnam_list")} <span style={{ color: 'red' }}>(*)</span>
                    </Typography>
                    <VietnamPassengerInfo
                      cValue={DeptName}
                      tValue={PassengerDeptCount}
                      DeptList={_DEPTList}
                      empName={empName}
                      dropOffList={_dropOffList}
                      handleName={handleSearch}
                      handleDropOff={handlePassengerDropOff}
                      deptNameHandleSelect={handleDeptSelect}
                      _PassengerChange={HandlePassengerChange}
                    />
                  </Box>
                </Box>
              </Box>
            </Stack>

                {/* Submit Button Section */}
                <Box 
                  sx={{ 
                    mt: { xs: 4, sm: 5, md: 6 },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  {data.MAIN_REASON_CD &&
                  data.SUB_REASON_CD &&
                  addressMemo &&
                  data.ARRIVAL &&
                  data.DEPART_CD &&
                  data.GO_DATE &&
                  data.GO_TIME &&
                  data.COMEBACK_DATE &&
                  data.COMEBACK_TIME &&
                  DeptName &&
                  validate.GO_DATE.validate &&
                  validate.GO_TIME.validate &&
                  validate.COMEBACK_DATE.validate &&
                  validate.COMEBACK_TIME.validate &&
                  PassengerDeptCount > 0 ? (
                    <ButtonPrimary
                      title={t("btn_request")}
                      handleClick={handleSubmit}
                    />
                  ) : (
                    <Box
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        border: 2,
                        borderRadius: 2,
                        borderColor: "error.main",
                        bgcolor: 'error.light',
                        textAlign: "center",
                        width: '100%',
                        maxWidth: { xs: '100%', sm: '500px' }
                      }}
                    >
                      <Typography 
                        color="error.main"
                        sx={{ 
                          fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                          fontWeight: 500
                        }}
                      >
                        {t("error_lack_of_information")}
                      </Typography>
                    </Box>
                  )}
                </Box>
                </form>
                )}

                {activeTab === 'report' && (
                  <>
                    {/* Date Navigator - Always visible */}
                    <Box sx={{ width: '100%', mb: 2 }}>
                      <div className="flex items-center justify-between mb-4 p-2 sm:p-4 border-b bg-background/40 backdrop-blur-sm gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                          <ButtonUI variant="outline" size="sm" onClick={goToPrevDay} className="h-8 w-8 p-0 flex-shrink-0">
                            <ChevronLeft className="h-4 w-4" />
                          </ButtonUI>
                          <div className="text-sm sm:text-lg md:text-xl font-semibold px-2 whitespace-nowrap flex-shrink-0 min-w-[110px] text-center">
                            {format(selectedDate, 'yyyy-MM-dd')}
                          </div>
                          <ButtonUI variant="outline" size="sm" onClick={goToNextDay} className="h-8 w-8 p-0 flex-shrink-0">
                            <ChevronRight className="h-4 w-4" />
                          </ButtonUI>
                          <ButtonUI variant="outline" size="sm" onClick={goToToday} className="h-8 px-2 text-xs sm:text-sm flex-shrink-0">
                            {t('today') || 'Today'}
                          </ButtonUI>
                        </div>
                        <ButtonUI 
                          className="h-8 px-3 sm:px-4 text-xs sm:text-sm bg-black text-white hover:bg-gray-800 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={fetchDriverSchedule}
                          disabled={loadingSchedule}
                        >
                          <Search className="h-4 w-4 mr-1 sm:mr-2" />
                          <span>{t('search') || 'Search'}</span>
                        </ButtonUI>
                      </div>
                    </Box>

                    {/* Content Area */}
                    {loadingSchedule ? (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: { xs: '300px', sm: '400px', md: '500px' },
                          width: '100%',
                          py: { xs: 4, sm: 6, md: 8 },
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'text.secondary',
                            textAlign: 'center',
                          }}
                        >
                          {t("loading") || "Loading..."}
                        </Typography>
                      </Box>
                    ) : scheduleError ? (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: { xs: '300px', sm: '400px', md: '500px' },
                          width: '100%',
                          py: { xs: 4, sm: 6, md: 8 },
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'error.main',
                            textAlign: 'center',
                          }}
                        >
                          {scheduleError}
                        </Typography>
                      </Box>
                    ) : driverScheduleData.length === 0 ? (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: { xs: '300px', sm: '400px', md: '500px' },
                          width: '100%',
                          py: { xs: 4, sm: 6, md: 8 },
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'text.secondary',
                            textAlign: 'center',
                          }}
                        >
                          {t("not_found") || "No Data Found!!!"}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', }}>
                        {/* Display driver schedule Gantt chart */}
                        <DriverScheduleGanttChart 
                          driverScheduleData={driverScheduleData}
                          selectedDate={selectedDate}
                          t={t}
                        />
                      </Box>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ModalWarning
        open={openWarn}
        handleOpen={handleOpenWarn}
        handleClose={handleCloseWarn}
        type="upload-failed"
      />
      <ModalInfo open={openInfo} handleClose={handleCloseInfo} type={type} />
    </>
  );
};

export default FormCar;
