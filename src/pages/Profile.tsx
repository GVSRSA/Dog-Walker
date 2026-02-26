import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LogOut, User, MapPin, Phone, Calendar, 
  Shield, Dog, Star, DollarSign, Clock, 
  CheckCircle, XCircle, Plus, Trash2 
} from 'lucide-react';

const Profile = () => {
  const { currentUser, updateProfile, addDog, removeDog } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAddDogModal, setShowAddDogModal] = useState(false);
  const [newDog, setNewDog] = useState({
    name: '',
    breed: '',
    age: 0,
    weight: 0,
    notes: '',
  });

  // Form state for different user types
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: { lat: 0, lng: 0, address: '' },
    hourlyRate: 0,
    services: [] as string[],
    availableCredits: 0,
    rating: 0,
    totalWalks: 0,
    availability: { days: [] as string[], startTime: '', endTime: '' },
  });

  // Sync form data with current user
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: (currentUser as any).phone || '',
        bio: (currentUser as any).bio || '',
        location: (currentUser as any).location || { lat: 0, lng: 0, address: '' },
        hourlyRate: (currentUser as any).hourlyRate || 0,
        services: (currentUser as any).services || [],
        availableCredits: (currentUser as any).availableCredits || 0,
        rating: (currentUser as any).rating || 0,
        totalWalks: (currentUser as any).totalWalks || 0,
        availability: (currentUser as any).availability || { days: [], startTime: '09:00', endTime: '18:00' },
      });
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddDog = () => {
    if (!newDog.name || !newDog.breed) return;

    addDog(currentUser!.id, {
      name: newDog.name,
      breed: newDog.breed,
      age: newDog.age || 0,
      weight: newDog.weight || 0,
      notes: newDog.notes || '',
    });

    setNewDog({ name: '', breed: '', age: 0, weight: 0, notes: '' });
    setShowAddDogModal(false);
  };

  const handleRemoveDog = (dogId: string) => {
    if (window.confirm('Are you sure you want to remove this dog?')) {
      removeDog(currentUser!.id, dogId);
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    try {
      // Simulate API call
      setTimeout(() => {
        updateProfile(currentUser!.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          bio: formData.bio,
          location: formData.location,
          hourlyRate: formData.hourlyRate,
          services: formData.services,
          availability: formData.availability,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      }, 500);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const renderClientProfile = () => (
    <>
      <div className="space-y-6">
        <div>
          <Label htmlFor="client-name">Full Name</Label>
          {isEditing ? (
            <Input
              id="client-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{currentUser?.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="client-email">Email</Label>
          {isEditing ? (
            <Input
              id="client-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{currentUser?.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="client-phone">Phone</Label>
          {isEditing ? (
            <Input
              id="client-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{(currentUser as any).phone || 'Not provided'}</p>
          )}
        </div>

        <div>
          <Label htmlFor="client-location">Location</Label>
          {isEditing ? (
            <Input
              id="client-location"
              placeholder="Enter your address"
              value={formData.location?.address || ''}
              onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{formData.location?.address || 'Not provided'}</p>
          )}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-semibold">My Dogs</Label>
            <Button
              size="sm"
              onClick={() => setShowAddDogModal(true)}
              className="bg-green-700 hover:bg-green-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Dog
            </Button>
          </div>
          {(currentUser as any).dogs && (currentUser as any).dogs.length > 0 ? (
            <div className="space-y-3">
              {(currentUser as any).dogs.map((dog: any) => (
                <div key={dog.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Dog className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{dog.name}</p>
                      <p className="text-sm text-gray-600">{dog.breed} {dog.age > 0 && `• ${dog.age} years old`}</p>
                      {dog.notes && (
                        <p className="text-xs text-gray-500 mt-1 max-w-md truncate">{dog.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Active</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveDog(dog.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Dog className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No dogs registered yet</p>
              <Button
                size="sm"
                onClick={() => setShowAddDogModal(true)}
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Dog
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderProviderProfile = () => (
    <>
      <div className="space-y-6">
        <div>
          <Label htmlFor="provider-name">Full Name</Label>
          {isEditing ? (
            <Input
              id="provider-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{currentUser?.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="provider-email">Email</Label>
          {isEditing ? (
            <Input
              id="provider-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{currentUser?.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="provider-phone">Phone</Label>
          {isEditing ? (
            <Input
              id="provider-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{(currentUser as any).phone || 'Not provided'}</p>
          )}
        </div>

        <div>
          <Label htmlFor="provider-bio">Bio</Label>
          {isEditing ? (
            <Input
              id="provider-bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{formData.bio || 'No bio provided'}</p>
          )}
        </div>

        <div>
          <Label htmlFor="provider-location">Location</Label>
          {isEditing ? (
            <Input
              id="provider-location"
              placeholder="Enter your service area"
              value={formData.location?.address || ''}
              onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{formData.location?.address || 'Not provided'}</p>
          )}
        </div>

        <div>
          <Label htmlFor="provider-hourly-rate">Hourly Rate (R)</Label>
          {isEditing ? (
            <Input
              id="provider-hourly-rate"
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">R{formData.hourlyRate}/hour</p>
          )}
        </div>

        <div>
          <Label>Services</Label>
          {isEditing ? (
            <Input
              placeholder="Comma-separated services (e.g., Walking, Pet Sitting)"
              value={formData.services.join(', ')}
              onChange={(e) => setFormData({ ...formData, services: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            />
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.services.map((service, idx) => (
                <Badge key={idx} variant="secondary">{service}</Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Availability</Label>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="flex items-center gap-2">
                <Switch
                  id={`day-${day}`}
                  checked={formData.availability.days.includes(day)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability,
                          days: [...formData.availability.days, day]
                        }
                      });
                    } else {
                      setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability,
                          days: formData.availability.days.filter(d => d !== day)
                        }
                      });
                    }
                  }}
                  disabled={!isEditing}
                />
                <Label htmlFor={`day-${day}`} className="text-sm">{day}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={formData.availability.startTime}
              onChange={(e) => setFormData({ ...formData, availability: { ...formData.availability, startTime: e.target.value } })}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={formData.availability.endTime}
              onChange={(e) => setFormData({ ...formData, availability: { ...formData.availability, endTime: e.target.value } })}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>
    </>
  );

  const renderAdminProfile = () => (
    <>
      <div className="space-y-6">
        <div>
          <Label htmlFor="admin-name">Full Name</Label>
          {isEditing ? (
            <Input
              id="admin-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{currentUser?.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="admin-email">Email</Label>
          {isEditing ? (
            <Input
              id="admin-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{currentUser?.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="admin-phone">Phone</Label>
          {isEditing ? (
            <Input
              id="admin-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{(currentUser as any).phone || 'Not provided'}</p>
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            As an administrator, you have full access to manage users, bookings, and platform settings.
          </p>
        </div>
      </div>
    </>
  );

  const getDashboardRoute = () => {
    switch (currentUser?.role) {
      case 'admin': return '/admin';
      case 'provider': return '/provider';
      case 'client': return '/client';
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Profile</h1>
              <p className="text-sm text-green-700 font-medium">by Jolly Walker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={getDashboardRoute()}>
              <Button variant="ghost">Back to Dashboard</Button>
            </Link>
            <Button variant="ghost" onClick={() => setShowLogoutDialog(true)}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Save Status Alert */}
        {saveStatus === 'saved' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Profile updated successfully!</p>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">Failed to update profile. Please try again.</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-center">{currentUser?.name}</CardTitle>
                <CardDescription className="text-center">
                  <Badge variant={
                    currentUser?.role === 'admin' ? 'default' : 
                    currentUser?.role === 'provider' ? 'secondary' : 'outline'
                  }>
                    {currentUser?.role?.toUpperCase()}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Member since {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {(currentUser as any).phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{(currentUser as any).phone}</span>
                  </div>
                )}
                {(currentUser as any).location?.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{(currentUser as any).location.address}</span>
                  </div>
                )}
                {currentUser?.role === 'provider' && (
                  <>
                    <div className="flex items-center gap-3 text-sm pt-4 border-t">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-gray-600 font-medium">{formData.rating} Rating</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Dog className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">{formData.totalWalks} Walks Completed</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">R{formData.hourlyRate}/hour</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">{formData.availableCredits} Credits Available</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      {isEditing ? 'Edit your profile details' : 'View and manage your profile'}
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={saveStatus === 'saving'}
                    className={isEditing ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
                  >
                    {saveStatus === 'saving' ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentUser?.role === 'client' && renderClientProfile()}
                {currentUser?.role === 'provider' && renderProviderProfile()}
                {currentUser?.role === 'admin' && renderAdminProfile()}
              </CardContent>
            </Card>

            {/* Account Status Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-gray-600">
                        {currentUser?.isApproved ? (
                          <span className="text-green-600">Active and Approved</span>
                        ) : (
                          <span className="text-amber-600">Pending Approval</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {currentUser?.isSuspended && (
                    <Badge variant="destructive">Suspended</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Dog Modal */}
      {showAddDogModal && (
        <Dialog open={showAddDogModal} onOpenChange={setShowAddDogModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Dog</DialogTitle>
              <DialogDescription>Register your furry friend in the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dog-name">Name *</Label>
                <Input
                  id="dog-name"
                  placeholder="Dog's name"
                  value={newDog.name}
                  onChange={(e) => setNewDog({ ...newDog, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dog-breed">Breed *</Label>
                <Input
                  id="dog-breed"
                  placeholder="e.g., Golden Retriever, Labrador"
                  value={newDog.breed}
                  onChange={(e) => setNewDog({ ...newDog, breed: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dog-age">Age (years)</Label>
                  <Input
                    id="dog-age"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Age"
                    value={newDog.age || ''}
                    onChange={(e) => setNewDog({ ...newDog, age: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="dog-weight">Weight (kg)</Label>
                  <Input
                    id="dog-weight"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Weight"
                    value={newDog.weight || ''}
                    onChange={(e) => setNewDog({ ...newDog, weight: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dog-notes">Special Instructions / Notes</Label>
                <Input
                  id="dog-notes"
                  placeholder="e.g., Needs longer walks, food allergies, etc."
                  value={newDog.notes}
                  onChange={(e) => setNewDog({ ...newDog, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDogModal(false);
                    setNewDog({ name: '', breed: '', age: 0, weight: 0, notes: '' });
                  }}
                  className="flex-1 text-green-700 border-green-300 hover:bg-green-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDog}
                  disabled={!newDog.name || !newDog.breed}
                  className="flex-1 bg-green-700 hover:bg-green-800"
                >
                  Add Dog
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>Are you sure you want to logout? You'll need to login again to access your account.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleLogout} className="flex-1 bg-green-700 hover:bg-green-800">
                Logout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Profile;