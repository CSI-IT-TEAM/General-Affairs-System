import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { CalendarIcon } from "lucide-react";
import dayjs from "dayjs";
import { Calendar } from "./calendar";

export function DatePickerDay({ value, onChange, id }) {
    const [open, setOpen] = React.useState(false);
    const selected = value ? dayjs(value) : null;
    const [tempDate, setTempDate] = React.useState(selected ? selected.toDate() : undefined);

    React.useEffect(() => {
        setTempDate(selected ? selected.toDate() : undefined);
    }, [value]);

    const display = selected ? selected.format("DD/MM/YYYY") : "Chọn ngày";

    const handleDateSelect = (date) => {
        if (date) {
            setOpen(false);
            onChange(dayjs(date).format("YYYY-MM-DD"));
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {display}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
                <Calendar
                    mode="single"
                    selected={tempDate}
                    onSelect={handleDateSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

