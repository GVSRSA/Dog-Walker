import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, Settings, LogOut, User } from 'lucide-react';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = currentUser?.role === 'admin';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (currentUser?.role) {
      case 'admin':
        return '/admin';
      case 'provider':
        return '/provider';
      case 'client':
        return '/client';
      default:
        return '/';
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to={getDashboardLink()} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dog Walker</h1>
              <p className="text-sm text-green-700 font-medium">by Jolly Walker</p>
              <p className="text-xs text-gray-600">Welcome, {currentUser?.full_name}</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Navigation Links */}
          {isAdmin && (
            <>
              <Link to="/admin">
                <Button
                  variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                  className={location.pathname === '/admin' 
                    ? 'bg-green-700 hover:bg-green-800' 
                    : 'text-green-700 hover:text-green-800'
                  }
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
              <Link to="/admin?tab=users">
                <Button
                  variant={location.pathname === '/admin' && location.search?.includes('tab=users') 
                    ? 'default' 
                    : 'ghost'
                  }
                  className={location.pathname === '/admin' && location.search?.includes('tab=users')
                    ? 'bg-green-700 hover:bg-green-800' 
                    : 'text-green-700 hover:text-green-800'
                  }
                >
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </Button>
              </Link>
              <Link to="/admin?tab=settings">
                <Button
                  variant={location.pathname === '/admin' && location.search?.includes('tab=settings')
                    ? 'default' 
                    : 'ghost'
                  }
                  className={location.pathname === '/admin' && location.search?.includes('tab=settings')
                    ? 'bg-green-700 hover:bg-green-800' 
                    : 'text-green-700 hover:text-green-800'
                  }
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Platform Settings
                </Button>
              </Link>
            </>
          )}

          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <User className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
