import { type CalendarOptions, useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { EventCalendarToolbar } from "@/components/event-calendar-toolbar";
import { EventCalendarViews } from "@/components/ui/event-calendar-views";
import { EventCalendarCloseIcon } from "@/components/event-calendar-icons";
import { cn } from "@/lib/utils";

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];

export interface EventCalendarProps extends Omit<
  CalendarOptions,
  "class" | "className" | "headerToolbar" | "footerToolbar" | "plugins"
> {
  className?: string;
  availableViews: string[];
}

export function EventCalendar({
  availableViews,
  className,
  height,
  contentHeight,
  direction,
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController();

  const hasBorderX = !(restOptions.borderlessX ?? restOptions.borderless);
  const hasBorderTop = !(restOptions.borderlessTop ?? restOptions.borderless);
  const hasBorderBottom = !(restOptions.borderlessBottom ?? restOptions.borderless);
  const isHeightAuto = height === "auto" || contentHeight === "auto";

  return (
    <div
      className={cn(
        className,
        "flex flex-col bg-background",
        hasBorderX && "border-x",
        hasBorderTop && "border-t",
        hasBorderBottom && "border-b",
        hasBorderTop && hasBorderX && "rounded-t-lg",
        hasBorderBottom && hasBorderX && "rounded-b-lg",
        !isHeightAuto && "overflow-hidden",
      )}
      style={{ height }}
      dir={direction === "rtl" ? "rtl" : undefined}
    >
      <EventCalendarToolbar
        className="px-4 py-5 sm:px-5 gap-y-4"
        controller={controller}
        availableViews={availableViews}
      />
      <div className="grow min-h-0">
        <EventCalendarViews
          controller={controller}
          height={isHeightAuto ? "auto" : height !== undefined ? "100%" : contentHeight}
          initialView={availableViews[0]}
          navLinkDayClick="timeGridDay"
          navLinkWeekClick="timeGridWeek"
          plugins={plugins}
          popoverCloseContent={() => <EventCalendarCloseIcon />}
          {...restOptions}
        />
      </div>
    </div>
  );
}
