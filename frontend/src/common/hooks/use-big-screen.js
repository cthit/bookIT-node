import { useEffect, useState } from "react";

export default function useBigSreenQuery() {
  const [isBigScreen, setIsBigScreen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-height: 1000px)");
    const handleChange = e => {
      setIsBigScreen(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    handleChange(mediaQuery);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  });

  return isBigScreen;
}
