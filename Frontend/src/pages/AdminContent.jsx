import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import API_BASE_URL from '../src';

const AdminContent = () => {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingContent, setEditingContent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 0
    });

    const navigate = useNavigate();
    const authToken = Cookies.get('authToken');
    const userRole = Cookies.get('userRole')?.toLowerCase();

    useEffect(() => {
        if (!authToken || userRole !== 'admin') {
            navigate('/login');
            return;
        }
        fetchContents();
    }, [authToken, userRole, navigate]);

    const fetchContents = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/content`);

            if (response.ok) {
                const data = await response.json();
                setContents(data.data || []);
            } else {
                setError('Failed to load content');
            }
        } catch (err) {
            console.error('Error fetching content:', err);
            setError('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'priority' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.description) {
            alert('Title and description are required');
            return;
        }

        try {
            const url = editingContent
                ? `${API_BASE_URL}/content/${editingContent._id}`
                : `${API_BASE_URL}/content`;

            const method = editingContent ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert(editingContent ? 'Content updated successfully' : 'Content created successfully');
                setShowForm(false);
                setEditingContent(null);
                setFormData({ title: '', description: '', priority: 0 });
                fetchContents();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to save content');
            }
        } catch (err) {
            console.error('Error saving content:', err);
            alert('Failed to save content');
        }
    };

    const handleEdit = (content) => {
        setEditingContent(content);
        setFormData({
            title: content.title,
            description: content.description,
            priority: content.priority
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this content?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/content/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                alert('Content deleted successfully');
                fetchContents();
            } else {
                alert('Failed to delete content');
            }
        } catch (err) {
            console.error('Error deleting content:', err);
            alert('Failed to delete content');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingContent(null);
        setFormData({ title: '', description: '', priority: 0 });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-28">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-28 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                        Content Management
                    </h1>
                    <p className="text-lg text-gray-600">
                        Manage content displayed on the home page
                    </p>
                </div>

                {/* Add New Button */}
                {!showForm && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            + Add New Content
                        </button>
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {editingContent ? 'Edit Content' : 'Add New Content'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority (0-10)
                                </label>
                                <input
                                    type="number"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="10"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                    {editingContent ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Content List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contents.map((content) => (
                        <div
                            key={content._id}
                            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300"
                        >
                            {/* Priority Badge */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-bold text-sm">
                                        Priority: {content.priority}
                                    </span>
                                    <div className="flex items-center">
                                        {[...Array(Math.min(content.priority, 5))].map((_, i) => (
                                            <svg
                                                key={i}
                                                className="w-4 h-4 text-yellow-300 fill-current"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {content.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    {content.description}
                                </p>
                                <p className="text-xs text-gray-400 mb-4">
                                    Updated: {new Date(content.updatedAt).toLocaleDateString()}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(content)}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors duration-200"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(content._id)}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors duration-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {contents.length === 0 && !error && (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-24 w-24 text-gray-300 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <p className="text-xl text-gray-500">No content available</p>
                        <p className="text-gray-400 mt-2">Click "Add New Content" to create your first content</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminContent;
