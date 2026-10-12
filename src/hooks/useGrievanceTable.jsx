import { useMemo } from 'react';
import { CheckCircle, Clock, Eye, HeartPulse, Lightbulb, Star, TicketCheck, Zap } from 'lucide-react';
import { decodeBase64UTF8, removeVietnameseDiacritics } from '../lib/base64Utils';
import { ConfirmationStatusBadge, WinnerStatusBadge } from '../components/GrievanceStatusBadges';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

// Extracted globalFilterFn to prevent re-creation on every render
const globalFilterFn = (row, _columnId, filterValue) => {
    if (!filterValue) return true;

    const searchTerm = filterValue.toLowerCase();
    const rowData = row.original;

    // Check fields directly to avoid intermediary array creation
    // Order by most likely to match for performance

    // 1. Check Description (High probability)
    const desc = decodeBase64UTF8(rowData.EMP_NM);
    if (desc && desc.toLowerCase().includes(searchTerm)) return true;

    // 2. Check Request Key (High probability)
    if (rowData.EMP_ID && rowData.EMP_ID.toLowerCase().includes(searchTerm)) return true;

    // 3. Check Department
    if (rowData.DEPT_NM && rowData.DEPT_NM.toLowerCase().includes(searchTerm)) return true;

    // 4. Check Dates
    if (rowData.PRAISE_DATE && rowData.PRAISE_DATE.includes(searchTerm)) return true;

    // 5. Check Description (High probability)
    if (rowData.RECIPIENT && removeVietnameseDiacritics(rowData.RECIPIENT.toLowerCase().trim()).includes(removeVietnameseDiacritics(searchTerm.toLocaleLowerCase()).trim())) return true;

    // 6. Request User
    if (rowData.REASON && removeVietnameseDiacritics(rowData.REASON.toLowerCase().trim()).includes(removeVietnameseDiacritics(searchTerm.toLocaleLowerCase()).trim())) return true;

    return false;
};

export const getTopicLabel = (topicCodeOrName, t) => {
    const isFn = typeof t === 'function';
    const val = String(topicCodeOrName || '').trim();
    switch (val) {
        case "0001":
        case "Hỗ trợ công việc":
        case "Work Support":
        case "업무 지원":
            return isFn ? t('support_job') : "Hỗ trợ công việc";
        case "0002":
        case "Tử tế - Quan tâm chu đáo":
        case "Kindness – Thoughtful care":
        case "친절함 – 세심함":
            return isFn ? t('friendly_alter') : "Tử tế - Quan tâm chu đáo";
        case "0003":
        case "An toàn - Môi trường":
        case "Safety - Environment":
        case "안전 – 환경":
            return isFn ? t('safe_envir') : "An toàn - Môi trường";
        case "0004":
        case "Việc tốt - Hành động tử tế":
        case "Good deeds - Acts of kindness":
        case "선한 일 – 착한 일":
            return isFn ? t('good_kind') : "Việc tốt - Hành động tử tế";
        case "0005":
        case "Khác":
        case "Others":
        case "기타":
            return isFn ? t('other') : "Khác";
        default:
            return isFn && !val ? t('other') : (val || (isFn ? t('other') : "Khác"));
    }
};

export const getTopicContent = (topicCode, t) => {
    const label = getTopicLabel(topicCode, t);
    switch (topicCode) {
        case "0001":
            return {
                label,
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/40 ring-1 ring-emerald-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/50 hover:scale-105',
                icon: <CheckCircle className="h-3.5 w-3.5" />
            };
        case "0002":
            return {
                label,
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/40 ring-1 ring-amber-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/50 hover:scale-105',
                icon: <Clock className="h-3.5 w-3.5" />
            };
        case "0003":
            return {
                label,
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-cyan-500/40 ring-1 ring-cyan-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105',
                icon: <Lightbulb className="h-3.5 w-3.5" />
            };
        case "0004":
            return {
                label,
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow-md shadow-purple-500/40 ring-1 ring-purple-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/50 hover:scale-105',
                icon: <HeartPulse className="h-3.5 w-3.5" />
            };
        default:
            return {
                label,
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-md shadow-slate-500/40 ring-1 ring-slate-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/50 hover:scale-105',
                icon: <Zap className="h-3.5 w-3.5" />
            };
    }
};

///// Render Rating Star
export const handleRenderStar = (itemID, value, handleClick) => {
    const numVal = Number(value) || 0;
    const cursorClass = handleClick ? "cursor-pointer" : "cursor-default";
    const rows = [];

    for (let iRow = 1; iRow <= 5; iRow++) {
        const isFull = iRow <= Math.floor(numVal);
        const isHalf = !isFull && iRow === Math.ceil(numVal) && (numVal % 1 !== 0);

        if (isFull) {
            rows.push(
                <div key={"star" + iRow} className="inline-flex">
                    <Star
                        className={`text-[60px] md:text-[40px] text-[#FBB202] ${cursorClass} transition-all duration-200 ease-in-out`}
                        fill="#FBB202"
                        color="#FBB202"
                        onClick={() => handleClick && handleClick(itemID, iRow)}
                    />
                </div>
            );
        } else if (isHalf) {
            rows.push(
                <div
                    key={"star" + iRow}
                    className={`relative inline-flex items-center justify-center ${cursorClass} transition-all duration-200 ease-in-out`}
                    onClick={() => handleClick && handleClick(itemID, iRow)}
                    title={`${numVal} sao`}
                >
                    {/* Background: Empty Gray Star */}
                    <Star
                        className="text-[60px] md:text-[40px] text-[#ccc]"
                        fill="#ccc"
                        color="#ccc"
                    />
                    {/* Foreground: 50% width Golden Filled Star */}
                    <div className="absolute top-0 left-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
                        <Star
                            className="text-[60px] md:text-[40px] text-[#FBB202] max-w-none"
                            fill="#FBB202"
                            color="#FBB202"
                        />
                    </div>
                </div>
            );
        } else {
            rows.push(
                <div key={"star" + iRow} className="inline-flex">
                    <Star
                        className={`text-[60px] md:text-[40px] text-[#ccc] ${cursorClass} transition-all duration-200 ease-in-out`}
                        fill="#ccc"
                        color="#ccc"
                        onClick={() => handleClick && handleClick(itemID, iRow)}
                    />
                </div>
            );
        }
    }
    return rows;
};

export const getFactoryGroup = (deptNm) => {
    const dept = String(deptNm || "").toUpperCase();
    if (dept.includes("VJ3")) return "VJ3";
    return "VJ";
};

export const getDeptFactory = (deptNm) => {
    if (!deptNm) return null;
    const str = String(deptNm).toUpperCase();
    if (str.includes('VJ1')) return 'VJ1';
    if (str.includes('VJ2')) return 'VJ2';
    if (str.includes('VJ3')) return 'VJ3';
    return null;
};

/**
 * Đánh giá trạng thái người chiến thắng của từng Factory (VJ1, VJ2, VJ3)
 * - Mỗi xưởng phải có 1 người:
 *   + Nếu chỉ có 1 người đạt Rate cao nhất -> Tự động là người chiến thắng, không cần chọn.
 *   + Nếu có từ 2 người trở lên đồng Rate cao nhất -> Bắt buộc Giám khảo phải chọn 1 người.
 */
export const evaluateFactoryWinners = (orders, selectedJudgeWinners = {}) => {
    const factories = ['VJ1', 'VJ2', 'VJ3'];
    const result = {
        isAllResolved: true,
        factoryStatus: {},
        missingReasons: [],
    };

    factories.forEach(factory => {
        // Lấy danh sách các ứng viên trong xưởng đã có đánh giá sao
        const candidates = (orders || []).filter(item => {
            const f = getDeptFactory(item.DEPT_NM || item.DEPT);
            const r = Number(item.RATE) || 0;
            return f === factory && r > 0;
        });

        if (candidates.length === 0) {
            result.isAllResolved = false;
            result.factoryStatus[factory] = {
                status: 'NO_RATED_CANDIDATE',
                maxRate: 0,
                winner: null,
                topCandidates: [],
                isTie: false,
            };
            result.missingReasons.push(`Xưởng ${factory}: Chưa có ứng viên nào được đánh giá sao.`);
            return;
        }

        // Tìm Rate cao nhất trong xưởng
        const maxRate = Math.max(...candidates.map(c => Number(c.RATE) || 0));
        const topCandidates = candidates.filter(c => Number(c.RATE) === maxRate);

        if (topCandidates.length === 1) {
            // Chỉ có 1 người đạt Rate cao nhất -> Tự động chọn người này
            result.factoryStatus[factory] = {
                status: 'AUTO_RESOLVED',
                maxRate,
                winner: topCandidates[0],
                topCandidates,
                isTie: false,
            };
        } else {
            // Có từ 2 người trở lên đồng Rate cao nhất -> Cần Giám khảo chọn
            const selectedId = selectedJudgeWinners[factory];
            const selectedCandidate = topCandidates.find(c => c.PRAISE_ID === selectedId);

            if (selectedCandidate) {
                result.factoryStatus[factory] = {
                    status: 'MANUALLY_RESOLVED',
                    maxRate,
                    winner: selectedCandidate,
                    topCandidates,
                    isTie: true,
                    selectedId,
                };
            } else {
                result.isAllResolved = false;
                result.factoryStatus[factory] = {
                    status: 'NEEDS_SELECTION',
                    maxRate,
                    winner: null,
                    topCandidates,
                    isTie: true,
                    selectedId: null,
                };
                result.missingReasons.push(`Xưởng ${factory}: Có ${topCandidates.length} người đồng điểm cao nhất (${maxRate}⭐). Cần chọn 1 người.`);
            }
        }
    });

    return result;
};

// --- CUSTOM HOOK: useOrdersTable ---
export const useGrievanceTable = ({
    orders,
    onOpenImageDialog,
    onOpenRatePanel,
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
    factoryFilter = 'all',
    viewFilter = 'all',
    dateRange,
    currentPage,
    pageSize,
    selectedJudgeWinners = {},
    onSelectJudgeWinner,
}) => {
    const { t } = useTranslation();

    // Đánh giá trạng thái người chiến thắng của từng Factory dựa trên danh sách orders
    const factoryWinnersInfo = useMemo(() => {
        return evaluateFactoryWinners(orders, selectedJudgeWinners);
    }, [orders, selectedJudgeWinners]);

    // --- COLUMNS DEFINITION ---
    const columns = useMemo(
        () => {
            const cols = [
                {
                    id: 'FACTORY',
                    accessorFn: (row) => getFactoryGroup(row.DEPT_NM || row.DEPT),
                    header: t('factory') || 'Nhà máy',
                    size: 90,
                    minSize: 80,
                    maxSize: 110,
                    meta: { align: 'center' },
                    enableSorting: true,
                    cell: ({ getValue }) => {
                        const factory = getValue();
                        const isVJ3 = factory === 'VJ3';
                        return (
                            <div className="flex items-center justify-center">
                                <span 
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                        isVJ3
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                    }`}
                                >
                                    {factory}
                                </span>
                            </div>
                        );
                    }
                },

                {
                    accessorKey: 'PRAISE_ID',
                    size: 20,
                    meta: { align: 'left' },
                    cell: ({ getValue }) => (
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-50">{getValue()}</span>
                    )
                },
                {
                    accessorKey: 'PRAISE_DATE',
                    header: t('meeting_room_date'),
                    size: 140,
                    minSize: 130,
                    meta: { align: 'center' },
                    cell: ({ getValue }) => {
                        return (
                            <span className="req-id-badge inline-block font-mono font-bold text-[13px] text-blue-700 dark:text-blue-300 px-2 py-1 rounded whitespace-nowrap text-center">
                                {getValue()}
                            </span>
                        );
                    }
                },
                {
                    accessorKey: 'EMP_NM',
                    header: t('praiser'),
                    size: 120,
                    minSize: 100,
                    maxSize: 140,
                    meta: { align: 'left' },
                    cell: ({ getValue, row }) => {
                        return (
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{getValue()}</span>
                                {row.original.EMP_ID && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                                        <TicketCheck className="h-4 w-4 text-gray-400" />
                                        {row.original.EMP_ID}
                                    </span>
                                )}
                            </div>
                        );
                    }
                },
                {
                    accessorKey: 'DEPT_NM',
                    header: t('commend_dept'),
                    size: 120,
                    minSize: 100,
                    maxSize: 150,
                    meta: { align: 'left' },
                    cell: ({ getValue }) => (
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-300 break-words">{getValue()}</span>
                    )
                },
                {
                    accessorKey: 'RECIPIENT',
                    header: t('praised_person'),
                    size: 130,
                    meta: { align: 'center' },
                    cell: ({ getValue }) => (
                        <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                            {getValue()}
                        </span>
                    )
                },
                {
                    accessorKey: 'TOPIC_NAME',
                    header: t('praised_topic'),
                    size: 150,
                    minSize: 120,
                    maxSize: 200,
                    meta: { align: 'left' },
                    cell: ({ row, getValue }) => {
                        const _code = row.original.TOPIC;
                        let label = "";
                        switch (_code) {
                            case "0001":
                                label = t('support_job');
                                break;
                            case "0002":
                                label = t('friendly_alter');
                                break;
                            case "0003":
                                label = t('safe_envir');
                                break;
                            case "0004":
                                label = t('good_kind');
                                break;
                            case "0005":
                                label = t('other');
                                break;
                            default:
                                label = getValue() || t('other');
                                break;
                        }

                        // Màu chữ nhẹ nhàng phân loại theo từng chủ đề
                        let colorClass = "text-gray-700 dark:text-gray-300";
                        switch (_code) {
                            case "0001":
                                colorClass = "text-emerald-700 dark:text-emerald-400";
                                break;
                            case "0002":
                                colorClass = "text-amber-700 dark:text-amber-400";
                                break;
                            case "0003":
                                colorClass = "text-blue-700 dark:text-blue-400";
                                break;
                            case "0004":
                                colorClass = "text-purple-700 dark:text-purple-400";
                                break;
                            default:
                                colorClass = "text-slate-600 dark:text-slate-400";
                                break;
                        }

                        return (
                            <span className={`font-semibold text-sm ${colorClass} whitespace-nowrap`}>
                                {label}
                            </span>
                        );
                    }
                },
                {
                    accessorKey: 'REASON',
                    header: t('praised_reason'),
                    size: 300,
                    minSize: 250,
                    maxSize: 450,
                    meta: { align: 'left' },
                    cell: ({ getValue }) => {
                        return (
                            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed overflow-hidden"
                                style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >{getValue()}</span>
                        );
                    }
                },
                {
                    id: 'images',
                    header: t('image'),
                    size: 70,
                    cell: ({ row }) => {
                        const hasAnyImages = row.original.IMAGES_COUNT > 0;
                        const hasUserUpload = hasAnyImages && row.original.FILE_PATH !== '';

                        return (
                            <div className="flex justify-center items-center gap-1">
                                {/* User uploaded image indicator */}
                                {hasUserUpload && (
                                    <div
                                        className="relative h-7 w-7 flex items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                                        onClick={() => {
                                            // Open image dialog to view user attachment
                                            onOpenImageDialog(row.original.FILE_PATH);
                                        }}
                                        title="🖼️ Có ảnh đính kèm từ người yêu cầu - Click để xem"
                                    >
                                        <span className="text-[15px]">📎</span>
                                    </div>
                                )}
                                {/* No images at all */}
                                {!hasAnyImages && (
                                    <span className="text-gray-300 dark:text-gray-600">-</span>
                                )}
                            </div>
                        );
                    }
                },
                {
                    accessorKey: 'RATE',
                    header: t('rated'),
                    size: 150,
                    meta: { align: 'center' },
                    cell: ({ getValue, row }) => {
                        const itemID = row.original.PRAISE_ID;
                        const itemRate = row.original.RATE;
                        const isConfirmed = String(row.original.CONFIRM_YN).toUpperCase() === 'Y';
                        const openRating = onOpenRatePanel
                            ? (_, star) => onOpenRatePanel(itemID, isConfirmed ? itemRate : star, row.original)
                            : null;

                        return (
                            <div className="flex items-center justify-center gap-1 font-bold text-sm text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">{handleRenderStar(itemID, itemRate, openRating)}</div>
                        );
                    }
                },
                                {
                    accessorKey: 'RATE_USER_NM',
                    header: t('evaluator'),
                    size: 160,
                    minSize: 140,
                    maxSize: 220,
                    meta: { align: 'center' },
                    cell: ({ row }) => {
                        const itemID = row.original.PRAISE_ID;
                        const itemRate = row.original.RATE;
                        const isConfirmed = String(row.original.CONFIRM_YN).toUpperCase() === 'Y';
                        const numRate = Number(row.original.NUM_RATE ?? row.original.num_rate ?? 0);

                        return (
                            <div className="flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => onOpenRatePanel && onOpenRatePanel(itemID, itemRate, row.original)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/40 transition-all duration-200 whitespace-nowrap cursor-pointer"
                                    title={isConfirmed ? t('grievance_view_rating') : t('grievance_rate_action')}
                                >
                                    {isConfirmed ? <Eye className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />}
                                    <span>{numRate} {t('evaluator') || 'Evaluator'}</span>
                                </button>
                            </div>
                        );
                    }
                },
                {
                    accessorKey: 'CONFIRM_YN',
                    header: t('grievance_confirm_status'),
                    size: 150,
                    meta: { align: 'center' },
                    cell: ({ getValue }) => <ConfirmationStatusBadge value={getValue()} />
                },
                {
                    accessorKey: 'WINNER_YN',
                    header: t('grievance_winner'),
                    size: 120,
                    meta: { align: 'center' },
                    cell: ({ getValue }) => <WinnerStatusBadge value={getValue()} />
                },
            ];

            return cols;

        },
        [onOpenImageDialog, onOpenRatePanel, factoryWinnersInfo, selectedJudgeWinners, onSelectJudgeWinner, t]
    );

    // --- TABLE INSTANCE ---
    const table = useReactTable({
        data: Array.isArray(orders) ? orders : [],
        columns: columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: 'onChange',
        enableColumnResizing: true,
        globalFilterFn: globalFilterFn,
    });

    const sortedAndFilteredRows = table.getRowModel().rows;

    // --- FILTER BY STATUS, FEEDBACK, AND MATERIAL ---
    const filteredByStatusAndFeedback = useMemo(() => {
        return sortedAndFilteredRows.filter(row => {
            const data = row.original;

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

            // Filter theo Factory (Commended Department contains)
            if (factoryFilter && factoryFilter !== 'all') {
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
    }, [sortedAndFilteredRows, topicFilter, rateFilter, factoryFilter, viewFilter]);

    // --- PAGINATION ---
    const totalPages = Math.ceil(filteredByStatusAndFeedback.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const visibleRows = filteredByStatusAndFeedback.slice(startIndex, endIndex);

    return {
        visibleRows,
        filteredRowsCount: filteredByStatusAndFeedback.length,
        totalPages,
        startIndex,
        endIndex,
        table,
        factoryWinnersInfo,
    };
};
