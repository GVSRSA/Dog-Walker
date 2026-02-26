import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dog, LogOut, CalendarDays, Users, Bone, PawPrint, HandCoins, Clock3, ClipboardList, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type RoleNavbarProps = {
  activeKey?: string;
};

type NavItem = {
  key: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getDashboardRoute(role?: string | null) {
  switch (role) {
    case 'admin':
      return '/admin?tab=users';
    case 'provider':
      return '/provider#walks';
    case 'client':
      return '/my-dogs';
    default:
      return '/';
  }
}

export default function RoleNavbar({ activeKey }: RoleNavbarProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = currentUser?.role;

  let roleItems: NavItem[] = [];
  if (role === 'admin') {
    roleItems = [
      { key: 'users', label: 'Users', to: '/admin?tab=users', icon: Users },
      { key: 'dogs', label: 'Dogs', to: '/admin?tab=dogs', icon: Bone },
      { key: 'bookings', label: 'Bookings', to: '/admin?tab=bookings', icon: ClipboardList },
    ];
  } else if (role === 'client') {
    roleItems = [
      { key: 'dogs', label: 'My Dogs', to: '/my-dogs', icon: PawPrint },
      { key: 'bookings', label: 'My Bookings', to: '/my-bookings', icon: CalendarDays },
      { key: 'find', label: 'Book', to: '/book', icon: Search },
    ];
  } else if (role === 'provider') {
    roleItems = [
      { key: 'walks', label: 'My Walks', to: '/provider#walks', icon: ClipboardList },
      { key: 'schedule', label: 'Schedule', to: '/provider#schedule', icon: Clock3 },
      { key: 'earnings', label: 'Earnings', to: '/provider#earnings', icon: HandCoins },
    ];
  }

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  const onLogoClick = () => {
    const target = getDashboardRoute(role);
    if (`${location.pathname}${location.search}${location.hash}` !== target) {
      navigate(target);
    }
  };

  const PillLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = activeKey ? activeKey === item.key : false;

    return (
      <Button
        asChild
        size="sm"
        variant="ghost"
        className={cn(
          'shrink-0 rounded-full px-3 text-slate-700 hover:bg-green-50 hover:text-green-900',
          isActive && 'bg-green-100 text-green-900 hover:bg-green-100'
        )}
      >
        <Link to={item.to}>
          <Icon className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{item.label}</span>
        </Link>
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onLogoClick}
            className="group flex items-center gap-3 rounded-2xl pr-2 text-left transition-colors hover:bg-green-50"
            aria-label="Go to dashboard"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-100 ring-1 ring-green-200">
              <Dog className="h-5 w-5 text-green-700" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight text-slate-900">Dog Walker</span>
              <span className="block text-xs font-semibold text-green-700">by Jolly Walker</span>
            </span>
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <nav className="flex min-w-0 flex-1 justify-end gap-2 overflow-x-auto py-1 pr-1">
              {roleItems.map((item) => (
                <PillLink key={item.key} item={item} />
              ))}
            </nav>

            {/* Always visible (pinned) */}
            <PillLink item={{ key: 'profile', label: 'Profile', to: '/profile', icon: UserRound }} />

            <Button
              size="sm"
              variant="ghost"
              onClick={onLogout}
              className="shrink-0 rounded-full px-3 text-slate-700 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}