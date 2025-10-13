import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

const Contact = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalContent, setOriginalContent] = useState({ content: '', metaTitle: '', metaDescription: '' });
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [contactFormError, setContactFormError] = useState('');
  const [contactFormSuccess, setContactFormSuccess] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const token = Cookies.get('authToken');
  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';

  // Debug imports
  useEffect(() => {
    console.log('Contact.jsx: Topbar:', typeof Topbar, Topbar);
    console.log('Contact.jsx: API_BASE_URL:', API_BASE_URL);
  }, []);

  // Fetch contact page content
  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching page:', `${API_BASE_URL}/page/slug/contact`);
        const response = await fetch(`${API_BASE_URL}/page/slug/contact`);
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response for page:', text.slice(0, 100));
          throw new Error('Invalid response from server');
        }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch page');
        }
        const fetchedContent = data.content || '';
        const fetchedMetaTitle = data.metaTitle || '';
        const fetchedMetaDescription = data.metaDescription || '';
        setContent(fetchedContent);
        setOriginalContent({ content: fetchedContent, metaTitle: fetchedMetaTitle, metaDescription: fetchedMetaDescription });
        setMetaTitle(fetchedMetaTitle);
        setMetaDescription(fetchedMetaDescription);
      } catch (err) {
        console.error('Error fetching page:', err);
        setContent('');
        setOriginalContent({ content: '', metaTitle: '', metaDescription: '' });
        setMetaTitle('');
        setMetaDescription('');
        setError(err.message || 'Page content not found. Admins can create it using the edit mode.');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  // Fetch contacts for admin
  useEffect(() => {
    if (userRole === 'admin') {
      if (!token) {
        setError('Please log in as an admin to view contacts.');
        return;
      }
      const fetchContacts = async () => {
        try {
          console.log('Fetching contacts:', `${API_BASE_URL}/contacts`);
          const response = await fetch(`${API_BASE_URL}/contacts`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response for contacts:', text.slice(0, 100));
            throw new Error('Invalid response from server');
          }
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch contacts');
          }
          const data = await response.json();
          setContacts(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Error fetching contacts:', err);
          setError(err.message || 'Failed to load contacts.');
        }
      };
      fetchContacts();
    }
  }, [userRole, token]);

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

  // Handle page content save
  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      console.log('Saving page:', `${API_BASE_URL}/page/upsert`);
      const response = await fetch(`${API_BASE_URL}/page/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Contact',
          content,
          metaTitle,
          metaDescription,
        }),
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for page save:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save page');
      }
      setOriginalContent({ content, metaTitle, metaDescription });
      setIsEditMode(false);
      setSuccess(data.message || 'Page saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving page:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle edit mode
  const handleEditToggle = () => {
    if (!isEditMode) {
      setIsEditMode(true);
      setSuccess('');
      setError('');
    } else {
      setContent(originalContent.content);
      setMetaTitle(originalContent.metaTitle);
      setMetaDescription(originalContent.metaDescription);
      setIsEditMode(false);
      setSuccess('');
      setError('');
    }
  };

  // Fetch single contact by ID
  const handleViewContact = async (contactId) => {
    try {
      setError('');
      console.log('Fetching contact:', `${API_BASE_URL}/contacts/${contactId}`);
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for contact:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contact details');
      }
      const data = await response.json();
      setSelectedContact(data);
    } catch (err) {
      console.error('Error fetching contact:', err);
      setError(err.message || 'Failed to load contact details.');
    }
  };

  // Update contact status
  const handleUpdateStatus = async (contactId, status) => {
    try {
      setError('');
      console.log('Updating status:', `${API_BASE_URL}/contacts/${contactId}/status`, 'Status:', status);
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for status update:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contact status');
      }
      setContacts(contacts.map((c) => (c._id === contactId ? { ...c, status } : c)));
      setSelectedContact(null);
      setSuccess('Contact status updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating contact status:', err);
      setError(err.message || 'Failed to update status.');
    }
  };

  // Delete contact
  const handleDeleteContact = async (contactId) => {
    try {
      setError('');
      console.log('Deleting contact:', `${API_BASE_URL}/contacts/${contactId}`);
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for delete:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete contact');
      }
      setContacts(contacts.filter((c) => c._id !== contactId));
      setSelectedContact(null);
      setSuccess('Contact deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(err.message || 'Failed to delete contact.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl tracking-tight">
            Contact Us
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
            Reach out to us with your questions or feedback.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center transition-opacity duration-500">
            {success}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="ml-4 text-lg text-gray-600">Loading content...</p>
          </div>
        ) : (
          <>
            {/* Admin Controls */}
            {userRole === 'admin' && (
              <div className="flex justify-center space-x-4 mb-8">
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`px-6 py-3 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 cursor-pointer ${saving ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg hover:scale-105'}`}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="px-6 py-3 bg-gray-500 text-white font-medium rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                  >
                    Edit Content
                  </button>
                )}
              </div>
            )}

            {/* Content Card */}
            <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-200 transition-shadow duration-300 hover:shadow-2xl">
              {isEditMode && userRole === 'admin' ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-2">Page Content</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-vertical"
                      rows="20"
                      placeholder="Enter the contact page content here..."
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-2">Meta Title</label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      placeholder="Enter meta title..."
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-2">Meta Description</label>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-vertical"
                      rows="4"
                      placeholder="Enter meta description..."
                    />
                  </div>
                </div>
              ) : (
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                  {content ? (
                    <pre className="whitespace-pre-wrap font-sans">{content}</pre>
                  ) : (
                    <p className="text-gray-500 italic">No content available for this page.</p>
                  )}
                </div>
              )}
            </div>

            {/* Contact Form for Users */}
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

            {/* Admin Contact Management */}
            {userRole === 'admin' && (
              <div className="mt-8 bg-white shadow-xl rounded-xl p-8 border border-gray-200 transition-shadow duration-300 hover:shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Submissions</h2>
                {contacts.length === 0 ? (
                  <p className="text-gray-500 italic">No contact submissions found.</p>
                ) : (
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div
                        key={contact._id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{contact.subject}</p>
                            <p className="text-sm text-gray-600">From: {contact.name} ({contact.email})</p>
                            {contact.phone && <p className="text-sm text-gray-600">Phone: {contact.phone}</p>}
                            <p className="text-sm text-gray-600">Status: {contact.status || 'Pending'}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewContact(contact._id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact._id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedContact && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Details</h3>
                    <p><strong>Name:</strong> {selectedContact.name}</p>
                    <p><strong>Email:</strong> {selectedContact.email}</p>
                    {selectedContact.phone && <p><strong>Phone:</strong> {selectedContact.phone}</p>}
                    <p><strong>Subject:</strong> {selectedContact.subject}</p>
                    <p><strong>Message:</strong> {selectedContact.message}</p>
                    <p><strong>Status:</strong> {selectedContact.status || 'Pending'}</p>
                    {selectedContact.notes && <p><strong>Notes:</strong> {selectedContact.notes}</p>}
                    <p><strong>Submitted:</strong> {new Date(selectedContact.createdAt).toLocaleString()}</p>
                    <div className="mt-4 flex space-x-4">
                      <select
                        value={selectedContact.status || 'Pending'}
                        onChange={(e) => handleUpdateStatus(selectedContact._id, e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                      <button
                        onClick={() => setSelectedContact(null)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Contact;
