import { DigitTabs } from "@cthit/react-digit-components";
import { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useDigitTranslations } from "@cthit/react-digit-components";
import translations from "./tabs.translations.json";
import UserContext from "../../contexts/user-context";

const tabs = [
  {
    id: "calendar",
    value: "",
  },
  {
    id: "rules",
    value: "rules",
  },
  {
    id: "api-keys",
    value: "api-keys",
    require_admin_access: true,
  },
];

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("");
  const history = useHistory();
  const [texts] = useDigitTranslations(translations);
  const [user] = useContext(UserContext);

  useEffect(() => {
    const value = window.location.pathname.split("/")[1];
    if (!value) return;
    const tab = tabs.find(e => e.value === value);
    if (!tab) return;
    setActiveTab(value);
  }, []);

  return (
    <DigitTabs
      onChange={value => {
        setActiveTab(value);
        history.push("/" + value);
      }}
      centered
      selected={activeTab}
      fullwidth
      tabs={tabs
        .filter(t => (t.require_admin_access ? user.is_admin : true))
        .map(t => ({ ...t, text: texts[t.id] }))}
    />
  );
};

export default Tabs;
