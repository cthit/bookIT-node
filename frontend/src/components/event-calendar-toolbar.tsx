import type { CalendarController } from "@fullcalendar/react";
import { EventCalendarNextIcon, EventCalendarPrevIcon } from "@/components/event-calendar-icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface EventCalendarToolbarProps {
  className?: string;
  controller: CalendarController;
  availableViews: string[];
  addButton?: {
    isPrimary?: boolean;
    text?: string;
    hint?: string;
    click?: () => void;
  };
}

export function EventCalendarToolbar({
  className,
  controller,
  availableViews,
  addButton,
}: EventCalendarToolbarProps) {
  const buttons = controller.getButtonState();

  return (
    <div className={cn("flex items-center justify-between flex-wrap gap-3", className)}>
      <div className="flex items-center flex-wrap gap-3">
        {addButton && (
          <Button onClick={addButton.click} aria-label={addButton.hint}>
            {addButton.text}
          </Button>
        )}
        <Button
          onClick={() => controller.today()}
          aria-label={buttons.today.hint}
          variant="outline"
        >
          {buttons.today.text}
        </Button>
        <div className="flex items-center">
          <Button
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
            variant="ghost"
            size="icon"
          >
            <EventCalendarPrevIcon />
          </Button>
          <Button
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
            variant="ghost"
            size="icon"
          >
            <EventCalendarNextIcon />
          </Button>
        </div>
        <h3 className="text-base font-semibold" aria-live="polite">
          {controller.view?.title}
        </h3>
      </div>
      <Tabs
        value={controller.view?.type ?? availableViews[0]}
        onValueChange={(view) => controller.changeView(view)}
      >
        <TabsList className="gap-1 p-1 group-data-[orientation=horizontal]/tabs:h-11">
          {availableViews.map((availableView) => (
            <TabsTrigger
              key={availableView}
              value={availableView}
              className="min-w-16 px-4 py-2"
              aria-label={buttons[availableView]?.hint}
            >
              {buttons[availableView]?.text}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
