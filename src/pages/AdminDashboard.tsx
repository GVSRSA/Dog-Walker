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
  CheckCircle, XCircle, LogOut, Shield, User, Star
} from 'lucide-react';

const AdminDashboard = () => {
  const { users, bookings, transactions, platformRevenue, approveUser, suspendUser, currentUser, getAverageRating, getReviews } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bookings' | 'safety'>('overview');

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
          <Button
            variant={activeTab === 'safety' ? 'default' : 'outline'}
            onClick={() => setActiveTab('safety')}
            className={activeTab === 'safety' ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
          >
            Safety
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

        {activeTab === 'safety' && (
          <Card>
            <CardHeader>
              <CardTitle>Safety Dashboard</CardTitle>
              <CardDescription>Monitor users with low ratings and take action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Low Rated Users Alert */}
                {users.filter(u => {
                  const avgRating = getAverageRating(u.id);
                  return avgRating > 0 && avgRating < 3.0 && u.role !== 'admin';
                }).length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold">
                        {users.filter(u => {
                          const avgRating = getAverageRating(u.id);
                          return avgRating > 0 && avgRating < 3.0 && u.role !== 'admin';
                        }).length} user(s) flagged for low ratings
                      </span>
                    </div>
                  </div>
                )}

                {/* Low Rated Providers */}
                <div>
                  <h3 className="font-semibold mb-4">Providers with Rating Below 3.0</h3>
                  <div className="space-y-3">
                    {users.filter(u => {
                      const avgRating = getAverageRating(u.id);
                      return avgRating > 0 && avgRating < 3.0 && u.role === 'provider';
                    }).map((user) => {
                      const avgRating = getAverageRating(user.id);
                      const userReviews = getReviews(user.id);
                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div>
                            <p className="font-semibold text-red-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-sm text-gray-600">{user.neighborhood || 'No location set'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Star className="w-4 h-4 text-red-500" />
                              <span className="text-red-700 font-semibold">{avgRating.toFixed(1)} / 5.0</span>
                              <span className="text-gray-600">({userReviews.length} reviews)</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              {userReviews.slice(-2).map(review => (
                                <p key={review.id} className="italic">"{review.comment}"</p>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {user.isSuspended ? (
                              <Badge variant="destructive">Suspended</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSuspend(user.id)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Suspend User
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {users.filter(u => {
                      const avgRating = getAverageRating(u.id);
                      return avgRating > 0 && avgRating < 3.0 && u.role === 'provider';
                    }).length === 0 && (
                      <p className="text-gray-500 text-center py-8">No providers with low ratings</p>
                    )}
                  </div>
                </div>

                {/* Low Rated Clients */}
                <div>
                  <h3 className="font-semibold mb-4">Clients with Rating Below 3.0</h3>
                  <div className="space-y-3">
                    {users.filter(u => {
                      const avgRating = getAverageRating(u.id);
                      return avgRating > 0 && avgRating < 3.0 && u.role === 'client';
                    }).map((user) => {
                      const avgRating = getAverageRating(user.id);
                      const userReviews = getReviews(user.id);
                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div>
                            <p className="font-semibold text-amber-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-sm text-gray-600">{user.neighborhood || 'No location set'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Star className="w-4 h-4 text-amber-500" />
                              <span className="text-amber-700 font-semibold">{avgRating.toFixed(1)} / 5.0</span>
                              <span className="text-gray-600">({userReviews.length} reviews)</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              {userReviews.slice(-2).map(review => (
                                <p key={review.id} className="italic">"{review.comment}"</p>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {user.isSuspended ? (
                              <Badge variant="destructive">Suspended</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSuspend(user.id)}
                                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Suspend User
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {users.filter(u => {
                      const avgRating = getAverageRating(u.id);
                      return avgRating > 0 && avgRating < 3.0 && u.role === 'client';
                    }).length === 0 && (
                      <p className="text-gray-500 text-center py-8">No clients with low ratings</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;