import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import ContactForm from '../components/ContactForm';
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
  const token = Cookies.get('authToken');
  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar />
      
      {/* Main Content with proper spacing */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        
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

            {/* Contact Form Component */}
            <ContactForm />
          </>
        )}
      </div>
    </div>
  );
};

export default Contact;