import { DigitCRUD, useDigitTranslations } from "@cthit/react-digit-components";
import DayMask from "./day-mask.element";
import Rooms from "./rooms.element";
import CancelIcon from "@material-ui/icons/Cancel";
import CheckIcon from "@material-ui/icons/Check";
import "./index.css";
import {
  createRule,
  deleteRule,
  getRule,
  getRules,
} from "../../api/backend.api";
import { formatDate, formatDT, formatTime } from "../../utils/utils";
import { detailed_view_keys, table_header_keys } from "./rules.labels";
import { ruleForm } from "./rule.form";
import translations from "./rules.translations.json";

const formatRule = r => ({
  ...r,
  _time: `${r.start_time}-${r.end_time}`,
  start_date: r.start_date.split(" ")[0],
  end_date: r.end_date.split(" ")[0],
  _room: <Rooms rooms={r.room} />,
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

const createRuleCallback = async rule =>
  createRule({
    description: rule.description,
    priority: rule.priority,
    title: rule.title,
    allow: rule._allow,
    day_mask: rule._day_mask,
    room: rule._room,
    start_date: formatDate(rule.start_date),
    end_date: formatDate(rule.end_date),
    start_time: formatTime(rule.start_time),
    end_time: formatTime(rule.end_time),
  });

const Rules = () => {
  const [texts] = useDigitTranslations(translations);

  return (
    <div className="container">
      <DigitCRUD
        readAllRequest={getRulesFormatted}
        readOneRequest={getRuleFormatted}
        createRequest={createRuleCallback}
        deleteRequest={deleteRule}
        path="/rules"
        idProp="id"
        keysOrder={detailed_view_keys}
        keysText={texts}
        backButtonText={texts.back}
        createButtonText={texts.create}
        detailsButtonText={texts.details}
        createTitle={texts.create_rule}
        tableProps={{
          columnsOrder: table_header_keys,
          headerTexts: texts,
          titleText: texts.Rules,
          startOrderBy: "title",
          startRowsPerPage: 10,
        }}
        formInitialValues={{
          title: "",
          priority: 10,
          start_date: new Date(),
          end_date: new Date("2040-12-31"),
          start_time: new Date("2021-08-21T08:00"),
          end_time: new Date("2021-08-21T17:00"),
          _allow: true,
          _day_mask: 0,
          description: "",
          _room: [],
        }}
        formComponentData={ruleForm(texts)}
      />
    </div>
  );
};

export default Rules;
