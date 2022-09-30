import { useContext, useEffect, useState } from "react";
import {
  DigitForm,
  DigitLayout,
  DigitLoading,
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
import propTypes from "prop-types";
import BookingTerms from "./elements/booking-terms.element";

const regexStrings = {
  // eslint-disable-next-line
  phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,5}$/im,
  // eslint-disable-next-line
  email: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
};

const whenTrue = {
  is: true,
  then: yup.string().required(),
  otherwise: yup.string(),
};

const whenTrueMatch = (regex, error) => {
  return {
    is: true,
    then: yup.string().matches(regex, error),
  };
};

const EventFrom = ({ onSubmit, initialValues }) => {
  const [openToast] = useDigitToast({
    duration: 3000,
    actionText: "Ok",
    actionHandler: () => {},
  });
  const [user] = useContext(UserContext);
  const [texts] = useDigitTranslations(translations);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(initialValues === null);
  }, [initialValues]);

  const validationSchema = yup.object().shape({
    title: yup.string().required(texts.title_required),
    phone: yup
      .string()
      .matches(regexStrings.phone, texts.phone_invalid)
      .required(texts.phone_required),
    room: yup.array().min(1, texts.room_required),
    description: yup.string(),
    start: yup.date().required(),
    end: yup.date().required(),
    isActivity: yup.bool().required(),
    permit: yup.bool(),
    responsible_name: yup.string().when("isActivity", whenTrue),
    responsible_number: yup
      .string()
      .when(
        "isActivity",
        whenTrueMatch(regexStrings.phone, texts.phone_invalid),
      )
      .when("isActivity", whenTrue),
    responsible_email: yup
      .string()
      .when(
        "isActivity",
        whenTrueMatch(regexStrings.email, texts.email_invalid),
      )
      .when("isActivity", whenTrue),
    booking_terms: yup.bool().required(texts.booking_terms_required),
    co_responsible_name: yup.string().when("useCoResponsible", whenTrue),
    co_responsible_number: yup
      .string()
      .when(
        "useCoResponsible",
        whenTrueMatch(regexStrings.phone, texts.phone_invalid),
      )
      .when("useCoResponsible", whenTrue),
    co_responsible_email: yup
      .string()
      .when(
        "useCoResponsible",
        whenTrueMatch(regexStrings.email, texts.email_invalid),
      )
      .when("useCoResponsible", whenTrue),
  });

  return (
    <>
      {loading ? (
        <DigitLoading size={80} />
      ) : (
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

              <PartyReport init={initialValues || {}} />
              {/*<a href="https://prit.chalmers.it/Bokningsvillkor.pdf">
            <DigitText.Subtitle text="*bokningsvillkoren" />
        </a>*/}

              <BookingTerms
                preLinkLabel={texts.pre_booking_terms}
                linkLabel={texts.booking_terms}
              />

              <DigitButton raised submit text={texts.submit} />
            </DigitLayout.Column>
          )}
        />
      )}
    </>
  );
};

EventFrom.propTypes = {
  initialValues: propTypes.shape({
    title: propTypes.string,
    phone: propTypes.string,
    room: propTypes.arrayOf(propTypes.string),
    start: propTypes.objectOf(Date),
    end: propTypes.objectOf(Date),
    description: propTypes.string,
    isActivity: propTypes.bool,
    permit: propTypes.bool,
    responsible_name: propTypes.string,
    responsible_number: propTypes.string,
    responsible_email: propTypes.string,
    useCoResponsible: propTypes.bool,
    co_responsible_name: propTypes.string,
    co_responsible_number: propTypes.string,
    co_responsible_email: propTypes.string,
    booked_as: propTypes.string,
  }),
};

export default EventFrom;
