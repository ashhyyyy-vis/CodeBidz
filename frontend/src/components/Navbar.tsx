import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut, User, Gavel } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <Gavel className="w-6 h-6 text-emerald-400" />
              <span>BidMaster</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{user.username}</span>
                  {user.role === 'bidder' && (
                    <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
                      {user.availableCredits} Credits
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-emerald-400 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
