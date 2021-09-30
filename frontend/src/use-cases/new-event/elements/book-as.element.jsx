import {
  DigitAutocompleteSelectSingle,
  useDigitFormField,
} from "@cthit/react-digit-components";

const BookAs = ({ groups }) => {
  const bookedAsValues = useDigitFormField("booked_as");
  return (
    <DigitAutocompleteSelectSingle
      {...bookedAsValues}
      upperLabel="Book as"
      options={groups.map(e => ({ text: e, value: e }))}
    />
  );
};

export default BookAs;
