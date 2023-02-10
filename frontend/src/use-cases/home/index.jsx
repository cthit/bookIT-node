import {
  useDigitCustomDialog,
  useDigitToast,
  useDigitTranslations,
} from "@cthit/react-digit-components";
import { useHistory } from "react-router";
import { editEvent, getEvents } from "../../api/backend.api";
import AddEventButton from "../../common/elements/add-event-button";
import ROOMS from "../../common/rooms";
import Calendar from "./views/calendar.view";
import DetailedView from "./views/detailed-view.view";
import "./index.css";
import useMobileQuery from "../../common/hooks/use-mobile-query";
import { getIllegalSlots } from "../../api/backend.api";
import { useContext, useCallback, useState } from "react";
import UserContext from "../../common/contexts/user-context";
import { overlap } from "../../utils/utils";
import transitions from "./home.translations.json";

const style = document.querySelector("#room-styles");

const getClassName = rooms => {
  let name = "event";
  if (rooms.length === 1) {
    name += "-" + rooms[0].toLowerCase() + "Alone";
  } else {
    for (const i in rooms) {
      name += "-" + rooms[i].toLowerCase();
    }
  }
  if (!style.innerHTML.includes(name)) {
    style.innerHTML += `.${name}{background: repeating-linear-gradient(45deg,`;
    let px = 0;
    for (const i in rooms) {
      style.innerHTML += `var(--bg_${rooms[i].toLowerCase()}) ${px}px ,`;
      px += 10;
      style.innerHTML += `var(--bg_${rooms[i].toLowerCase()}) ${px}px ,`;
    }
    style.innerHTML = `${style.innerHTML.slice(
      0,
      style.innerHTML.length - 1,
    )});}\n`;
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
  const history = useHistory();
  const [openDialog, closeDialog] = useDigitCustomDialog({
    title: "Event",
  });
  const isMobile = useMobileQuery();
  const [filters, setFilters] = useState(ROOMS.map(r => r.value));
  const [texts, activeLanguage] = useDigitTranslations(transitions);
  const [openToast] = useDigitToast({
    duration: 7000,
    actionText: "Ok",
    actionHandler: () => {},
  });

  const getCalendarEvents = async info => {
    const events = await getEvents(info.start, info.end);

    const illegalSlots = await getIllegalSlots(info.start, info.end);
    console.log(events.filter(r => r.title === "asdfa")[0]);

    return [
      ...events
        .filter(e => overlap(e.room, filters))
        .map(e => {
          return {
            ...e,
            className: getClassName(e.room.sort()),
            start: new Date(Number(e.start)),
            end: new Date(Number(e.end)),
            editable: user.groups.includes(e.booked_as) || user.is_admin,
            durationEditable: false,
            room: e.room.sort(),
          };
        }),
      ...illegalSlots.map(e => {
        return {
          backgroundColor: "#EF9A9A",
          start: new Date(Number(e.start)),
          end: new Date(Number(e.end)),
          display: "background",
          title: e.title + (e.description ? ` - ` + e.description : ""),
        };
      }),
    ];
  };

  const getCalendarEventsCallback = useCallback(getCalendarEvents, [
    filters,
    user,
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
        openToast({
          text: err[activeLanguage],
        });
      } else {
        openToast({
          text: texts.event_edited,
        });
      }
    });
  };

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
          <div
            key={r.text}
            className="chip"
            style={{
              backgroundColor: filters.includes(r.value) ? r.color : "gray",
            }}
            onClick={() => toggleChip(r.value)}
          >
            {r.text}
          </div>
        ))}
      </div>
      <Calendar
        getEvents={getCalendarEventsCallback}
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
        onEventDrop={onEventDrop}
      />
      <AddEventButton />
    </div>
  );
};

export default Home;
