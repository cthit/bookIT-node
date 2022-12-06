import FullCallendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import momentPlugin from "@fullcalendar/moment";
import svLocale from "@fullcalendar/core/locales/sv";
import enLocale from "@fullcalendar/core/locales/en-gb";
import { useDigitTranslations } from "@cthit/react-digit-components";
import "./calendar-view.css";

const Calendar = ({ getEvents, eventClick, onSelect, onEventDrop, ref }) => {
  getEvents = getEvents ?? (() => new Promise(res => res([])));
  eventClick = eventClick ?? (() => {});
  onSelect = onSelect ?? (() => {});

  const [, activeLanguage] = useDigitTranslations({});

  return (
    <FullCallendar
      locales={[enLocale, svLocale]}
      locale={activeLanguage}
      select={onSelect}
      selectable
      firstDay={1}
      eventClick={eventClick}
      eventTimeFormat={{
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }}
      slotLabelFormat={{
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }}
      dayHeaderFormat={"ddd DD/MM"}
      rerenderDelay={1000}
      allDaySlot
      weekNumbers
      editable
      headerToolbar={{
        start: "title",
        center: "",
        end: "dayGridMonth,listWeek,timeGridWeek,today,prev,next",
      }}
      plugins={[
        momentPlugin,
        interactionPlugin,
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
      ]}
      initialView={window.innerWidth > 600 ? "timeGridWeek" : "timeGridDay"}
      eventOverlap
      height={window.innerWidth > 600 ? "100%" : "auto"}
      scrollTime={"17:00:00"}
      scrollTimeReset={false}
      events={getEvents}
      eventDrop={onEventDrop}
    />
  );
};

export default Calendar;
