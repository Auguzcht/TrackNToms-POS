import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile, deleteFile } from '../../services/fileStorage';
import { FiUpload, FiFile, FiX, FiCheckCircle, FiEdit2 } from 'react-icons/fi';

const FileUpload = ({
  category,
  onUploadComplete,
  onUploadError,
  onDeleteComplete,
  label = 'Upload Image',
  accept = 'image/*',
  maxSize = 5, // in MB
  className = '',
  showPreview = true,
  previewClass = 'w-32 h-32 object-cover rounded-lg',
  initialPreview = null,
  initialFileUrl = null,
  displayMode = false, // New prop to determine if component is in display mode
  alt = 'Image preview'
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initialPreview);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [fileUrl, setFileUrl] = useState(initialFileUrl);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);
  const deleteButtonRef = useRef(null);
  
  // Update preview when initialPreview changes
  useEffect(() => {
    setPreview(initialPreview);
  }, [initialPreview]);
  
  const handleFileChange = async (selectedFile) => {
    // Reset states
    setError(null);
    setUploadComplete(false);
    
    if (!selectedFile) return;
    
    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For non-image files, clear the preview
      setPreview(null);
    }

    // Auto-upload the file when selected
    await handleUpload(selectedFile);
  };
  
  const handleInputChange = (e) => {
    handleFileChange(e.target.files[0]);
  };
  
  const handleUpload = async (selectedFile) => {
    const fileToUpload = selectedFile || file;
    if (!fileToUpload) {
      setError('Please select a file first');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const result = await uploadFile(fileToUpload, category);
      
      setFileUrl(result.url || result.downloadURL || result);
      setUploadComplete(true);
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed');
      
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };
  
  // Completely separate delete button handler
  const handleDeleteButtonClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If we have a file URL and it's stored in Firebase, delete it
    if (fileUrl) {
      try {
        setDeleting(true);
        await deleteFile(fileUrl);
        
        if (onDeleteComplete) {
          onDeleteComplete(fileUrl);
        }
      } catch (error) {
        console.error('Error deleting file from storage:', error);
        setError('Failed to delete file from storage');
      } finally {
        setDeleting(false);
      }
    }
    
    // Reset component state
    setFile(null);
    setPreview(null);
    setFileUrl(null);
    setUploadComplete(false);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const getFileTypeIcon = () => {
    if (!file) return <FiFile className="w-8 h-8 text-gray-400" />;
    
    const fileType = file.type.split('/')[0];
    switch (fileType) {
      case 'image':
        return null; // We'll show the image preview
      case 'video':
        return <FiFile className="w-8 h-8 text-blue-500" />;
      case 'audio':
        return <FiFile className="w-8 h-8 text-purple-500" />;
      case 'application':
        return <FiFile className="w-8 h-8 text-orange-500" />;
      default:
        return <FiFile className="w-8 h-8 text-gray-500" />;
    }
  };
  
  const isDisabled = uploading || deleting;
  
  // If we're in display mode and have no image, show nothing
  if (displayMode && !preview && !initialPreview) {
    return null;
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {label && !displayMode && (
        <motion.label 
          className="block text-sm font-medium text-[#571C1F] dark:text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.label>
      )}
      
      {/* Modified section: Display mode vs. Upload mode */}
      <div className="relative">
        <motion.div
          className={`relative ${displayMode ? '' : 'border-2 border-dashed rounded-lg p-4 text-center transition-colors'}
            ${!displayMode && dragActive ? 'border-[#571C1F] bg-[#571C1F]/5' : 'border-gray-300 hover:border-[#571C1F]/50 bg-gray-50 dark:bg-gray-800/30'}
            ${!displayMode && error ? 'border-red-300 dark:border-red-700' : ''}
            ${!displayMode && isDisabled ? 'opacity-70 cursor-not-allowed' : displayMode ? '' : 'cursor-pointer'}`}
          onDragEnter={!displayMode ? handleDrag : undefined}
          onDragLeave={!displayMode ? handleDrag : undefined}
          onDragOver={!displayMode ? handleDrag : undefined}
          onDrop={!displayMode ? handleDrop : undefined}
          onClick={() => !displayMode && !isDisabled && fileInputRef.current.click()}
          whileHover={!displayMode ? { scale: isDisabled ? 1 : 1.01 } : undefined}
          whileTap={!displayMode ? { scale: isDisabled ? 1 : 0.99 } : undefined}
          initial={!displayMode ? { opacity: 0, y: 10 } : undefined}
          animate={!displayMode ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.3 }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            id={`file-upload-${category}`}
            disabled={isDisabled || displayMode}
          />
          
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div 
                key="preview"
                className="flex flex-col items-center relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`relative ${displayMode ? 'group' : 'mb-3'}`}>
                  <img 
                    src={preview} 
                    alt={alt}
                    className={`${previewClass} ${isDisabled ? 'opacity-50' : ''}`} 
                  />
                  
                  {/* Edit overlay for display mode */}
                  {displayMode && (
                    <div 
                      className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300 rounded-lg ${isHovering ? 'bg-opacity-40' : ''}`}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <motion.div 
                        className={`p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isHovering ? 'opacity-100' : ''}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiEdit2 className="w-5 h-5 text-[#571C1F]" />
                      </motion.div>
                    </div>
                  )}
                </div>
                
                {!displayMode && (
                  <>
                    <span className="text-sm text-gray-500 truncate max-w-full block">
                      {file ? file.name : 'Selected file'}
                    </span>
                    
                    {uploadComplete && (
                      <span className="text-xs flex items-center text-green-600 mt-1">
                        <FiCheckCircle className="mr-1" /> Uploaded successfully
                      </span>
                    )}
                    
                    {deleting && (
                      <span className="text-xs flex items-center text-orange-500 mt-1">
                        <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Removing file...
                      </span>
                    )}
                  </>
                )}
              </motion.div>
            ) : !displayMode && (
              <motion.div 
                key="dropzone"
                className="flex flex-col items-center justify-center py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FiUpload className="h-10 w-10 text-[#571C1F]/70 mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drop your file here, or <span className="text-[#571C1F] font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: {maxSize}MB
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Delete button - only show in non-display mode or when hovering in display mode */}
        {preview && (!displayMode || isHovering) && (
          <div 
            ref={deleteButtonRef}
            className="absolute -top-2 -right-2 z-20"
          >
            <motion.button
              type="button"
              onClick={handleDeleteButtonClick}
              className="bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Remove file"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiX className="h-4 w-4" />
            </motion.button>
          </div>
        )}
      </div>
      
      {/* Error message with animation */}
      <AnimatePresence>
        {error && !displayMode && (
          <motion.div
            className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-md flex items-center"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiX className="w-4 h-4 mr-1 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;