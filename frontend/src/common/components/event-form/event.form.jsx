import translations from "./event.form.translations.json";
import { useTranslations } from "../../contexts/translations";
import * as yup from "yup";
import { TextField, Autocomplete, Button, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import AutocompleteSelectMultiple from "../autocomplete-select-multiple";
import ROOMS from "../../rooms";
import UserContext from "../../contexts/user";
import Checkbox from "../checkbox";

const useInput = (name, initalValues, schema, submitted) => {
  const [value, setValue] = useState(initalValues ? initalValues[name] : undefined);
  const [error, setError] = useState(undefined);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    schema
      .validateAt(name, { [name]: value }, { abortEarly: false })
      .then(() => setError(undefined))
      .catch(error => setError(error.inner[0].message));
  }, [value]);

  return {
    id: name,
    error: (touched || submitted) && error,
    helperText: (touched || submitted) && error,
    value: value,
    onChange: e => setValue(e.target.type === "checkbox" ? e.target.checked : e.target.value),
    onBlur: () => setTouched(true),
  };
};

const regexStrings = {
  // eslint-disable-next-line
  phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,5}$/im,
  // eslint-disable-next-line
  email: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
};

const EventForm = ({ initialValues }) => {
  const [texts] = useTranslations(translations);
  const [user] = useContext(UserContext);

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
    booked_as: yup.string().oneOf(user.groups),
    gdpr: yup.bool().isTrue().required(texts.gdpr_required),
    cubsec: yup.bool().isTrue().required(texts.cubsec_required),
  });

  const titleProps = useInput("title", initialValues, validationSchema);
  const phoneProps = useInput("phone", initialValues, validationSchema);
  const roomProps = useInput("room", initialValues, validationSchema);
  const descriptionProps = useInput("description", initialValues, validationSchema);
  const bookAsProps = useInput("booked_as", initialValues, validationSchema);
  const termsProps = useInput("booking_terms", initialValues, validationSchema);
  const gdprProps = useInput("gdpr", initialValues, validationSchema);
  const cubsecProps = useInput("cubsec", initialValues, validationSchema);

  return (
    <>
      <TextField label="Title" variant="standard" sx={{ width: "100%" }} {...titleProps} />
      <TextField label="Phone Number" variant="standard" sx={{ width: "100%" }} {...phoneProps} />
      <AutocompleteSelectMultiple
        size={{ width: "100%" }}
        upperLabel="Room"
        options={ROOMS}
        {...roomProps}
      />
      <TextField
        label="Description"
        variant="standard"
        sx={{ width: "100%" }}
        minRows={3}
        multiline
        {...descriptionProps}
      />
      <Autocomplete
        disablePortal
        options={user.groups}
        {...bookAsProps}
        renderInput={params => <TextField {...params} variant="standard" label="Book as" />}
      />
      <Checkbox
        label={
          <p>
            {texts.i_accept}
            <a
              href="https://docs.chalmers.it/bokningsvillkor.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              {texts.booking_terms}
            </a>
          </p>
        }
        {...termsProps}
      />
      <Checkbox
        label={
          <p>
            {texts.i_accept}
            <a href="#" rel="noopener noreferrer">
              {texts.gdpr_agreement}
            </a>
          </p>
        }
        {...gdprProps}
      />
      <Checkbox
        label={
          <p>
            {texts.cubsec_condition}
            <a
              href="https://www.chalmers.se/utbildning/studera-hos-oss/studentliv/arrangemang-i-sektionslokaler/formular-for-anmalan-av-arrangemang/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {texts.cubsec_notified}
            </a>
          </p>
        }
        {...cubsecProps}
      />
      <Button variant="contained" style={{ width: "100%" }}>
        <Typography variant="p">{texts.submit}</Typography>
      </Button>
    </>
  );
};

export default EventForm;
