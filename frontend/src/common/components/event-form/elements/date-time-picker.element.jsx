import {
  useDigitFormField,
  DigitDateAndTimePicker,
} from "@cthit/react-digit-components";
import { string } from "prop-types";
import { useEffect } from "react";
import moment from "moment";
import "moment/locale/sv";

const TimeAndTimePicker = ({ name, label }) => {
  const timeValues = useDigitFormField(name);
  useEffect(() => {
    moment.locale("sv", { week: { dow: 0 } });
  }, []);
  return <DigitDateAndTimePicker {...timeValues} upperLabel={label} />;
};

TimeAndTimePicker.propTypes = {
  name: string.isRequired,
  label: string,
};

export default TimeAndTimePicker;
