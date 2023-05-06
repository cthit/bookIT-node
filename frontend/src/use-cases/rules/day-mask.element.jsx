import { DigitCheckbox, DigitText } from "@cthit/react-digit-components";
import { useCallback } from "react";
import "./day-mask.style.css";

const dayArray = day_mask => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push({ value: day_mask % 2, id: i });
    day_mask >>= 1;
  }
  return days;
};

const DayMask = ({ day_mask }) => {
  const daysArr = useCallback(dayArray, [day_mask]);
  return (
    <div className="mask-container">
      {daysArr(day_mask).map(d => (
        <div
          key={d.id}
          className="day"
          style={{ background: d.value ? "#00B74A" : "#B71C1C " }}
        ></div>
      ))}
    </div>
  );
};

export const DayMaskInput = ({ value, onChange, label }) => {
  const daysArr = useCallback(dayArray, [value]);

  return (
    <div>
      <div className="mask-container" style={{ paddingLeft: "1.1rem" }}>
        {label.split(" ").map(letter => (
          <DigitText.Title className="day-input" text={letter} />
        ))}
      </div>
      <div className="mask-container">
        {daysArr(value).map((d, index) => (
          <div className="day-input" key={d.id}>
            <DigitCheckbox
              primary
              value={d.value}
              onChange={event => {
                const day = 1 << index;
                if (event.target.checked) {
                  onChange(value + day);
                } else {
                  onChange(value - day);
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayMask;
