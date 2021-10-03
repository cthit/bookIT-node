import {
  DigitAutocompleteSelectMultiple,
  useDigitFormField,
} from "@cthit/react-digit-components";

const Rooms = ({ rooms, label }) => {
  const roomValues = useDigitFormField("room");
  return (
    <DigitAutocompleteSelectMultiple
      {...roomValues}
      upperLabel={label}
      options={rooms}
    />
  );
};

export default Rooms;
