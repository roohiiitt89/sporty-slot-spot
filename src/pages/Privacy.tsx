import React from 'react';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react';

const Privacy: React.FC = () => (
  <div className="min-h-screen bg-navy-dark text-white py-16 px-4">
    <div className="max-w-3xl mx-auto bg-navy rounded-xl shadow-lg p-8">
      <button onClick={() => window.location.href = '/'} className="mb-6 flex items-center gap-2 text-indigo-light hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Home
      </button>
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <ShieldCheck className="w-8 h-8 text-indigo-light" /> Privacy Policy
      </h1>
      <p className="mb-6 text-gray-300 text-lg">
        Your privacy is important to us. This policy explains what information we collect, how we use it, and your rights as a Grid2Play user.
      </p>
      <div className="space-y-6">
        <div className="bg-navy-light rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">What We Collect</h2>
          <ul className="list-disc ml-6 text-gray-300">
            <li>Account information (name, email, phone)</li>
            <li>Booking details (venues, times, preferences)</li>
            <li>Usage analytics (site activity, device/browser info)</li>
            <li>Support/chat messages</li>
          </ul>
        </div>
        <div className="bg-navy-light rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">How We Use Your Data</h2>
          <ul className="list-disc ml-6 text-gray-300">
            <li>To provide and manage your bookings and account</li>
            <li>To improve our services and personalize your experience</li>
            <li>To offer support and respond to your requests</li>
            <li>To send important updates (booking confirmations, changes, offers)</li>
          </ul>
        </div>
        <div className="bg-navy-light rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Your Rights</h2>
          <ul className="list-disc ml-6 text-gray-300">
            <li>Access or update your account information at any time</li>
            <li>Request deletion of your account and data</li>
            <li>Contact us for any privacy-related questions</li>
          </ul>
        </div>
        <div className="bg-navy-light rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Data Protection</h2>
          <p className="text-gray-300">We use industry-standard security measures to protect your data. Your information is never sold to third parties.</p>
        </div>
      </div>
      <div className="mt-8 text-center">
        <p className="text-gray-400 flex items-center justify-center gap-2">
          <Mail className="w-5 h-5 text-indigo-light" />
          Questions? Email <a href="mailto:support@grid2play.com" className="text-indigo-light underline">support@grid2play.com</a>
        </p>
      </div>
    </div>
  </div>
);

export default Privacy; 
