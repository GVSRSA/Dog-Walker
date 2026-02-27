import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import RoleNavbar from '@/components/RoleNavbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, Booking, Review, Dog } from '@/types';
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  XCircle,
  Shield,
  Star,
  Dog as DogIcon,
} from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'dogs' | 'bookings'>('users');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'users' || tab === 'dogs' || tab === 'bookings') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        setFetchError(`Supabase Error: ${error.message} (Code: ${error.code})`);
      } else {
        setProfiles(data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error:', err);
      setFetchError(`Unexpected Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dogs:', error);
      } else {
        setDogs(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: Profile['role']) => {
    setUpdatingRoleUserId(userId);
    try {
      const { error } = await supabase.rpc('update_user_role', {
        target_id: userId,
        new_role: newRole,
      });

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: 'Role update failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      await fetchUsers();

      toast({
        title: 'Role updated',
        description: 'Role updated. The user may need to log out and back in to see their new dashboard.',
      });
    } catch (err) {
      console.error('Error updating user role:', err);
      toast({
        title: 'Role update failed',
        description: 'Unexpected error updating role.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  // Fetch all profiles
  useEffect(() => {
    fetchUsers();
    fetchAllDogs();
  }, []);

  // Fetch all bookings
  useEffect(() => {
    const fetchAllBookings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('scheduled_at', { ascending: false });

        if (error) {
          console.error('Error fetching bookings:', error);
        } else {
          setBookings(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBookings();
  }, []);

  // Fetch all reviews
  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching reviews:', error);
        } else {
          setReviews(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    fetchAllReviews();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_approve_user', {
        target_id: userId,
        status: true,
      });

      if (error) {
        console.error('Error approving user:', error);
        alert('Failed to approve user');
        return;
      }

      await fetchUsers();
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to approve user');
    }
  };

  const handleHardDelete = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_hard_delete_user', {
        target_id: userId,
      });

      if (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
        return;
      }

      await fetchUsers();
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete user');
    }
  };

  const handleSetSuspended = async (userId: string, suspensionStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_user_suspension', {
        target_id: userId,
        suspension_status: suspensionStatus,
      });

      if (error) {
        console.error('Error toggling user suspension:', error);
        alert(`Failed to ${suspensionStatus ? 'suspend' : 'unsuspend'} user`);
        return;
      }

      await fetchUsers();
    } catch (err) {
      console.error('Error:', err);
      alert(`Failed to ${suspensionStatus ? 'suspend' : 'unsuspend'} user`);
    }
  };

  const downloadUsersCsv = () => {
    const headers = ['full_name', 'email', 'role', 'is_approved', 'is_suspended', 'created_at'];
    const rows = profiles.map((p) => [
      p.full_name ?? '',
      p.email ?? '',
      p.role ?? '',
      String(!!p.is_approved),
      String(!!p.is_suspended),
      p.created_at ?? '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate platform revenue
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0);

  // Filter users
  const pendingProviders = profiles.filter((p) => p.role === 'provider' && !p.is_approved);
  const activeProviders = profiles.filter((p) => p.role === 'provider' && p.is_approved && !p.is_suspended);
  const activeBookings = bookings.filter((b) => b.status === 'active');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Top snapshot */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold tracking-tight">R{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-gray-600">Platform commission</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold tracking-tight">{profiles.length}</div>
              <p className="text-xs text-gray-600">{activeProviders.length} active providers</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dogs</CardTitle>
              <DogIcon className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold tracking-tight">{dogs.length}</div>
              <p className="text-xs text-gray-600">Registered pets</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold tracking-tight">{bookings.length}</div>
              <p className="text-xs text-gray-600">{activeBookings.length} active • {completedBookings.length} completed</p>
            </CardContent>
          </Card>
        </div>

        {activeTab === 'users' && (
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Approve, suspend, and manage platform users</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={fetchUsers} className="rounded-full border-green-200 text-green-800 hover:bg-green-50">
                  Refresh
                </Button>
                <Button variant="outline" onClick={downloadUsersCsv} className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50">
                  Download CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <DogIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading users...
                </div>
              ) : fetchError ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                  <h3 className="font-semibold text-red-900 mb-2">Error Loading Users</h3>
                  <p className="text-sm text-red-700 font-mono bg-red-100 p-3 rounded-lg">{fetchError}</p>
                  <p className="text-xs text-red-600 mt-2">This may be a permission issue. Check your RLS policies.</p>
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 mb-2">No users found in the database</p>
                </div>
              ) : (
                <>
                  {/* Pending Providers */}
                  {pendingProviders.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-amber-900">Pending Provider Approvals</p>
                          <p className="text-sm text-amber-800/80">Review and approve new service providers</p>
                        </div>
                        <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200">{pendingProviders.length}</Badge>
                      </div>
                      <div className="mt-4 space-y-3">
                        {pendingProviders.map((provider) => (
                          <div key={provider.id} className="flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{provider.full_name}</p>
                              <p className="text-sm text-slate-600">{provider.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApprove(provider.id)} className="rounded-full bg-green-700 hover:bg-green-800">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="rounded-full" onClick={() => handleHardDelete(provider.id)}>
                                <XCircle className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow
                          key={profile.id}
                          className={profile.is_suspended ? 'bg-slate-50 text-slate-500' : undefined}
                        >
                          <TableCell className="font-medium">{profile.full_name}</TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>
                            <Select
                              value={profile.role}
                              onValueChange={(v) => handleUpdateUserRole(profile.id, v as Profile['role'])}
                              disabled={updatingRoleUserId === profile.id}
                            >
                              <SelectTrigger className="h-9 w-[160px] rounded-full bg-white">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="provider">Provider</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Badge
                                className={
                                  profile.is_approved
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-100'
                                }
                              >
                                {profile.is_approved ? 'Approved' : 'Pending'}
                              </Badge>
                              {profile.is_suspended && (
                                <Badge className="bg-slate-200 text-slate-900 border border-slate-300 hover:bg-slate-200">Suspended</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {!profile.is_approved && profile.role !== 'admin' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(profile.id)}
                                  className="rounded-full bg-green-700 hover:bg-green-800"
                                >
                                  Approve
                                </Button>
                              )}

                              {profile.role !== 'admin' && (profile.is_approved || profile.is_suspended) &&
                                (profile.is_suspended ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSetSuspended(profile.id, false)}
                                    className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                                  >
                                    Unsuspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="rounded-full"
                                    onClick={() => handleSetSuspended(profile.id, true)}
                                  >
                                    Suspend
                                  </Button>
                                ))}

                              {profile.role !== 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleHardDelete(profile.id)}
                                  className="rounded-full border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'dogs' && (
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Dogs</CardTitle>
                <CardDescription>All registered dogs on the platform</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchAllDogs} className="rounded-full border-green-200 text-green-800 hover:bg-green-50">
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <DogIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading dogs...
                </div>
              ) : dogs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <DogIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>No dogs found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Breed</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dogs.map((dog) => {
                      const owner = profiles.find((p) => p.id === dog.owner_id);
                      return (
                        <TableRow key={dog.id}>
                          <TableCell className="font-medium">{dog.name}</TableCell>
                          <TableCell>{dog.breed || 'Unknown breed'}</TableCell>
                          <TableCell>{dog.age ?? '-'}</TableCell>
                          <TableCell>{owner?.full_name || dog.owner_id.slice(0, 8) + '...'}</TableCell>
                          <TableCell>{dog.created_at ? format(new Date(dog.created_at), 'PPP') : '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'bookings' && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>View and manage all platform bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <DogIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading bookings...
                </div>
              ) : bookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bookings found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const client = profiles.find((p) => p.id === booking.client_id);
                      const provider = profiles.find((p) => p.id === booking.provider_id);
                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.id.slice(0, 8)}...</TableCell>
                          <TableCell>{client?.full_name}</TableCell>
                          <TableCell>{provider?.full_name}</TableCell>
                          <TableCell>{booking.scheduled_at ? format(new Date(booking.scheduled_at), 'PPP') : '-'}</TableCell>
                          <TableCell>R{booking.total_fee?.toFixed(2) || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.status === 'completed'
                                  ? 'default'
                                  : booking.status === 'active'
                                    ? 'secondary'
                                    : booking.status === 'pending'
                                      ? 'outline'
                                      : 'destructive'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;