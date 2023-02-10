import { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { DigitCRUD } from "@cthit/react-digit-components";
import UserContext from "../../common/contexts/user-context";
import "./index.css";
import { getAPIKeys } from "../../api/backend.api";

const APIKeys = () => {
  const [user] = useContext(UserContext);
  const history = useHistory();

  useEffect(() => {
    if (!user.is_admin) {
      history.push("/");
    }
  }, [user, history]);

  return (
    <div className="container">
      <DigitCRUD
        readAllRequest={getAPIKeys}
        createRequest={async event => {
          console.log(event);
        }}
        deleteRequest={async event => {
          console.log(event);
        }}
        keysOrder={["name", "description"]}
        keysText={{ name: "Name", description: "Description" }}
        idProp="id"
        path="/api-keys"
        detailsButtonText={"Hello"}
        readOneRequest={async () => await getAPIKeys()[0]}
      />
    </div>
  );
};

export default APIKeys;
