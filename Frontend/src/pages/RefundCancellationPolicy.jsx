import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

const RefundCancellationPolicy = () => {
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

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError('');
        // Use the exact slug from your API response
        const response = await fetch(`${API_BASE_URL}/page/slug/refund-&-cancellation-policy`);
        if (response.headers.get('content-type')?.includes('application/json')) {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch page');
          }
          const fetchedContent = data.content || '';
          const fetchedMetaTitle = data.metaTitle || '';
          const fetchedMetaDescription = data.metaDescription || '';
          setContent(fetchedContent);
          setOriginalContent({ 
            content: fetchedContent, 
            metaTitle: fetchedMetaTitle, 
            metaDescription: fetchedMetaDescription 
          });
          setMetaTitle(fetchedMetaTitle);
          setMetaDescription(fetchedMetaDescription);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        // Set default content if API fails
        const defaultContent = `Refund & Cancellation Policy:

• Cancel orders within 24 hours of confirmation.
• Refunds are processed within 7–10 business days.
• Returns accepted only for defective or wrong items.
• Customized or special orders cannot be cancelled once production begins.
• Shipping charges are non-refundable for returns due to customer preference changes.
• To request a refund or cancellation, please contact our customer support team with your order details.`;
        
        setContent(defaultContent);
        setOriginalContent({ 
          content: defaultContent, 
          metaTitle: 'Refund & Cancellation Policy - Sensokart', 
          metaDescription: 'Learn about our refund and cancellation policies for orders placed on Sensokart.' 
        });
        setMetaTitle('Refund & Cancellation Policy - Sensokart');
        setMetaDescription('Learn about our refund and cancellation policies for orders placed on Sensokart.');
        setError(err.message || 'Using default policy content.');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  const handleEditToggle = () => {
    if (!isEditMode) {
      setIsEditMode(true);
      setSuccess('');
      setError('');
    } else {
      // Cancel edit: revert changes
      setContent(originalContent.content);
      setMetaTitle(originalContent.metaTitle);
      setMetaDescription(originalContent.metaDescription);
      setIsEditMode(false);
      setSuccess('');
      setError('');
    }
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const response = await fetch(`${API_BASE_URL}/page/upsert`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Refund & Cancellation Policy',
          slug: 'refund-&-cancellation-policy', // Ensure consistent slug
          content,
          metaTitle,
          metaDescription
        }),
      });
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save page');
        }
        // Update original to prevent revert on cancel
        setOriginalContent({ content, metaTitle, metaDescription });
        setIsEditMode(false);
        setSuccess('Policy updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
            Our policies on refunds and cancellations for your peace of mind.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-center">
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
            <p className="ml-4 text-lg text-gray-600">Loading policy...</p>
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
                      className={`px-6 py-3 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 cursor-pointer ${saving ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg'}`}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="px-6 py-3 bg-gray-500 text-white font-medium rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                  >
                    Edit Policy
                  </button>
                )}
              </div>
            )}

            {/* Content Card */}
            <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-200 transition-shadow duration-300 hover:shadow-2xl">
              {isEditMode && userRole === 'admin' ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-2">Policy Content</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-vertical font-mono text-sm"
                      rows="15"
                      placeholder="Enter the refund and cancellation policy content here..."
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
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 text-base leading-7">
                    {content}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RefundCancellationPolicy;