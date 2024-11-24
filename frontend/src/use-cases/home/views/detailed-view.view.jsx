import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { getEvent } from "../../../api/backend.api";
import ROOMS from "../../../common/rooms";
import translations from "./detailed-view.translations.json";
import "./detailed-view.css";
import { formatDT } from "../../../utils/utils";
import { useTranslations } from "../../../common/contexts/translations";
import { Button, Typography } from "@mui/material";
const EVENT_KEYS = ["_booked_by", "description", "start", "end", "room"];

const DetailedView = ({ event_id, onClose, onDelete, user, title }) => {
  const history = useHistory();
  const [event, setEvent] = useState({});
  const [texts] = useTranslations(translations);
  useEffect(() => {
    getEvent(event_id)
      .then(res =>
        setEvent({
          ...res,
          start: formatDT(Number(res.start)),
          end: formatDT(Number(res.end)),
          _booked_by: (
            <>
              <a href={"https://gamma.chalmers.it/users/" + res.booked_by}>{res.booked_by}</a>
              {" via "}
              <a href={"https://gamma.chalmers.it/super-groups/" + res.booked_as}>
                {res.booked_as}
              </a>
            </>
          ),
          room: res.room.sort().map(r => ROOMS.find(e => e.value === r).text),
        }),
      )
      .catch(() => {});
  }, [event_id]);
  return (
    <div className="dialog">
      <Typography variant="h6">{title}</Typography>
      <table>
        <tbody>
          {event &&
            EVENT_KEYS.map(key => (
              <tr key={key}>
                <td>
                  <Typography sx={{ "font-weight": "bolder", "text-align": "end" }} variant="body1">
                    {texts[key]}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body1">{event[key]}</Typography>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {user.groups.includes(event.booked_as) || user.is_admin ? (
        <div className="container">
          <Button
            style={{ color: "black", borderColor: "black", marginRight: "1rem" }}
            variant="outlined"
            onClick={() => {
              onClose();
              history.push(`/edit-event?id=${event_id}`);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            style={{ color: "black", borderColor: "black" }}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default DetailedView;
