import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { request } from "@/api/client";
import { RulesDocument, DeleteRuleDocument, type Room } from "@/generated/graphql";
import { roomName } from "@/lib/rooms";
import { useUser } from "@/lib/user";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
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

import { RuleForm } from "@/components/rule-form";
import { RuleDetails as RuleDetailsContent } from "@/components/rule-details";
import { ruleDateText as dateText, ruleDayText, type RuleDetails } from "@/lib/rules";

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
  if (key === "priority" || key === "day_mask") {
    return rule[key] ?? 0;
  }

  if (key === "allow") {
    return Number(rule.allow);
  }

  if (key === "room") {
    return rule.room?.map(roomName).sort().join(", ") ?? "";
  }

  return rule[key] ?? "";
}

export function RulesPage() {
  const { t, language } = useLanguage();
  const { data: user } = useUser();
  const cache = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [ascending, setAscending] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

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

  const dayText = (mask: number | null | undefined) => ruleDayText(mask, language);

  async function invalidate() {
    await cache.invalidateQueries({ queryKey: ["rules"] });
    await cache.invalidateQueries({ queryKey: ["calendar"] });
  }

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const result = await request(DeleteRuleDocument, { id });

      if (!result.deleteRule) {
        throw new Error(t("Could not delete rule", "Kunde inte ta bort regel"));
      }
    },
    onSuccess: async () => {
      await invalidate();
      setDeleting(null);
      toast.success(t("Rule deleted", "Regeln raderades"));
    },
    onError: (reason) => toast.error(reason.message),
  });

  return (
    <>
      <div className="flex justify-between items-end flex-wrap gap-5 mb-7">
        <h1 className="page-title">{t("Rules", "Regler")}</h1>
        {user?.is_admin && (
          <Button onClick={() => setCreating(true)}>
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
          <Table className="min-w-[1080px] [&_th]:px-5 [&_th]:py-3 [&_td]:px-5 [&_td]:py-4 [&_td]:leading-6">
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
                <TableHead className="sticky right-0 bg-card">
                  <span className="sr-only">{t("Actions", "Åtgärder")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="min-w-44 max-w-72 whitespace-normal font-medium">
                    {rule.title}
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell className="whitespace-nowrap">{dateText(rule.start_date)}</TableCell>
                  <TableCell className="whitespace-nowrap">{dateText(rule.end_date)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {rule.start_time}–{rule.end_time}
                  </TableCell>
                  <TableCell className="min-w-36 whitespace-normal">
                    {rule.room
                      ?.filter((room): room is Room => Boolean(room))
                      .map(roomName)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="min-w-44 whitespace-normal">
                    {dayText(rule.day_mask)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.allow ? "secondary" : "destructive"}>
                      {rule.allow ? t("Allowed", "Tillåten") : t("Blocked", "Spärrad")}
                    </Badge>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-card">
                    <div className="flex items-center gap-2">
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
          <div className="flex items-center justify-end gap-3 border-t px-5 py-4 text-sm">
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
          if (!open) {
            setDetailsId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Rule details", "Regeldetaljer")}</DialogTitle>
            <DialogDescription>{details?.title}</DialogDescription>
          </DialogHeader>
          {details && <RuleDetailsContent details={details} onClose={() => setDetailsId(null)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("New rule", "Ny regel")}</DialogTitle>
            <DialogDescription className="sr-only">{t("New rule", "Ny regel")}</DialogDescription>
          </DialogHeader>
          <RuleForm
            onCancel={() => setCreating(false)}
            onSaved={async () => {
              await invalidate();
              setCreating(false);
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
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
