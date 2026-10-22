import { roomName } from "@/lib/rooms";
import { useLanguage } from "@/lib/language";
import { ruleDateText as dateText, ruleDayText, type RuleDetails as Rule } from "@/lib/rules";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export function RuleDetails({ details, onClose }: { details: Rule; onClose: () => void }) {
  const { t, language } = useLanguage();
  const dayText = (mask: number | null | undefined) => ruleDayText(mask, language);

  return (
    <>
      <dl className="grid gap-4 sm:grid-cols-2 text-sm">
        {[
          [t("Title", "Titel"), details.title],
          [t("Priority", "Prioritet"), details.priority],
          [t("Start date", "Startdatum"), dateText(details.start_date)],
          [t("End date", "Slutdatum"), dateText(details.end_date)],
          [t("Start time", "Starttid"), details.start_time],
          [t("End time", "Sluttid"), details.end_time],
          [t("Description", "Beskrivning"), details.description],
          [t("Rooms", "Rum"), details.room?.map(roomName).join(", ")],
          [t("Weekdays", "Veckodagar"), dayText(details.day_mask)],
          [
            t("Availability", "Tillgänglighet"),
            details.allow ? t("Allowed", "Tillåten") : t("Blocked", "Spärrad"),
          ],
          [t("Created", "Skapad"), dateText(details.created_at, true)],
          [t("Updated", "Uppdaterad"), dateText(details.updated_at, true)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t("Close", "Stäng")}
        </Button>
      </DialogFooter>
    </>
  );
}
