import { DigitTabs } from "@cthit/react-digit-components";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useDigitTranslations } from "@cthit/react-digit-components";
import translations from "./tabs.translations.json";

const tabs = [
  {
    text: "Calendar",
    value: "",
  },
  {
    text: "Rules",
    value: "rules",
  },
];

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("");
  const history = useHistory();
  const [texts] = useDigitTranslations(translations);

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
      tabs={tabs.map(t => ({ ...t, text: texts[t.text] }))}
    />
  );
};

export default Tabs;
