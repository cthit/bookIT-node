import React, { useEffect, useState } from "react";
import { getUser } from "../../api/backend.api";
import { useDigitTranslations } from "@cthit/react-digit-components";

export const user_default = {
  cid: "",
  groups: [],
  is_admin: false,
  is_logged_in: false,
  locale: "en",
};

const UserContext = React.createContext([user_default, () => {}]);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(user_default);
  const [, , setActiveLanguage] = useDigitTranslations({});
  useEffect(() => {
    getUser()
      .then(res => {
        setActiveLanguage(res.locale);
        setUser(res);
      })
      .catch(error => {
        console.log(error);
      });
  }, [setActiveLanguage]);
  return (
    <UserContext.Provider value={[user, setUser]}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
