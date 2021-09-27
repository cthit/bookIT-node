import { useHistory } from "react-router";
import { getEvents } from "../../api/backend.api";
import AddEventButton from "../../common/elements/add-event-button";
import Calendar from "./calendar.view";

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
      <Calendar
        getEvents={getEvents}
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
