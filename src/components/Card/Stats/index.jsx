import { Card, CardContent } from "../../ui/card";

const StatsCard = ({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgFrom,
    iconBgTo,
    delay = "stagger-1"
}) => (
    <Card className={`glass hover-lift animate-fade-in ${delay} relative overflow-hidden border-0 shadow-premium hover:shadow-lg transition-all duration-300 group ${value === '' ? 'hidden' : ''}`}>
        <div className={`absolute -right-6 -top-6 opacity-[0.05] transition-opacity duration-500 transform`}>
            <Icon className={`h-16 w-16 ${iconColor}`} />
        </div>
        <CardContent className="p-2 relative z-10">
            <div className="flex items-start justify-between gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconBgFrom} ${iconBgTo} shadow-lg ring-2 ring-white dark:ring-gray-800 transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className="w-5 h-5 md:h-6 md:w-6 text-white" />
                </div>
                                 <div className="min-w-0">
                        <p className="text-lg font-bold truncate">{value}</p>
                        <p className="text-xs text-slate-500 truncate text-right">{title}</p>
                    </div>
            </div>
        </CardContent>
    </Card>
);

export default StatsCard;