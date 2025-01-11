import { Checkbox as MuiCheckbox, FormControlLabel, FormHelperText } from "@mui/material";

const Checkbox = ({ value, onChange, error, helperText, children, ...props }) => {
  return (
    <>
      <FormControlLabel control={<MuiCheckbox value={value} onChange={onChange} />} {...props} />
      <FormHelperText style={{ color: error ? "red" : undefined }}>{helperText}</FormHelperText>
    </>
  );
};

export default Checkbox;
