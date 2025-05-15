import React, { useState } from 'react';
import { Mail, Phone, Send, ArrowLeft } from 'lucide-react';

const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would send the form data to your backend or email service
  };

  return (
    <div className="min-h-screen bg-navy-dark text-white py-16 px-4">
      <div className="max-w-2xl mx-auto bg-navy rounded-xl shadow-lg p-8">
        <button onClick={() => window.location.href = '/'} className="mb-6 flex items-center gap-2 text-indigo-light hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Mail className="w-8 h-8 text-indigo-light" /> Contact Us
        </h1>
        <p className="mb-6 text-gray-300 text-lg">
          Reach out to our support team for any questions or issues. We usually respond within 24 hours.
        </p>
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-gray-300">
            <Mail className="w-5 h-5 text-indigo-light" />
            <a href="mailto:support@grid2play.com" className="text-indigo-light underline">support@grid2play.com</a>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Phone className="w-5 h-5 text-indigo-light" />
            <a href="tel:+918448609110" className="text-indigo-light underline">+91 8448609110</a>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-2 rounded bg-navy-light text-white border border-indigo/30 focus:border-indigo outline-none" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required className="w-full px-4 py-2 rounded bg-navy-light text-white border border-indigo/30 focus:border-indigo outline-none" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
            <textarea id="message" name="message" value={form.message} onChange={handleChange} required rows={5} className="w-full px-4 py-2 rounded bg-navy-light text-white border border-indigo/30 focus:border-indigo outline-none" />
          </div>
          <button type="submit" className="flex items-center gap-2 bg-indigo px-6 py-2 rounded text-white font-semibold hover:bg-indigo-dark transition-colors">
            <Send className="w-5 h-5" /> Send Message
          </button>
        </form>
        {submitted && (
          <div className="mt-6 p-4 bg-green-900/80 rounded text-green-300 text-center">
            Thank you for contacting us! Our team will get back to you soon.
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact; 
