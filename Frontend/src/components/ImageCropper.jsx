import React, { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

const ImageCropper = ({ image, onCropComplete, onCancel, aspect = 1 }) => {
  const cropperRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(aspect || NaN);

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      setIsProcessing(true);
      
      const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      
      if (!canvas) {
        setIsProcessing(false);
        return;
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.95);
    }
  };

  const handleZoom = (ratio) => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.zoom(ratio);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-2 md:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" style={{ maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="p-4 md:px-6 md:py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Crop & Resize</h3>
            <p className="text-xs text-gray-500 mt-0.5">Use the corner handles to resize. Drag to move. Scroll to zoom.</p>
          </div>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cropper Area */}
        <div className="flex-1 bg-gray-200 overflow-hidden relative border-b border-gray-300 min-h-[300px]">
          <Cropper
            src={image}
            style={{ height: '400px', width: '100%' }}
            aspectRatio={aspectRatio}
            guides={true}
            ref={cropperRef}
            viewMode={1}
            dragMode="crop"
            background={true}
            responsive={true}
            autoCropArea={0.9}
            checkOrientation={false}
          />
        </div>

        {/* Controls */}
        <div className="p-4 md:px-6 md:py-4 bg-white flex flex-col gap-4 overflow-y-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Shape selection */}
            <div className="flex flex-col gap-1.5 w-full md:w-auto">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Crop Shape</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAspectRatio(NaN)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    Number.isNaN(aspectRatio) ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Free-form
                </button>
                <button
                  onClick={() => setAspectRatio(1)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    aspectRatio === 1 ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Square (1:1)
                </button>
                <button
                  onClick={() => setAspectRatio(4 / 3)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    aspectRatio === 4 / 3 ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Landscape (4:3)
                </button>
              </div>
            </div>

            {/* Quick Actions & Confirm */}
            <div className="flex justify-end items-center gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
              <div className="flex gap-1 mr-2 bg-gray-100 rounded-lg p-1">
                <button onClick={() => handleZoom(-0.1)} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition" title="Zoom Out">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                </button>
                <button onClick={() => handleZoom(0.1)} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition" title="Zoom In">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </button>
              </div>
            
              <button
                onClick={onCancel}
                className="px-5 py-2.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCrop}
                disabled={isProcessing}
                className="flex items-center justify-center min-w-[120px] px-6 py-2.5 text-sm bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-all cursor-pointer shadow-lg shadow-gray-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Saving...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
