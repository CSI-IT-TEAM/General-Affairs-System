import { useMemo } from 'react';
import { CheckCircle, Clock, HeartPulse, Lightbulb, Star, TicketCheck, Zap } from 'lucide-react';
import { decodeBase64UTF8, removeVietnameseDiacritics } from '../lib/base64Utils';
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

export const getTopicContent = (topicCode) => {
    switch (topicCode) {
        case "0001":
            return {
                label: "Hỗ trợ công việc",
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/40 ring-1 ring-emerald-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/50 hover:scale-105',
                icon: <CheckCircle className="h-3.5 w-3.5" />
            }
        case "0002":
            return {
                label: "Thân thiện - Chu đáo",
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/40 ring-1 ring-amber-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/50 hover:scale-105',
                icon: <Clock className="h-3.5 w-3.5" />
            }
        case "0003":
            return {
                label: "An toàn - Môi trường",
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-cyan-500/40 ring-1 ring-cyan-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105',
                icon: <Lightbulb className="h-3.5 w-3.5" />
            }
        case "0004":
            return {
                label: "Việc tốt - Việc tử tế",
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow-md shadow-purple-500/40 ring-1 ring-purple-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/50 hover:scale-105',
                icon: <HeartPulse className="h-3.5 w-3.5" />
            }
        default:
            return {
                label: "Khác",
                className: 'status-badge inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-md shadow-slate-500/40 ring-1 ring-slate-400/50 whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/50 hover:scale-105',
                icon: <Zap className="h-3.5 w-3.5" />
            }

    }
};

///// Render Rating Star
export const handleRenderStar = (itemID, value, handleClick) => {
    const rows = [];
    for (let iRow = 1; iRow <= 5; iRow++) {
        rows.push(
            <div key={"star" + iRow}>
                <Star
                    className={`text-[60px] md:text-[40px] text-[#ccc] cursor-pointer transition-all duration-200 ease-in-out`}
                    fill={iRow <= value ? '#FBB202' : '#ccc'}
                    color={iRow <= value ? '#FBB202' : '#ccc'}
                    onClick={() => handleClick(itemID, iRow)} />
            </div>
        );
    }
    return rows;
}

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
    dateRange,
    currentPage,
    pageSize,
}) => {
    const { t } = useTranslation();

    // --- COLUMNS DEFINITION ---
    const columns = useMemo(
        () => {
            /////Repaired Orders
            const cols = [
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
                    size: 100,
                    meta: { align: 'center' },
                    cell: ({ getValue }) => {
                        return (
                            <span className="req-id-badge inline-block font-mono font-bold text-[13px] text-blue-700 dark:text-blue-300 px-2 py-1 rounded break-words text-center">
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
                    size: 100,
                    meta: { align: 'center' },
                    cell: ({ getValue }) => {
                        return (
                            <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">{getValue()}</span>
                        );
                    }
                },
                {
                    accessorKey: 'TOPIC_NAME',
                    header: t('praised_topic'),
                    size: 80,
                    minSize: 100,
                    maxSize: 150,
                    cell: ({ row }) => {
                        const _code = row.original.TOPIC;
                        const { _, className, icon } = getTopicContent(row.original.TOPIC);
                        let label = "";

                        switch(_code){
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
                                break;
                        }

                        return (
                            <div className="flex justify-center">
                                <span className={className}>
                                    {icon}
                                    {label}
                                </span>
                            </div>
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
                        const isEnable = row.original.CONFIRM_YN === 'N';

                        return (
                            <div className="flex items-center justify-center gap-1 font-bold text-sm text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">{handleRenderStar(itemID, itemRate, isEnable ? onOpenRatePanel : null)}</div>
                        );
                    }
                },
                {
                    accessorKey: 'RATE_USER_NM',
                    header: t('evaluator'),
                    size: 150,
                    minSize: 150,
                    maxSize: 450,
                    meta: { align: 'left' },
                    cell: ({ getValue }) => {
                        return (
                           <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{getValue()}</span>
                        );
                    }
                },
            ];

            return cols;

        },
        [onOpenImageDialog, onOpenRatePanel]
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

            return true;
        });
    }, [sortedAndFilteredRows, topicFilter, rateFilter]);

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
    };
};