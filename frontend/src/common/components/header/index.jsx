import Tabs from "./tabs.component";
import { Link } from "react-router-dom";
import { AppBar } from "@mui/material";
import { Typography } from "@mui/material";

const Header = ({ children }) => {
  return (
    <div>
      <AppBar
        position="static"
        style={{
          padding: "0.5rem 1rem 0.5rem 1rem",
        }}
      >
        <div
          style={{
            width: "100%",
            flexDirection: "row",
            display: "flex",
            placeItems: "center",
          }}
        >
          <Link to="/" style={{ textDecoration: "none", color: "white" }}>
            <Typography variant="h5">BookIT</Typography>
          </Link>
          <div style={{ marginLeft: "2em" }}>
            <Tabs />
          </div>
        </div>
      </AppBar>
      {children}
    </div>
  );
};

export default Header;
