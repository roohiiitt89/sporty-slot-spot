import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTopOnMobile() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  return null;
} 
