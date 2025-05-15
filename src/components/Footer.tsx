
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-dark text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Grid2Play</h3>
            <p className="text-gray-300 mb-4">
              Book sport venues easily and efficiently. Find the perfect place for your next game.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" className="hover:text-indigo-light" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" className="hover:text-indigo-light" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://instagram.com" className="hover:text-indigo-light" aria-label="Instagram">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-indigo-light">Home</Link>
              </li>
              <li>
                <Link to="/venues" className="text-gray-300 hover:text-indigo-light">Venues</Link>
              </li>
              <li>
                <Link to="/sports" className="text-gray-300 hover:text-indigo-light">Sports</Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-indigo-light">Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-gray-300 hover:text-indigo-light">Help Center</Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-indigo-light">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-indigo-light">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-indigo-light">FAQs</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Mail size={16} className="text-indigo-light" />
                <span className="text-gray-300">contact@grid2play.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={16} className="text-indigo-light" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin size={16} className="text-indigo-light mt-1 flex-shrink-0" />
                <span className="text-gray-300">123 Sports Avenue, Venue City, VC 12345</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Grid2Play. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
