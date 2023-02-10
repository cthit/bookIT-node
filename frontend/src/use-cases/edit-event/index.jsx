import { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { getFullEvent } from "../../api/backend.api";
import EventForm from "../../common/components/event-form";
import {
  DigitLayout,
  DigitDesign,
  useDigitToast,
  useDigitTranslations,
} from "@cthit/react-digit-components";
import { formatDT } from "../../utils/utils.js";
import { editEvent } from "../../api/backend.api";
import transitions from "./edit-event.translations.json";

const formatEvent = event => {
  return {
    ...event,
    start: new Date(Number(event.start)),
    end: new Date(Number(event.end)),
    booking_terms: true,
    gdpr: true,
  };
};

const EditEvent = () => {
  const history = useHistory();
  const [event, setEvent] = useState(null);
  const [id, setId] = useState(null);
  const [openToast] = useDigitToast({
    duration: 7000,
    actionText: "Ok",
    actionHandler: () => {},
  });
  const [texts, activeLanguage] = useDigitTranslations(transitions);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(window.location.search);
      let id = params.get("id");
      setId(id);
      setEvent(formatEvent(await getFullEvent(id)));
    };
    fetchData();
  }, []);

  const handleSubmit = async event_ => {
    const res = await editEvent({
      id: id,
      title: event_.title,
      phone: event_.phone,
      room: event_.room,
      start: formatDT(event_.start),
      end: formatDT(event_.end),
      description: event_.description,
      booked_as: event_.booked_as,
      booking_terms: event_.booking_terms,
    });
    if (res === null) {
      openToast({
        text: texts.event_edited,
      });
      history.push("/");
      return;
    }
    openToast({
      text: res[activeLanguage],
    });
  };

  return (
    <DigitLayout.Center>
      <DigitDesign.Card>
        <DigitDesign.CardBody>
          <DigitDesign.CardTitle text={texts.edit_event} />
          <EventForm initialValues={event} onSubmit={handleSubmit} />
        </DigitDesign.CardBody>
      </DigitDesign.Card>
    </DigitLayout.Center>
  );
};

export default EditEvent;
