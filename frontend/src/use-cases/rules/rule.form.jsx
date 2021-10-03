import {
  DigitTextField,
  DigitDatePicker,
  DigitTextArea,
  DigitTimePicker,
  DigitSwitch,
  DigitAutocompleteSelectMultiple,
} from "@cthit/react-digit-components";
import { DayMaskInput } from "./day-mask.element";
import ROOMS from "../../common/rooms";

export const ruleForm = texts => ({
  title: {
    component: DigitTextField,
    componentProps: {
      outlined: true,
      upperLabel: texts.title,
    },
  },
  priority: {
    component: DigitTextField,
    componentProps: {
      outlined: true,
      upperLabel: texts.priority,
    },
  },
  start_date: {
    component: DigitDatePicker,
    componentProps: {
      outlined: true,
      upperLabel: texts.start_date,
    },
  },
  end_date: {
    component: DigitDatePicker,
    componentProps: {
      outlined: true,
      upperLabel: texts.end_date,
    },
  },
  start_time: {
    component: DigitTimePicker,
    componentProps: {
      outlined: true,
      upperLabel: texts.start_time,
    },
  },
  end_time: {
    component: DigitTimePicker,
    componentProps: {
      outlined: true,
      upperLabel: texts.end_time,
    },
  },
  description: {
    component: DigitTextArea,
    componentProps: {
      outlined: true,
      upperLabel: texts.description,
      rows: 3,
    },
  },
  _room: {
    component: DigitAutocompleteSelectMultiple,
    componentProps: {
      options: ROOMS,
      upperLabel: texts._room,
    },
  },
  _day_mask: {
    component: DayMaskInput,
    componentProps: {
      label: texts._day_mask,
    },
  },
  _allow: {
    component: DigitSwitch,
    componentProps: {
      primary: true,
      label: texts._allow,
    },
  },
});
