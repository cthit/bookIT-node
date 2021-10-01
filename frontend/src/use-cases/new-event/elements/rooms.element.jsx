import {
  DigitAutocompleteSelectMultiple,
  useDigitFormField,
} from "@cthit/react-digit-components";

const Rooms = ({ rooms, onChange }) => {
  const roomValues = useDigitFormField("room");
  return (
    <DigitAutocompleteSelectMultiple
      {...roomValues}
      upperLabel="Room"
      options={rooms}
      onChange={e => {
        onChange(e);
        roomValues.onChange(e);
      }}
    />
  );
};

export default Rooms;
