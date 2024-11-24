import { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { getFullEvent } from "../../api/backend.api";
import EventForm from "../../common/components/event-form";
import { DigitLayout, DigitDesign } from "@cthit/react-digit-components";
import { formatDT } from "../../utils/utils.js";
import { editEvent } from "../../api/backend.api";
import transitions from "./edit-event.translations.json";
import { EventForm2 } from "../../common/components/event-form/event.form2.jsx";
import { useTranslations } from "../../common/contexts/translations.jsx";
import Snackbar from "../../common/components/snackbar/index.jsx";

const formatEvent = event => {
  return {
    ...event,
    start: new Date(Number(event.start)),
    end: new Date(Number(event.end)),
    booking_terms: true,
    gdpr: true,
    cubsec: true,
  };
};

const EditEvent = () => {
  const history = useHistory();
  const [event, setEvent] = useState(null);
  const [id, setId] = useState(null);
  const [snackbar, setSnackbar] = useState(false);
  const [snackbarText, setSnackbarText] = useState("");
  const [texts, activeLanguage] = useTranslations(transitions);

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
      history.push("/");
      return;
    }
    setSnackbar(true);
    setSnackbarText(res[activeLanguage]);
  };

  return (
    <>
      <DigitLayout.Center>
        <DigitDesign.Card>
          <DigitDesign.CardBody>
            <DigitDesign.CardTitle text={texts.edit_event} />
            <EventForm initialValues={event} onSubmit={handleSubmit} />
            <EventForm2 initialValues={event} onSubmit={handleSubmit} />
          </DigitDesign.CardBody>
        </DigitDesign.Card>
      </DigitLayout.Center>
      <Snackbar
        open={snackbar}
        onClose={() => setSnackbar(false)}
        message={snackbarText}
        autoHideDuration={7000}
      />
    </>
  );
};

export default EditEvent;
