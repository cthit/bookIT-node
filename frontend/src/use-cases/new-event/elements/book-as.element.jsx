import {
  DigitAutocompleteSelectSingle,
  useDigitFormField,
} from "@cthit/react-digit-components";

const BookAs = ({ groups, label }) => {
  const bookedAsValues = useDigitFormField("booked_as");
  return (
    <DigitAutocompleteSelectSingle
      {...bookedAsValues}
      upperLabel={label}
      options={groups.map(e => ({ text: e, value: e }))}
    />
  );
};

export default BookAs;
