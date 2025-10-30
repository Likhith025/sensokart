import React, { useState } from 'react';
import API_BASE_URL from '../src';

const ContactForm = () => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [contactFormError, setContactFormError] = useState('');
  const [contactFormSuccess, setContactFormSuccess] = useState('');

  // Handle contact form input changes
  const handleContactFormChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  // Handle contact form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      setContactFormError('');
      setContactFormSuccess('');
      console.log('Submitting to:', `${API_BASE_URL}/contacts`, 'Payload:', contactForm);
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for contact submission:', text.slice(0, 100));
        throw new Error('Server returned an unexpected response');
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit contact form');
      }
      const data = await response.json();
      setContactFormSuccess(data.message || 'Your message has been sent successfully!');
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setContactFormSuccess(''), 3000);
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setContactFormError(err.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div className="mt-8 bg-white shadow-xl rounded-xl p-8 border border-gray-200 transition-shadow duration-300 hover:shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
      {contactFormError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {contactFormError}
        </div>
      )}
      {contactFormSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 transition-opacity duration-500">
          {contactFormSuccess}
        </div>
      )}
      <form onSubmit={handleContactSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={contactForm.name}
            onChange={handleContactFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="Your Name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={contactForm.email}
            onChange={handleContactFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="Your Email"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={contactForm.phone}
            onChange={handleContactFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="Your Phone (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            name="subject"
            value={contactForm.subject}
            onChange={handleContactFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="Subject"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            name="message"
            value={contactForm.message}
            onChange={handleContactFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-vertical"
            rows="6"
            placeholder="Your Message"
            required
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;