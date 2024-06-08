import { useContext, useEffect } from "react";
import { useHistory } from "react-router";
import { exchangeCode } from "../../api/backend.api";
import UserContext from "../../common/contexts/user-context";
import { useDigitTranslations } from "@cthit/react-digit-components";

const Callback = () => {
  const history = useHistory();
  const [, setUser] = useContext(UserContext);
  const [, , setActiveLanguage] = useDigitTranslations({});
  useEffect(() => {
    const authenticateUser = async () => {
      const params = new URLSearchParams(window.location.search);
      const user = await exchangeCode(params.get("code"), params.get("state"));
      setActiveLanguage(user.language);
      setUser(user);
      history.push("/");
    };
    authenticateUser();
  }, [setUser, history, setActiveLanguage]);
  return null;
};

export default Callback;
