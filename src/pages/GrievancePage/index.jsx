import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Search, FileX2, RefreshCw, CalendarIcon, X, LayoutList, AlertTriangle, HeartHandshake, ChevronUp, ChevronDown, SlidersHorizontal, Trophy, Medal, CircleStar, Sparkles, CheckCircle, Info } from "lucide-react";
import { getGrievanceRegistration, saveGrievanceRegistration } from "../../api/grievance";
import { format } from "date-fns";
import { Button } from '../../components/ui/button';
import { useDialogCarouselStore } from "../../stores/use-dialog-store";
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Input } from '../../components/ui/input';
import { Calendar } from '../../components/ui/calendar';
import GrievanceTableView from "../../components/Table/Grievance";
import { useCalculatedPageSize } from "../../hooks/useCalculatedPageSize";
import { useGrievanceTable } from "../../hooks/useGrievanceTable";
import { formatDateDisplay, formatDateToYYYYMMDD, formatDateToYYYYMM } from '../../lib/dateUtils'
import { TopicFilter, RateFilter } from "../../components/Filters/GrievanceFilters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../components/Dialog/Carousel/ui/dialog"
import StatsCard from "../../components/Card/Stats";
import { cn } from "../../lib/utils";
import PraiseCard from "../../components/Card/Praise";
import { removeVietnameseDiacritics } from "../../lib/base64Utils";
import { decodeBase64UTF8 } from "../../lib/base64Utils";

const getFullMonthRange = (date) => {
    const baseDate = date ? new Date(date) : new Date();
    const from = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    to.setHours(23, 59, 59, 999);

    return { from, to };
};

function base64ToUnicode(base64) {
    const binaryString = atob(base64);
    const bytes = Uint8Array.from(binaryString, (char) =>
        char.charCodeAt(0)
    );

    return new TextDecoder("utf-8").decode(bytes);
}

const matchesGlobalFilter = (
    rowData,
    filterValue
) => {
    if (!filterValue) return true;

    const searchTerm = removeVietnameseDiacritics(
        filterValue.toLowerCase().trim()
    );

    // 1. Employee Name
    const empName = decodeBase64UTF8(rowData.EMP_NM ?? '');

    if (
        empName &&
        removeVietnameseDiacritics(
            empName.toLowerCase().trim()
        ).includes(searchTerm)
    ) {
        return true;
    }

    // 2. Employee ID
    if (
        rowData.EMP_ID &&
        String(rowData.EMP_ID)
            .toLowerCase()
            .includes(searchTerm)
    ) {
        return true;
    }

    // 3. Department
    if (
        rowData.DEPT_NM &&
        removeVietnameseDiacritics(
            rowData.DEPT_NM.toLowerCase().trim()
        ).includes(searchTerm)
    ) {
        return true;
    }

    // 4. Praise Date
    if (
        rowData.PRAISE_DATE &&
        String(rowData.PRAISE_DATE)
            .toLowerCase()
            .includes(searchTerm)
    ) {
        return true;
    }

    // 5. Recipient
    if (
        rowData.RECIPIENT &&
        removeVietnameseDiacritics(
            rowData.RECIPIENT.toLowerCase().trim()
        ).includes(searchTerm)
    ) {
        return true;
    }

    // 6. Reason
    if (
        rowData.REASON &&
        removeVietnameseDiacritics(
            rowData.REASON.toLowerCase().trim()
        ).includes(searchTerm)
    ) {
        return true;
    }

    return false;
}

const GrievancePage = () => {
    // ========================================================================
    // STATE DECLARATIONS
    // ========================================================================

    /////// Translate Lang
    const { t } = useTranslation();
    const PAGE_SIZE = useCalculatedPageSize(5, 15);

    // Date Range State - Mặc định từ đầu tháng đến hôm nay
    const [dateRange, setDateRange] = useState(() => {
        return getFullMonthRange(new Date());
    });

    // Orders & Loading State
    const [orders, setOrders] = useState([]);
    const [ordersMobile, setOrdersMobile] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [tempGlobalFilter, setTempGlobalFilter] = useState('');
    const [globalFilter, setGlobalFilter] = useState('');
    const [rateFilter, setRateFilter] = useState('all');
    const [topicFilter, setTopicFilter] = useState('all');
    const openCarousel = useDialogCarouselStore(state => state.triggerMenu);
    const updateCarouselData = useDialogCarouselStore(state => state.updateDataModal);

    // Toast thông báo (auto-email / lỗi)
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (!toast) return
        const timer = window.setTimeout(() => setToast(null), 4500)
        return () => window.clearTimeout(timer)
    }, [toast])

    // Rate Confirmation State
    const [rateDialogState, setRateDialogState] = useState({
        isOpen: false,
        reqId: '',
        rateVal: 0,
    });
    const [rateLoading, setRateLoading] = useState(false);

    // Confirmation State
    const [confirmDialogState, setConfirmDialogState] = useState({
        isOpen: false,
        date: '',
    });
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Table State
    const [sorting, setSorting] = useState([]);
    const [columnFilters, setColumnFilters] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState({
        PRAISE_ID: false,
        EMP_ID: true,
        EMP_NM: true,
        DEPT_NM: true,
        PRAISE_DATE: true,
        RECIPIENT: true,
        TOPIC_NAME: true,
        REASON: true,
        images: true,
        action: true,
    });


    // Mobile: collapse the condition/search panel so the data area gets max space
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Count of user-narrowed filters (dates are pre-filled by default �  excluded)
    const activeFilterCount = [
        rateFilter,
        topicFilter,
        globalFilter,
        tempGlobalFilter,
    ].filter(Boolean).length

    // ========================================================================
    // IMAGE MODAL
    // ========================================================================

    const handleThumbClick = (imgPath) => {
        const thumb = imgPath
            .split(";")
            .map((x) => x.trim())
            .filter(Boolean);
        const newData = thumb.map((item, index) => ({
            id: index,
            title: `image_${index}`,
            description: t('reg_license'),
            image: item
        }));

        updateCarouselData(newData);
        openCarousel();
    }

    const openRatePanel = useCallback(async (reqId, starValue) => {
        // Valid user permission
        const validUserResult = await getGrievanceRegistration({
            argQType: "Q_AUTH",
            argFromDate: '',
            argToDate: ''
        });
        const userData = sessionStorage.getItem("userData");
        const userDataParse = await JSON.parse(userData);

        if (!validUserResult.success || validUserResult.data.length < 1 || userData === null || userData === undefined) {
            setToast({
                type: "error",
                message: t('invalid_permission'),
            });
            return;
        }

        const validUser = validUserResult.data.find(item => item.EMPID === userDataParse.EMPID);
        if (validUser === undefined || validUser === null) {
            setToast({
                type: "error",
                message: t('invalid_permission'),
            });
            return;
        }

        setRateDialogState({
            isOpen: true,
            reqId: reqId,
            rateVal: starValue
        });
    }, [setRateDialogState]);

    // ========================================================================
    // USE TABLE HOOK
    // ========================================================================

    const {
        visibleRows,
        filteredRowsCount,
        totalPages,
        startIndex,
        endIndex,
        table
    } = useGrievanceTable({
        orders,
        onOpenImageDialog: handleThumbClick,
        onOpenRatePanel: openRatePanel,
        formatDateDisplay,
        sorting,
        setSorting,
        columnFilters,
        setColumnFilters,
        globalFilter,
        setGlobalFilter,
        columnVisibility,
        setColumnVisibility,
        topicFilter,
        rateFilter,
        dateRange,
        currentPage,
        pageSize: PAGE_SIZE, // Số dòng tự động tính theo chiều cao màn hình (5-20 dòng)
    });

    // Fetch Orders từ API
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const _startDate = formatDateToYYYYMMDD(dateRange.from);
            const _endDate = formatDateToYYYYMMDD(dateRange.to);

            const result = await getGrievanceRegistration({
                argQType: "Q",
                argFromDate: _startDate,
                argToDate: _endDate
            });
            setOrders([]);

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                const newData = result.data.map((item) => {

                    return {
                        ...item,
                        REASON: base64ToUnicode(base64ToUnicode(item.REASON)),
                        RECIPIENT: base64ToUnicode(base64ToUnicode(item.RECIPIENT)).toLowerCase()
                            .split(" ")
                            .map((word) => {
                                if (!word) return word;
                                return word.charAt(0).toUpperCase() + word.slice(1);
                            })
                            .join(" "),
                        TOPIC_NAME: base64ToUnicode(base64ToUnicode(item.TOPIC_NAME)),
                    }
                });
                setOrders(newData);

                console.log(newData)
            }
        } catch (error) {
            console.error('Error fetching self registration data:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // Fetch registration data for self tab on initial load
    useEffect(() => {
        fetchOrders();
    }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    // Tính số lượng cho các filter options
    const filterCounts = useMemo(() => {
        const counts = {
            status: { all: orders.length, completed: 0, processing: 0 },
        };

        orders.forEach(order => {
            const isCompleted = order.RATE > 0;

            if (isCompleted) {
                counts.status.completed++;
            } else {
                counts.status.processing++;
            }
        });

        return counts;
    }, [orders]);

    const ordersRanking = useMemo(() => {
        const counts = {
            status: { first: '', second: '', third: '' },
        };

        const topDep = orders
            .reduce((acc, item) => {
                const deptNm = item.DEPT_NM || "Unknown";
                const rate = Number(item.RATE || 0);
                const found = acc.find((x) => x.DEPT_NM === deptNm);

                if (found) {
                    found.TOTAL_RATE += rate;
                    found.COUNT += 1;
                } else {
                    acc.push({
                        DEPT_NM: deptNm,
                        TOTAL_RATE: rate,
                        COUNT: 1,
                    });
                }

                return acc;
            }, [])
            .sort((a, b) => b.TOTAL_RATE - a.TOTAL_RATE)
            .slice(0, 3);

        counts.status.first = topDep[0]?.DEPT_NM || "";
        counts.status.second = topDep[1]?.DEPT_NM || "";
        counts.status.third = topDep[2]?.DEPT_NM || "";

        return counts;
    }, [orders]);

    // ========================================================================
    // PAGINATION HANDLERS
    // ========================================================================
    const handlePreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
    const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
    const handlePageClick = (page) => setCurrentPage(page);

    // Disable dates after today (future dates)
    const isDateDisabled = useCallback((date) => {
        const today = new Date();

        // Ngày đầu tiên của tháng sau
        const firstDayOfNextMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            1
        );
        firstDayOfNextMonth.setHours(0, 0, 0, 0);

        const dateToCheck = new Date(date);
        dateToCheck.setHours(0, 0, 0, 0);

        // Disable nếu date >= ngày đầu tháng sau
        return dateToCheck >= firstDayOfNextMonth;
    }, []);

    // Reload dữ liệu thủ công
    const handleReloadData = useCallback(() => {
        console.log('🔄 Đang tải lại dữ liệu...');
        fetchOrders();
    }, [fetchOrders]);

    // Xác nhận đánh giá khen ngợi
    const confirmRateOrder = useCallback(async () => {
        const { reqId, rateVal } = rateDialogState;
        if (!reqId) return;

        // Valid user permission
        const userData = sessionStorage.getItem("userData");
        const userDataParse = await JSON.parse(userData);

        if (userData === null || userData === undefined) {
            setToast({
                type: "error",
                message: t('invalid_permission'),
            });
            setRateDialogState({ isOpen: false, reqId: '', rateVal: 0 });
            return;
        }

        //
        setRateLoading(true);
        try {
            const uploadData = {
                argType: 'SAVE',
                argPraiseId: reqId,
                argRate: rateVal.toString(),
                argDate: '',
                argPic: userDataParse.EMPID
            };
            const result = await saveGrievanceRegistration(uploadData);

            if (result.success) {
                setRateDialogState({ isOpen: false, reqId: '', rateVal: 0 });
                setOrders((prev) =>
                    prev.map((item) =>
                        item.PRAISE_ID === reqId
                            ? { ...item, RATE: rateVal, RATE_USER: userDataParse.EMPID, RATE_USER_NM: userDataParse.EMP_NM }
                            : item
                    )
                );
                setToast({
                    type: "success",
                    message: t('swal_your_data_uploaded'),
                })
            } else {
                setToast({
                    type: "error",
                    message: t('swal_failed'),
                })
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            setToast({
                type: "error",
                message: t('swal_failed'),
            })
        } finally {
            setRateLoading(false);
        }
    }, [rateDialogState]);

    // Xác nhận order
    const onConfirmClick = useCallback(async () => {
        // Valid date
        const validDateResult = await getGrievanceRegistration({
            argQType: "Q_CONFIRM_DATE",
            argFromDate: '',
            argToDate: ''
        });

        if (!validDateResult.success || validDateResult.data.length < 1 || validDateResult.data[0].VALID_YN === "N") {
            setToast({
                type: "error",
                message: t('invalid_confirm_date'),
            });
            return;
        }

        // Valid user permission
        const validUserResult = await getGrievanceRegistration({
            argQType: "Q_CONFIRM",
            argFromDate: '',
            argToDate: ''
        });
        const userData = sessionStorage.getItem("userData");
        const userDataParse = await JSON.parse(userData);

        if (!validUserResult.success || validUserResult.data.length < 1 || userData === null || userData === undefined) {
            setToast({
                type: "error",
                message: t('invalid_permission'),
            });
            return;
        }

        const validUser = validUserResult.data.find(item => item.EMPID === userDataParse.EMPID);
        if (validUser === undefined || validUser === null) {
            setToast({
                type: "error",
                message: t('invalid_permission'),
            });
            return;
        }

        setConfirmDialogState({
            isOpen: true,
            date: formatDateToYYYYMM(new Date()),
        });
    }, [dateRange]);

    // Xác nhận order
    const confirmOrder = useCallback(async () => {
        const { date } = confirmDialogState;
        if (!date) return;

        // Valid user permission
        const userData = sessionStorage.getItem("userData");
        const userDataParse = await JSON.parse(userData);

        if (userData === null || userData === undefined) {
            setToast({
                type: "error",
                message: t('invalid_permission'),
            });
            setConfirmDialogState({ isOpen: false, date: '' });
            return;
        }

        //
        setConfirmLoading(true);
        try {
            const uploadData = {
                argType: 'CONFIRM',
                argPraiseId: '',
                argRate: '',
                argDate: date,
                argPic: userDataParse.EMPID
            };

            const result = await saveGrievanceRegistration(uploadData);

            if (result.success) {
                setConfirmDialogState({ isOpen: false, date: '' });
                setOrders((prev) =>
                    prev.map((item) => ({
                        ...item,
                        CONFIRM_YN: "Y",
                    }))
                );

                setToast({
                    type: "success",
                    message: t('swal_your_data_uploaded'),
                })
            } else {
                setToast({
                    type: "error",
                    message: t('swal_failed'),
                })
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            setToast({
                type: "error",
                message: t('swal_failed'),
            })
        } finally {
            setConfirmLoading(false);
        }
    }, [confirmDialogState]);

    // Debounce filter (200ms) - Giảm lag khi gõ
    useEffect(() => {
        const timeout = setTimeout(() => {
            setGlobalFilter(tempGlobalFilter);
            // Reset page only when filter is cleared or changed significantly
            if (tempGlobalFilter === '') {
                setCurrentPage(1);
            }
        }, 200);
        return () => clearTimeout(timeout);
    }, [tempGlobalFilter]);

    useEffect(() => {
        const sortedAndFilteredRows = orders.filter(row => {
            const data = row;

            // Filter theo Trạng Thái
            if (topicFilter !== 'all') {
                const topicVal = data.TOPIC || '';
                const isSupport = topicVal === '0001';
                const isFriendly = topicVal === '0002';
                const isSafety = topicVal === '0003';
                const isJob = topicVal === '0004';
                const isOther = topicVal === '0005';

                if (topicFilter === '0001' && !isSupport) return false;
                if (topicFilter === '0002' && !isFriendly) return false;
                if (topicFilter === '0003' && !isSafety) return false;
                if (topicFilter === '0004' && !isJob) return false;
                if (topicFilter === '0005' && !isOther) return false;
            }

            // Filter theo Request Type
            if (rateFilter !== 'all') {
                const rateVal = data.RATE || 0;
                const isFiveStar = rateVal === 5;
                const isFourStar = rateVal === 4;
                const isThreeStar = rateVal === 3;
                const isTwoStar = rateVal === 2;
                const isOneStar = rateVal === 1;

                if (rateFilter === 'VERY_GOOD' && !isFiveStar) return false;
                if (rateFilter === 'GOOD' && !isFourStar) return false;
                if (rateFilter === 'NORMAL' && !isThreeStar) return false;
                if (rateFilter === 'BAD' && !isTwoStar) return false;
                if (rateFilter === 'VERY_BAD' && !isOneStar) return false;
                if (rateFilter === 'none' && rateVal !== 0) return false;
            }

            if (
                !matchesGlobalFilter(row, globalFilter)
            ) {
                return false;
            }

            return true;
        });

        setOrdersMobile(sortedAndFilteredRows);
    },[globalFilter, rateFilter, topicFilter, orders])

    return (
        <>
            <div className="relative h-[calc(100vh-3.5rem)] sm:h-[calc(100vh)] flex flex-col overflow-hidden bg-[#f9fafb]" style={{ paddingTop: '72px' }}>
                {/* Fixed Background Layer */}
                <div className="fixed inset-0 dark:bg-slate-950 z-0 pointer-events-none" aria-hidden="true" />
                <div className="relative z-10 pt-0 md:pt-2 p-3 md:p-4 flex flex-col gap-2 md:gap-3 h-full overflow-hidden">
                    {/* ================================================================
                        HEADER SECTION - Synchronized with Dashboard
                    ================================================================ */}
                    <div className="flex-shrink-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0 w-10 h-10">
                                <HeartHandshake color="#fff" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-bold text-blue-900 truncate">{t('grievance_title')}</h1>
                                <p className="text-xs text-slate-500 truncate">{t('grievance_desc')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="hidden md:flex items-center h-10 px-3 rounded-xl bg-white border border-blue-100 shadow-sm">
                                <div className="flex items-center gap-2 px-2">
                                    <p className="text-lg font-bold leading-tight text-slate-800">{filterCounts.status.all}</p>
                                    <p className="text-xs text-slate-500 leading-tight whitespace-nowrap">{t('total')}</p>
                                </div>
                                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                <div className="flex items-center gap-2 px-2">
                                    <p className="text-lg font-bold leading-tight text-blue-600">{filterCounts.status.processing}</p>
                                    <p className="text-xs text-slate-500 leading-tight whitespace-nowrap">{t('not_rated_yet')}</p>
                                </div>
                                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                <div className="flex items-center gap-2 px-2">
                                    <p className="text-lg font-bold leading-tight text-emerald-600">{filterCounts.status.completed}</p>
                                    <p className="text-xs text-slate-500 leading-tight whitespace-nowrap">{t('rated')}</p>
                                </div>
                            </div>
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 shadow-md hover:shadow-lg px-5 py-2 bg-[#0f005f] hover:bg-[#1a0099] text-white flex-shrink-0 h-10"
                                onClick={onConfirmClick}
                            >
                                <Trophy size={18} />
                                <span className="hidden sm:inline">{t('confirm_trophy')}</span>
                            </button>
                        </div>
                    </div>

                    <div className="md:hidden flex-shrink-0 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-white border border-blue-100 shadow-sm px-2 py-1.5 text-center">
                            <p className="text-lg font-bold leading-tight text-slate-800">{filterCounts.status.all}</p>
                            <p className="text-[11px] text-slate-500 leading-tight truncate">{t('total')}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-blue-100 shadow-sm px-2 py-1.5 text-center">
                            <p className="text-lg font-bold leading-tight text-blue-800">{filterCounts.status.processing}</p>
                            <p className="text-[11px] text-slate-500 leading-tight truncate">{t('not_rated_yet')}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-blue-100 shadow-sm px-2 py-1.5 text-center">
                            <p className="text-lg font-bold leading-tight text-emerald-800">{filterCounts.status.completed}</p>
                            <p className="text-[11px] text-slate-500 leading-tight truncate">{t('rated')}</p>
                        </div>
                    </div>

                    {/* ================================================================
                        FILTER SECTION - Synchronized with Dashboard
                    ================================================================ */}
                    <div className="rounded-2xl border border-blue-100 bg-white shadow-md card-shadow-lg flex-shrink-0 p-3 sm:p-4 relative">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            {/* Left: All Controls in one row */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                {/* Date From */}
                                <div className="flex-col hidden lg:flex">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('meeting_room_start_date')}</label>
                                    <div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm rounded-tr-none rounded-br-none border-r-0"
                                            title="Tải lại dữ liệu"
                                        >
                                            <CalendarIcon className="h-3.5 w-3.5" />
                                        </Button>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={`h-9 px-2.5 pr-4 justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg rounded-tl-none rounded-bl-none shadow-sm text-sm ${!dateRange && "text-muted-foreground"}`}
                                                >
                                                    <div className="h-3.5" />
                                                    {dateRange?.from ? (
                                                        <span>{format(dateRange.from, "dd/MM/yyyy")}</span>
                                                    ) : (
                                                        <span>Chọn ngày</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <Calendar
                                                    mode="single"
                                                    defaultMonth={dateRange?.from}
                                                    selected={dateRange.from}
                                                    onSelect={(e) => {
                                                        setDateRange((prev) => ({
                                                            ...prev,
                                                            from: e,
                                                        }))
                                                    }}
                                                    initialFocus
                                                    disabled={isDateDisabled}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                {/* Date To */}
                                <div className="flex-col hidden lg:flex">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('meeting_room_end_date')}</label>
                                    <div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm rounded-tr-none rounded-br-none border-r-0"
                                            title="Tải lại dữ liệu"
                                        >
                                            <CalendarIcon className="h-3.5 w-3.5" />
                                        </Button>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={`h-9 px-2.5 pr-4 justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg rounded-tl-none rounded-bl-none shadow-sm text-sm ${!dateRange && "text-muted-foreground"}`}
                                                >
                                                    <div className="h-3.5" />
                                                    {dateRange?.to ? (
                                                        <span>{format(dateRange.to, "dd/MM/yyyy")}</span>
                                                    ) : (
                                                        <span>Chọn ngày</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <Calendar
                                                    mode="single"
                                                    defaultMonth={dateRange?.to}
                                                    selected={dateRange.to}
                                                    onSelect={(e) => setDateRange((prev) => ({
                                                        ...prev,
                                                        to: e,
                                                    }))}
                                                    initialFocus
                                                    disabled={isDateDisabled}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="flex-col hidden lg:flex">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('topic')}</label>

                                    <TopicFilter value={topicFilter} onChange={setTopicFilter} />
                                </div>
                                <div className="flex-col hidden lg:flex">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('rated')}</label>
                                    <RateFilter value={rateFilter} onChange={setRateFilter} />
                                </div>
                                {/* Search */}
                                <div className="flex-col hidden lg:flex">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('search')}</label>
                                    <div className="relative group w-full sm:w-auto">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            type="text"
                                            value={tempGlobalFilter}
                                            onChange={(e) => {
                                                setTempGlobalFilter(e.target.value);
                                                if (e.target.value === '') setCurrentPage(1);
                                            }}
                                            placeholder={`${t('input_placeholder')}...`}
                                            className="pl-9 h-9 w-full sm:w-[180px] lg:w-[220px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 focus:border-blue-500 transition-all rounded-lg shadow-sm text-sm"
                                        />
                                        {tempGlobalFilter && (
                                            <button
                                                onClick={() => { setTempGlobalFilter(''); setCurrentPage(1); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                            >
                                                <FileX2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* Reload */}
                                <div className="flex-col hidden lg:flex">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1 opacity-0">{t('topic')}</label>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleReloadData}
                                        disabled={loading}
                                        className="h-9 w-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm"
                                        title="Tải lại dữ liệu"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>

                            </div>
                            {/* Right: Title + Stats */}
                            <div className="hidden md:flex flex-col sm:flex-row sm:items-center gap-4">
                                <StatsCard
                                    title={t('first_place')}
                                    value={ordersRanking.status.first}
                                    icon={Medal}
                                    iconColor="text-blue-500"
                                    iconBgFrom="from-yellow-500"
                                    iconBgTo="to-yellow-400"
                                    delay="stagger-1"
                                />
                                <StatsCard
                                    title={t('second_place')}
                                    value={ordersRanking.status.second}
                                    icon={Sparkles}
                                    iconColor="text-blue-500"
                                    iconBgFrom="from-slate-500"
                                    iconBgTo="to-gray-400"
                                    delay="stagger-1"
                                />
                                <StatsCard
                                    title={t('third_place')}
                                    value={ordersRanking.status.third}
                                    icon={CircleStar}
                                    iconColor="text-stone-500"
                                    iconBgFrom="from-orange-500"
                                    iconBgTo="to-amber-500"
                                    delay="stagger-1"
                                />
                            </div>
                        </div>

                        <div className="md:hidden flex items-center gap-2 mb-0">
                            <div className="relative flex-1 min-w-0">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    value={tempGlobalFilter}
                                    onChange={(e) => setTempGlobalFilter(e.target.value)}
                                    placeholder={`${t('input_placeholder')}...`}
                                    className="w-full h-10 pl-9 pr-8 text-sm placeholder:text-[15px] bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                                />
                                {tempGlobalFilter && (
                                    <button
                                        type="button"
                                        onClick={() => setTempGlobalFilter("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setFiltersOpen((v) => !v)}
                                aria-expanded={filtersOpen}
                                className={cn(
                                    "relative flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border text-sm font-semibold active:scale-95 transition-all",
                                    filtersOpen
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                                )}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                {t("filter_title")}
                                {activeFilterCount > 0 && (
                                    <span className={cn(
                                        "ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                                        filtersOpen ? "bg-white/25 text-white" : "bg-blue-600 text-white"
                                    )}>
                                        {activeFilterCount}
                                    </span>
                                )}
                                {filtersOpen ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        {/* Floating filter popup */}
                        {filtersOpen && (
                            <>
                                {/* Backdrop */}
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {/* Date From */}
                                    <div className="flex-col flex">
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('meeting_room_start_date')}</label>
                                        <div className="flex">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-10 md:h-9 w-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm rounded-tr-none rounded-br-none border-r-0"
                                                title="Tải lại dữ liệu"
                                            >
                                                <CalendarIcon className="h-3.5 w-3.5" />
                                            </Button>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={`h-10 md:h-9 px-2.5 pr-4 w-full justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg rounded-tl-none rounded-bl-none shadow-sm text-sm ${!dateRange && "text-muted-foreground"}`}
                                                    >
                                                        <div className="h-3.5" />
                                                        {dateRange?.from ? (
                                                            <span>{format(dateRange.from, "dd/MM/yyyy")}</span>
                                                        ) : (
                                                            <span>Chọn ngày</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="end">
                                                    <Calendar
                                                        mode="single"
                                                        defaultMonth={dateRange?.from}
                                                        selected={dateRange.from}
                                                        onSelect={(e) => {
                                                            setDateRange((prev) => ({
                                                                ...prev,
                                                                from: e,
                                                            }))
                                                        }}
                                                        initialFocus
                                                        disabled={isDateDisabled}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    {/* Date To */}
                                    <div className="flex-col flex">
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('meeting_room_end_date')}</label>
                                        <div className="flex">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-10 md:h-9 w-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm rounded-tr-none rounded-br-none border-r-0"
                                                title="Tải lại dữ liệu"
                                            >
                                                <CalendarIcon className="h-3.5 w-3.5" />
                                            </Button>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={`h-10 md:h-9 px-2.5 pr-4 w-full justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg rounded-tl-none rounded-bl-none shadow-sm text-sm ${!dateRange && "text-muted-foreground"}`}
                                                    >
                                                        <div className="h-3.5" />
                                                        {dateRange?.to ? (
                                                            <span>{format(dateRange.to, "dd/MM/yyyy")}</span>
                                                        ) : (
                                                            <span>Chọn ngày</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="end">
                                                    <Calendar
                                                        mode="single"
                                                        defaultMonth={dateRange?.to}
                                                        selected={dateRange.to}
                                                        onSelect={(e) => setDateRange((prev) => ({
                                                            ...prev,
                                                            to: e,
                                                        }))}
                                                        initialFocus
                                                        disabled={isDateDisabled}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="flex-col flex col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('topic')}</label>

                                        <TopicFilter value={topicFilter} onChange={setTopicFilter} />
                                    </div>
                                    <div className="flex-col flex col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('rated')}</label>
                                        <RateFilter value={rateFilter} onChange={setRateFilter} />
                                    </div>

                                </div>
                            </>
                        )}

                    </div>
                    {/* ================================================================
                        CONTENT AREA - Khu vực hiển thị dữ liệu
                    ================================================================ */}
                    <div className="hidden md:block flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in stagger-1">
                        {loading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900/30"></div>
                                    <div className="h-14 w-14 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                                    <LayoutList className="absolute h-6 w-6 text-blue-400" />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('load_title')}...</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('load_desc')}</p>
                                </div>
                            </div>
                        ) : (
                            <GrievanceTableView
                                table={table}
                                visibleRows={visibleRows}
                                columnVisibility={columnVisibility}
                            />
                        )}
                    </div>
                    {/* ================================================================
                        CONTENT AREA - MOBILE
                    ================================================================ */}
                    <div className="md:hidden flex-1 min-h-0 overflow-y-scroll">
                        {ordersMobile.map(item => <PraiseCard key={item.PRAISE_ID} data={item} onOpenImageDialog={handleThumbClick} onOpenRatePanel={openRatePanel} />)}
                    </div>
                    {/* ================================================================
                        PAGINATION CONTROLS - Phân trang
                    ================================================================ */}
                    {!loading && filteredRowsCount > 0 && (
                        <div className="hidden md:flex shrink-0 -mt-1 py-2 px-4 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 animate-fade-in stagger-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>{t('show')}</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{startIndex + 1}-{Math.min(endIndex, filteredRowsCount)}</span>
                                <span>{t('of')}</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredRowsCount.toLocaleString('vi-VN')}</span>
                                <span>{t('result')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className="h-9 px-3 gap-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl disabled:opacity-50 transition-all hover-lift"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t('previous')}</span>
                                </Button>
                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 2) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 1) {
                                            pageNum = totalPages - 2 + i;
                                        } else {
                                            pageNum = currentPage - 1 + i;
                                        }
                                        if (pageNum < 1) pageNum = 1;
                                        if (pageNum > totalPages) return null;

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageClick(pageNum)}
                                                className={`h-9 w-9 p-0 rounded-xl font-medium transition-all ${currentPage === pageNum
                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg ring-2 ring-blue-200 dark:ring-blue-800'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover-lift'
                                                    }`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="h-9 px-3 gap-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl disabled:opacity-50 transition-all hover-lift"
                                >
                                    <span className="hidden sm:inline">{t('next')}</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                    {/* Rating Dialog */}
                    <Dialog
                        open={rateDialogState.isOpen}
                        onOpenChange={(open) => !open && setRateDialogState({ isOpen: false, reqId: '', rateVal: 0 })}
                    >
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-red-900/30">
                                        <Info className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {t('confirm_rate')}
                                    </DialogTitle>
                                </div>
                                <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    {t('rate_title')} <span className="font-bold text-gray-900 dark:text-gray-100">{rateDialogState.rateVal} {t('star')}</span> {t('rate_desc')}?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setRateDialogState({ isOpen: false, reqId: '', rateVal: 0 })}
                                    disabled={rateLoading}
                                    className="flex-1"
                                >
                                    {t('btn_cancel')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmRateOrder}
                                    disabled={rateLoading}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-700 transition-all ease-linear"
                                >
                                    {rateLoading ? (
                                        <span className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            {t('confirming')}...
                                        </span>
                                    ) : (
                                        t('btn_confirm')
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    {/* Confirmation Dialog */}
                    <Dialog
                        open={confirmDialogState.isOpen}
                        onOpenChange={(open) => !open && setConfirmDialogState({ isOpen: false, date: '' })}
                    >
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-red-900/30">
                                        <Info className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {t('confirm_trophy')}
                                    </DialogTitle>
                                </div>
                                <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    {t('confirm_title')} <span className="font-bold text-gray-900 dark:text-gray-100">{t('month')} {format(dateRange?.from, 'MM/yyyy')}</span> ?
                                    <br />
                                    <span className="text-red-600 dark:text-red-400 font-medium">
                                        {t('warn_desc')}.
                                    </span>
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmDialogState({ isOpen: false, date: '' })}
                                    disabled={confirmLoading}
                                    className="flex-1"
                                >
                                    {t('btn_cancel')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmOrder}
                                    disabled={confirmLoading}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-700 transition-all ease-linear"
                                >
                                    {confirmLoading ? (
                                        <span className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            {t('confirming')}...
                                        </span>
                                    ) : (
                                        t('btn_confirm')
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            {toast &&
                createPortal(
                    <div className="fixed top-4 right-4 z-[9999] animate-fadeIn pointer-events-none">
                        <div
                            className={cn(
                                "flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold pointer-events-auto",
                                toast.type === "success"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    : "bg-rose-50 border-rose-200 text-rose-800"
                            )}
                        >
                            {toast.type === "success" ? (
                                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                            )}
                            <span>{toast.message}</span>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
};

export default GrievancePage;