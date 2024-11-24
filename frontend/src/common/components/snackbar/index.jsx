import { Card, Typography, IconButton, Snackbar as MuiSnackbar } from "@mui/material";
import CloseIcon from "@material-ui/icons/Close";

const Snackbar = ({ message, onClose, ...props }) => {
  return (
    <MuiSnackbar {...props} onClose={onClose}>
      <Card
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "0 1rem 0 1rem",
          flexDirection: "row",
          backgroundColor: "#313131",
          color: "white",
        }}
      >
        <Typography>{message}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon color="secondary" />
        </IconButton>
      </Card>
    </MuiSnackbar>
  );
};

export default Snackbar;
