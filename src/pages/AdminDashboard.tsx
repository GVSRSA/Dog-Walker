import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DollarSign, Users, ShoppingCart, TrendingUp, 
  CheckCircle, XCircle, LogOut, Shield, User
} from 'lucide-react';

const AdminDashboard = () => {
  const { users, bookings, transactions, platformRevenue, approveUser, suspendUser, currentUser } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bookings'>('overview');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleApprove = (userId: string) => {
    approveUser(userId);
  };

  const handleSuspend = (userId: string) => {
    suspendUser(userId);
  };

  const pendingProviders = users.filter(u => u.role === 'provider' && !u.isApproved);
  const activeBookings = bookings.filter(b => b.status === 'active');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-700" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dog Walker</h1>
              <p className="text-sm text-green-700 font-medium">by Jolly Walker</p>
              <p className="text-xs text-gray-600">Welcome, {currentUser?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className={activeTab === 'users' ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
          >
            Users ({pendingProviders.length > 0 && pendingProviders.length})
          </Button>
          <Button
            variant={activeTab === 'bookings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('bookings')}
            className={activeTab === 'bookings' ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
          >
            Bookings
          </Button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R{platformRevenue.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-gray-600">Platform commission</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformRevenue.totalUsers}</div>
                  <p className="text-xs text-gray-600">{platformRevenue.activeProviders} active providers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformRevenue.totalBookings}</div>
                  <p className="text-xs text-gray-600">{activeBookings.length} active now</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingProviders.length}</div>
                  <p className="text-xs text-gray-600">Providers awaiting review</p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Providers */}
            {pendingProviders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Provider Approvals</CardTitle>
                  <CardDescription>Review and approve new service providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingProviders.map((provider) => (
                      <div key={provider.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{provider.name}</p>
                          <p className="text-sm text-gray-600">{provider.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(provider.id)}
                            className="bg-green-700 hover:bg-green-800"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSuspend(provider.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage platform users and their status</CardDescription>
            </CardHeader>
            <CardContent>
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
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'admin' ? 'default' : 
                          user.role === 'provider' ? 'secondary' : 'outline'
                        }>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant={user.isApproved ? 'default' : 'outline'}>
                            {user.isApproved ? 'Approved' : 'Pending'}
                          </Badge>
                          {user.isSuspended && (
                            <Badge variant="destructive">Suspended</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.role === 'provider' && !user.isApproved && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(user.id)}
                            className="bg-green-700 hover:bg-green-800"
                          >
                            Approve
                          </Button>
                        )}
                        {user.isApproved && !user.isSuspended && user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSuspend(user.id)}
                          >
                            Suspend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'bookings' && (
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>View and manage all platform bookings</CardDescription>
            </CardHeader>
            <CardContent>
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
                    const client = users.find(u => u.id === booking.clientId);
                    const provider = users.find(u => u.id === booking.providerId);
                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.id.split('-')[1]}</TableCell>
                        <TableCell>{client?.name}</TableCell>
                        <TableCell>{provider?.name}</TableCell>
                        <TableCell>{new Date(booking.scheduledDate).toLocaleDateString()}</TableCell>
                        <TableCell>R{booking.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            booking.status === 'completed' ? 'default' :
                            booking.status === 'active' ? 'secondary' :
                            booking.status === 'pending' ? 'outline' : 'destructive'
                          }>
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;