import { useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { exchangeCode } from "../../api/backend.api";
import UserContext from "../../common/contexts/user";
import { useTranslations } from "../../common/contexts/translations";

const Callback = () => {
  const navigate = useNavigate();
  const [, setUser] = useContext(UserContext);
  const [, , setActiveLanguage] = useTranslations({});
  useEffect(() => {
    const authenticateUser = async () => {
      const params = new URLSearchParams(window.location.search);
      const user = await exchangeCode(params.get("code"), params.get("state"));
      setActiveLanguage(user.language);
      setUser(user);
      navigate("/");
    };
    authenticateUser();
  }, [setUser, navigate, setActiveLanguage]);
  return null;
};

export default Callback;
