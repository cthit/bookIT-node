import NewReservationFrom from "./new-event.form";
import {
  DigitDesign,
  DigitLayout,
  useDigitToast,
  useDigitTranslations,
} from "@cthit/react-digit-components";
import { createEvent } from "../../api/backend.api";
import { useHistory } from "react-router";
import { formatDT } from "../../utils/utils";
import transitions from "./new-event.translations.json";

const NewReservation = ({
  history: {
    location: { state },
  },
}) => {
  const [openToast] = useDigitToast({
    duration: 3000,
    actionText: "Ok",
    actionHandler: () => {},
  });
  const history = useHistory();
  const handleSubmit = async event => {
    const res = await createEvent({
      title: event.title,
      phone: event.phone,
      room: event.room,
      start: formatDT(event.start),
      end: formatDT(event.end),
      description: event.description,
      booked_as: event.booked_as,
      party_report: !event.isActivity
        ? null
        : {
            responsible_name: event.responsible_name,
            responsible_number: event.responsible_number,
            responsible_email: event.responsible_email,
            serving_permit: event.permit,
          },
    });
    if (res === true) {
      openToast({
        text: "A new event was created",
      });
      history.push("/");
      return;
    }
    openToast({
      //TODO: Show description of broken rule
      text: "Failed to create event",
    });
  };

  const [texts] = useDigitTranslations(transitions);

  return (
    <DigitLayout.Center>
      <DigitDesign.Card>
        <DigitDesign.CardBody>
          <DigitDesign.CardTitle text={texts.new_booking} />
          <NewReservationFrom
            start={state ? state.start : null}
            end={state ? state.end : null}
            onSubmit={handleSubmit}
          />
        </DigitDesign.CardBody>
      </DigitDesign.Card>
    </DigitLayout.Center>
  );
};

export default NewReservation;
