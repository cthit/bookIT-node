import { useState, useEffect } from "react";
//import { useHistory } from "react-router";
import { getFullEvent } from "../../api/backend.api";
import EventForm from "../../common/components/event-form";
import { DigitLayout, DigitDesign } from "@cthit/react-digit-components";
import { formatDT } from "../../utils/utils.js";
import { editEvent } from "../../api/backend.api";

const formatEvent = event => {
  return {
    ...event,
    ...event.party_report,
    isActivity: event.party_report !== null,
  };
};

const EditEvent = () => {
  // const history = useHistory();
  const [event, setEvent] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(window.location.search);
      let id = params.get("id");
      setId(id);
      setEvent(formatEvent(await getFullEvent(id)));
    };
    fetchData();
  }, []);

  useEffect(() => {
    console.log(event);
  }, [event]);

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
      party_report: !event_.isActivity
        ? null
        : {
            id: event.party_report.id,
            responsible_name: event_.responsible_name,
            responsible_number: event_.responsible_number,
            responsible_email: event_.responsible_email,
            serving_permit: event_.permit,
          },
    });
    console.log(res);
  };

  return (
    <DigitLayout.Center>
      <DigitDesign.Card>
        <DigitDesign.CardBody>
          <DigitDesign.CardTitle text={"Edit event"} />
          <EventForm initialValues={event} onSubmit={handleSubmit} />
        </DigitDesign.CardBody>
      </DigitDesign.Card>
    </DigitLayout.Center>
  );
};

export default EditEvent;
