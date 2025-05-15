import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, MessageSquare, Mail, Phone } from 'lucide-react';

const Help: React.FC = () => (
  <div className="min-h-screen bg-navy-dark text-white py-16 px-4">
    <div className="max-w-3xl mx-auto bg-navy rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <HelpCircle className="w-8 h-8 text-indigo-light" /> Help Center
      </h1>
      <p className="mb-6 text-gray-300 text-lg">
        Welcome to the Grid2Play Help Center. Here you can find answers to common questions, get support for bookings, payments, and account issues, and connect with our team.
      </p>
      <div className="space-y-6">
        <div className="bg-navy-light rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions</h2>
          <p className="mb-2 text-gray-300">Find quick answers in our <Link to="/faq" className="text-indigo-light underline">FAQ section</Link>.</p>
        </div>
        <div className="bg-navy-light rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-light" /> Live Chat Support</h2>
          <p className="mb-2 text-gray-300">Use the chat widget at the bottom right for instant help from our support team.</p>
        </div>
        <div className="bg-navy-light rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-light" /> Email & Phone</h2>
          <p className="mb-2 text-gray-300">Email: <a href="mailto:support@grid2play.com" className="text-indigo-light underline">support@grid2play.com</a></p>
          <p className="mb-2 text-gray-300">Phone: <a href="tel:+918448609110" className="text-indigo-light underline">+91 8448609110</a></p>
        </div>
      </div>
      <div className="mt-8 text-center">
        <p className="text-gray-400">Need more help? <Link to="/contact" className="text-indigo-light underline">Contact us</Link> and our team will get back to you soon.</p>
      </div>
    </div>
  </div>
);

export default Help; 
