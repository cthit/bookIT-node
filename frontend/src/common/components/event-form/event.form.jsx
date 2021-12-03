import { useContext } from "react";
import {
  DigitForm,
  DigitLayout,
  DigitButton,
  useDigitToast,
  useDigitTranslations,
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
import PartyReport from "./party-report.component";
import UserContext from "../../contexts/user-context";
import ROOMS from "../../rooms";
import translations from "./event.form.translations.json";

const whenTrue = {
  is: true,
  then: yup.string().required(),
  otherwise: yup.string(),
};

const EventFrom = ({ onSubmit, initialValues }) => {
  const [openToast] = useDigitToast({
    duration: 3000,
    actionText: "Ok",
    actionHandler: () => {},
  });
  const [user] = useContext(UserContext);
  const [texts] = useDigitTranslations(translations);

  const validationSchema = yup.object().shape({
    title: yup.string().required(texts.title_required),
    phone: yup.string().required(texts.phone_required),
    room: yup.array().min(1, texts.room_required),
    description: yup.string(),
    start: yup.date().required(),
    end: yup.date().required(),
    isActivity: yup.bool().required(),
    permit: yup.bool(),
    responsible_name: yup.string().when("isActivity", whenTrue),
    responsible_number: yup.string().when("isActivity", whenTrue),
    responsible_email: yup.string().when("isActivity", whenTrue),
  });

  /*const initialValues = {
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
  };*/

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
          <Title label={texts.title} />
          <PhoneNumber
            name="phone"
            label={texts.phone}
            size={{ width: "20rem" }}
          />
          <Rooms label={texts.room} rooms={ROOMS} />
          <DigitLayout.Row>
            <TimeAndTimePicker name="start" label={texts.start} />
            <TimeAndTimePicker name="end" label={texts.end} />
          </DigitLayout.Row>
          <Description label={texts.description} />
          <BookAs label={texts.booked_as} groups={user.groups} />

          <PartyReport />
          {/*<a href="https://prit.chalmers.it/Bokningsvillkor.pdf">
            <DigitText.Subtitle text="*bokningsvillkoren" />
        </a>*/}
          <DigitButton raised submit text={texts.submit} />
        </DigitLayout.Column>
      )}
    />
  );
};

export default EventFrom;
