
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo & About */}
          <div>
            <Link to="/" className="flex items-center mb-4">
              <span className="text-2xl font-bold text-emerald-500">SportySlot</span>
            </Link>
            <p className="text-gray-300 mb-4">
              The best platform to book sports venues and connect with other athletes in your area.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-emerald-500">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-emerald-500">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-emerald-500">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-500">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/venues" className="text-gray-300 hover:text-white">Venues</Link>
              </li>
              <li>
                <Link to="/sports" className="text-gray-300 hover:text-white">Sports</Link>
              </li>
              <li>
                <Link to="/challenge" className="text-gray-300 hover:text-white">Challenge Mode</Link>
              </li>
              <li>
                <Link to="/bookings" className="text-gray-300 hover:text-white">My Bookings</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-500">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">Help Center</Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">Contact Us</Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">FAQ</Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">Terms & Conditions</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-500">Newsletter</h3>
            <p className="text-gray-300 mb-4">
              Subscribe to our newsletter for the latest updates on venues and events.
            </p>
            <div className="flex space-x-0">
              <input 
                type="email"
                placeholder="Your email"
                className="bg-gray-800 text-white px-4 py-2 rounded-l focus:outline-none"
              />
              <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-l-none">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} SportySlot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
