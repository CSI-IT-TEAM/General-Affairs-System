import { CheckCircle, Clock, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const isGrievanceWinner = (value) => String(value || '').trim().toUpperCase() === 'Y';

export const ConfirmationStatusBadge = ({ value }) => {
    const { t } = useTranslation();
    const confirmed = String(value || '').trim().toUpperCase() === 'Y';

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap ${confirmed
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
            {confirmed ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {confirmed ? t('confirmed') : t('grievance_pending_confirm')}
        </span>
    );
};

export const WinnerStatusBadge = ({ value }) => {
    const { t } = useTranslation();

    if (!isGrievanceWinner(value)) {
        return <span className="text-slate-400 dark:text-slate-500" aria-label={t('grievance_not_winner')}>—</span>;
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-50 px-2.5 py-1 text-xs font-extrabold text-amber-800 shadow-sm shadow-amber-200/60 whitespace-nowrap dark:border-amber-700 dark:from-amber-900/60 dark:to-yellow-950/40 dark:text-amber-200">
            <Trophy className="h-3.5 w-3.5 fill-amber-500/30" />
            {t('grievance_winner_badge')}
        </span>
    );
};
