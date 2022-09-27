import {
  useDigitFormField as ff,
  DigitCheckbox,
  DigitTextField,
  DigitLayout,
  useDigitTranslations,
} from "@cthit/react-digit-components";
import translations from "./event.form.translations.json";

const PartyReport = ({ init }) => {
  const activityValues = ff("isActivity");
  const permitValues = ff("serving_permit");
  const repNameValues = ff("responsible_name");
  const repNumberValues = ff("responsible_number");
  const repEmailValues = ff("responsible_email");
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

          <DigitLayout.Column>
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
          </DigitLayout.Column>
        </>
      )}
    </>
  );
};

export default PartyReport;
