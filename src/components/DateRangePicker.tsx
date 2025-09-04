"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  align?: "start" | "center" | "end";
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  align = "start",
  className,
}: DateRangePickerProps) {

  // Internal handler to sanitize the range received from react-day-picker
  const handleInternalDateRangeChange = (newRange: DateRange | undefined) => {
    if (!newRange) {
      onDateRangeChange(undefined);
      return;
    }

    const from = newRange.from;
    const to = newRange.to;

    let sanitizedFrom: Date | undefined = undefined;
    let sanitizedTo: Date | undefined = undefined;

    if (from && isValid(from)) {
      sanitizedFrom = from;
    }

    if (to && isValid(to)) {
      sanitizedTo = to;
    }

    if (sanitizedFrom && sanitizedTo) {
      onDateRangeChange({ from: sanitizedFrom, to: sanitizedTo });
    } else if (sanitizedFrom) {
      // If only 'from' is valid, ensure 'to' is also set to 'from' for single-day selection
      onDateRangeChange({ from: sanitizedFrom, to: sanitizedFrom });
    } else {
      // If neither is valid, or only 'to' is valid (which shouldn't happen with react-day-picker's range mode)
      onDateRangeChange(undefined);
    }
  };

  // Ensure the dateRange passed to Calendar is always valid or undefined
  const calendarSelected = React.useMemo(() => {
    if (!dateRange) return undefined;
    const from = dateRange.from;
    const to = dateRange.to;
    const validFrom = from && isValid(from) ? from : undefined;
    const validTo = to && isValid(to) ? to : undefined;

    if (validFrom && validTo) {
      return { from: validFrom, to: validTo };
    }
    if (validFrom) {
      return { from: validFrom, to: validFrom };
    }
    return undefined;
  }, [dateRange]);

  const calendarDefaultMonth = calendarSelected?.from || undefined;


  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !calendarSelected?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {calendarSelected?.from ? (
              calendarSelected.to ? (
                <>
                  {format(calendarSelected.from, "LLL dd, y")} -{" "}
                  {format(calendarSelected.to, "LLL dd, y")}
                </>
              ) : (
                format(calendarSelected.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={calendarDefaultMonth}
            selected={calendarSelected}
            onSelect={handleInternalDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}