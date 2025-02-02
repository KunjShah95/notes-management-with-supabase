import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onUploadComplete: (urls: string[]) => void;
  existingFiles?: string[];
  onRemoveFile?: (url: string) => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'video/*': ['.mp4', '.webm'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, existingFiles = [], onRemoveFile }) => {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setUploading(true);
    setUploadProgress({});

    try {
      const validFiles = acceptedFiles.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          setError(`File "${file.name}" exceeds 25MB limit`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        setUploading(false);
        return;
      }

      const uploadPromises = validFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
          const { data, error } = await supabase.storage
            .from('notes-attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('notes-attachments')
            .getPublicUrl(filePath);

          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));

          return publicUrl;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setError(`Failed to upload ${file.name}`);
          return null;
        }
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url): url is string => url !== null);
      
      if (validUrls.length > 0) {
        onUploadComplete(validUrls);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: uploading
  });

  const handleRemoveFile = async (url: string) => {
    if (onRemoveFile) {
      try {
        const fileName = url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('notes-attachments')
            .remove([fileName]);
        }
        onRemoveFile(url);
      } catch (error) {
        console.error('Error removing file:', error);
        setError('Failed to remove file. Please try again.');
      }
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          {...getRootProps()}
          className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors relative
            ${isDragActive 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {isDragActive
              ? "Drop the files here..."
              : uploading 
                ? "Uploading files..."
                : "Drag 'n' drop files here, or click to select files"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Supports PDF, PPT, PPTX, DOC, DOCX, and video files (max 25MB per file)
          </p>
        </div>
      </motion.div>

      {existingFiles && existingFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded Files</h3>
          <div className="grid grid-cols-1 gap-2">
            {existingFiles.map((url, index) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 truncate"
                >
                  {url.split('/').pop()}
                </a>
                {onRemoveFile && (
                  <button
                    onClick={() => handleRemoveFile(url)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          >
            <div className="flex items-center text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;