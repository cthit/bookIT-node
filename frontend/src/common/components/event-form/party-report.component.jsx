import {
  useDigitFormField as formField,
  DigitCheckbox,
  DigitTextField,
  DigitLayout,
  useDigitTranslations,
} from "@cthit/react-digit-components";
import translations from "./event.form.translations.json";

const PartyReport = () => {
  const activityValues = formField("isActivity");
  const permitValues = formField("permit");
  const repNameValues = formField("responsible_name");
  const repNumberValues = formField("responsible_number");
  const repEmailValues = formField("responsible_email");
  const [texts] = useDigitTranslations(translations);

  return (
    <>
      <DigitCheckbox
        {...activityValues}
        label={texts.isActivity}
        size={{ width: "100%" }}
      />
      {activityValues.value && (
        <>
          <DigitCheckbox {...permitValues} label={texts.permit} />

          <DigitLayout.Row>
            <DigitTextField
              {...repNameValues}
              upperLabel={texts.responsible_name}
            />
            <DigitTextField
              {...repNumberValues}
              upperLabel={texts.responsible_number}
            />
            <DigitTextField
              {...repEmailValues}
              upperLabel={texts.responsible_email}
            />
          </DigitLayout.Row>
        </>
      )}
    </>
  );
};

export default PartyReport;
