import {
  DigitButton,
  DigitCRUD,
  DigitTooltip,
  useDigitTranslations,
  DigitLayout,
} from "@cthit/react-digit-components";
import {
  getPartyReport,
  getPartyReports,
  setPartyReportStatus,
} from "../../api/backend.api";
import { formatDT } from "../../utils/utils";
import "./index.css";
import { useHistory } from "react-router";
import { detailed_view_keys, table_header_keys } from "./party-report.labels";
import translations from "./party-report.translations.json";

import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import HelpIcon from "@material-ui/icons/Help";
import { useContext } from "react";
import UserContext from "../../common/contexts/user-context";
import { useEffect } from "react";

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
};

const formatPartyReport = e => ({
  ...e,
  ...e.party_report,
  start: formatDT(e.start),
  end: formatDT(e.end),
  created_at: formatDT(e.created_at),
  status: getStatusIcon(e.party_report.status),
});

const PartyReports = () => {
  const history = useHistory();
  const [texts] = useDigitTranslations(translations);
  const [user] = useContext(UserContext);

  useEffect(() => {
    if (!user.is_admin) history.push("/");
  });

  const readAllPartyReports = async () =>
    (await getPartyReports()).map(e => ({
      ...formatPartyReport(e),
      details: (
        <DigitButton
          text="Details"
          label="Hello there"
          onClick={() => history.push("/party_reports/" + e.party_report.id)}
        />
      ),
    }));

  const setStatus = async (event, status) => {
    const res = await setPartyReportStatus(event.party_report.id, status);
    console.log(res);
    if (!res) {
      history.push("/party_reports");
      return;
    }
    console.log("Failed!");
  };

  return (
    <div className="container">
      <DigitCRUD
        readAllRequest={readAllPartyReports}
        readOneRequest={readOnePartyReport}
        path="/party_reports"
        idProp="id"
        keysOrder={[...detailed_view_keys, "edit_status"]}
        keysText={texts}
        tableProps={{
          columnsOrder: table_header_keys,
          headerTexts: texts,
          titleText: texts.party_reports,
          startOrderBy: "created",
          startRowsPerPage: 10,
        }}
        backButtonText={texts.back}
        detailsButtonText="Details"
        detailsTitle={data => data.title}
        readOneProps={{ style: { maxWidth: "40rem" } }}
        customDetailsRenders={{
          edit_status: event => (
            <DigitLayout.Row className="status-buttons">
              <DigitButton
                text={texts.accept}
                primary
                raised
                onClick={() => setStatus(event, "ACCEPTED")}
              />
              <DigitButton
                text={texts.deny}
                raised
                onClick={() => setStatus(event, "DENIED")}
              />
            </DigitLayout.Row>
          ),
        }}
      />
    </div>
  );
};

export default PartyReports;
