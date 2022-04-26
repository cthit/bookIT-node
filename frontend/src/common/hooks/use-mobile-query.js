import { useEffect, useState } from "react";

export default function useMobileQuery() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = e => {
      setIsMobile(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    handleChange(mediaQuery);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  });

  return isMobile;
}
