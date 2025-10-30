import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import API_BASE_URL from '../src';

const ContactEnquiry = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const token = Cookies.get('authToken');
  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Sort contacts by creation date (newest first)
  const sortedContacts = [...contacts].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Fetch contacts for admin
  useEffect(() => {
    if (userRole === 'admin') {
      if (!token) {
        setError('Please log in as an admin to view contacts.');
        setLoading(false);
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
        } finally {
          setLoading(false);
        }
      };
      fetchContacts();
    } else {
      setLoading(false);
    }
  }, [userRole, token]);

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
      setContactToDelete(null);
      setSuccess('Contact deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(err.message || 'Failed to delete contact.');
    }
  };

  // Close modals
  const closeViewModal = () => setSelectedContact(null);
  const closeDeleteModal = () => setContactToDelete(null);

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-28 sm:pt-32 pb-8 sm:pb-16">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10 px-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Contact Enquiries
          </h1>
          <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600">
            Manage all contact form submissions
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center text-sm sm:text-base mx-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center transition-opacity duration-500 text-sm sm:text-base mx-2">
            {success}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="ml-3 sm:ml-4 text-base sm:text-lg text-gray-600">Loading enquiries...</p>
          </div>
        ) : (
          <div className="bg-white shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 mx-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Contact Submissions</h2>
            {sortedContacts.length === 0 ? (
              <p className="text-gray-500 italic text-center py-8">No contact submissions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        From
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedContacts.map((contact, index) => (
                      <tr 
                        key={contact._id} 
                        className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                      >
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-900 font-medium">
                          {sortedContacts.length - index}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-900 max-w-xs truncate">
                          {contact.subject}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-600">
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-xs text-gray-500">{contact.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-600">
                          {contact.phone || '-'}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-600">
                          {formatDate(contact.createdAt)}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contact.status === 'Resolved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {contact.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewContact(contact._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md cursor-pointer"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            <button
                              onClick={() => setContactToDelete(contact)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md cursor-pointer"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Contact Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Contact Details</h3>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer p-1 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 text-sm sm:text-base">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-700">Name:</label>
                    <p className="text-gray-900 mt-1">{selectedContact.name}</p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">Email:</label>
                    <p className="text-gray-900 mt-1">{selectedContact.email}</p>
                  </div>
                </div>
                
                {selectedContact.phone && (
                  <div>
                    <label className="font-semibold text-gray-700">Phone:</label>
                    <p className="text-gray-900 mt-1">{selectedContact.phone}</p>
                  </div>
                )}
                
                <div>
                  <label className="font-semibold text-gray-700">Subject:</label>
                  <p className="text-gray-900 mt-1">{selectedContact.subject}</p>
                </div>
                
                <div>
                  <label className="font-semibold text-gray-700">Message:</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {selectedContact.message}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-700">Status:</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedContact.status === 'Resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedContact.status || 'Pending'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">Submitted:</label>
                    <p className="text-gray-900 mt-1">
                      {formatDate(selectedContact.createdAt)}
                    </p>
                  </div>
                </div>
                
                {selectedContact.notes && (
                  <div>
                    <label className="font-semibold text-gray-700">Notes:</label>
                    <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                      {selectedContact.notes}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                  <select
                    value={selectedContact.status || 'Pending'}
                    onChange={(e) => handleUpdateStatus(selectedContact._id, e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base cursor-pointer hover:border-gray-400 transition-colors duration-200"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  <button
                    onClick={closeViewModal}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {contactToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Contact</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete the contact from <strong>{contactToDelete.name}</strong>? 
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => handleDeleteContact(contactToDelete._id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactEnquiry;