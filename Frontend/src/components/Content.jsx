import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../src';

const Content = () => {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchContents();
    }, []);

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

    if (loading) {
        return (
            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || contents.length === 0) {
        return null;
    }

    return (
        <div className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    {contents.map((content) => (
                        <div key={content._id} className="space-y-3">
                            <h2 className="text-3xl font-bold text-gray-900">
                                {content.title}
                            </h2>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                {content.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Content;
