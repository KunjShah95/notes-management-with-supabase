import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { supabase } from '../lib/supabase';
import { Save, Trash, Moon, Sun, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  attachments: string[];
  user_id?: string;
}

const NotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id !== 'new') {
      fetchNote();
    } else {
      setNote({
        id: 'new',
        title: '',
        content: '',
        category: '',
        tags: [],
        attachments: []
      });
      setLoading(false);
    }
  }, [id]);

  const fetchNote = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setNote(data);
    } catch (error) {
      console.error('Error fetching note:', error);
      setError('Failed to load note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note || !session) return;
    setSaving(true);
    setError(null);

    try {
      const noteData = {
        title: note.title.trim(),
        content: note.content,
        category: note.category.trim(),
        tags: note.tags,
        attachments: note.attachments,
        user_id: session.user.id
      };

      if (id === 'new') {
        const { error } = await supabase
          .from('notes')
          .insert([noteData]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', id);
        if (error) throw error;
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setError(null);

    try {
      // Delete attachments first
      if (note?.attachments && note.attachments.length > 0) {
        const fileNames = note.attachments.map(url => url.split('/').pop());
        const { error: storageError } = await supabase.storage
          .from('notes-attachments')
          .remove(fileNames as string[]);
        
        if (storageError) throw storageError;
      }

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note. Please try again.');
    }
  };

  const handleUploadComplete = (urls: string[]) => {
    setNote(prev => {
      if (!prev) return null;
      return {
        ...prev,
        attachments: [...(prev.attachments || []), ...urls]
      };
    });
    setShowUpload(false);
  };

  const handleRemoveFile = (urlToRemove: string) => {
    setNote(prev => {
      if (!prev) return null;
      return {
        ...prev,
        attachments: prev.attachments.filter(url => url !== urlToRemove)
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Note Title"
            className="text-2xl font-bold focus:outline-none w-full bg-transparent dark:text-white"
            value={note?.title || ''}
            onChange={(e) => setNote(prev => prev ? {...prev, title: e.target.value} : null)}
          />
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUpload(!showUpload)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Paperclip className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </motion.button>
            {id !== 'new' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <Trash className="h-5 w-5 mr-2" />
                Delete
              </motion.button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Category"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:text-white"
            value={note?.category || ''}
            onChange={(e) => setNote(prev => prev ? {...prev, category: e.target.value} : null)}
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {showUpload && (
          <FileUpload 
            onUploadComplete={handleUploadComplete}
            existingFiles={note?.attachments}
            onRemoveFile={handleRemoveFile}
          />
        )}

        <div className="markdown-editor-container mt-6" data-color-mode={theme}>
          <MDEditor
            value={note?.content || ''}
            onChange={(value) => setNote(prev => prev ? {...prev, content: value || ''} : null)}
            height={500}
            preview="edit"
            hideToolbar={false}
            enableScroll={true}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default NotePage;