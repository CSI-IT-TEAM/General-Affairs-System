import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Search, FileX2, RefreshCw, CalendarIcon, X, LayoutList, AlertTriangle, HeartHandshake, ChevronUp, ChevronDown, SlidersHorizontal, Trophy, CircleStar, Sparkles, CheckCircle, Info, Star, Users, Image as ImageIcon } from "lucide-react";
import { getGrievanceRegistration, saveGrievanceRegistration } from "../../api/grievance";
import { format, subMonths } from "date-fns";
import { Button } from '../../components/ui/button';
import { useDialogCarouselStore } from "../../stores/use-dialog-store";
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Input } from '../../components/ui/input';
import { Calendar } from '../../components/ui/calendar';
import GrievanceTableView from "../../components/Table/Grievance";
import { useCalculatedPageSize } from "../../hooks/useCalculatedPageSize";
import { useGrievanceTable, evaluateFactoryWinners, getTopicLabel } from "../../hooks/useGrievanceTable";
import { formatDateDisplay, formatDateToYYYYMMDD } from '../../lib/dateUtils'
import { TopicFilter, RateFilter, FactoryFilter, ViewModeFilter } from "../../components/Filters/GrievanceFilters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../components/Dialog/Carousel/ui/dialog"
import StatsCard from "../../components/Card/Stats";
import { cn } from "../../lib/utils";
import PraiseCard from "../../components/Card/Praise";
import { removeVietnameseDiacritics } from "../../lib/base64Utils";
import { decodeBase64UTF8 } from "../../lib/base64Utils";

const getDefaultDateRange = (baseDate = new Date()) => {
    const to = new Date(baseDate);
    to.setHours(23, 59, 59, 999);
    const from = subMonths(to, 2);
    from.setHours(0, 0, 0, 0);

    return { from, to };
};
const getFullMonthRange = (date) => {
    const baseDate = date ? new Date(date) : new Date();
    const from = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    to.setHours(23, 59, 59, 999);

    return { from, to };
};

function base64ToUnicode(base64) {
    if (!base64 || typeof base64 !== "string") return "";
    try {
        const binaryString = atob(base64);
        const bytes = Uint8Array.from(binaryString, (char) =>
            char.charCodeAt(0)
        );

        return new TextDecoder("utf-8").decode(bytes);
    } catch {
        return base64;
    }
}

const formatBlobToImage = (photo) => {
    if (!photo) return null;
    try {
        if (typeof photo === "string") {
            if (photo.startsWith("data:image")) return photo;
            return `data:image/jpeg;base64,${photo}`;
        }
        const bufferData = photo.data || photo;
        if (Array.isArray(bufferData) || bufferData instanceof Uint8Array) {
            let binary = "";
            const bytes = new Uint8Array(bufferData);
            const len = bytes.byteLength;
            if (len === 0) return null;
            const chunkSize = 8192;
            for (let i = 0; i < len; i += chunkSize) {
                const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
                binary += String.fromCharCode.apply(null, chunk);
            }
            return `data:image/jpeg;base64,${window.btoa(binary)}`;
        }
        return null;
    } catch (e) {
        console.warn("Error converting BLOB photo:", e);
        return null;
    }
};

const EvaluatorAvatar = ({ person, idx }) => {
    const [imgError, setImgError] = useState(false);
    const photoData = person.PHOTO || person.photo;
    const photoUrl = useMemo(() => formatBlobToImage(photoData), [photoData]);

    useEffect(() => {
        setImgError(false);
    }, [photoData]);

    const initial = person.NAME ? person.NAME.trim().split(" ").slice(-1)[0][0] : "U";
    const AVATAR_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500'];
    const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];

    if (photoUrl && !imgError) {
        return (
            <img
                src={photoUrl}
                alt={person.NAME || "Avatar"}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0", avatarBg)}>
            {initial}
        </div>
    );
};

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

const getStarText = (stars, t) => {
    switch (stars) {
        case 5:
            return t('grievance_star_5');
        case 4:
            return t('grievance_star_4');
        case 3:
            return t('grievance_star_3');
        case 2:
            return t('grievance_star_2');
        case 1:
            return t('grievance_star_1');
        default:
            return t('grievance_select_rating');
    }
};

const GrievancePage = () => {
    // ========================================================================
    // STATE DECLARATIONS
    // ========================================================================

    /////// Translate Lang
    const { t } = useTranslation();
    const PAGE_SIZE = useCalculatedPageSize(5, 15);

    // Date Range State - Mặc định End Date là ngày hiện tại, lùi về 2 tháng là Start Date
    const [dateRange, setDateRange] = useState(() => {
        return getDefaultDateRange();
    });

    // Orders & Loading State
    const [orders, setOrders] = useState([]);
    const [ordersMobile, setOrdersMobile] = useState([]);
    const [loading, setLoading] = useState(true);
    const ratedPraiseIdsRef = useRef(new Set());

    // Search & Filter State
    const [tempGlobalFilter, setTempGlobalFilter] = useState('');
    const [globalFilter, setGlobalFilter] = useState('');
    const [rateFilter, setRateFilter] = useState('all');
    const [topicFilter, setTopicFilter] = useState('all');
    const [factoryFilter, setFactoryFilter] = useState('all');
    const [viewFilter, setViewFilter] = useState('all');
    const openCarousel = useDialogCarouselStore(state => state.triggerMenu);
    const updateCarouselData = useDialogCarouselStore(state => state.updateDataModal);

    // Toast thông báo (auto-email / lỗi)
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (!toast) return
        const timer = window.setTimeout(() => setToast(null), 4500)
        return () => window.clearTimeout(timer)
    }, [toast])

    // Rate & Evaluator State
    const [rateDialogState, setRateDialogState] = useState({
        isOpen: false,
        reqId: '',
        rateVal: 5,
        itemData: null,
        canEdit: true,
    });
    const [hoverStar, setHoverStar] = useState(0);
    const [rateLoading, setRateLoading] = useState(false);
    const [evaluatorsList, setEvaluatorsList] = useState([]);
    const [evaluatorsLoading, setEvaluatorsLoading] = useState(false);

    // Confirmation State
    const [confirmDialogState, setConfirmDialogState] = useState({
        isOpen: false,
    });
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmListLoading, setConfirmListLoading] = useState(false);
    const [confirmWinners, setConfirmWinners] = useState([]);
    const [confirmMonths, setConfirmMonths] = useState([]);
    const [confirmListError, setConfirmListError] = useState(false);
    const [selectedConfirmWinners, setSelectedConfirmWinners] = useState({});
    const getConfirmGroup = (deptNm) => {
        const dept = String(deptNm || '').toUpperCase().trim();
        if (dept.includes('VJ3')) return 'VJ3';
        if (dept.includes('VJ1') || dept.includes('VJ2') || dept.startsWith('VJ')) return 'VJ';
        return 'VJ';
    };
    const confirmGroups = ['VJ', 'VJ3'];
    const populatedConfirmGroups = confirmGroups.filter((group) =>
        confirmWinners.some((person) => getConfirmGroup(person.DEPT_NM) === group)
    );
    const canConfirmWinners = populatedConfirmGroups.length > 0 && populatedConfirmGroups.every((group) => {
        const candidates = confirmWinners.filter((person) => getConfirmGroup(person.DEPT_NM) === group);
        return candidates.some((person) => String(person.PRAISE_ID) === String(selectedConfirmWinners[group]));
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Judge Selected Winners State (Lưu người được Giám khảo chọn khi đồng điểm theo từng Factory & Rate)
    const [selectedJudgeWinners, setSelectedJudgeWinners] = useState(() => {
        try {
            const saved = localStorage.getItem('grievance_judge_selected_winners');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const handleSelectJudgeWinner = useCallback((factory, praiseId) => {
        setSelectedJudgeWinners(prev => {
            const isAlreadySelected = prev[factory] === praiseId;
            const updated = {
                ...prev,
                [factory]: isAlreadySelected ? null : praiseId,
            };
            try {
                localStorage.setItem('grievance_judge_selected_winners', JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save selected judge winners', e);
            }
            return updated;
        });
    }, []);

    // Table State
    const [sorting, setSorting] = useState([{ id: 'FACTORY', desc: false }]);
    const [columnFilters, setColumnFilters] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState({
        judge_select: true,
        PRAISE_ID: false,
        EMP_ID: true,
        EMP_NM: true,
        DEPT_NM: true,
        FACTORY: true,
        PRAISE_DATE: true,
        RECIPIENT: true,
        TOPIC_NAME: true,
        REASON: true,
        images: true,
        RATE: true,
        RATE_USER_NM: true,
        CONFIRM_YN: true,
        WINNER_YN: true,
        action: true,
    });

    // Mobile: collapse the condition/search panel so the data area gets max space
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Count of user-narrowed filters (dates are pre-filled by default �  excluded)
    const activeFilterCount = [
        viewFilter !== 'all' ? viewFilter : null,
        factoryFilter !== 'all' ? factoryFilter : null,
        rateFilter !== 'all' ? rateFilter : null,
        topicFilter !== 'all' ? topicFilter : null,
        globalFilter,
        tempGlobalFilter,
    ].filter(Boolean).length;

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

    const openRatePanel = useCallback(async (reqId, starValue, itemData) => {
        setHoverStar(0);
        const isConfirmed = String(itemData?.CONFIRM_YN ?? itemData?.confirm_yn ?? '').toUpperCase() === 'Y';
        const locallyRated = ratedPraiseIdsRef.current.has(String(reqId));
        const initialCanEdit = !isConfirmed && !locallyRated && (itemData ? String(itemData.CAN_EDIT ?? itemData.can_edit ?? 'Y').toUpperCase() !== 'N' : true);
        setRateDialogState({
            isOpen: true,
            reqId: reqId,
            rateVal: Number(starValue) > 0 ? Number(starValue) : isConfirmed ? 0 : 5,
            itemData: itemData || null,
            canEdit: initialCanEdit,
        });

        // Gọi API lấy danh sách người đánh giá với Q_RATE_LIST
        setEvaluatorsLoading(true);
        try {
            const res = await getGrievanceRegistration({
                argQType: 'Q_RATE_LIST',
                argPraiseID: reqId ? String(reqId) : '',
                argFromDate: '',
                argToDate: '',
            });

            if (res && res.success && Array.isArray(res.data)) {
                setEvaluatorsList(res.data);

                // Lấy thông tin user hiện tại
                const userData = sessionStorage.getItem("userData");
                let userDataParse = null;
                try {
                    userDataParse = userData ? JSON.parse(userData) : null;
                } catch (e) {
                    userDataParse = null;
                }
                const currentEmpId = userDataParse?.EMPID || "99115447";

                // Tìm thông tin đánh giá của user hiện tại
                const myRate = res.data.find(
                    (x) => String(x.EMPID).trim() === String(currentEmpId).trim()
                );

                // Kiểm tra quyền chỉnh sửa dựa vào CAN_EDIT
                let isCanEdit = !isConfirmed && !locallyRated;
                const canEditFromItem = itemData?.CAN_EDIT ?? itemData?.can_edit;
                const canEditFromUser = myRate?.CAN_EDIT ?? myRate?.can_edit;

                if (canEditFromItem !== undefined && String(canEditFromItem).toUpperCase() === 'N') {
                    isCanEdit = false;
                } else if (canEditFromUser !== undefined && String(canEditFromUser).toUpperCase() === 'N') {
                    isCanEdit = false;
                } else if (myRate && String(myRate.CAN_EDIT).toUpperCase() === 'N') {
                    isCanEdit = false;
                } else if (!myRate && res.data.length > 0 && res.data.every(x => String(x.CAN_EDIT || x.can_edit).toUpperCase() === 'N')) {
                    isCanEdit = false;
                }

                if (!isConfirmed && myRate && myRate.RATE && Number(myRate.RATE) > 0) {
                    setRateDialogState((prev) => ({
                        ...prev,
                        rateVal: Number(myRate.RATE),
                        canEdit: isCanEdit,
                    }));
                } else {
                    setRateDialogState((prev) => ({
                        ...prev,
                        canEdit: isCanEdit,
                    }));
                }
            } else {
                setEvaluatorsList([]);
            }
        } catch (err) {
            console.error('Error fetching rate list:', err);
            setEvaluatorsList([]);
        } finally {
            setEvaluatorsLoading(false);
        }
    }, []);

    // ========================================================================
    // USE TABLE HOOK
    // ========================================================================

    const {
        visibleRows,
        filteredRowsCount,
        totalPages,
        startIndex,
        endIndex,
        table,
        factoryWinnersInfo,
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
        factoryFilter,
        viewFilter,
        dateRange,
        currentPage,
        pageSize: PAGE_SIZE, // Số dòng tự động tính theo chiều cao màn hình (5-20 dòng)
        selectedJudgeWinners,
        onSelectJudgeWinner: handleSelectJudgeWinner,
    });

    // Fetch Orders từ API
    const fetchOrders = useCallback(async ({ silent = false, overrideViewFilter } = {}) => {
        if (!silent) setLoading(true);
        try {
            const currentView = overrideViewFilter !== undefined ? overrideViewFilter : viewFilter;
            const isUnconfirmed = currentView === 'unconfirmed';
            const _startDate = isUnconfirmed ? '' : formatDateToYYYYMMDD(dateRange.from);
            const _endDate = isUnconfirmed ? '' : formatDateToYYYYMMDD(dateRange.to);
            const _qType = isUnconfirmed ? 'Q1' : 'Q';

            const result = await getGrievanceRegistration({
                argQType: _qType,
                argFromDate: _startDate,
                argToDate: _endDate
            });
            if (result.success && Array.isArray(result.data)) {
                const newData = result.data.map((item) => {
                    const recipientDecoded = base64ToUnicode(item.RECIPIENT);
                    const formattedRecipient = recipientDecoded
                        ? recipientDecoded
                            .toLowerCase()
                            .split(" ")
                            .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
                            .join(" ")
                        : "";

                    return {
                        ...item,
                        REASON: base64ToUnicode(item.REASON),
                        RECIPIENT: formattedRecipient,
                        TOPIC_NAME: base64ToUnicode(item.TOPIC_NAME),
                    };
                });
                setOrders(newData);
                return true;
            }
            if (!silent) setOrders([]);
            return false;
        } catch (error) {
            console.error('Error fetching self registration data:', error);
            if (!silent) setOrders([]);
            return false;
        } finally {
            if (!silent) setLoading(false);
        }
    }, [dateRange, viewFilter]);

    // Fetch registration data for self tab on initial load or date/view change
    useEffect(() => {
        fetchOrders();
    }, [
        viewFilter === 'unconfirmed' ? null : dateRange?.from?.getTime(),
        viewFilter === 'unconfirmed' ? null : dateRange?.to?.getTime(),
        viewFilter,
    ]);

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
        const { reqId, rateVal, canEdit, itemData } = rateDialogState;
        if (!reqId) return;

        if (canEdit === false || String(itemData?.CONFIRM_YN ?? itemData?.confirm_yn ?? '').toUpperCase() === 'Y') {
            setToast({
                type: "warning",
                message: String(itemData?.CONFIRM_YN ?? itemData?.confirm_yn ?? '').toUpperCase() === 'Y'
                    ? t('grievance_confirmed_rating_readonly')
                    : t('grievance_already_rated'),
            });
            return;
        }

        // Valid user permission
        const userData = sessionStorage.getItem("userData");
        let userDataParse = null;
        try {
            userDataParse = userData ? JSON.parse(userData) : null;
        } catch (e) {
            userDataParse = null;
        }

        const userEmpId = userDataParse?.EMPID || "99115447";
        setRateLoading(true);
        try {
            const uploadData = {
                argType: 'SAVE',
                argPraiseId: reqId,
                argRate: (rateVal || 5).toString(),
                argDate: '',
                argPic: userEmpId
            };
            const result = await saveGrievanceRegistration(uploadData);

            if (result.success) {
                ratedPraiseIdsRef.current.add(String(reqId));
                setRateDialogState({ isOpen: false, reqId: '', rateVal: 5, itemData: null, canEdit: true });
                setToast({ type: "success", message: t('swal_your_data_uploaded') });
                const refreshed = await fetchOrders({ silent: true });
                if (!refreshed) {
                    setToast({ type: "warning", message: t('grievance_rating_saved_refresh_failed') });
                }
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
    }, [rateDialogState, fetchOrders, t]);

    // Xác nhận order
    const onConfirmClick = useCallback(async () => {
        setConfirmListLoading(true);
        setConfirmListError(false);
        setConfirmWinners([]);
        setConfirmMonths([]);
        setSelectedConfirmWinners({});
        try {
            // 1. Kiểm tra ngày hợp lệ từ hệ thống
            const validDateResult = await getGrievanceRegistration({
                argQType: "Q_CONFIRM_DATE",
                argFromDate: '',
                argToDate: ''
            });

            if (!validDateResult.success || !Array.isArray(validDateResult.data) || validDateResult.data.length < 1 || validDateResult.data[0].VALID_YN === "N") {
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
            let userDataParse = null;
            try {
                userDataParse = userData ? JSON.parse(userData) : null;
            } catch (error) {
                userDataParse = null;
            }

            if (!validUserResult.success || !Array.isArray(validUserResult.data) || validUserResult.data.length < 1 || !userDataParse?.EMPID) {
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
            });

            const [winnersResult, pendingResult] = await Promise.all([
                getGrievanceRegistration({
                    argQType: 'Q_CONFIRM_LIST',
                    argFromDate: '',
                    argToDate: '',
                }),
                getGrievanceRegistration({
                    argQType: 'Q',
                    argFromDate: '00010101',
                    argToDate: '99991231',
                }),
            ]);
            if (!winnersResult.success || !Array.isArray(winnersResult.data)
                || !pendingResult.success || !Array.isArray(pendingResult.data)) {
                setConfirmListError(true);
                return;
            }
            setConfirmMonths([...new Set(pendingResult.data
                .filter((person) => String(person.CONFIRM_YN ?? '').toUpperCase() === 'N')
                .map((person) => String(person.PRAISE_DATE || '').slice(0, 7))
                .filter((month) => /^\d{4}-\d{2}$/.test(month)))]
                .sort()
                .map((month) => `${month.slice(5, 7)}/${month.slice(0, 4)}`));
            setConfirmWinners(winnersResult.data.map((item) => ({
                ...item,
                EMP_NM: decodeBase64UTF8(item.EMP_NM),
                RECIPIENT: decodeBase64UTF8(item.RECIPIENT),
                TOPIC_NAME: decodeBase64UTF8(item.TOPIC_NAME),
                REASON: decodeBase64UTF8(item.REASON),
            })));
            setSelectedConfirmWinners(Object.fromEntries(confirmGroups.flatMap((group) => {
                const candidates = winnersResult.data.filter((person) => getConfirmGroup(person.DEPT_NM) === group);
                return candidates.length === 1 ? [[group, candidates[0].PRAISE_ID]] : [];
            })));
        } catch (error) {
            console.error('Error loading prize confirmation:', error);
            setConfirmListError(true);
        } finally {
            setConfirmListLoading(false);
        }
    }, [t]);

    // Xác nhận order
    const confirmOrder = useCallback(async () => {
        if (!canConfirmWinners) return;

        // Valid user permission
        const userData = sessionStorage.getItem("userData");
        let userDataParse = null;
        try {
            userDataParse = userData ? JSON.parse(userData) : null;
        } catch (error) {
            userDataParse = null;
        }

        if (!userDataParse?.EMPID) {
            setToast({
                type: "error",
                message: t('invalid_permission'),
            });
            setConfirmDialogState({ isOpen: false });
            return;
        }

        //
        setConfirmLoading(true);
        try {
            const uploadData = {
                argType: 'CONFIRM',
                argPraiseId: populatedConfirmGroups.map((group) => selectedConfirmWinners[group]).join(','),
                argRate: '',
                argDate: '',
                argPic: userDataParse.EMPID
            };

            const result = await saveGrievanceRegistration(uploadData);

            if (result.success) {
                setConfirmDialogState({ isOpen: false });
                await fetchOrders();

                setToast({
                    type: "success",
                    message: t('swal_your_data_uploaded'),
                })
            } else {
                if (result.error?.message?.includes('ORA-20006')) {
                    await onConfirmClick();
                }
                setToast({
                    type: "error",
                    message: result.error?.message?.includes('ORA-20006')
                        ? t('grievance_candidates_changed')
                        : result.error?.message || t('swal_failed'),
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
    }, [canConfirmWinners, populatedConfirmGroups, selectedConfirmWinners, fetchOrders, onConfirmClick, t]);

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

            // Filter theo Factory (Commended Department contains)
            if (factoryFilter !== 'all') {
                const dept = String(data.DEPT_NM || data.DEPT || '').toUpperCase();
                if (factoryFilter === 'VJ3') {
                    if (!dept.includes('VJ3')) return false;
                } else if (factoryFilter === 'VJ') {
                    const isVJ = (dept.includes('VJ1') || dept.includes('VJ2') || dept.includes('VJ')) && !dept.includes('VJ3');
                    if (!isVJ) return false;
                } else {
                    if (!dept.includes(factoryFilter.toUpperCase())) return false;
                }
            }

            // Filter theo Danh sách xem (View Filter)
            if (viewFilter === 'confirmed') {
                const isConfirmed = String(data.CONFIRM_YN ?? '').toUpperCase() === 'Y';
                if (!isConfirmed) return false;
            } else if (viewFilter === 'unconfirmed') {
                const isConfirmed = String(data.CONFIRM_YN ?? '').toUpperCase() === 'Y';
                if (isConfirmed) return false;
            }

            return true;
        });

        setOrdersMobile(sortedAndFilteredRows);
    }, [globalFilter, rateFilter, topicFilter, factoryFilter, viewFilter, orders])

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
                        <div className="flex flex-col lg:flex-row lg:items-end gap-2.5 w-full">
                            {/* Date From */}
                            <div className="flex-col hidden lg:flex flex-1 min-w-[130px]">
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1">{t('meeting_room_start_date')}</label>
                                <div className="flex w-full">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm rounded-tr-none rounded-br-none border-r-0"
                                        title="Tải lại dữ liệu"
                                    >
                                        <CalendarIcon className="h-3.5 w-3.5" />
                                    </Button>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`h-9 px-2.5 pr-2 w-full flex-1 justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg rounded-tl-none rounded-bl-none shadow-sm text-sm truncate ${!dateRange && "text-muted-foreground"}`}
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
                            <div className="flex-col hidden lg:flex flex-1 min-w-[130px]">
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1">{t('meeting_room_end_date')}</label>
                                <div className="flex w-full">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm rounded-tr-none rounded-br-none border-r-0"
                                        title="Tải lại dữ liệu"
                                    >
                                        <CalendarIcon className="h-3.5 w-3.5" />
                                    </Button>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`h-9 px-2.5 pr-2 w-full flex-1 justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg rounded-tl-none rounded-bl-none shadow-sm text-sm truncate ${!dateRange && "text-muted-foreground"}`}
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
                            {/* View Mode */}
                            <div
                                className="flex-col hidden lg:flex flex-[1.15] min-w-[140px]"
                                title={t('grievance_unconfirmed_tooltip') || 'Khi chọn Chưa được xác nhận thì hiển thị tất cả danh sách chưa được xác nhận, không quan tâm ngày.'}
                            >
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1 cursor-help">
                                    {t('grievance_view_list') || 'Danh sách xem'}
                                    <Info className="h-3 w-3 text-slate-400 hover:text-blue-500 transition-colors shrink-0" />
                                </label>
                                <ViewModeFilter value={viewFilter} onChange={(val) => { setViewFilter(val); setCurrentPage(1); }} />
                            </div>
                            {/* Factory */}
                            <div className="flex-col hidden lg:flex flex-[0.85] min-w-[105px]">
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1">Factory</label>
                                <FactoryFilter value={factoryFilter} onChange={(val) => { setFactoryFilter(val); setCurrentPage(1); }} />
                            </div>
                            {/* Topic */}
                            <div className="flex-col hidden lg:flex flex-[1.4] min-w-[160px]">
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1">{t('topic')}</label>
                                <TopicFilter value={topicFilter} onChange={(val) => { setTopicFilter(val); setCurrentPage(1); }} />
                            </div>
                            {/* Rated */}
                            <div className="flex-col hidden lg:flex flex-[1.1] min-w-[130px]">
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1">{t('rated')}</label>
                                <RateFilter value={rateFilter} onChange={(val) => { setRateFilter(val); setCurrentPage(1); }} />
                            </div>
                            {/* Search Input */}
                            <div className="flex-col hidden lg:flex flex-[1.6] min-w-[170px]">
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1">{t('search')}</label>
                                <div className="relative group w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        type="text"
                                        value={tempGlobalFilter}
                                        onChange={(e) => {
                                            setTempGlobalFilter(e.target.value);
                                            if (e.target.value === '') setCurrentPage(1);
                                        }}
                                        placeholder={`${t('input_placeholder')}...`}
                                        className="pl-9 h-9 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 focus:border-blue-500 transition-all rounded-lg shadow-sm text-sm"
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
                            {/* Reload Button */}
                            {/* <div className="flex-col hidden lg:flex shrink-0">
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1 opacity-0 pointer-events-none select-none">Reload</label>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleReloadData}
                                    disabled={loading}
                                    className="h-9 w-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm cursor-pointer"
                                    title="Tải lại dữ liệu"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div> */}
                            {/* Search Button */}
                            <div className="flex-col hidden md:flex shrink-0">
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide opacity-0 pointer-events-none select-none">
                                    {t('search') || 'Tìm kiếm'}
                                </label>
                                <Button
                                    onClick={() => {
                                        setGlobalFilter(tempGlobalFilter);
                                        setCurrentPage(1);
                                        fetchOrders();
                                    }}
                                    disabled={loading}
                                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg shadow-sm shadow-blue-500/25 font-semibold text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                    title="Tìm kiếm dữ liệu"
                                >
                                    {loading ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                    <span>{t('search') || 'Tìm kiếm'}</span>
                                </Button>
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

                                    {/* View Mode Filter */}
                                    <div
                                        className="flex-col flex col-span-2"
                                        title={t('grievance_unconfirmed_tooltip') || 'Khi chọn Chưa được xác nhận thì hiển thị tất cả danh sách chưa được xác nhận, không quan tâm ngày.'}
                                    >
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1 cursor-help">
                                            {t('grievance_view_list') || 'Danh sách xem'}
                                            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        </label>
                                        <ViewModeFilter value={viewFilter} onChange={(val) => { setViewFilter(val); setCurrentPage(1); }} />
                                    </div>
                                    <div className="flex-col flex col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 tracking-wide truncate flex items-center gap-1">Factory</label>
                                        <FactoryFilter value={factoryFilter} onChange={(val) => { setFactoryFilter(val); setCurrentPage(1); }} />
                                    </div>
                                    <div className="flex-col flex col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('topic')}</label>

                                        <TopicFilter value={topicFilter} onChange={(val) => { setTopicFilter(val); setCurrentPage(1); }} />
                                    </div>
                                    <div className="flex-col flex col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5  tracking-wide truncate flex items-center gap-1">{t('rated')}</label>
                                        <RateFilter value={rateFilter} onChange={(val) => { setRateFilter(val); setCurrentPage(1); }} />
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
                                factoryWinnersInfo={factoryWinnersInfo}
                                selectedJudgeWinners={selectedJudgeWinners}
                            />
                        )}
                    </div>
                    {/* ================================================================
                        CONTENT AREA - MOBILE
                    ================================================================ */}
                    <div className="md:hidden flex-1 min-h-0 overflow-y-scroll">
                        {ordersMobile.map(item => (
                            <PraiseCard
                                key={item.PRAISE_ID}
                                data={item}
                                onOpenImageDialog={handleThumbClick}
                                onOpenRatePanel={openRatePanel}
                                factoryWinnersInfo={factoryWinnersInfo}
                                selectedJudgeWinners={selectedJudgeWinners}
                                onSelectJudgeWinner={handleSelectJudgeWinner}
                            />
                        ))}
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
                    {/* Rating & Evaluators Dialog */}
                    <Dialog
                        open={rateDialogState.isOpen}
                        onOpenChange={(open) => !open && setRateDialogState({ isOpen: false, reqId: '', rateVal: 5, itemData: null, canEdit: true })}
                    >
                        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col gap-3.5">
                            <DialogHeader className="shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-inner shrink-0">
                                        <Star className="h-6 w-6 fill-blue-500 text-blue-500" />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            {t('grievance_rating_dialog_title')}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {rateDialogState.itemData?.RECIPIENT ? (
                                                <>
                                                    {t('grievance_praised_person')}: <span className="font-semibold text-gray-700 dark:text-gray-300">{rateDialogState.itemData.RECIPIENT}</span>
                                                    {rateDialogState.itemData?.TOPIC ? (
                                                        <> • <span className="text-blue-600 dark:text-blue-400 font-medium">{getTopicLabel(rateDialogState.itemData.TOPIC, t)}</span></>
                                                    ) : rateDialogState.itemData?.TOPIC_NAME ? (
                                                        <> • {rateDialogState.itemData.TOPIC_NAME}</>
                                                    ) : null}
                                                </>
                                            ) : (
                                                t('grievance_rating_dialog_description')
                                            )}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* Top Section: 5 sao để chọn đánh giá */}
                            <div className="shrink-0 flex flex-col items-center justify-center py-3.5 px-3 bg-gradient-to-b from-blue-50/70 to-indigo-50/30 dark:from-slate-800/60 dark:to-slate-900/60 rounded-xl border border-blue-100/80 dark:border-slate-800 shadow-xs">
                                <span className={cn(
                                    "text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5",
                                    !rateDialogState.canEdit ? "text-amber-600 dark:text-amber-400" : "text-blue-700 dark:text-blue-400"
                                )}>
                                    {!rateDialogState.canEdit && <CheckCircle className="w-3.5 h-3.5 text-amber-500" />}
                                    {String(rateDialogState.itemData?.CONFIRM_YN ?? rateDialogState.itemData?.confirm_yn ?? '').toUpperCase() === 'Y'
                                        ? t('grievance_confirmed_rating_title')
                                        : !rateDialogState.canEdit ? t('grievance_your_rating_complete') : t('grievance_select_rating')}
                                </span>

                                <div className="flex items-center gap-2.5 my-1">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const currentVal = !rateDialogState.canEdit
                                            ? (Number(rateDialogState.rateVal) || 0)
                                            : (hoverStar || rateDialogState.rateVal || 5);
                                        const isFull = star <= Math.floor(currentVal);
                                        const isHalf = !isFull && star === Math.ceil(currentVal) && (currentVal % 1 !== 0);

                                        return (
                                            <button
                                                key={star}
                                                type="button"
                                                disabled={!rateDialogState.canEdit}
                                                onMouseEnter={() => rateDialogState.canEdit && setHoverStar(star)}
                                                onMouseLeave={() => rateDialogState.canEdit && setHoverStar(0)}
                                                onClick={() => rateDialogState.canEdit && setRateDialogState(prev => ({ ...prev, rateVal: star }))}
                                                className={cn(
                                                    "p-1.5 rounded-xl transition-all duration-200 focus:outline-none",
                                                    rateDialogState.canEdit
                                                        ? "hover:scale-125 active:scale-95 cursor-pointer"
                                                        : "cursor-default opacity-90"
                                                )}
                                                title={t('grievance_star_count', { value: star })}
                                            >
                                                {isHalf ? (
                                                    <div className="relative inline-flex items-center justify-center">
                                                        <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 fill-transparent" />
                                                        <div className="absolute top-0 left-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
                                                            <Star className="w-8 h-8 text-amber-400 fill-amber-400 max-w-none filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.6)]" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Star
                                                        className={cn(
                                                            "w-8 h-8 transition-all duration-200",
                                                            isFull
                                                                ? "text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.6)]"
                                                                : "text-slate-300 dark:text-slate-600 fill-transparent hover:text-amber-300"
                                                        )}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
                                    <span>{String(rateDialogState.itemData?.CONFIRM_YN ?? rateDialogState.itemData?.confirm_yn ?? '').toUpperCase() === 'Y'
                                        ? Number(rateDialogState.rateVal) > 0
                                            ? `${Number(rateDialogState.rateVal).toFixed(2)} ${t('grievance_average_stars')}`
                                            : t('grievance_no_ratings')
                                        : getStarText(hoverStar || rateDialogState.rateVal || 5, t)}</span>
                                </div>

                                {!rateDialogState.canEdit && (
                                    <div className="mt-2.5 flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
                                        <Info className="w-4 h-4 shrink-0 text-amber-500" />
                                        <span>{String(rateDialogState.itemData?.CONFIRM_YN ?? rateDialogState.itemData?.confirm_yn ?? '').toUpperCase() === 'Y'
                                            ? t('grievance_confirmed_rating_readonly')
                                            : t('grievance_already_rated')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Section: Danh sách người đánh giá */}
                            <div className="flex-1 min-h-0 flex flex-col space-y-2">
                                <div className="flex items-center justify-between px-1 shrink-0">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span>{t('grievance_evaluator_list')}</span>
                                    </h4>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        {evaluatorsLoading ? t('grievance_loading') : t('grievance_people_count', { value: evaluatorsList.length })}
                                    </span>
                                </div>

                                <div className="flex-1 min-h-[140px] max-h-[280px] md:max-h-[320px] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-900/40 p-2 space-y-1 custom-scrollbar">
                                    {evaluatorsLoading ? (
                                        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                                            <span className="text-xs">{t('grievance_loading_evaluators')}</span>
                                        </div>
                                    ) : evaluatorsList.length === 0 ? (
                                        <div className="text-center py-6 text-xs text-gray-400">
                                            {t('grievance_no_evaluators')}
                                        </div>
                                    ) : (
                                        evaluatorsList.map((person, idx) => {
                                            const hasRated = person.RATE !== null && person.RATE !== undefined && Number(person.RATE) > 0;
                                            const rateNumber = hasRated ? Number(person.RATE) : 0;

                                            return (
                                                <div
                                                    key={person.EMPID || idx}
                                                    className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800/80 transition-colors"
                                                >
                                                    {/* Bên trái: người */}
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <EvaluatorAvatar person={person} idx={idx} />
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">
                                                                {person.NAME}
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                                {person.EMPID} {person.DEPT_NM || person.DEPT ? `• ${person.DEPT_NM || person.DEPT}` : ''}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bên phải: số sao đánh giá */}
                                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                        {hasRated ? (
                                                            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                                                                <div className="flex items-center gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((s) => {
                                                                        const isFull = s <= Math.floor(rateNumber);
                                                                        const isHalf = !isFull && s === Math.ceil(rateNumber) && (rateNumber % 1 !== 0);

                                                                        if (isFull) {
                                                                            return (
                                                                                <Star
                                                                                    key={s}
                                                                                    className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                                                                                />
                                                                            );
                                                                        }
                                                                        if (isHalf) {
                                                                            return (
                                                                                <div key={s} className="relative inline-flex items-center justify-center">
                                                                                    <Star className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 fill-transparent" />
                                                                                    <div className="absolute top-0 left-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
                                                                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 max-w-none" />
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <Star
                                                                                key={s}
                                                                                className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 fill-transparent"
                                                                            />
                                                                        );
                                                                    })}
                                                                </div>
                                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 ml-1">
                                                                    {Number.isInteger(rateNumber) ? `${rateNumber}.0` : rateNumber}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                                {t('not_rated_yet')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="shrink-0 flex gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-slate-800">
                                <Button
                                    variant={!rateDialogState.canEdit ? "default" : "outline"}
                                    onClick={() => setRateDialogState({ isOpen: false, reqId: '', rateVal: 5, itemData: null, canEdit: true })}
                                    disabled={rateLoading}
                                    className={cn(
                                        "font-semibold",
                                        !rateDialogState.canEdit ? "w-full bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600" : "flex-1"
                                    )}
                                >
                                    {t('btn_close')}
                                </Button>
                                {rateDialogState.canEdit && (
                                    <Button
                                        onClick={confirmRateOrder}
                                        disabled={rateLoading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/25 transition-all"
                                    >
                                        {rateLoading ? (
                                            <span className="flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                {t('grievance_saving_rating')}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5">
                                                <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                                                {t('grievance_save_rating', { value: rateDialogState.rateVal || 5 })}
                                            </span>
                                        )}
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    {/* Confirmation Dialog */}
                    <Dialog
                        open={confirmDialogState.isOpen}
                        onOpenChange={(open) => !open && setConfirmDialogState({ isOpen: false })}
                    >
                        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1500px] max-h-[92vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col gap-4">
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shadow-inner shrink-0">
                                        <Trophy className="h-6 w-6" />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('confirm_trophy')}</DialogTitle>
                                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">{t('grievance_confirm_dialog_description')}</DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="rounded-xl border border-blue-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-slate-800 dark:to-slate-800/60 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                                {t('grievance_confirm_dialog_question')}
                                {confirmMonths.length > 0 && (
                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                        {t('grievance_confirm_months')}: <span className="font-semibold">{confirmMonths.join(', ')}</span>
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{t('warn_desc')}.</p>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        {t('grievance_expected_winners')}
                                    </h4>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        {confirmListLoading ? t('grievance_loading') : t('grievance_people_count', { value: confirmWinners.length })}
                                    </span>
                                </div>
                                <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-900/40 p-2">
                                    {confirmListLoading ? (
                                        <div className="flex items-center justify-center py-10 text-gray-500 gap-2 text-xs">
                                            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" /> {t('grievance_loading_winners')}
                                        </div>
                                    ) : confirmListError ? (
                                        <div className="text-center py-8 text-sm text-rose-600">{t('grievance_winners_load_error')}</div>
                                    ) : confirmWinners.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-gray-500">{t('grievance_no_winners_to_confirm')}</div>
                                    ) : (
                                        <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                            <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                                                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    <tr>
                                                        <th scope="col" className="w-20 px-3 py-2.5 font-semibold">{t('grievance_select')}</th>
                                                        <th scope="col" className="min-w-[150px] px-3 py-2.5 font-semibold">{t('grievance_praised_person')}</th>
                                                        <th scope="col" className="min-w-[110px] px-3 py-2.5 font-semibold">{t('grievance_department')}</th>
                                                        <th scope="col" className="w-24 px-3 py-2.5 text-center font-semibold">{t('grievance_average_rating')}</th>
                                                        <th scope="col" className="w-24 px-3 py-2.5 text-center font-semibold">{t('grievance_rating_count')}</th>
                                                        <th scope="col" className="min-w-[130px] px-3 py-2.5 font-semibold">{t('praised_topic')}</th>
                                                        <th scope="col" className="w-28 px-3 py-2.5 font-semibold">{t('grievance_praise_date')}</th>
                                                        <th scope="col" className="w-24 px-3 py-2.5 text-center font-semibold">{t('image')}</th>
                                                        <th scope="col" className="min-w-[230px] px-3 py-2.5 font-semibold">{t('grievance_content_and_praiser')}</th>
                                                    </tr>
                                                </thead>
                                                {confirmGroups.map((group) => {
                                                    const winners = confirmWinners.filter((person) => getConfirmGroup(person.DEPT_NM) === group);
                                                    const isVJ3 = group === 'VJ3';
                                                    const groupLabel = isVJ3 ? 'VJ3 Chang Shin Đồng Nai' : 'VJ Chang Shin Việt Nam';
                                                    return (
                                                        <tbody key={group} className="divide-y divide-slate-100 dark:divide-slate-700/70">
                                                            <tr className={cn(
                                                                "border-y",
                                                                isVJ3 
                                                                    ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-200/60 dark:border-purple-800/40" 
                                                                    : "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/40"
                                                            )}>
                                                                <th colSpan={9} scope="rowgroup" className="px-3 py-2.5 text-left">
                                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                                        <span className="inline-flex items-center gap-2.5">
                                                                            <span className={cn(
                                                                                "rounded-md px-2.5 py-0.5 text-xs font-black tracking-wide text-white uppercase shadow-xs",
                                                                                isVJ3 ? "bg-purple-600" : "bg-blue-600"
                                                                            )}>
                                                                                {group}
                                                                            </span>
                                                                            <span className={cn(
                                                                                "font-bold text-sm",
                                                                                isVJ3 ? "text-purple-900 dark:text-purple-200" : "text-blue-900 dark:text-blue-200"
                                                                            )}>
                                                                                {groupLabel}
                                                                            </span>
                                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                                                {t('grievance_top_candidates', { value: winners.length })}
                                                                            </span>
                                                                        </span>
                                                                        {winners.length > 1 && (
                                                                            <span className="font-semibold text-xs text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                                                                                • {t('grievance_choose_one')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </th>
                                                            </tr>
                                                            {winners.length === 0 ? (
                                                                <tr><td colSpan={9} className="px-3 py-4 text-center text-slate-400">{t('grievance_no_candidates')}</td></tr>
                                                            ) : winners.map((person) => {
                                                                const selected = String(selectedConfirmWinners[group]) === String(person.PRAISE_ID);
                                                                const imagePaths = String(person.FILE_PATH || '').split(';').map((path) => path.trim()).filter(Boolean);
                                                                return (
                                                                    <tr key={person.PRAISE_ID} className={cn('align-middle transition-colors', selected ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50')}>
                                                                        <td className="px-3 py-3 align-middle">
                                                                            {winners.length > 1 ? (
                                                                                <input type="radio" name={`confirm-winner-${group}`} aria-label={t('grievance_select_winner_for_factory', { person: person.RECIPIENT || person.EMP_NM, factory: group })} checked={selected} onChange={() => setSelectedConfirmWinners((prev) => ({ ...prev, [group]: person.PRAISE_ID }))} className="h-4 w-4 cursor-pointer accent-blue-600" />
                                                                            ) : <CheckCircle className="h-4 w-4 text-emerald-600" aria-label={t('grievance_auto_selected')} />}
                                                                        </td>
                                                                        <td className="px-3 py-3 align-middle font-semibold text-slate-900 dark:text-slate-100 break-words">{person.RECIPIENT || person.EMP_NM || t('grievance_unnamed')}</td>
                                                                        <td className="px-3 py-3 align-middle text-slate-600 dark:text-slate-300 break-words">{person.DEPT_NM || group}</td>
                                                                        <td className="px-3 py-3 align-middle text-center font-bold text-amber-700 dark:text-amber-300">{person.RATE == null ? '—' : Number(person.RATE).toFixed(1)}</td>
                                                                        <td className="px-3 py-3 align-middle text-center text-slate-600 dark:text-slate-300">{person.NUM_RATE || 0}</td>
                                                                        <td className="px-3 py-3 align-middle text-slate-600 dark:text-slate-300 break-words">{getTopicLabel(person.TOPIC || person.TOPIC_NAME, t) || '—'}</td>
                                                                        <td className="px-3 py-3 align-middle whitespace-nowrap text-slate-600 dark:text-slate-300">{person.PRAISE_DATE ? String(person.PRAISE_DATE).slice(0, 10).split('-').reverse().join('/') : '—'}</td>
                                                                        <td className="px-3 py-2.5 align-middle text-center">
                                                                            {imagePaths.length > 0 ? (
                                                                                <button type="button" onClick={() => handleThumbClick(person.FILE_PATH)} title={t('grievance_view_images')} aria-label={t('grievance_view_images')} className="relative inline-flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:ring-2 hover:ring-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all">
                                                                                    <ImageIcon className="absolute h-5 w-5 text-slate-400" aria-hidden="true" />
                                                                                    <img src={imagePaths[0]} alt={t('grievance_praise_image')} loading="lazy" className="relative h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                                                                                    {imagePaths.length > 1 && <span className="absolute bottom-0 right-0 rounded-tl-md bg-slate-900/80 px-1.5 py-0.5 text-xs font-bold text-white">+{imagePaths.length - 1}</span>}
                                                                                </button>
                                                                            ) : <span className="text-slate-400">—</span>}
                                                                        </td>
                                                                        <td className="px-3 py-3 align-middle text-slate-600 dark:text-slate-300">
                                                                            {person.REASON && <p className="break-words">{person.REASON}</p>}
                                                                            {person.EMP_NM && person.RECIPIENT && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('praiser')}: {person.EMP_NM}{person.EMP_ID ? ` (${person.EMP_ID})` : ''}</p>}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    );
                                                })}
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DialogFooter className="flex gap-2 mt-1 pt-3 border-t border-gray-100 dark:border-slate-800">
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmDialogState({ isOpen: false })}
                                    disabled={confirmLoading}
                                    className="flex-1"
                                >
                                    {t('btn_cancel')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmOrder}
                                    disabled={confirmLoading || confirmListLoading || confirmListError || !canConfirmWinners}
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
