import {
  DigitTextField,
  useDigitFormField,
} from "@cthit/react-digit-components";

const Title = ({ label }) => {
  const titleValues = useDigitFormField("title");
  return (
    <DigitTextField
      {...titleValues}
      size={{ width: "100%" }}
      upperLabel={label}
    />
  );
};

export default Title;
