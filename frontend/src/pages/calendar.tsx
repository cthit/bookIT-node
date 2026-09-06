import { useEffect, useState } from "react";
import { EventCalendar } from "@/components/event-calendar";
import svLocale from "@fullcalendar/react/locales/sv";
import enLocale from "@fullcalendar/react/locales/en-gb";
import { addDays, startOfDay, startOfWeek } from "date-fns";
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
import { parseDate, localInput } from "@/lib/dates";
import { useLanguage } from "@/lib/language";
import { useUser } from "@/lib/user";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BookingDetails } from "@/pages/booking";
import { Failure } from "@/components/feedback";

export function CalendarPage() {
  const { t, language } = useLanguage();
  const { data: user } = useUser();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);
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
    mutationFn: async ({
      booking,
      start,
      end,
    }: {
      booking: BookingFragment;
      start: Date;
      end: Date;
    }) => {
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
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["calendar"] });
      toast.success(t("Booking moved", "Bokningen flyttades"));
    },
  });
  return (
    <>
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
        selectable
        eventOverlap
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        slotHeaderFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        dayHeaderFormat={{ weekday: "short", day: "2-digit", month: "2-digit" }}
        views={{ dayGridMonth: { dayHeaderFormat: { weekday: "short" } } }}
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
          if (info.event.id) setDetailId(info.event.id);
        }}
        eventDrop={(info) => {
          const booking = bookings.find((event) => event.id === info.event.id);
          if (!booking || !info.event.start || !info.event.end) {
            info.revert();
            return;
          }
          move.mutate(
            { booking, start: info.event.start, end: info.event.end },
            {
              onError: (error) => {
                info.revert();
                toast.error(error.message);
              },
            },
          );
        }}

        eventDidMount={(info) => {
          const booking = bookings.find((event) => event.id === info.event.id);
          const colors = rooms
            .filter((room) => booking?.room.includes(room.id))
            .map((room) => room.color);
          if (colors.length > 1)
            info.el.style.backgroundImage = `repeating-linear-gradient(45deg, ${colors.map((color, i) => `${color} ${i * 25}px ${(i + 1) * 25}px`).join(", ")})`;
        }}
        events={[
          ...visible.map((event) => ({
            id: event.id ?? undefined,
            title: event.title,
            start: parseDate(event.start),
            end: parseDate(event.end),
            color: rooms.find((room) => event.room.includes(room.id))?.color,
            contrastColor: "#fff",
            editable: Boolean(user?.is_admin || user?.groups?.includes(event.booked_as)),
            durationEditable: false,
          })),
          ...(query.data?.illegalSlots ?? [])
            .filter((slot) => slot.room.some((room) => selectedRooms.includes(room)))
            .map((slot) => ({
              start: parseDate(slot.start),
              end: parseDate(slot.end),
              display: "background",
              color: "#EF9A9A",
              title: slot.title + (slot.description ? ` — ${slot.description}` : ""),
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
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
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
