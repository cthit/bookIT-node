import translations from "./event.form.translations.json";
import { useTranslations } from "../../contexts/translations";
import * as yup from "yup";
import { TextField } from "@mui/material";
import { useEffect, useState } from "react";

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
    onChange: e => setValue(e.target.value),
    onBlur: () => setTouched(true),
  };
};

const regexStrings = {
  // eslint-disable-next-line
  phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,5}$/im,
  // eslint-disable-next-line
  email: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
};

export const EventForm2 = ({ initialValues }) => {
  const [texts] = useTranslations(translations);

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

  const titleProps = useInput("title", initialValues, validationSchema);
  const phoneProps = useInput("phone", initialValues, validationSchema);

  return (
    <>
      <TextField label="Title" variant="standard" sx={{ width: "100%" }} {...titleProps} />
      <TextField label="Phone Number" variant="standard" sx={{ width: "100%" }} {...phoneProps} />
    </>
  );
};
