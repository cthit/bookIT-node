import { useState, useEffect, useContext } from "react";
import {
  DigitForm,
  DigitLayout,
  DigitButton,
  useDigitToast,
} from "@cthit/react-digit-components";
import * as yup from "yup";
import {
  Title,
  TimeAndTimePicker,
  Description,
  Rooms,
  PhoneNumber,
  BookAs,
} from "./elements";
import * as moment from "moment";
import PartyReport from "./party-report.component";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import UserContext from "../../common/contexts/user-context";
import ROOMS from "../../common/rooms";

const whenTrue = {
  is: true,
  then: yup.string().required(),
  otherwise: yup.string(),
};

const validationSchema = yup.object().shape({
  title: yup.string().required("You need to provide a title for the event"),
  phone: yup.string().required("You need to provide a phone number"),
  room: yup.array().min(1, "You need to select at least one room"),
  description: yup.string(),
  start: yup.date().required(),
  end: yup.date().required(),
  isActivity: yup.bool().required(),
  permit: yup.bool(),
  responsible_name: yup.string().when("isActivity", whenTrue),
  responsible_number: yup.string().when("isActivity", whenTrue),
  responsible_email: yup.string().when("isActivity", whenTrue),
});

const default_begin_date = new Date();
const default_end_date = moment(new Date()).add(1, "h").toDate();

const NewReservationFrom = ({ onSubmit, start, end }) => {
  const [openToast] = useDigitToast({
    duration: 3000,
    actionText: "Ok",
    actionHandler: () => {},
  });
  const [beginDate, setBeginDate] = useState(default_begin_date);
  const [endDate, setEndDate] = useState(default_end_date);
  const [room, setRoom] = useState(null);
  const [validTime, setValidTime] = useState(false);
  const [user] = useContext(UserContext);

  useEffect(() => {
    if (!room) return;
    setValidTime(endDate > beginDate);
  }, [endDate, beginDate, room]);

  const initialValues = {
    title: "",
    phone: "",
    room: ["BIG_HUB"],
    start: start ?? default_begin_date,
    end: end ?? default_end_date,
    description: "",
    isActivity: false,
    permit: false,
    responsible_name: "",
    responsible_number: "",
    responsible_email: "",
    booked_as: "",
  };

  return (
    <DigitForm
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={values => {
        validationSchema
          .validate(values)
          .then(() => onSubmit(values))
          .catch(err =>
            openToast({
              text: err.message,
            }),
          );
      }}
      render={() => (
        <DigitLayout.Column>
          {/*<DigitText.Text text={`Bokare: ${me ? me.cid : ""}`} />*/}
          <Title />
          <PhoneNumber
            name="phone"
            label="Phone number"
            size={{ width: "20rem" }}
          />
          <Rooms rooms={ROOMS} onChange={e => setRoom(e.target.value)} />
          <DigitLayout.Row>
            <TimeAndTimePicker
              name="start"
              label="Startdatum"
              onChange={e => setBeginDate(e.target.value)}
            />
            <TimeAndTimePicker
              name="end"
              label="Slutdatum"
              onChange={e => setEndDate(e.target.value)}
            />
            {!room ? null : validTime ? (
              <CheckCircleIcon style={{ color: "green" }} />
            ) : (
              <CancelIcon style={{ color: "red" }} />
            )}
          </DigitLayout.Row>
          <Description />
          <BookAs groups={user.groups} />

          <PartyReport />
          {/*<a href="https://prit.chalmers.it/Bokningsvillkor.pdf">
            <DigitText.Subtitle text="*bokningsvillkoren" />
        </a>*/}
          <DigitButton raised submit text="Submit" />
        </DigitLayout.Column>
      )}
    />
  );
};

export default NewReservationFrom;
