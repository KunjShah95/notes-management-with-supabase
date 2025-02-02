import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotePage from './pages/NotePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/notes/:id" element={
                <ProtectedRoute>
                  <NotePage />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;