import { useEffect, useState } from "react";
// Hook
export default function useHeight() {
	const [windowHeight, setWindowHeight] = useState({
	  height: undefined,
	});

	useEffect(() => {
	  // Handler to call on window resize
	  function handleResize() {
		 // Set window width/height to state
		 setWindowHeight({
			height: window.innerHeight,
		 });
	  }

	  // Add event listener
	  window.addEventListener("resize", handleResize);

	  // Call handler right away so state gets updated with initial window size
	  handleResize();

	  // Remove event listener on cleanup
	  return () => window.removeEventListener("resize", handleResize);
	}, []); // Empty array ensures that effect is only run on mount

	return windowHeight;
 }