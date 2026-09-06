import { useEffect, useRef, useState } from "react";
import { EventCalendar } from "@/components/event-calendar";
import { CalendarBlockLabel } from "@/components/calendar-block-label";
import svLocale from "@fullcalendar/react/locales/sv";
import enLocale from "@fullcalendar/react/locales/en-gb";
import { addDays, format, startOfDay, startOfWeek } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { request, checkMutation } from "@/api/client";
import {
  CalendarDocument,
  UpdateBookingDocument,
  type BookingFragment,
  type Room,
} from "@/generated/graphql";
import { rooms } from "@/lib/rooms";
import { bookingRoomClass, bookingRoomStyles } from "@/lib/booking-colors";
import { calendarBlocks } from "@/lib/calendar-blocks";
import { parseDate, localInput } from "@/lib/dates";
import { useLanguage } from "@/lib/language";
import { useUser } from "@/lib/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingDetails } from "@/pages/booking";
import { Failure } from "@/components/feedback";

type BookingMove = { booking: BookingFragment; start: Date; end: Date };

export function CalendarPage() {
  const { t, language } = useLanguage();
  const { data: user } = useUser();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<BookingMove | null>(null);
  const savingMove = useRef(false);

  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  const [range, setRange] = useState(() => ({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
    to: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7).toISOString(),
  }));

  const [selectedRooms, setSelectedRooms] = useState<Room[]>(rooms.map((room) => room.id));

  const query = useQuery({
    queryKey: ["calendar", range],
    queryFn: () => request(CalendarDocument, range),
  });

  const bookings = (query.data?.eventsFT ?? []).filter((event): event is BookingFragment =>
    Boolean(event),
  );

  const visible = bookings.filter((event) =>
    event.room.some((room) => room && selectedRooms.includes(room)),
  );

  const move = useMutation({
    mutationFn: async ({ booking, start, end }: BookingMove) => {
      const { editEvent } = await request(UpdateBookingDocument, {
        event: {
          id: booking.id,
          title: booking.title,
          description: booking.description,
          start: start.toISOString(),
          end: end.toISOString(),
          room: booking.room.filter((room): room is Room => Boolean(room)),
          booked_as: booking.booked_as,
          booking_terms: true,
        },
      });

      checkMutation(editEvent, language);
    },
    onSuccess: async (_result, { booking }) => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["calendar"] }),
        cache.invalidateQueries({ queryKey: ["booking", booking.id] }),
      ]);

      toast.success(t("Booking moved", "Bokningen flyttades"));
    },
  });

  function cancelMove() {
    if (!savingMove.current) {
      setPendingMove(null);
    }
  }

  async function confirmMove() {
    if (!pendingMove || savingMove.current) {
      return;
    }

    savingMove.current = true;

    try {
      await move.mutateAsync(pendingMove);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("Move failed", "Flytten misslyckades"),
      );
    } finally {
      savingMove.current = false;
      setPendingMove(null);
    }
  }

  return (
    <>
      <style>{bookingRoomStyles}</style>
      <h1 className="sr-only">{t("Calendar", "Kalender")}</h1>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-2" aria-label={t("Room filters", "Rumsfilter")}>
          {rooms.map((room) => {
            const active = selectedRooms.includes(room.id);

            return (
              <Button
                key={room.id}
                size="sm"
                aria-pressed={active}
                style={{ backgroundColor: active ? room.color : "#737373", color: "#fff" }}
                onClick={() =>
                  setSelectedRooms(
                    active
                      ? selectedRooms.filter((id) => id !== room.id)
                      : [...selectedRooms, room.id],
                  )
                }
              >
                {room.name}
              </Button>
            );
          })}
        </div>
        <Button asChild>
          <Link to="/new-event" search={{}}>
            <Plus className="size-4" />
            {t("New booking", "Ny bokning")}
          </Link>
        </Button>
      </div>
      {query.error && <Failure error={query.error} retry={() => void query.refetch()} />}
      <EventCalendar
        availableViews={["dayGridMonth", "listWeek", "timeGridWeek"]}
        locales={[enLocale, svLocale]}
        locale={language === "en" ? "en-gb" : "sv"}
        firstDay={1}
        initialView={viewport.width > 600 ? "timeGridWeek" : "timeGridDay"}
        allDaySlot
        weekNumbers
        height={viewport.width > 600 ? Math.max(420, viewport.height - 200) : "auto"}
        scrollTime="17:00:00"
        scrollTimeReset={false}
        selectable={!pendingMove && !move.isPending}
        eventOverlap
        slotEventOverlap={false}
        eventMaxStack={2}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        slotHeaderFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        dayHeaderFormat={{ weekday: "short", day: "2-digit", month: "2-digit" }}
        views={{ dayGridMonth: { dayHeaderFormat: { weekday: "short" }, dayMaxEvents: 3 } }}
        backgroundEventInnerClass="overflow-hidden min-w-0"
        backgroundEventContent={({ event }) => (
          <CalendarBlockLabel
            title={event.title}
            description={
              typeof event.extendedProps.description === "string"
                ? event.extendedProps.description
                : event.title
            }
          />
        )}
        datesSet={(info) =>
          setRange((current) =>
            current.from === info.start.toISOString() && current.to === info.end.toISOString()
              ? current
              : { from: info.start.toISOString(), to: info.end.toISOString() },
          )
        }
        select={(info) =>
          void navigate({
            to: "/new-event",
            search: { start: localInput(info.start), end: localInput(info.end) },
          })
        }
        eventClick={(info) => {
          if (info.event.id && !pendingMove && !move.isPending) {
            setDetailId(info.event.id);
          }
        }}
        eventDrop={(info) => {
          const booking = bookings.find((event) => event.id === info.event.id);
          const start = info.event.start;
          const end = info.event.end;

          info.revert();

          if (
            pendingMove ||
            savingMove.current ||
            !booking ||
            !start ||
            !end ||
            !(user?.is_admin || user?.groups?.includes(booking.booked_as))
          ) {
            return;
          }

          setPendingMove({ booking, start, end });
        }}

        events={[
          ...visible.map((event) => ({
            id: event.id ?? undefined,
            title: event.title,
            start: parseDate(event.start),
            end: parseDate(event.end),
            color: rooms.find((room) => event.room.includes(room.id))?.color,
            contrastColor: "#fff",
            className: bookingRoomClass(event.room),
            editable: Boolean(
              !pendingMove &&
              !move.isPending &&
              (user?.is_admin || user?.groups?.includes(event.booked_as)),
            ),
            durationEditable: false,
          })),
          ...calendarBlocks(
            (query.data?.illegalSlots ?? []).filter((slot) =>
              slot.room.some((room) => selectedRooms.includes(room)),
            ),
          ).map((block) => ({
            ...block,
            display: "background",
            color: "#EF9A9A",
          })),
          ...(new Date(range.to) > startOfDay(addDays(new Date(), 63))
            ? [
                {
                  start: startOfDay(addDays(new Date(), 63)),
                  end: range.to,
                  display: "background",
                  color: "#AAAAAA",
                  title: t("Outside of booking range", "Utanför bokningsperiod"),
                },
              ]
            : []),
        ]}
      />
      <Dialog
        open={pendingMove !== null}
        onOpenChange={(open) => {
          if (!open) {
            cancelMove();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => {
            if (savingMove.current) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (savingMove.current) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("Move booking?", "Flytta bokningen?")}</DialogTitle>
            <DialogDescription>{pendingMove?.booking.title}</DialogDescription>
          </DialogHeader>
          {pendingMove && (
            <dl className="grid gap-4 text-sm">
              {[
                {
                  label: t("Original time", "Nuvarande tid"),
                  start: parseDate(pendingMove.booking.start),
                  end: parseDate(pendingMove.booking.end),
                },
                {
                  label: t("Proposed time", "Föreslagen tid"),
                  start: pendingMove.start,
                  end: pendingMove.end,
                },
              ].map(({ label, start, end }) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-2 flex flex-wrap gap-x-2 font-medium">
                    <time dateTime={start.toISOString()}>{format(start, "yyyy-MM-dd HH:mm")}</time>
                    <span aria-hidden="true">–</span>
                    <time dateTime={end.toISOString()}>{format(end, "yyyy-MM-dd HH:mm")}</time>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={move.isPending} onClick={cancelMove}>
              {t("Cancel", "Avbryt")}
            </Button>
            <Button disabled={move.isPending} onClick={() => void confirmMove()}>
              {t("Move booking", "Flytta bokning")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{t("Booking details", "Bokningsdetaljer")}</DialogTitle>
          {detailId && <BookingDetails id={detailId} onClose={() => setDetailId(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
