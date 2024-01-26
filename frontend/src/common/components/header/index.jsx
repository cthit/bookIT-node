import Tabs from "./tabs.component";
import { DigitHeader, DigitText } from "@cthit/react-digit-components";
import { Link } from "react-router-dom";

const Header = ({ children }) => {
  return (
    <DigitHeader
      title=""
      mainPadding="0"
      renderHeader={() => (
        <div style={{ width: "100%", flexDirection: "row", display: "flex", placeItems: "center"}}>
          <Link to="/" style={{ textDecoration: "none", color: "white" }}>
            <DigitText.Heading5 text="BookIT" />
          </Link>
          <div style={{marginLeft: "2em"}}>
            <Tabs/>
          </div>
        </div>
      )}
      renderMain={() => <>{children}</>}
    />
  );
};

export default Header;
