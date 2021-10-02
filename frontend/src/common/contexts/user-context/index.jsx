import React, { useEffect, useState } from "react";
import { getUser } from "../../../api/backend.api";
import { useDigitTranslations } from "@cthit/react-digit-components";

export const user_default = {
  cid: "",
  groups: [],
  is_admin: false,
  is_logged_in: false,
  language: "en",
};

const UserContext = React.createContext([user_default, () => {}]);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(user_default);
  const [, , setActiveLanguage] = useDigitTranslations({});
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/auth/callback" || path.match(/\/api.*/)) {
      return;
    }

    getUser()
      .then(res => {
        setActiveLanguage(res.language);
        setUser(res);
      })
      .catch(() => {
        window.location = "/api/login";
      });
  }, [setActiveLanguage]);
  return (
    <UserContext.Provider value={[user, setUser]}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
