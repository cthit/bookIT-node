import translations from "./event.form.translations.json";
import { useTranslations } from "../../contexts/translations";

export const EventForm2 = () => {
  const [texts] = useTranslations(translations);
  return (
    <>
      <div>{texts.new_booking}</div>
    </>
  );
};
