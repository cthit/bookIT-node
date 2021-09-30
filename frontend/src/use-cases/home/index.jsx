import { useHistory } from "react-router";
import { getEvents } from "../../api/backend.api";
import AddEventButton from "../../common/elements/add-event-button";
import ROOMS from "../../common/rooms";
import Calendar from "./calendar.view";
import "./index.css";

const getCalendarEvents = async info => {
  const events = await getEvents(info.start, info.end);
  return events.map(e => {
    const room = ROOMS.find(r => r.value === e.room);
    return {
      ...e,
      color: room.color,
    };
  });
};

const Home = () => {
  const history = useHistory();
  return (
    <div
      style={{
        width: "100%",
        margin: "1rem",
        height: "40rem",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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
        eventClick={value => console.log(value)}
        onSelect={value =>
          history.push("/new-event", { start: value.start, end: value.end })
        }
      />
      <AddEventButton />
    </div>
  );
};

export default Home;
