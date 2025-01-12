import { IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import "./add-event-button.css";

const AddEventButton = () => {
  const navigate = useNavigate();

  return (
    <div className="add-event-button">
      <IconButton onClick={() => navigate("/new-event")}>
        <AddIcon style={{ color: "white" }} />
      </IconButton>
    </div>
  );
};

export default AddEventButton;
