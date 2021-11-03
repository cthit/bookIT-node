import {
  DigitDisplayData,
  DigitText,
  useDigitTranslations,
} from "@cthit/react-digit-components";
import { useEffect, useState } from "react";
import { getEvent } from "../../api/backend.api";
import ROOMS from "../../common/rooms";
import translations from "./detailed-view.translations.json";

const DetailedView = ({ event_id }) => {
  const [event, setEvent] = useState({});
  const [texts] = useDigitTranslations(translations);

  useEffect(() => {
    getEvent(event_id)
      .then(res =>
        setEvent({
          ...res,
          _booked_by: (
            <>
              <a href={"https://gamma.chalmers.it/users/" + res.booked_by}>
                {res.booked_by}
              </a>
              {" via "}
              <a
                href={"https://gamma.chalmers.it/super-groups/" + res.booked_as}
              >
                {res.booked_as}
              </a>
            </>
          ),
          room: res.room.map(r => (
            <DigitText.Text text={ROOMS.find(e => e.value === r).text} />
          )),
        }),
      )
      .catch(() => {});
  }, [event_id]);
  return (
    <DigitDisplayData
      data={event}
      keysText={{
        _booked_by: texts.bookedBy,
        description: texts.description,
        start: texts.start,
        end: texts.end,
        room: texts.rooms,
      }}
      keysOrder={["_booked_by", "description", "start", "end", "room"]}
    />
  );
};

export default DetailedView;
