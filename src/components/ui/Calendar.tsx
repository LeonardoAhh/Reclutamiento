import * as React from "react";
import { DayPicker } from "@daypicker/react";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils-shadcn";
import "@daypicker/react/style.css";
import "./Calendar.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
