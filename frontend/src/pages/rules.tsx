import { formText } from "@/lib/forms";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Trash2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { request, checkMutation } from "@/api/client";
import {
  RulesDocument,
  CreateRuleDocument,
  DeleteRuleDocument,
  type Room,
  type RulesQuery,
} from "@/generated/graphql";
import { rooms, roomName } from "@/lib/rooms";
import { parseDate } from "@/lib/dates";
import { useUser } from "@/lib/user";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Failure, Loading } from "@/components/feedback";

type RuleDetails = NonNullable<NonNullable<RulesQuery["rules"]>[number]>;
type SortKey =
  | "title"
  | "priority"
  | "start_date"
  | "end_date"
  | "start_time"
  | "room"
  | "day_mask"
  | "allow";

function sortValue(rule: RuleDetails, key: SortKey): string | number {
  if (key === "priority" || key === "day_mask") return rule[key] ?? 0;
  if (key === "allow") return Number(rule.allow);
  if (key === "room") return rule.room?.map(roomName).sort().join(", ") ?? "";
  return rule[key] ?? "";
}

export function RulesPage() {
  const { t, language } = useLanguage();
  const { data: user } = useUser();
  const cache = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const [selected, setSelected] = useState<Room[]>([]);
  const [days, setDays] = useState(0);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [ascending, setAscending] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState("");
  const weekdays =
    language === "en"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
  const query = useQuery({ queryKey: ["rules"], queryFn: () => request(RulesDocument, {}) });
  const sorted = (query.data?.rules ?? [])
    .filter((rule): rule is RuleDetails => rule !== null)
    .sort((a, b) => {
      const left = sortValue(a, sortKey);
      const right = sortValue(b, sortKey);
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), language, { sensitivity: "base" });
      return ascending ? result : -result;
    });
  const pageCount = Math.max(1, Math.ceil(sorted.length / 10));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRules = sorted.slice(currentPage * 10, currentPage * 10 + 10);
  const details = sorted.find((rule) => rule.id === detailsId);
  const columns: { key: SortKey; label: string }[] = [
    { key: "title", label: t("Title", "Titel") },
    { key: "priority", label: t("Priority", "Prioritet") },
    { key: "start_date", label: t("Start date", "Startdatum") },
    { key: "end_date", label: t("End date", "Slutdatum") },
    { key: "start_time", label: t("Time", "Tid") },
    { key: "room", label: t("Rooms", "Rum") },
    { key: "day_mask", label: t("Weekdays", "Veckodagar") },
    { key: "allow", label: t("Availability", "Tillgänglighet") },
  ];
  const dateText = (value: string | null | undefined, withTime = false) =>
    value ? format(parseDate(value), withTime ? "d MMM yyyy, HH:mm" : "d MMM yyyy") : "—";
  const dayText = (mask: number | null | undefined) =>
    weekdays.filter((_, index) => ((mask ?? 0) & (1 << index)) !== 0).join(" · ") || "—";
  async function invalidate() {
    await cache.invalidateQueries({ queryKey: ["rules"] });
    await cache.invalidateQueries({ queryKey: ["calendar"] });
  }
  const create = useMutation({
    mutationFn: async (form: FormData) => {
      if (!selected.length || !days)
        throw new Error(
          t("Select rooms and at least one weekday.", "Välj rum och minst en veckodag."),
        );
      const rule = {
        title: formText(form, "title").trim(),
        description: formText(form, "description"),
        priority: Number(form.get("priority")),
        allow: form.get("allow") === "true",
        day_mask: days,
        room: selected,
        start_date: formText(form, "start_date"),
        end_date: formText(form, "end_date"),
        start_time: formText(form, "start_time"),
        end_time: formText(form, "end_time"),
      };
      if (rule.end_date < rule.start_date || rule.end_time <= rule.start_time)
        throw new Error(
          t("The rule must end after it starts.", "Regeln måste sluta efter att den börjar."),
        );
      const result = await request(CreateRuleDocument, { rule });
      checkMutation(result.createRule, language);
    },
    onSuccess: async () => {
      await invalidate();
      setCreating(false);
      setSelected([]);
      toast.success(t("Rule created", "Regeln skapades"));
    },
    onError: (reason) => setError(reason.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const result = await request(DeleteRuleDocument, { id });
      checkMutation(result.deleteRule, language);
    },
    onSuccess: async () => {
      await invalidate();
      setDeleting(null);
      toast.success(t("Rule deleted", "Regeln raderades"));
    },
    onError: (reason) => toast.error(reason.message),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    create.mutate(new FormData(event.currentTarget));
  }
  return (
    <>
      <div className="flex justify-between items-end flex-wrap gap-5 mb-7">
        <h1 className="page-title">{t("Rules", "Regler")}</h1>
        {user?.is_admin && (
          <Button
            onClick={() => {
              setError("");
              setDays(0);
              setSelected([]);
              setCreating(true);
            }}
          >
            <Plus className="size-4" />
            {t("New rule", "Ny regel")}
          </Button>
        )}
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      sortKey === column.key ? (ascending ? "ascending" : "descending") : "none"
                    }
                  >
                    <button
                      className="inline-flex items-center gap-1 whitespace-nowrap py-2"
                      onClick={() => {
                        setAscending(sortKey === column.key ? !ascending : true);
                        setSortKey(column.key);
                        setPageIndex(0);
                      }}
                    >
                      {column.label}
                      <ArrowUpDown className="size-3" aria-hidden="true" />
                    </button>
                  </TableHead>
                ))}
                <TableHead>
                  <span className="sr-only">{t("Actions", "Åtgärder")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="max-w-72 font-medium">{rule.title}</TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell className="whitespace-nowrap">{dateText(rule.start_date)}</TableCell>
                  <TableCell className="whitespace-nowrap">{dateText(rule.end_date)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {rule.start_time}–{rule.end_time}
                  </TableCell>
                  <TableCell>
                    {rule.room
                      ?.filter((room): room is Room => Boolean(room))
                      .map(roomName)
                      .join(", ")}
                  </TableCell>
                  <TableCell>{dayText(rule.day_mask)}</TableCell>
                  <TableCell>
                    <Badge variant={rule.allow ? "secondary" : "destructive"}>
                      {rule.allow ? t("Allowed", "Tillåten") : t("Blocked", "Spärrad")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rule.id && setDetailsId(rule.id)}
                        aria-label={`${t("Details", "Detaljer")} ${rule.title ?? ""}`}
                      >
                        {t("Details", "Detaljer")}
                      </Button>
                      {user?.is_admin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`${t("Delete", "Radera")} ${rule.title ?? ""}`}
                          onClick={() =>
                            rule.id && setDeleting({ id: rule.id, title: rule.title ?? "" })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!sorted.length && (
            <p className="p-10 text-center text-muted-foreground">
              {t("No booking rules yet.", "Inga bokningsregler ännu.")}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 border-t p-3 text-sm">
            <span>
              {t("Page", "Sida")} {currentPage + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPageIndex(currentPage - 1)}
            >
              {t("Previous", "Föregående")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage + 1 === pageCount}
              onClick={() => setPageIndex(currentPage + 1)}
            >
              {t("Next", "Nästa")}
            </Button>
          </div>
        </Card>
      )}
      <Dialog
        open={Boolean(details)}
        onOpenChange={(open) => {
          if (!open) setDetailsId(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Rule details", "Regeldetaljer")}</DialogTitle>
            <DialogDescription>{details?.title}</DialogDescription>
          </DialogHeader>
          {details && (
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsId(null)}>
              {t("Close", "Stäng")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("New rule", "Ny regel")}</DialogTitle>
            <DialogDescription className="sr-only">{t("New rule", "Ny regel")}</DialogDescription>
          </DialogHeader>
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
                <select id="allow" name="allow" className="native-select">
                  <option value="true">{t("Allowed", "Tillåten")}</option>
                  <option value="false">{t("Blocked", "Spärrad")}</option>
                </select>
              </div>
              <div className="field">
                <Label htmlFor="start_date">{t("Start date", "Startdatum")}</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              <div className="field">
                <Label htmlFor="end_date">{t("End date", "Slutdatum")}</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                  defaultValue="2040-12-31"
                />
              </div>
              <div className="field">
                <Label htmlFor="start_time">{t("Start time", "Starttid")}</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  required
                  defaultValue="08:00"
                />
              </div>
              <div className="field">
                <Label htmlFor="end_time">{t("End time", "Sluttid")}</Label>
                <Input id="end_time" name="end_time" type="time" required defaultValue="17:00" />
              </div>
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
                          checked
                            ? [...selected, room.id]
                            : selected.filter((id) => id !== room.id),
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
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                {t("Cancel", "Avbryt")}
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {t("Save rule", "Spara regel")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete rule?", "Radera regeln?")}</DialogTitle>
            <DialogDescription>{deleting?.title}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("Cancel", "Avbryt")}
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              {t("Confirm deletion", "Bekräfta radering")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
