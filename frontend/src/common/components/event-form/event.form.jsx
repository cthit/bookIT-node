import { useContext, useEffect, useState } from "react";
import {
  DigitForm,
  DigitLayout,
  DigitLoading,
  DigitButton,
  useDigitToast,
  useDigitTranslations,
  useDigitCustomDialog,
  DigitText,
} from "@cthit/react-digit-components";
import * as yup from "yup";
import {
  Title,
  TimeAndTimePicker,
  Description,
  Rooms,
  PhoneNumber,
  BookAs,
  GDPR,
  Cubsec,
} from "./elements";
import UserContext from "../../contexts/user";
import ROOMS from "../../rooms";
import translations from "./event.form.translations.json";
import propTypes from "prop-types";
import BookingTerms from "./elements/booking-terms.element";
import GDPRAgreement from "./gdpr-agreement";
import "./event.form.css";

const regexStrings = {
  // eslint-disable-next-line
  phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,5}$/im,
  // eslint-disable-next-line
  email: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
};

const EventFrom = ({ onSubmit, initialValues }) => {
  const [openToast] = useDigitToast({
    duration: 3000,
    actionText: "Ok",
    actionHandler: () => {},
  });
  const [user] = useContext(UserContext);
  const [texts, activeLanguage] = useDigitTranslations(translations);
  const [loading, setLoading] = useState(true);
  const [openDialog] = useDigitCustomDialog({
    title: texts.gdpr_agreement,
  });

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
    booking_terms: yup.bool().isTrue().required(texts.booking_terms_required),
    gdpr: yup.bool().isTrue().required(texts.gdpr_required),
    cubsec: yup.bool().isTrue().required(texts.cubsec_required),
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
            <DigitLayout.Column size={{ maxWidth: "100%" }}>
              {/*<DigitText.Text text={`Bokare: ${me ? me.cid : ""}`} />*/}
              <Title label={texts.title} size={{ width: "100%" }} />
              <PhoneNumber
                name="phone"
                label={texts.phone}
                size={{ width: "100%" }}
              />
              <Rooms label={texts.room} rooms={ROOMS} />
              <DigitLayout.Row flexWrap="wrap" display="flex">
                <TimeAndTimePicker name="start" label={texts.start} />
                <TimeAndTimePicker name="end" label={texts.end} />
              </DigitLayout.Row>
              <Description label={texts.description} />
              <BookAs label={texts.booked_as} groups={user.groups} />

              <BookingTerms
                preLinkLabel={texts.i_accept}
                linkLabel={texts.booking_terms}
              />

              <GDPR
                preLinkLabel={texts.i_accept}
                linkLabel={texts.gdpr_agreement}
                onLinkClick={() =>
                  openDialog({
                    renderMain: () => (
                      <div className="gdpr-text">
                        {GDPRAgreement[activeLanguage].split("\n").map(t => (
                          <div>
                            <DigitText.Text text={t} />
                            <br />
                          </div>
                        ))}
                      </div>
                    ),
                  })
                }
              />

              <Cubsec
                preLinkLabel={texts.cubsec_condition}
                linkLabel={texts.cubsec_notified}
              />

              <DigitButton
                raised
                submit
                size={{ maxWidth: "100%" }}
                text={texts.submit}
              />
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
    booked_as: propTypes.string,
  }),
};

export default EventFrom;
