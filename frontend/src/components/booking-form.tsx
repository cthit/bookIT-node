import { formText } from "@/lib/forms";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { addHours } from "date-fns";
import { toast } from "sonner";
import { request, checkMutation } from "@/api/client";
import {
  CreateBookingDocument,
  UpdateBookingDocument,
  type BookingFragment,
  type Room,
} from "@/generated/graphql";
import { rooms } from "@/lib/rooms";
import { localInput, parseDate } from "@/lib/dates";
import { useUser } from "@/lib/user";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/date-time-fields";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { privacyText } from "@/lib/privacy";

export function BookingForm({
  booking,
  initialStart,
  initialEnd,
}: {
  booking?: BookingFragment;
  initialStart?: string;
  initialEnd?: string;
}) {
  const { data: user } = useUser();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Room[]>(
    booking?.room.filter((room): room is Room => Boolean(room)) ?? ["BIG_HUB"],
  );

  const [terms, setTerms] = useState(Boolean(booking));
  const [privacy, setPrivacy] = useState(Boolean(booking));
  const [notification, setNotification] = useState(Boolean(booking));
  const [error, setError] = useState("");
  const [defaultStart] = useState(() => new Date());
  const groups = user?.groups?.filter((group): group is string => Boolean(group)) ?? [];
  const canEditPhone = !booking?.booked_by || booking.booked_by === user?.cid || user?.is_admin;

  const eligibleGroups =
    user?.is_admin && booking && !groups.includes(booking.booked_as)
      ? [...groups, booking.booked_as]
      : groups;

  const start = booking
    ? localInput(parseDate(booking.start))
    : initialStart || localInput(defaultStart);

  const end = booking
    ? localInput(parseDate(booking.end))
    : initialEnd || localInput(addHours(defaultStart, 1));

  const mutation = useMutation({
    mutationFn: async (form: FormData) => {
      const from = new Date(formText(form, "start"));
      const to = new Date(formText(form, "end"));

      if (!(to > from)) {
        throw new Error(
          t("End time must be after start time.", "Sluttiden måste vara efter starttiden."),
        );
      }

      if (!selected.length) {
        throw new Error(t("Select at least one room.", "Välj minst ett rum."));
      }

      if (!terms || !privacy || !notification) {
        throw new Error(
          t("Please confirm all three booking conditions.", "Bekräfta alla tre bokningsvillkor."),
        );
      }

      const event = {
        ...(booking?.id ? { id: booking.id } : {}),
        title: formText(form, "title").trim(),
        phone: formText(form, "phone").trim() || null,
        start: from.toISOString(),
        end: to.toISOString(),
        room: selected,
        description: formText(form, "description"),
        booked_as: formText(form, "booked_as"),
        booking_terms: terms,
      };

      if (booking) {
        const data = await request(UpdateBookingDocument, { event });

        checkMutation(data.editEvent, language);
      } else {
        const data = await request(CreateBookingDocument, { event });

        checkMutation(data.createEvent, language);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["booking"] });
      toast.success(t("Booking saved", "Bokningen sparades"));
      await navigate({ to: "/" });
    },
    onError: (reason: Error) => setError(reason.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    mutation.mutate(new FormData(event.currentTarget));
  }

  if (!eligibleGroups.length) {
    return (
      <p role="alert" className="rounded-lg bg-amber-50 p-5">
        {t(
          "You need membership in an active group to make a booking.",
          "Du behöver vara medlem i en aktiv grupp för att boka.",
        )}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <Label htmlFor="title">{t("Title", "Titel")}</Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={200}
            defaultValue={booking?.title}
            placeholder={t("What are you planning?", "Vad planerar ni?")}
          />
        </div>
        <div className="field">
          <Label htmlFor="phone">{t("Phone number", "Telefonnummer")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            disabled={!canEditPhone}
            required={!booking?.booked_by}
            pattern={String.raw`\+?\(?[0-9]{3}\)?[\-\s.]?[0-9]{3}[\-\s.]?[0-9]{4,5}`}
            defaultValue={booking?.phone ?? ""}
            placeholder={
              booking?.booked_by
                ? t("Leave blank to keep existing number", "Lämna tomt för att behålla numret")
                : "070 123 45 67"
            }
          />
          {!canEditPhone && (
            <p className="text-sm text-muted-foreground">
              {t(
                "The contact number is kept private. Its owner or an administrator can change it.",
                "Kontaktens nummer är privat. Kontaktpersonen eller en administratör kan ändra det.",
              )}
            </p>
          )}
        </div>
        <div className="field">
          <Label htmlFor="booked_as">{t("Booking as", "Bokas som")}</Label>
          <NativeSelect
            id="booked_as"
            name="booked_as"
            defaultValue={booking?.booked_as ?? ""}
            required
          >
            <option value="" disabled>
              {t("Select group", "Välj grupp")}
            </option>
            {eligibleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <fieldset>
        <legend className="mb-3 text-sm font-medium">{t("Rooms", "Rum")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {rooms.map((room) => (
            <label
              key={room.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${selected.includes(room.id) ? "border-ring bg-accent/50" : ""}`}
            >
              <Checkbox
                aria-label={room.name}
                checked={selected.includes(room.id)}
                onCheckedChange={(checked) =>
                  setSelected(
                    checked ? [...selected, room.id] : selected.filter((id) => id !== room.id),
                  )
                }
              />
              <span className="size-2 rounded-full" style={{ background: room.color }} />
              <span className="text-sm">{room.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <DatePicker label={t("Begins at", "Börjar")} name="start" defaultValue={start} withTime />
        <DatePicker label={t("Ends at", "Slutar")} name="end" defaultValue={end} withTime />
      </div>
      <div className="field">
        <Label htmlFor="description">{t("Description", "Beskrivning")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={booking?.description ?? ""}
          placeholder={t("Anything others should know?", "Något andra bör veta?")}
        />
      </div>
      <div className="space-y-4 border-t pt-5 text-sm leading-relaxed">
        <div className="flex gap-3">
          <Checkbox
            id="terms"
            checked={terms}
            onCheckedChange={(value) => setTerms(value === true)}
          />
          <label htmlFor="terms">
            {t("I accept the ", "Jag godkänner ")}
            <a
              className="text-accent-foreground underline"
              href="https://docs.chalmers.it/bokningsvillkor.pdf"
              target="_blank"
              rel="noreferrer"
            >
              {t("booking terms and conditions", "bokningsvillkoren")}
            </a>
            .
          </label>
        </div>
        <div className="flex gap-3">
          <Checkbox
            id="privacy"
            checked={privacy}
            onCheckedChange={(value) => setPrivacy(value === true)}
          />
          <div>
            <label htmlFor="privacy">
              {t("I accept the privacy agreement. ", "Jag godkänner GDPR-avtalet. ")}
            </label>
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="text-accent-foreground underline">
                  {t("Read agreement", "Läs avtalet")}
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("Privacy agreement", "GDPR-avtal")}</DialogTitle>
                  <DialogDescription>
                    {t(
                      "How IT handles your booking information",
                      "Hur IT hanterar din bokningsinformation",
                    )}
                  </DialogDescription>
                </DialogHeader>
                <p className="whitespace-pre-line text-sm leading-6 max-h-[60vh] overflow-auto">
                  {privacyText[language]}
                </p>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex gap-3">
          <Checkbox
            id="notification"
            checked={notification}
            onCheckedChange={(value) => setNotification(value === true)}
          />
          <label htmlFor="notification">
            {t(
              "I have notified Cubsec/Chalmers if this booking is for an event requiring notification.",
              "Jag har anmält till Cubsec/Chalmers om bokningen gäller ett arrangemang som kräver anmälan.",
            )}{" "}
            <a
              className="text-accent-foreground underline"
              href="https://www.chalmers.se/utbildning/studera-hos-oss/studentliv/arrangemang-i-sektionslokaler/formular-for-anmalan-av-arrangemang/"
              target="_blank"
              rel="noreferrer"
            >
              {t("Notification form", "Anmälningsformulär")}
            </a>
          </label>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => void navigate({ to: "/" })}>
          {t("Cancel", "Avbryt")}
        </Button>
        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? t("Saving…", "Sparar…") : t("Save booking", "Spara bokning")}
        </Button>
      </div>
    </form>
  );
}
