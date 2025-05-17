import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Building2,
  Trophy,
  Workflow
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [darkMode, setDarkMode] = useLocalStorage("darkMode", false);
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const checkIfAdmin = async () => {
      try {
        const { data, error } = await supabase.rpc("is_admin");
        if (error) throw error;
        setIsAdmin(data);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    if (user) {
      checkIfAdmin();
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsOpen(false);
  }, [location.pathname]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md shadow-sm"
          : location.pathname === "/"
          ? "bg-transparent"
          : "bg-background"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 md:h-20 px-4">
        <div className="flex items-center">
          <Link
            to="/"
            className="text-xl font-bold text-foreground flex items-center"
          >
            <Building2 className="h-6 w-6 mr-2 text-primary" />
            SportMatch
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-4">
          <Link
            to="/venues"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname.startsWith("/venues")
                ? "text-primary"
                : "text-foreground hover:text-primary transition-colors"
            }`}
          >
            Venues
          </Link>
          <Link
            to="/sports"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname.startsWith("/sports")
                ? "text-primary"
                : "text-foreground hover:text-primary transition-colors"
            }`}
          >
            Sports
          </Link>
          <Link
            to="/challenge"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname.startsWith("/challenge") || location.pathname.startsWith("/teams")
                ? "text-primary"
                : "text-foreground hover:text-primary transition-colors"
            }`}
          >
            <div className="flex items-center">
              <Workflow className="mr-1 h-4 w-4" />
              Challenge
            </div>
          </Link>
          <Link
            to="/tournaments"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname.startsWith("/tournament")
                ? "text-primary"
                : "text-foreground hover:text-primary transition-colors"
            }`}
          >
            <div className="flex items-center">
              <Trophy className="mr-1 h-4 w-4" />
              Tournaments
            </div>
          </Link>
        </nav>

        <div className="flex items-center space-x-2 md:space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="hidden md:inline-flex"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden md:inline-flex gap-2"
                >
                  <User className="h-4 w-4" />
                  {user?.email?.split("@")[0]}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/bookings" className="cursor-pointer">
                    My Bookings
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex space-x-2">
              <Button asChild variant="outline">
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
              <Button asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            className="md:hidden"
            size="icon"
            variant="ghost"
            onClick={toggleMenu}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden h-screen w-full bg-background">
          <div className="px-4 py-2">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/venues"
                className="px-3 py-4 border-b border-border text-lg font-medium flex justify-between items-center"
              >
                Venues
              </Link>
              <Link
                to="/sports"
                className="px-3 py-4 border-b border-border text-lg font-medium flex justify-between items-center"
              >
                Sports
              </Link>
              <Link
                to="/challenge"
                className="px-3 py-4 border-b border-border text-lg font-medium flex justify-between items-center"
              >
                <div className="flex items-center">
                  <Workflow className="mr-2 h-5 w-5" />
                  Challenge Mode
                </div>
              </Link>
              <Link
                to="/tournaments"
                className="px-3 py-4 border-b border-border text-lg font-medium flex justify-between items-center"
              >
                <div className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Tournaments
                </div>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="px-3 py-4 border-b border-border text-lg font-medium"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/bookings"
                    className="px-3 py-4 border-b border-border text-lg font-medium"
                  >
                    My Bookings
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-3 py-4 border-b border-border text-lg font-medium"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-4 border-b border-border text-lg font-medium text-left w-full flex items-center"
                  >
                    <LogOut className="mr-2 h-5 w-5" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-4 border-b border-border text-lg font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-4 border-b border-border text-lg font-medium"
                  >
                    Sign up
                  </Link>
                </>
              )}
              <div className="flex items-center justify-between px-3 py-4">
                <span className="text-lg font-medium">
                  {darkMode ? "Light" : "Dark"} Mode
                </span>
                <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                  {darkMode ? (
                    <Sun className="h-6 w-6" />
                  ) : (
                    <Moon className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
