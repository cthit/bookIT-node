import { useDigitCustomDialog } from "@cthit/react-digit-components";
import { useHistory } from "react-router";
import { getEvents } from "../../api/backend.api";
import AddEventButton from "../../common/elements/add-event-button";
import ROOMS from "../../common/rooms";
import Calendar from "./views/calendar.view";
import DetailedView from "./views/detailed-view.view";
import "./index.css";
import useMobileQuery from "../../common/hooks/use-mobile-query";
import { getIllegalSlots } from "../../api/backend.api";
import { useContext } from "react";
import UserContext from "../../common/contexts/user-context";

const style = document.querySelector("#room-styles");

const getClassName = rooms => {
  let name = "event";
  for (const i in rooms) {
    name += "-" + rooms[i].toLowerCase();
  }
  if (!(style.innerHTML.includes(name))) {
    style.innerHTML += `.${name}{background: repeating-linear-gradient(45deg,`;
    let px = 0;
    for (const i in rooms) {
      style.innerHTML += `var(--bg_${rooms[i].toLowerCase()}) ${px}px ,`;
      px += 10;
      style.innerHTML += `var(--bg_${rooms[i].toLowerCase()}) ${px}px ,`;
    }
    style.innerHTML = `${style.innerHTML.slice(0, style.innerHTML.length - 1)});}\n`;
  }
  return name;
};

const getCalendarEvents = async info => {
  const events = await getEvents(info.start, info.end);

  const illegalSlots = await getIllegalSlots(info.start, info.end);

  return [
    ...events.map(e => {
      return {
        ...e,
        className: getClassName(e.room.sort()),
        start: new Date(Number(e.start)),
        end: new Date(Number(e.end)),
      };
    }),
    ...illegalSlots.map(e => {
      return {
        backgroundColor: "#EF9A9A",
        start: new Date(Number(e.start)),
        end: new Date(Number(e.end)),
        display: "background",
      };
    }),
  ];
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
  const [user] = useContext(UserContext);
  const history = useHistory();
  const [openDialog, closeDialog] = useDigitCustomDialog({
    title: "Event",
  });
  const isMobile = useMobileQuery();

  return (
    <div
      style={{
        width: "100%",
        margin: `${isMobile ? "1rem 0" : "1rem"}`,
        height: "40rem",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        ...colorVariables,
      }}
    >
      <div
        style={{
          display: "flex",
          alignContent: "center",
          marginBottom: "0.25rem",
        }}
      >
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
                // This should not be needed, but context does not work in the detailed view
                user={user}
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
