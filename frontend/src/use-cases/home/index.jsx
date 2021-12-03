import { useDigitCustomDialog } from "@cthit/react-digit-components";
import { useHistory } from "react-router";
import { getEvents } from "../../api/backend.api";
import AddEventButton from "../../common/elements/add-event-button";
import ROOMS from "../../common/rooms";
import Calendar from "./calendar.view";
import DetailedView from "./detailed-view.view";
import "./index.css";

const getClassName = rooms => {
  let name = "event";
  for (const i in rooms) {
    name += "-" + rooms[i].toLowerCase();
  }
  return name;
};

const getCalendarEvents = async info => {
  const events = await getEvents(info.start, info.end);
  return events.map(e => {
    return {
      ...e,
      className: getClassName(e.room.sort()),
    };
  });
};

const getColorVariables = () => {
  let variables = {};
  for (const i in ROOMS) {
    variables["--bg_" + ROOMS[i].value.toLowerCase()] = ROOMS[i].color;
  }
  return variables;
};
const colorVariables = getColorVariables();

const Home = () => {
  const history = useHistory();
  const [openDialog, closeDialog] = useDigitCustomDialog({
    title: "Event",
  });
  return (
    <div
      style={{
        width: "100%",
        margin: "1rem",
        height: "40rem",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        ...colorVariables,
      }}
    >
      <div style={{ display: "flex", alignContent: "center" }}>
        {ROOMS.map(r => (
          <div className="chip" style={{ backgroundColor: r.color }}>
            {r.text}
          </div>
        ))}
      </div>
      <Calendar
        getEvents={getCalendarEvents}
        eventClick={value =>
          openDialog({
            title: value.event._def.title,
            renderMain: () => (
              <DetailedView
                event_id={value.event._def.publicId}
                onClose={closeDialog}
              />
            ),
          })
        }
        onSelect={value =>
          history.push("/new-event", { start: value.start, end: value.end })
        }
      />
      <AddEventButton />
    </div>
  );
};

export default Home;
