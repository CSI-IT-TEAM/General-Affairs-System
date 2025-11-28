import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { MonthPicker } from "./monthpicker";

export function MonthPickerPopover({ value, onChange }) {
    const [date, setDate] = React.useState(value);

    React.useEffect(() => {
        setDate(value);
    }, [value]);

    const handleMonthSelect = (d) => {
        setDate(d);
        if (onChange) onChange(d);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-[180px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM yyyy") : <span>Chọn tháng</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <MonthPicker onMonthSelect={handleMonthSelect} selectedMonth={date} />
            </PopoverContent>
        </Popover>
    );
}

