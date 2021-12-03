import { useState, useEffect } from "react";
//import { useHistory } from "react-router";
import { getFullEvent } from "../../api/backend.api";
import EventForm from "../../common/components/event-form";
import { DigitLayout, DigitDesign } from "@cthit/react-digit-components";

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

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(window.location.search);
      setEvent(formatEvent(await getFullEvent(params.get("id"))));
    };
    fetchData();
  }, []);

  useEffect(() => {
    console.log(event);
  }, [event]);

  const handleSubmit = event => {
    console.log(event);
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
