import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, Dog } from '@/types';
import { 
  LogOut, User, MapPin, Phone, Calendar, 
  Shield, Dog as DogIcon, Star, DollarSign, 
  CheckCircle, XCircle, Plus, Trash2 
} from 'lucide-react';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const profile = currentUser as Profile;

  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAddDogModal, setShowAddDogModal] = useState(false);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loadingDogs, setLoadingDogs] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [addDogStatus, setAddDogStatus] = useState<'success' | 'error' | null>(null);
  
  const [newDog, setNewDog] = useState({
    name: '',
    breed: '',
    age: 0,
    weight: 0,
    special_instructions: '',
  });

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    location: { lat: 0, lng: 0, address: '' } as any,
    hourly_rate: 0,
    services: [] as string[],
  });

  // Fetch dogs for current user
  useEffect(() => {
    if (!profile?.id) return;

    const fetchUserDogs = async () => {
      setLoadingDogs(true);
      try {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('owner_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching dogs:', error);
        } else {
          setDogs(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingDogs(false);
      }
    };

    fetchUserDogs();
  }, [profile?.id]);

  // Fetch reviews for current user (only for providers)
  useEffect(() => {
    if (!profile?.id || profile.role !== 'provider') return;

    const fetchUserReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('provider_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching reviews:', error);
        } else {
          setReviews(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchUserReviews();
  }, [profile?.id, profile?.role]);

  // Sync form data with current user
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        bio: profile.bio || '',
        location: profile.location || { lat: 0, lng: 0, address: '' },
        hourly_rate: profile.hourly_rate || 0,
        services: profile.services || [],
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddDog = async () => {
    if (!newDog.name || !newDog.breed) {
      alert('Please fill in the required fields (Name and Breed)');
      return;
    }

    setAddDogStatus(null);

    // Prepare the dog object with proper type conversions
    // Note: weight is stored as TEXT in the database, so we convert to string
    const dogData = {
      owner_id: profile!.id,
      name: newDog.name,
      breed: newDog.breed,
      age: Number(newDog.age) || 0,
      weight: String(Number(newDog.weight) || 0), // Convert to string for DB TEXT column
      special_instructions: newDog.special_instructions || '',
    };

    console.log('[handleAddDog] Attempting to add dog with data:', dogData);
    console.log('[handleAddDog] Age type:', typeof dogData.age, 'Value:', dogData.age);
    console.log('[handleAddDog] Weight type:', typeof dogData.weight, 'Value:', dogData.weight);

    try {
      const { error, data } = await supabase
        .from('dogs')
        .insert(dogData)
        .select()
        .single();

      if (error) {
        console.error('[handleAddDog] Error adding dog:', error);
        console.error('[handleAddDog] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        setAddDogStatus('error');
        alert(`Failed to add dog: ${error.message}`);
        return;
      }

      console.log('[handleAddDog] Dog added successfully:', data);
      
      setNewDog({ name: '', breed: '', age: 0, weight: 0, special_instructions: '' });
      setShowAddDogModal(false);
      setAddDogStatus('success');
      
      // Refresh dogs
      const { data: dogsData } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', profile!.id)
        .order('created_at', { ascending: false });
      setDogs(dogsData || []);
      
      alert('🐕 Dog added successfully!');
    } catch (err) {
      console.error('[handleAddDog] Unexpected error:', err);
      setAddDogStatus('error');
      alert('Failed to add dog. Please try again.');
    }
  };

  const handleRemoveDog = async (dogId: string) => {
    if (window.confirm('Are you sure you want to remove this dog?')) {
      try {
        const { error } = await supabase
          .from('dogs')
          .delete()
          .eq('id', dogId);

        if (error) {
          console.error('Error removing dog:', error);
          alert('Failed to remove dog');
        } else {
          setDogs(dogs.filter(d => d.id !== dogId));
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Failed to remove dog');
      }
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          location: formData.location,
          hourly_rate: formData.hourly_rate,
          services: formData.services,
        })
        .eq('id', profile!.id);

      if (error) {
        console.error('Error updating profile:', error);
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  };

  const renderClientProfile = () => (
    <>
      <div className="space-y-6">
        <div>
          <Label htmlFor="client-name">Full Name</Label>
          {isEditing ? (
            <Input
              id="client-name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{profile?.full_name}</p>
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
            <p className="text-sm text-gray-600 mt-1">{profile?.email}</p>
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
            <h3 className="text-base font-semibold">My Dogs</h3>
            <Button
              size="sm"
              onClick={() => setShowAddDogModal(true)}
              className="bg-green-700 hover:bg-green-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Dog
            </Button>
          </div>
          {dogs.length > 0 ? (
            <div className="space-y-3">
              {dogs.map((dog) => (
                <div key={dog.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <DogIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{dog.name}</p>
                      <p className="text-sm text-gray-600">{dog.breed} {dog.age > 0 && `• ${dog.age} years old`}</p>
                      {dog.special_instructions && (
                        <p className="text-xs text-gray-500 mt-1 max-w-md truncate">{dog.special_instructions}</p>
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
              <DogIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
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
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{profile?.full_name}</p>
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
            <p className="text-sm text-gray-600 mt-1">{profile?.email}</p>
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
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">R{formData.hourly_rate}/hour</p>
          )}
        </div>

        <div>
          <Label htmlFor="provider-services">Services</Label>
          {isEditing ? (
            <Input
              id="provider-services"
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
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{profile?.full_name}</p>
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
            <p className="text-sm text-gray-600 mt-1">{profile?.email}</p>
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
    switch (profile?.role) {
      case 'admin': return '/admin';
      case 'provider': return '/provider';
      case 'client': return '/client';
      default: return '/';
    }
  };

  const averageRating = calculateAverageRating();

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
        
        {/* Add Dog Success Alert */}
        {addDogStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">🐕 Dog added successfully!</p>
          </div>
        )}
        {addDogStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">Failed to add dog. Please try again.</p>
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
                <CardTitle className="text-center">{profile?.full_name}</CardTitle>
                <div className="text-center">
                  <Badge variant={
                    profile?.role === 'admin' ? 'default' :
                    profile?.role === 'provider' ? 'secondary' : 'outline'
                  }>
                    {profile?.role?.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {profile?.location?.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{profile.location.address}</span>
                  </div>
                )}
                {profile?.role === 'provider' && (
                  <>
                    <div className="flex items-center gap-3 text-sm pt-4 border-t">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-gray-600 font-medium">{profile.avg_rating?.toFixed(1)} Rating</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <DogIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">{profile.review_count} Reviews</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">R{profile.hourly_rate}/hour</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">{profile.credit_balance} Credits Available</span>
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
                {profile?.role === 'client' && renderClientProfile()}
                {profile?.role === 'provider' && renderProviderProfile()}
                {profile?.role === 'admin' && renderAdminProfile()}
              </CardContent>
            </Card>

            {/* Account Status Card */}
            {profile?.role !== 'admin' && (
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
                          {profile?.is_approved ? (
                            <span className="text-green-600">Active and Approved</span>
                          ) : (
                            <span className="text-amber-600">Pending Approval</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {profile?.is_suspended && (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Card */}
        {profile?.role === 'provider' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>What others say about you</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReviews ? (
                <div className="text-center py-8 text-gray-500">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No reviews yet</p>
                  <p className="text-sm text-gray-500 mt-1">Complete bookings to receive reviews from others</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Rating Summary */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= Math.round(averageRating)
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Client</p>
                              <p className="text-xs text-gray-500">
                                {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'fill-amber-500 text-amber-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
                    step="1"
                    placeholder="Age"
                    value={newDog.age || ''}
                    onChange={(e) => setNewDog({ ...newDog, age: parseInt(e.target.value, 10) || 0 })}
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
                  value={newDog.special_instructions}
                  onChange={(e) => setNewDog({ ...newDog, special_instructions: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDogModal(false);
                    setNewDog({ name: '', breed: '', age: 0, weight: 0, special_instructions: '' });
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