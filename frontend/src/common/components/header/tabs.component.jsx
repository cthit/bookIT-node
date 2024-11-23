import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import translations from "./tabs.translations.json";
import { useTranslations } from "../../contexts/translations";
import { Box, Tab, Tabs as MTabs } from "@mui/material";
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
  const [texts] = useTranslations(translations);

  useEffect(() => {
    const value = window.location.pathname.split("/")[1];
    if (!value) return;
    const tab = tabs.find(e => e.value === value);
    if (!tab) return;
    setActiveTab(value);
  }, []);

  return (
    <>
      <Box>
        <MTabs
          value={activeTab}
          onChange={(_, value) => {
            setActiveTab(value);
            history.push("/" + value);
          }}
          indicatorColor="secondary"
        >
          {tabs.map(e => (
            <Tab
              style={{
                color: "white",
                "&.Mui-selected": {
                  color: "white",
                },
              }}
              label={texts[e.text]}
              value={e.value}
              id={e.value}
            />
          ))}
        </MTabs>
      </Box>
    </>
  );
};

export default Tabs;
