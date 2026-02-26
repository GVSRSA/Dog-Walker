import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LogOut, MapPin, Clock, DollarSign, Star, 
  ShoppingCart, Play, Square, CreditCard, User
} from 'lucide-react';

const ProviderDashboard = () => {
  const { bookings, startWalk, endWalk, users, purchaseCredits, currentUser, updateBookingStatus, routes, confirmBooking } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState(10);
  const [watchId, setWatchId] = useState<number | null>(null);

  const provider = currentUser as any;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await confirmBooking(bookingId);
    } catch (error) {
      console.error('Failed to confirm booking:', error);
    }
  };

  const handleStartWalk = async (bookingId: string) => {
    try {
      await startWalk(bookingId);
      setActiveBooking(bookingId);
      setIsWalking(true);
      
      // Start geolocation tracking
      if ('geolocation' in navigator) {
        const id = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            // Add route point
            const route = routes.find(r => r.bookingId === bookingId);
            if (route) {
              useApp().addRoutePoint(route.id, latitude, longitude);
              
              // In production, this would send to Supabase tracking_logs table
              // await supabase.from('tracking_logs').insert({
              //   booking_id: bookingId,
              //   location: `(${latitude},${longitude})`,
              //   timestamp: new Date().toISOString(),
              // });
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
        setWatchId(id);
      }
      
      // Simulate GPS tracking as fallback
      const route = routes.find(r => r.bookingId === bookingId);
      if (route) {
        const interval = setInterval(() => {
          const route = routes.find(r => r.bookingId === bookingId);
          if (route && isWalking) {
            const lastPoint = route.points[route.points.length - 1];
            const newLat = lastPoint ? lastPoint.lat + (Math.random() - 0.5) * 0.001 : -26.2041;
            const newLng = lastPoint ? lastPoint.lng + (Math.random() - 0.5) * 0.001 : 28.0473;
            useApp().addRoutePoint(route.id, newLat, newLng);
          } else {
            clearInterval(interval);
          }
        }, 30000); // Every 30 seconds
      }
    } catch (error) {
      console.error('Failed to start walk:', error);
    }
  };

  const handleEndWalk = async (bookingId: string) => {
    try {
      // Stop geolocation tracking
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      
      await endWalk(bookingId);
      setActiveBooking(null);
      setIsWalking(false);
    } catch (error) {
      console.error('Failed to end walk:', error);
    }
  };

  const handlePurchaseCredits = () => {
    const cost = creditAmount * 50; // R50 per credit
    purchaseCredits(provider.id, cost, creditAmount);
    setShowPurchaseModal(false);
    setCreditAmount(10);
  };

  const myBookings = bookings.filter(b => b.providerId === provider?.id);
  const pendingBookings = myBookings.filter(b => b.status === 'pending');
  const confirmedBookings = myBookings.filter(b => b.status === 'confirmed');
  const activeBookings = myBookings.filter(b => b.status === 'active');
  const completedBookings = myBookings.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dog Walker</h1>
              <p className="text-sm text-green-700 font-medium">by Jolly Walker</p>
              <p className="text-xs text-gray-600">Welcome, {provider?.name}</p>
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
              <CreditCard className="h-4 w-4 text-green-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{provider?.availableCredits || 0}</div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowPurchaseModal(true)}
                className="mt-2 text-green-700 border-green-300 hover:bg-green-50"
              >
                Buy More
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{provider?.rating || 0}</div>
              <p className="text-xs text-gray-600">{provider?.totalWalks || 0} total walks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{provider?.hourlyRate || 0}</div>
              <p className="text-xs text-gray-600">per hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{completedBookings.reduce((sum, b) => sum + b.providerPayout, 0).toFixed(2)}
              </div>
              <p className="text-xs text-gray-600">{completedBookings.length} completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Bookings Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Bookings</CardTitle>
                <CardDescription>Accept new booking requests</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending bookings</p>
                ) : (
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => {
                      const client = users.find(u => u.id === booking.clientId);
                      return (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold">{client?.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.scheduledDate).toLocaleDateString()} at {new Date(booking.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <p className="text-sm text-gray-600">{booking.duration} minutes</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold text-green-700">R{booking.price.toFixed(2)}</p>
                            <Button
                              size="sm"
                              onClick={() => handleConfirmBooking(booking.id)}
                              disabled={isWalking}
                              className="bg-green-700 hover:bg-green-800"
                            >
                              Confirm Booking
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {confirmedBookings.length > 0 && (
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">Confirmed Bookings</CardTitle>
                  <CardDescription>Ready to start walks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {confirmedBookings.map((booking) => {
                      const client = users.find(u => u.id === booking.clientId);
                      return (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                          <div>
                            <p className="font-semibold">{client?.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.scheduledDate).toLocaleDateString()} at {new Date(booking.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <p className="text-sm text-gray-600">{booking.duration} minutes</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold text-green-700">R{booking.price.toFixed(2)}</p>
                            <Button
                              size="sm"
                              onClick={() => handleStartWalk(booking.id)}
                              disabled={isWalking}
                              className="bg-green-700 hover:bg-green-800"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start Walk
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeBookings.length > 0 && (
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">Active Walk in Progress</CardTitle>
                  <CardDescription>GPS tracking is active</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeBookings.map((booking) => {
                    const client = users.find(u => u.id === booking.clientId);
                    return (
                      <div key={booking.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Walking for {client?.name}</p>
                          <p className="text-sm text-gray-600">Tracking location...</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleEndWalk(booking.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Square className="w-4 h-4 mr-1" />
                          End Walk
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>Your past walks</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...completedBookings, ...myBookings.filter(b => b.status === 'cancelled')].map((booking) => {
                      const client = users.find(u => u.id === booking.clientId);
                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{client?.name}</TableCell>
                          <TableCell>{new Date(booking.scheduledDate).toLocaleDateString()}</TableCell>
                          <TableCell>{booking.duration} min</TableCell>
                          <TableCell>R{booking.providerPayout.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              booking.status === 'completed' ? 'default' : 'outline'
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
          </div>

          {/* Profile Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your public profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={provider?.name || ''} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={provider?.email || ''} disabled />
                </div>
                <div>
                  <Label>Bio</Label>
                  <Input value={provider?.bio || ''} placeholder="Tell clients about yourself" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={provider?.location?.address || ''} placeholder="Your service area" />
                </div>
                <div>
                  <Label>Hourly Rate (R)</Label>
                  <Input type="number" value={provider?.hourlyRate || 0} />
                </div>
                <Button className="w-full bg-green-700 hover:bg-green-800">
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>Set your working hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="monday">Monday</Label>
                  <Switch id="monday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="tuesday">Tuesday</Label>
                  <Switch id="tuesday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="wednesday">Wednesday</Label>
                  <Switch id="wednesday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="thursday">Thursday</Label>
                  <Switch id="thursday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="friday">Friday</Label>
                  <Switch id="friday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="saturday">Saturday</Label>
                  <Switch id="saturday" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sunday">Sunday</Label>
                  <Switch id="sunday" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input type="time" defaultValue="08:00" />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input type="time" defaultValue="18:00" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Purchase Credits Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>Buy credits to accept more bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[5, 10, 20].map((amount) => (
                  <Button
                    key={amount}
                    variant={creditAmount === amount ? 'default' : 'outline'}
                    onClick={() => setCreditAmount(amount)}
                    className={creditAmount === amount ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
                  >
                    {amount} credits
                  </Button>
                ))}
              </div>
              <div className="text-center p-4 bg-green-100 rounded-lg">
                <p className="text-2xl font-bold text-green-900">R{(creditAmount * 50).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total cost</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShowPurchaseModal(false)} className="flex-1 text-green-700 border-green-300 hover:bg-green-50">
                  Cancel
                </Button>
                <Button onClick={handlePurchaseCredits} className="flex-1 bg-green-700 hover:bg-green-800">
                  Purchase
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;