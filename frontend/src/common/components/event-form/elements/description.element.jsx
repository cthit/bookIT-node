import {
  useDigitFormField,
  DigitTextArea,
} from "@cthit/react-digit-components";

const Description = ({ label }) => {
  const descriptionValues = useDigitFormField("description");
  return (
    <DigitTextArea
      size={{ width: "100%", maxWidth: "100%" }}
      rows={5}
      rowsMax={8}
      {...descriptionValues}
      upperLabel={label}
    />
  );
};

export default Description;
