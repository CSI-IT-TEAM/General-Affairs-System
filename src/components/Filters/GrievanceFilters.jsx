import React from 'react';
import { Star, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';

export const TopicFilter = ({ value, onChange, className }) => {
    const { t } = useTranslation();

    return (
    <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
            className={`h-10 md:h-9 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm text-sm ${className || ''}`} 
            aria-label="Lọc theo trạng thái"
        >
            <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                    value === '0001' ? 'bg-emerald-500' : 
                    value === '0002' ? 'bg-amber-500' : 
                    value === '0003' ? 'bg-blue-500' : 
                    value === '0004' ? 'bg-purple-500' : 'bg-gray-300'
                }`} />
                <span className="truncate text-[15px]">
                    {value === 'all' ? t('all') : 
                     value === '0001' ? t('support_job') : 
                     value === '0002' ? t('friendly_alter') : 
                     value === '0003' ? t('safe_envir') : 
                     value === '0004' ? t('good_kind') : t('other')}
                </span>
            </div>
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>{t('all')}</span>
                </div>
            </SelectItem>
            <SelectItem value="0001">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400">{t('support_job')}</span>
                </div>
            </SelectItem>
            <SelectItem value="0002">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-amber-700 dark:text-amber-400">{t('friendly_alter')}</span>
                </div>
            </SelectItem>
            <SelectItem value="0003">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-blue-700 dark:text-blue-400">{t('safe_envir')}</span>
                </div>
            </SelectItem>
            <SelectItem value="0004">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-purple-700 dark:text-violet-400">{t('good_kind')}</span>
                </div>
            </SelectItem>
            <SelectItem value="0005">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span className="text-gray-700 dark:text-slate-400">{t('other')}</span>
                </div>
            </SelectItem>
        </SelectContent>
    </Select>
)};

export const RateFilter = ({ value, onChange, className }) => {
    const { t } = useTranslation();

    return (
    <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
            className={`h-10 md:h-9 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm text-sm ${className || ''}`} 
            aria-label="Lọc theo đánh giá"
        >
            <div className="flex items-center gap-1.5">
                <Star className={`h-3 w-3 ${
                    value !== 'all' && value !== 'none' 
                        ? 'text-orange-500 fill-orange-500' 
                        : 'text-gray-400'
                }`} />
                <span className="truncate text-[15px]">
                    {value === 'all' ? t('all') : 
                     value === 'none' ? t('not_rated_yet') : 
                     value === 'VERY_GOOD' ? `5 ${t('star')}` : 
                     value === 'GOOD' ? `4 ${t('star')}` : 
                     value === 'NORMAL' ? `3 ${t('star')}` : 
                     value === 'BAD' ? `2 ${t('star')}` : `1 ${t('star')}`}
                </span>
            </div>
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    <span>{t('all')}</span>
                </div>
            </SelectItem>
            <SelectItem value="VERY_GOOD">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-green-700 dark:text-green-400">5 {t('star')}</span>
                </div>
            </SelectItem>
            <SelectItem value="GOOD">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-blue-700 dark:text-blue-400">4 {t('star')}</span>
                </div>
            </SelectItem>
            <SelectItem value="NORMAL">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-amber-700 dark:text-amber-400">3 {t('star')}</span>
                </div>
            </SelectItem>
            <SelectItem value="BAD">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-purple-700 dark:text-purple-400">2 {t('star')}</span>
                </div>
            </SelectItem>
            <SelectItem value="VERY_BAD">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-red-700 dark:text-red-400">1 {t('star')}</span>
                </div>
            </SelectItem>
            <SelectItem value="none">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span className="text-gray-500 dark:text-gray-400">{t('not_rated_yet')}</span>
                </div>
            </SelectItem>
        </SelectContent>
    </Select>
)};

export const FactoryFilter = ({ value, onChange, className }) => {
    const { t } = useTranslation();

    const getDisplayText = (val) => {
        if (val === 'VJ') return `VJ (${t('factory_vj_desc') || 'Chang Shin Việt Nam'})`;
        if (val === 'VJ3') return `VJ3 (${t('factory_vj3_desc') || 'Chang Shin Đồng Nai'})`;
        return t('factory_all') || t('all') || 'Tất cả';
    };

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger 
                className={`h-10 md:h-9 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm text-sm ${className || ''}`} 
                aria-label="Lọc theo nhà máy"
            >
                <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="truncate text-[13px] md:text-sm font-medium">
                        {getDisplayText(value)}
                    </span>
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
                        <span>{t('factory_all') || t('all') || 'Tất cả nhà máy'}</span>
                    </div>
                </SelectItem>
                <SelectItem value="VJ">
                    <div className="flex items-center gap-2 py-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                        <div className="flex flex-col text-left">
                            <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">VJ</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                                {t('factory_vj_desc') || 'Chang Shin Việt Nam'}
                            </span>
                        </div>
                    </div>
                </SelectItem>
                <SelectItem value="VJ3">
                    <div className="flex items-center gap-2 py-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                        <div className="flex flex-col text-left">
                            <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">VJ3</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                                {t('factory_vj3_desc') || 'Chang Shin Đồng Nai'}
                            </span>
                        </div>
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
};

export const ViewModeFilter = ({ value, onChange, className }) => {
    const { t } = useTranslation();
    const tooltipText = t("grievance_unconfirmed_tooltip") || "Khi chọn Chưa được xác nhận thì hiển thị tất cả danh sách chưa được xác nhận, không quan tâm ngày.";

    const getDisplayText = (val) => {
        if (val === "confirmed") return t("grievance_confirmed") || "Đã xác nhận";
        if (val === "unconfirmed") return t("grievance_unconfirmed") || "Chưa được xác nhận";
        return t("all") || "Tất cả";
    };

    return (
        <div title={tooltipText} className="w-full">
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    className={`h-10 md:h-9 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg shadow-sm text-sm ${className || ""}`}
                    aria-label={t("grievance_view_list") || "Danh sách xem"}
                    title={tooltipText}
                >
                    <div className="flex items-center gap-1.5 truncate">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            value === "confirmed" ? "bg-emerald-500" :
                            value === "unconfirmed" ? "bg-amber-500" :
                            "bg-blue-500"
                        }`} />
                        <span className="truncate text-[13px] md:text-sm font-medium">
                            {getDisplayText(value)}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                            <span>{t("all") || "Tất cả"}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="confirmed">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                {t("grievance_confirmed") || "Đã xác nhận"}
                            </span>
                        </div>
                    </SelectItem>
                    <SelectItem value="unconfirmed">
                        <div className="flex items-center gap-2" title={tooltipText}>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                                {t("grievance_unconfirmed") || "Chưa được xác nhận"}
                            </span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};
