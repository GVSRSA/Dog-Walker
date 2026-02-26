import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Dog,
  LogOut,
  CalendarDays,
  Users,
  Bone,
  PawPrint,
  HandCoins,
  Clock3,
  ClipboardList,
  Search,
  UserRound,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type RoleNavbarProps = {
  activeKey?: string;
};

type NavItem = {
  key: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getHomeRoute(role?: string | null) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'provider':
      return '/provider';
    case 'client':
      return '/client';
    default:
      return '/';
  }
}

function roleBadgeClass(role?: string | null) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-700 ring-1 ring-purple-200';
    case 'provider':
      return 'bg-blue-100 text-blue-700 ring-1 ring-blue-200';
    case 'client':
      return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }
}

function roleLabel(role?: string | null) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'provider':
      return 'Provider';
    case 'client':
      return 'Client';
    default:
      return 'User';
  }
}

export default function RoleNavbar({ activeKey }: RoleNavbarProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = currentUser?.role;
  const homeRoute = getHomeRoute(role);

  let roleItems: NavItem[] = [];
  if (role === 'admin') {
    roleItems = [
      { key: 'dashboard', label: 'Dashboard', to: homeRoute, icon: LayoutDashboard },
      { key: 'users', label: 'Users', to: '/admin?tab=users', icon: Users },
      { key: 'dogs', label: 'Dogs', to: '/admin?tab=dogs', icon: Bone },
      { key: 'bookings', label: 'Bookings', to: '/admin?tab=bookings', icon: ClipboardList },
    ];
  } else if (role === 'client') {
    roleItems = [
      { key: 'dashboard', label: 'Dashboard', to: homeRoute, icon: LayoutDashboard },
      { key: 'dogs', label: 'My Dogs', to: '/my-dogs', icon: PawPrint },
      { key: 'bookings', label: 'My Bookings', to: '/my-bookings', icon: CalendarDays },
      { key: 'find', label: 'Book', to: '/book', icon: Search },
    ];
  } else if (role === 'provider') {
    roleItems = [
      { key: 'dashboard', label: 'Dashboard', to: homeRoute, icon: LayoutDashboard },
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
    if (`${location.pathname}${location.search}${location.hash}` !== homeRoute) {
      navigate(homeRoute);
    }
  };

  const statusDotClass = currentUser?.is_suspended
    ? 'bg-rose-500 ring-rose-200'
    : currentUser?.is_approved
      ? 'bg-emerald-500 ring-emerald-200'
      : 'bg-amber-500 ring-amber-200';

  const displayName = currentUser?.full_name?.trim() || currentUser?.email || '—';
  const initials = (currentUser?.full_name?.trim() || currentUser?.email || 'U')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'group hidden shrink-0 items-center gap-3 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200/70 shadow-sm transition-colors hover:bg-slate-50 sm:flex',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2'
                  )}
                  aria-label="User identity"
                >
                  <span className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                    {currentUser?.avatar_url ? (
                      <img
                        src={currentUser.avatar_url}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-sm font-semibold text-slate-700">
                        {initials}
                      </span>
                    )}
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white',
                        statusDotClass
                      )}
                      aria-label={
                        currentUser?.is_suspended
                          ? 'Suspended'
                          : currentUser?.is_approved
                            ? 'Approved'
                            : 'Pending'
                      }
                      title={
                        currentUser?.is_suspended
                          ? 'Suspended'
                          : currentUser?.is_approved
                            ? 'Approved'
                            : 'Pending'
                      }
                    />
                  </span>

                  <span className="min-w-0 text-left">
                    <span className="block max-w-[220px] truncate text-sm font-semibold text-slate-900">
                      {displayName}
                    </span>
                    <span className="block">
                      <Badge className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', roleBadgeClass(role))}>
                        {roleLabel(role)}
                      </Badge>
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl border-slate-200/70 p-1">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{displayName}</div>
                      <div className="truncate text-xs font-medium text-slate-500">{currentUser?.email}</div>
                    </div>
                    <Badge className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', roleBadgeClass(role))}>
                      {roleLabel(role)}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full ring-2', statusDotClass)} />
                    <span className="text-xs font-medium text-slate-600">
                      {currentUser?.is_suspended
                        ? 'Suspended'
                        : currentUser?.is_approved
                          ? 'Approved'
                          : 'Pending approval'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl px-3 py-2 font-medium"
                  onSelect={() => navigate('/profile')}
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl px-3 py-2 font-medium"
                  onSelect={() => navigate(homeRoute)}
                >
                  Dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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