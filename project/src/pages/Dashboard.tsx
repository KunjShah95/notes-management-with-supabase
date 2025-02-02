import React, { useEffect, useState } from 'react';
import { Plus, Search, Folder } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface Note {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

const Dashboard = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
        <Link
          to="/notes/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Note
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Link
              key={note.id}
              to={`/notes/${note.id}`}
              className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center mb-3">
                <Folder className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-indigo-600">{note.category}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{note.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;