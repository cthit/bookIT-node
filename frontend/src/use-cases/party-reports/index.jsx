import {
  DigitButton,
  DigitCRUD,
  DigitTooltip,
  useDigitTranslations,
} from "@cthit/react-digit-components";
import { getPartyReport, getPartyReports } from "../../api/backend.api";
import { formatDT } from "../../utils/utils";
import "./index.css";
import { useHistory } from "react-router";
import { detailed_view_keys, table_header_keys } from "./party-report.labels";
import translations from "./party-report.translations.json";

import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import HelpIcon from "@material-ui/icons/Help";

const getStatusIcon = status => {
  var icon = <HelpIcon />;
  switch (status) {
    case "PENDING":
      icon = (
        <FiberManualRecordIcon fontSize="large" style={{ color: "orange" }} />
      );
      break;
    case "ACCEPTED":
      icon = <CheckCircleIcon style={{ color: "green" }} />;
      break;
    case "DENIED":
      icon = <CancelIcon style={{ color: "red" }} />;
      break;
    default:
  }
  return <DigitTooltip text={status} render={() => icon} />;
};

const readOnePartyReport = async id => {
  const report = await getPartyReport(id);
  if(report.party_report.status){
    return {
      data: {
        ...report,
        ...report.party_report,
        start: formatDT(report.start),
        end: formatDT(report.end),
        created_at: formatDT(report.created_at),
        status: getStatusIcon(report.party_report.status),
        location: "Hubben 2.1",
        attendees: "75 or less",
        serving_permit: report.party_report.serving_permit
          ? "Finns"
          : "Ej aktuellt",
      },
    };
  }
  else{
    return {
      data:{
        ...report,
        responsible_name:report.party_report.responsible_name,
        start: formatDT(report.start),
        end: formatDT(report.end),
        created_at: formatDT(report.created_at),
      },
      };
    }
};

const formatPartyReport = e => (
  (e.party_report.status)?
  {
  ...e,
  ...e.party_report,
  start: formatDT(e.start),
  end: formatDT(e.end),
  created_at: formatDT(e.created_at),
  status: getStatusIcon(e.party_report.status),
}:{
  ...e,
  ...e.party_report,
  start: formatDT(e.start),
  end: formatDT(e.end),
  created_at: formatDT(e.created_at),
}

);

const PartyReports = () => {
  const history = useHistory();
  const [texts] = useDigitTranslations(translations);

  const readAllPartyReports = async () =>
    (await getPartyReports()).map(e => ({
      ...formatPartyReport(e),
    }));

  return (
    <div className="container">
      <DigitCRUD
        readAllRequest={readAllPartyReports}
        readOneRequest={readOnePartyReport}
        path="/party_reports"
        idProp="id"
        keysOrder={detailed_view_keys}
        keysText={texts}
        tableProps={{
          columnsOrder: table_header_keys,
          headerTexts: texts,
          titleText: texts.party_reports,
          startOrderBy: "created",
          startRowsPerPage: 10,
        }}
        backButtonText={texts.back}
        detailsButtonText={"Details"}
        detailsTitle={data => data.title}
        readOneProps={{ style: { maxWidth: "40rem" } }}
      />
    </div>
  );
};

export default PartyReports;
