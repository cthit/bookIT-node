import { useContext } from "react";
import DayMask from "./day-mask.element";
import Rooms from "./rooms.element";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";
import { createRule, deleteRule, getRule, getRules } from "../../api/backend.api";
import { formatDate, formatDT, formatTime } from "../../utils/utils";
import { detailed_view_keys, table_header_keys } from "./rules.labels";
import translations from "./rules.translations.json";
import UserContext from "../../common/contexts/user";
import { useTranslations } from "../../common/contexts/translations";
import { Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const formatRule = r => ({
  ...r,
  _time: `${r.start_time}-${r.end_time}`,
  start_date: formatDate(Number(r.start_date)),
  end_date: formatDate(Number(r.end_date)),
  _room: <Rooms rooms={r.room.sort()} />,
  _day_mask: <DayMask day_mask={r.day_mask} />,
  _allow: r.allow ? <CheckIcon /> : <CancelIcon />,
  created_at: formatDT(r.created_at),
  updated_at: formatDT(r.updated_at),
});

const getRulesFormatted = async () => {
  const rules = await getRules();
  return rules.map(r => formatRule(r));
};

const getRuleFormatted = async id => {
  return { data: formatRule(await getRule(id)) };
};

const Rules = () => {
  const [texts] = useTranslations(translations);
  const [user] = useContext(UserContext);

  const createRuleCallback = async rule => {
    const res = await createRule({
      description: rule.description,
      priority: Number(rule.priority),
      title: rule.title,
      allow: rule._allow,
      day_mask: rule._day_mask,
      room: rule._room,
      start_date: formatDate(rule.start_date),
      end_date: formatDate(rule.end_date),
      start_time: formatTime(rule.start_time),
      end_time: formatTime(rule.end_time),
    });
    if (res === null) {
      return true;
    }
  };

  return (
    <div className="container">
      <Paper>
        <DataGrid
          columns={table_header_keys.map(col_name => ({
            field: col_name,
            headerName: texts[col_name],
          }))}
        />
      </Paper>
    </div>
  );
};

export default Rules;
