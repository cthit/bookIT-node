import {
  DigitDisplayData,
  DigitText,
  DigitButton,
  useDigitTranslations,
  useDigitToast,
} from "@cthit/react-digit-components";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { deleteEvent, getEvent } from "../../../api/backend.api";
import ROOMS from "../../../common/rooms";
import translations from "./detailed-view.translations.json";
import "./detailed-view.css";
import { formatDT } from "../../../utils/utils";
import { useContext } from "react";
import UserContext from "../../../common/contexts/user-context";

const DetailedView = ({ event_id, onClose, onDelete, user }) => {
  const history = useHistory();
  const [event, setEvent] = useState({});
  const [texts, activeLanguage] = useDigitTranslations(translations);
  const [openToast] = useDigitToast({
    duration: 3000,
    actionText: "Ok",
    actionHandler: () => {},
  });

  useEffect(() => {
    getEvent(event_id)
      .then(res =>
        setEvent({
          ...res,
          start: formatDT(Number(res.start)),
          end: formatDT(Number(res.end)),
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
    <>
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
      {user.groups.includes(event.booked_as) || user.is_admin ? (
        <div className="container">
          <DigitButton
            text="Edit"
            outlined
            onClick={() => {
              onClose();
              history.push(`/edit-event?id=${event_id}`);
            }}
          />
          <DigitButton
            text="Delete"
            outlined
            onClick={() => {
              deleteEvent(event_id).then(res => {
                onClose();
                if (res) {
                  openToast({
                    text: res[activeLanguage],
                  });
                } else {
                  openToast({
                    text: texts.event_deleted,
                  });
                  window.location.href = "/";
                }
              });
            }}
          />
        </div>
      ) : null}
    </>
  );
};

export default DetailedView;
