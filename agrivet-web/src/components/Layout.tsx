// src/components/Layout.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">AgriVet Platform</h1>
              <div className="ml-10 flex items-baseline space-x-4">
                {user?.role === 'graduate' && (
                  <>
                    <button
                      onClick={() => navigate('/graduate')}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/graduate/requests')}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Available Requests
                    </button>
                    <button
                      onClick={() => navigate('/graduate/assignments')}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      My Assignments
                    </button>
                    <button
                      onClick={() => navigate('/graduate/profile')}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Profile
                    </button>
                  </>
                )}
                {user?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => navigate('/admin')}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/admin/users')}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      User Management
                    </button>
                    <button
                      onClick={() => navigate('/admin/requests')}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Service Requests
                    </button>
                    <button
                      onClick={() => navigate('/admin/analytics')}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Analytics
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-sm block">Welcome, {user?.name}</span>
                <span className="text-xs text-green-200 capitalize">{user?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium bg-green-700 hover:bg-green-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;