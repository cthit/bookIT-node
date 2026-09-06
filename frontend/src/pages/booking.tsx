import { Link, useNavigate, useSearch, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { request, checkMutation } from "@/api/client";
import { BookingDetailDocument, DeleteBookingDocument, type Room } from "@/generated/graphql";
import { roomName } from "@/lib/rooms";
import { parseDate } from "@/lib/dates";
import { useUser } from "@/lib/user";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookingForm } from "@/components/booking-form";
import { Failure, Loading } from "@/components/feedback";

export function NewBookingPage() {
  const { t } = useLanguage();
  const { start, end } = useSearch({ from: "/new-event" });

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="flex gap-2 items-center text-sm text-muted-foreground mb-6">
        <ArrowLeft className="size-4" />
        {t("Back to calendar", "Tillbaka till kalendern")}
      </Link>
      <h1 className="text-2xl font-semibold mb-6">{t("New booking", "Ny bokning")}</h1>
      <Card>
        <CardContent>
          <BookingForm initialStart={start} initialEnd={end} />
        </CardContent>
      </Card>
    </div>
  );
}

export function BookingPage() {
  const { id } = useParams({ from: "/bookings/$id" });
  const { edit } = useSearch({ from: "/bookings/$id" });

  return <BookingDetails id={id} initialEditing={edit} />;
}

export function BookingDetails({
  id,
  initialEditing = false,
  onClose,
}: {
  id: string;
  initialEditing?: boolean;
  onClose?: () => void;
}) {
  const { t, language } = useLanguage();
  const { data: user } = useUser();
  const [editing, setEditing] = useState(initialEditing);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const cache = useQueryClient();

  const query = useQuery({
    queryKey: ["booking", id],
    queryFn: () => request(BookingDetailDocument, { id }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await request(DeleteBookingDocument, { id });

      checkMutation(result.deleteEvent, language);
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["calendar"] });
      toast.success(t("Booking deleted", "Bokningen raderades"));
      onClose?.();
      await navigate({ to: "/" });
    },
    onError: (error) => toast.error(error.message),
  });

  if (query.isPending) {
    return <Loading />;
  }

  if (query.error) {
    return <Failure error={query.error} />;
  }

  const booking = query.data.event;

  if (!booking) {
    return <p role="alert">{t("Booking not found.", "Bokningen hittades inte.")}</p>;
  }

  const canEdit = user?.is_admin || user?.groups?.includes(booking.booked_as);

  return (
    <div className="max-w-3xl mx-auto">
      {!onClose && (
        <Link to="/" className="flex gap-2 items-center text-sm text-muted-foreground mb-6">
          <ArrowLeft className="size-4" />
          {t("Back to calendar", "Tillbaka till kalendern")}
        </Link>
      )}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{booking.title}</h2>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (onClose) {
                  onClose();
                  void navigate({ to: "/edit-event", search: { id } });
                } else {
                  setEditing(!editing);
                }
              }}
            >
              <Pencil className="size-4" />
              {t("Edit", "Redigera")}
            </Button>
            <Button variant="outline" onClick={() => setDeleting(true)}>
              <Trash2 className="size-4" />
              {t("Delete", "Radera")}
            </Button>
          </div>
        )}
      </div>
      <Card>
        <CardContent>
          {editing && canEdit ? (
            <BookingForm booking={booking} />
          ) : (
            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">{t("Rooms", "Rum")}</dt>
                <dd className="mt-2 font-medium">
                  {booking.room
                    .filter((room): room is Room => Boolean(room))
                    .map(roomName)
                    .join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t("Booking as", "Bokas som")}</dt>
                <dd className="mt-2 font-medium">
                  <a
                    className="text-primary underline"
                    href={`https://gamma.chalmers.it/super-groups/${encodeURIComponent(booking.booked_as)}`}
                  >
                    {booking.booked_as}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t("Begins at", "Börjar")}</dt>
                <dd className="mt-2">{format(parseDate(booking.start), "yyyy-MM-dd HH:mm")}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t("Ends at", "Slutar")}</dt>
                <dd className="mt-2">{format(parseDate(booking.end), "yyyy-MM-dd HH:mm")}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{t("Description", "Beskrivning")}</dt>
                <dd className="whitespace-pre-wrap mt-2">{booking.description || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t("Booked by", "Bokad av")}</dt>
                <dd className="mt-2">
                  {booking.booked_by ? (
                    <a
                      className="text-primary underline"
                      href={`https://gamma.chalmers.it/users/${encodeURIComponent(booking.booked_by)}`}
                    >
                      {booking.booked_by}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete booking?", "Radera bokningen?")}</DialogTitle>
            <DialogDescription>{booking.title}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(false)}>
              {t("Cancel", "Avbryt")}
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {t("Confirm deletion", "Bekräfta radering")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
