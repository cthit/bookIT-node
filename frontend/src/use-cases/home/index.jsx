import { useNavigate } from "react-router-dom";
import { editEvent, getEvents } from "../../api/backend.api";
import AddEventButton from "../../common/elements/add-event-button";
import ROOMS from "../../common/rooms";
import Calendar from "./views/calendar.view";
import DetailedView from "./views/detailed-view.view";
import "./index.css";
import useMobileQuery from "../../common/hooks/use-mobile-query";
import { getIllegalSlots } from "../../api/backend.api";
import { useContext, useCallback, useState, useReducer } from "react";
import UserContext from "../../common/contexts/user";
import { overlap } from "../../utils/utils";
import translations from "./home.translations.json";
import { useTranslations } from "../../common/contexts/translations";
import { Dialog } from "@mui/material";
import { deleteEvent } from "../../api/backend.api";
import Snackbar from "../../common/components/snackbar";

const style = document.querySelector("#room-styles");

const getClassName = rooms => {
  let name = "event";
  for (const i in rooms) {
    name += "-" + rooms[i].toLowerCase();
  }
  name += rooms.length;
  if (!style.innerHTML.includes(name)) {
    style.innerHTML += `.${name}{background: repeating-linear-gradient(45deg,`;
    let px = 0;
    for (const i in rooms) {
      style.innerHTML += `var(--bg_${rooms[i].toLowerCase()}) ${px}px ,`;
      px += 25;
      style.innerHTML += `var(--bg_${rooms[i].toLowerCase()}) ${px}px ,`;
    }
    style.innerHTML = `${style.innerHTML.slice(0, style.innerHTML.length - 1)});}\n`;
  }
  return name;
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
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState({ title: null, id: null });
  const isMobile = useMobileQuery();
  const [filters, setFilters] = useState(ROOMS.map(r => r.value));
  const [texts, activeLanguage] = useTranslations(translations);
  const [snackBar, setSnackBar] = useState(false);
  const [snackBarText, setSnackBarText] = useState("");
  const [deleteCount, eventDeleted] = useReducer((state, _) => state + 1, 0);

  const getCalendarEvents = async info => {
    const events = await getEvents(info.start, info.end);

    const illegalSlots = await getIllegalSlots(info.start, info.end);
    console.log(events.filter(r => r.title === "asdfa")[0]);

    return [
      ...events
        .filter(e => overlap(e.room, filters))
        .map(e => ({
          ...e,
          className: getClassName(e.room.sort()),
          start: new Date(Number(e.start)),
          end: new Date(Number(e.end)),
          editable: user.groups.includes(e.booked_as) || user.is_admin,
          durationEditable: false,
          room: e.room.sort(),
        })),
      ...illegalSlots.map(e => ({
        backgroundColor: "#EF9A9A",
        start: new Date(Number(e.start)),
        end: new Date(Number(e.end)),
        display: "background",
        title: e.title + (e.description ? ` - ` + e.description : ""),
      })),
      {
        backgroundColor: "#AAAAAA",
        startRecur: new Date(new Date(Date.now() + 5443200000).toDateString()),
        display: "background",
        title: texts.out_of_range,
      },
    ];
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getCalendarEventsCallback = useCallback(getCalendarEvents, [
    texts,
    filters,
    user,
    deleteCount,
  ]);
  const toggleChip = room => {
    if (filters.includes(room)) {
      setFilters(filters.filter(f => f !== room));
    } else {
      setFilters([...filters, room]);
    }
  };

  const onEventDrop = ({ event, revert }) => {
    editEvent({
      id: event.id,
      start: event.start,
      end: event.end,
      //Required by backend
      title: event.title,
      room: event._def.extendedProps.room,
      phone: event._def.extendedProps.phone,
      booked_as: event._def.extendedProps.booked_as,
      booking_terms: true,
    }).then(err => {
      if (err) {
        revert();
        setSnackBar(true);
        setSnackBarText(err[activeLanguage]);
      }
    });
  };

  return (
    <div
      style={{
        width: "auto",
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
          <div
            className="chip"
            style={{
              backgroundColor: filters.includes(r.value) ? r.color : "gray",
            }}
            onClick={() => toggleChip(r.value)}
            key={r.text}
          >
            {r.text}
          </div>
        ))}
      </div>
      <Calendar
        getEvents={getCalendarEventsCallback}
        eventClick={value => {
          setSelectedEvent({
            title: value.event._def.title,
            id: value.event._def.publicId,
          });
          setDialogOpen(true);
        }}
        onSelect={value =>
          navigate("/new-event", { state: { start: value.start, end: value.end } })
        }
        onEventDrop={onEventDrop}
      />
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DetailedView
          title={selectedEvent.title}
          event_id={selectedEvent.id}
          onClose={() => setDialogOpen(false)}
          // This should not be needed, but context does not work in the detailed view
          user={user}
          onDelete={() => {
            deleteEvent(selectedEvent.id).then(async res => {
              setDialogOpen(false);
              if (res) {
                setSnackBar(true);
                setSnackBarText(res[activeLanguage]);
              } else {
                setSnackBar(true);
                setSnackBarText(texts.event_deleted);
                eventDeleted();
              }
            });
          }}
        />
      </Dialog>
      <AddEventButton />
      <Snackbar
        open={snackBar}
        autoHideDuration={3000}
        onClose={() => setSnackBar(false)}
        message={snackBarText}
      />
    </div>
  );
};

export default Home;
