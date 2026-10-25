import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { request, checkMutation } from "@/api/client";
import { CreateRuleDocument, type Room } from "@/generated/graphql";
import { formText } from "@/lib/forms";
import { rooms } from "@/lib/rooms";
import { useLanguage } from "@/lib/language";
import { ruleWeekdays } from "@/lib/rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker, TimePicker } from "@/components/date-time-fields";
import { DialogFooter } from "@/components/ui/dialog";

export function RuleForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const { t, language } = useLanguage();
  const [selected, setSelected] = useState<Room[]>([]);
  const [days, setDays] = useState(0);
  const [error, setError] = useState("");
  const weekdays = ruleWeekdays[language];

  const create = useMutation({
    mutationFn: async (form: FormData) => {
      if (!selected.length || !days) {
        throw new Error(
          t("Select rooms and at least one weekday.", "Välj rum och minst en veckodag."),
        );
      }

      const rule = {
        title: formText(form, "title").trim(),
        description: formText(form, "description"),
        priority: Number(form.get("priority")),
        allow: form.get("allow") === "true",
        day_mask: days,
        room: selected,
        start_date: formText(form, "start_date"),
        end_date: formText(form, "end_date"),
        start_time: formText(form, "start_time").slice(0, 5),
        end_time: formText(form, "end_time").slice(0, 5),
      };

      if (rule.end_date < rule.start_date || rule.end_time <= rule.start_time) {
        throw new Error(
          t("The rule must end after it starts.", "Regeln måste sluta efter att den börjar."),
        );
      }

      const result = await request(CreateRuleDocument, { rule });

      checkMutation(result.createRule, language);
    },
    onSuccess: async () => {
      await onSaved();
      toast.success(t("Rule created", "Regeln skapades"));
    },
    onError: (reason) => setError(reason.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    create.mutate(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="field">
        <Label htmlFor="rule-title">{t("Title", "Titel")}</Label>
        <Input id="rule-title" name="title" required maxLength={200} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="field">
          <Label htmlFor="priority">{t("Priority", "Prioritet")}</Label>
          <Input id="priority" name="priority" type="number" required defaultValue={10} />
        </div>
        <div className="field">
          <Label htmlFor="allow">{t("Availability", "Tillgänglighet")}</Label>
          <NativeSelect id="allow" name="allow">
            <option value="true">{t("Allowed", "Tillåten")}</option>
            <option value="false">{t("Blocked", "Spärrad")}</option>
          </NativeSelect>
        </div>
        <DatePicker
          label={t("Start date", "Startdatum")}
          name="start_date"
          defaultValue={format(new Date(), "yyyy-MM-dd")}
        />
        <DatePicker label={t("End date", "Slutdatum")} name="end_date" defaultValue="2040-12-31" />
        <TimePicker label={t("Start time", "Starttid")} name="start_time" defaultValue="08:00" />
        <TimePicker label={t("End time", "Sluttid")} name="end_time" defaultValue="17:00" />
      </div>
      <fieldset>
        <legend className="text-sm font-medium mb-3">{t("Weekdays", "Veckodagar")}</legend>
        <div className="flex flex-wrap gap-3">
          {weekdays.map((day, index) => (
            <label className="flex gap-2 items-center text-sm" key={day}>
              <Checkbox
                aria-label={day}
                checked={Boolean(days & (1 << index))}
                onCheckedChange={(checked) =>
                  setDays(checked ? days | (1 << index) : days & ~(1 << index))
                }
              />
              {day}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium mb-3">{t("Rooms", "Rum")}</legend>
        <div className="grid grid-cols-2 gap-3">
          {rooms.map((room) => (
            <label className="flex gap-2 items-center text-sm" key={room.id}>
              <Checkbox
                aria-label={room.name}
                checked={selected.includes(room.id)}
                onCheckedChange={(checked) =>
                  setSelected(
                    checked ? [...selected, room.id] : selected.filter((id) => id !== room.id),
                  )
                }
              />
              {room.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <Label htmlFor="rule-description">{t("Description", "Beskrivning")}</Label>
        <Textarea id="rule-description" name="description" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Cancel", "Avbryt")}
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {t("Save rule", "Spara regel")}
        </Button>
      </DialogFooter>
    </form>
  );
}
