import { DigitDesign, DigitLayout } from "@cthit/react-digit-components";
import { createEvent } from "../../api/backend.api";
import { useHistory } from "react-router";
import { formatDT } from "../../utils/utils";
import transitions from "./new-event.translations.json";
import EventForm from "../../common/components/event-form";
import moment from "moment";
import { useTranslations } from "../../common/contexts/translations";
import Snackbar from "../../common/components/snackbar";
import { useState } from "react";

const NewReservation = ({
  history: {
    location: { state },
  },
}) => {
  const [snackbar, setSnackbar] = useState(false);
  const [snackbarText, setSnackbarText] = useState("");
  const history = useHistory();
  const [texts, activeLanguage] = useTranslations(transitions);

  const handleSubmit = async event => {
    const res = await createEvent({
      title: event.title,
      phone: event.phone,
      room: event.room,
      start: formatDT(event.start),
      end: formatDT(event.end),
      description: event.description,
      booked_as: event.booked_as,
      booking_terms: event.booking_terms,
    });
    if (res === null) {
      history.push("/");
      return;
    }
    setSnackbar(true);
    setSnackbarText(res[activeLanguage]);
  };

  const default_begin_date = new Date();
  const default_end_date = moment(new Date()).add(1, "h");

  const initialValues = {
    title: "",
    phone: "",
    room: ["BIG_HUB"],
    start: state ? state.start : default_begin_date,
    end: state ? state.end : default_end_date,
    description: "",
    booked_as: "",
  };

  return (
    <>
      <DigitLayout.Center>
        <DigitDesign.Card>
          <DigitDesign.CardBody>
            <DigitDesign.CardTitle text={texts.new_booking} />
            <EventForm initialValues={initialValues} onSubmit={handleSubmit} />
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

export default NewReservation;
