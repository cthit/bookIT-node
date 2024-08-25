import { IconButton } from "@mui/material";
import AddIcon from "@material-ui/icons/Add";
import { useHistory } from "react-router-dom";
import "./add-event-button.css";

const AddEventButton = () => {
  const history = useHistory();

  return (
    <div className="add-event-button">
      <IconButton onClick={() => history.push("/new-event")}>
        <AddIcon style={{ color: "white" }} />
      </IconButton>
    </div>
  );
};

export default AddEventButton;
