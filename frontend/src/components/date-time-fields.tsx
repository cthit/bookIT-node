import { useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "radix-ui";
import {
  type CalendarDate,
  CalendarDateTime,
  parseDate,
  parseDateTime,
  parseTime,
  toCalendarDate,
} from "@internationalized/date";
import {
  Button as CalendarButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateField,
  DateInput,
  DateSegment,
  FieldError,
  Heading,
  I18nProvider,
  Label,
  TimeField,
} from "react-aria-components";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";

type FieldProps = {
  label: string;
  name: string;
  defaultValue: string;
};

const inputClass =
  "flex min-h-10 min-w-0 flex-1 items-center rounded-md border bg-background px-3 py-2 text-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 data-invalid:border-destructive";

function Segments() {
  return (
    <DateInput className={inputClass}>
      {(segment) => (
        <DateSegment
          segment={segment}
          className="rounded-sm px-0.5 tabular-nums outline-none focus:bg-primary focus:text-primary-foreground data-placeholder:text-muted-foreground data-[type=literal]:px-0"
        />
      )}
    </DateInput>
  );
}

export function DatePicker({
  label,
  name,
  defaultValue,
  withTime = false,
}: FieldProps & { withTime?: boolean }) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [value, setValue] = useState<CalendarDate | CalendarDateTime | null>(() =>
    withTime ? parseDateTime(defaultValue) : parseDate(defaultValue),
  );

  return (
    <I18nProvider locale={language === "sv" ? "sv-SE" : "en-GB"}>
      <DateField
        name={name}
        value={value}
        onChange={setValue}
        granularity={withTime ? "minute" : "day"}
        hourCycle={24}
        shouldForceLeadingZeros
        isRequired
        validationBehavior="native"
        className="space-y-2"
      >
        <Label className="text-sm font-medium">{label}</Label>

        <div className="flex items-center gap-2">
          <Segments />

          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t(`Choose date for ${label}`, `Välj datum för ${label}`)}
              >
                <CalendarDays className="size-4" aria-hidden="true" />
              </Button>
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Content
                align="start"
                sideOffset={8}
                collisionPadding={16}
                onOpenAutoFocus={(event) => {
                  event.preventDefault();

                  calendarRef.current
                    ?.querySelector<HTMLElement>('[role="button"][tabindex="0"]')
                    ?.focus();
                }}
                aria-label={t(`${label} calendar`, `Kalender för ${label}`)}
                className="z-50 w-fit max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-3 text-popover-foreground shadow-md"
              >
                <Calendar
                  ref={calendarRef}
                  aria-label={label}
                  value={value ? toCalendarDate(value) : null}
                  onChange={(date) => {
                    setValue((current) =>
                      current
                        ? current.set({ year: date.year, month: date.month, day: date.day })
                        : withTime
                          ? new CalendarDateTime(date.year, date.month, date.day)
                          : date,
                    );

                    setOpen(false);
                  }}
                  firstDayOfWeek="mon"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <CalendarButton
                      slot="previous"
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </CalendarButton>

                    <Heading className="text-sm font-semibold" />

                    <CalendarButton
                      slot="next"
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </CalendarButton>
                  </div>

                  <CalendarGrid>
                    <CalendarGridHeader>
                      {(day) => (
                        <CalendarHeaderCell className="pb-2 text-xs font-normal text-muted-foreground">
                          {day}
                        </CalendarHeaderCell>
                      )}
                    </CalendarGridHeader>
                    <CalendarGridBody>
                      {(date) => (
                        <CalendarCell
                          date={date}
                          className="flex size-9 cursor-pointer items-center justify-center rounded-md text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-selected:bg-primary data-selected:text-primary-foreground data-[outside-month]:text-muted-foreground data-disabled:opacity-40"
                        />
                      )}
                    </CalendarGridBody>
                  </CalendarGrid>
                </Calendar>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>

        <FieldError className="block text-sm text-destructive" />
      </DateField>
    </I18nProvider>
  );
}

export function TimePicker({ label, name, defaultValue }: FieldProps) {
  const { language } = useLanguage();

  return (
    <I18nProvider locale={language === "sv" ? "sv-SE" : "en-GB"}>
      <TimeField
        name={name}
        defaultValue={parseTime(defaultValue)}
        granularity="minute"
        hourCycle={24}
        shouldForceLeadingZeros
        isRequired
        validationBehavior="native"
        className="space-y-2"
      >
        <Label className="text-sm font-medium">{label}</Label>
        <Segments />
        <FieldError className="block text-sm text-destructive" />
      </TimeField>
    </I18nProvider>
  );
}
