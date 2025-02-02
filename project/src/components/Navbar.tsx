import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">StudyNotes</span>
            </Link>
          </div>
          {session && (
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;