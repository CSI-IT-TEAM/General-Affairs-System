import React, { useEffect, useState } from 'react';
import { User, CheckCircle, Clock, Edit, Eye, Phone, ChevronDown, ChevronUp, Calendar, UserCheck, Timer, AlertCircle, Hash, Paperclip, ClockCheck, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTopicContent } from '../../../hooks/useGrievanceTable';
import { handleRenderStar } from '../../../hooks/useGrievanceTable';

const handleStatus = (data, t) => {
    if(!data) return <></>;
    const _code = data.TOPIC;
    const { _, className, icon } = getTopicContent(data.TOPIC, data.TOPIC_NAME);
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
        <span className={className}>
            {icon}
            {label}
        </span>
    );
}

const PraiseCard = ({
    data,
    onOpenImageDialog,
    onOpenRatePanel
}) => {

    const { t } = useTranslation();

    const [isExpanded, setIsExpanded] = useState(false);
    
    // Descriptions
    const description = data.REASON;
    const isLongDescription = description.length > 80;
    const truncatedDescription = isLongDescription && !isExpanded
        ? description.substring(0, 80) + '...'
        : description;

    useEffect(() => {
        if(!data) return;

    },[data])

    return (
        <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-200 mb-4">
            {/* 1. Header: ID & Status */}
            <div className="px-4 py-3 flex items-start justify-between gap-3 border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-white/5">
                <div className="flex items-center justify-center gap-1 font-bold text-sm text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                    {handleRenderStar(data.PRAISE_ID, data.RATE, data.CONFIRM_YN === 'N' ? onOpenRatePanel : null)}
                </div>
                
                <div className="flex justify-center">
                    {handleStatus(data,t)}
                </div>
            </div>

            {/* 2. User Info */}
            <div className="px-4 py-3 pb-0">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                        <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                {data.EMP_NM || 'Người dùng'}
                            </h4>
                        </div>
                        
                        {data.EMP_ID && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                <Phone className="h-3 w-3" />
                                <span>{data.EMP_ID}</span>
                            </div>
                        )}
                        
                        <p className="text-xs text-gray-700 dark:text-gray-400 truncate font-semibold">
                            {data.DEPT_NM || 'Không có bộ phận'}
                        </p>
                    </div>

                        {/* User Upload Image Indicator */}
                            {data.IMAGES_COUNT > 0 && (
                                <button 
                                    className="flex items-center justify-center w-11 h-11 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                                    title="Xem ảnh đính kèm từ người dùng"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onOpenImageDialog) {
                                            onOpenImageDialog(data.FILE_PATH);
                                        }
                                    }}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </button>
                            )}
                </div>
            </div>

            {/* 3. Description & Timeline */}
            <div className="px-4 py-3 space-y-4">
                {/* Description Box */}
                <div className="relative bg-gray-50/80 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0 text-gray-400">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {truncatedDescription}
                            </p>
                            {isLongDescription && (
                                <button 
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-blue-600 dark:text-blue-400"
                                >
                                    {isExpanded ? (
                                        <>Thu gọn <ChevronUp className="h-3 w-3" /></>
                                    ) : (
                                        <>Xem thêm <ChevronDown className="h-3 w-3" /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <TimelineItem 
                        icon={Calendar} 
                        label={t('meeting_room_date')} 
                        value={data.PRAISE_DATE} 
                        color="text-blue-500"
                        bg="bg-blue-50 dark:bg-blue-900/20"
                    />
                    <TimelineItem 
                        icon={UserCheck} 
                        label={t('praised_person')} 
                        value={data.RECIPIENT} 
                        color="text-purple-500"
                        bg="bg-purple-50 dark:bg-purple-900/20"
                    />
                    <TimelineItem 
                        icon={CheckCircle} 
                        label={t('rate_user')}
                        value={data.RATE_USER_NM || 'Chưa đánh giá'} 
                        color="text-emerald-500"
                        bg="bg-emerald-50 dark:bg-emerald-900/20"
                    />
                </div>
            </div>
        </div>
    );
};

// Sub-component for Timeline Item
const TimelineItem = ({ icon: Icon, label, value, color, bg }) => (
    <div className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800">
        <div className={`p-2 rounded-lg ${bg} ${color} shrink-0`}>
            <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold text-gray-400">{label}</span>
            <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate md:whitespace-normal">
                {value}
            </span>
        </div>
    </div>
);

export default PraiseCard;