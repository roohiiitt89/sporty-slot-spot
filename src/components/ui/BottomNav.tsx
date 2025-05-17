
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, Map, Dumbbell, Plus, Trophy } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const st = window.scrollY;
      if (st > lastScrollTop && st > 100) {
        // Scrolling down
        setVisible(false);
      } else {
        // Scrolling up
        setVisible(true);
      }
      setLastScrollTop(st);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollTop]);

  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 px-6 ${
        visible ? "translate-y-0" : "translate-y-full"
      } transition-transform duration-300 z-50`}
    >
      <div className="flex justify-around items-center">
        <Link
          to="/"
          className={`flex flex-col items-center ${
            location.pathname === "/"
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          to="/sports"
          className={`flex flex-col items-center ${
            location.pathname.includes("/sports")
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Dumbbell className="h-5 w-5" />
          <span className="text-xs mt-1">Sports</span>
        </Link>

        <Link
          to="/venues"
          className={`flex flex-col items-center ${
            location.pathname.includes("/venues")
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Map className="h-5 w-5" />
          <span className="text-xs mt-1">Venues</span>
        </Link>

        <Link
          to="/tournaments"
          className={`flex flex-col items-center ${
            location.pathname.includes("/tournament")
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Trophy className="h-5 w-5" />
          <span className="text-xs mt-1">Tournaments</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center ${
            location.pathname.includes("/profile")
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
