import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleNavbar from '@/components/RoleNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Dog } from '@/types';
import { Dog as DogIcon, Plus, Trash2, UploadCloud } from 'lucide-react';

const DOG_PHOTO_BUCKET = 'dog-photos';

export default function MyDogs() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    special_instructions: '',
  });

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 0 && form.breed.trim().length > 0;
  }, [form.name, form.breed]);

  const fetchMyDogs = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (!error) setDogs((data || []) as Dog[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyDogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!open) {
      setPhotoFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open]);

  const handlePhotoPick = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image under 5MB.');
      return;
    }

    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const uploadDogPhotoIfNeeded = async (ownerId: string) => {
    if (!photoFile) return null;

    setUploadingPhoto(true);
    try {
      const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${ownerId}/dogs/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(DOG_PHOTO_BUCKET)
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(DOG_PHOTO_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddDog = async () => {
    if (!canSubmit) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const age = form.age.trim() ? Number(form.age) : null;
    const weight = form.weight.trim() ? String(form.weight) : null;

    const image_url = await uploadDogPhotoIfNeeded(user.id);

    const { error } = await supabase.from('dogs').insert({
      owner_id: user.id,
      name: form.name.trim(),
      breed: form.breed.trim(),
      age,
      weight,
      special_instructions: form.special_instructions.trim() || null,
      image_url,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setForm({ name: '', breed: '', age: '', weight: '', special_instructions: '' });
    setPhotoFile(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setOpen(false);
    await fetchMyDogs();
  };

  const handleDeleteDog = async (dogId: string) => {
    const { error } = await supabase.from('dogs').delete().eq('id', dogId);
    if (error) {
      alert(error.message);
      return;
    }
    setDogs((prev) => prev.filter((d) => d.id !== dogId));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar activeKey="dogs" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">My Dogs</h1>
            <p className="mt-1 text-sm font-medium text-slate-600">Manage your pups for faster booking.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                <Plus className="mr-2 h-4 w-4" />
                Add Dog
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add a dog</DialogTitle>
                <DialogDescription>We'll use this profile when you book a walk.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dog-photo">Dog photo</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Dog preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <UploadCloud className="h-5 w-5 text-emerald-700" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <Input
                        id="dog-photo"
                        type="file"
                        accept="image/*"
                        className="rounded-xl file:mr-3 file:rounded-full file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePhotoPick(f);
                        }}
                      />
                      <p className="mt-2 text-xs font-medium text-slate-500">PNG/JPG, up to 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dog-name">Name</Label>
                  <Input
                    id="dog-name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="rounded-xl"
                    placeholder="e.g. Luna"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dog-breed">Breed</Label>
                  <Input
                    id="dog-breed"
                    value={form.breed}
                    onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                    className="rounded-xl"
                    placeholder="e.g. Labrador"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="dog-age">Age</Label>
                    <Input
                      id="dog-age"
                      inputMode="numeric"
                      value={form.age}
                      onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                      className="rounded-xl"
                      placeholder="Years"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dog-weight">Weight</Label>
                    <Input
                      id="dog-weight"
                      value={form.weight}
                      onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                      className="rounded-xl"
                      placeholder="kg"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dog-notes">Special instructions</Label>
                  <Textarea
                    id="dog-notes"
                    value={form.special_instructions}
                    onChange={(e) => setForm((p) => ({ ...p, special_instructions: e.target.value }))}
                    className="min-h-[90px] rounded-xl"
                    placeholder="Anything a walker should know?"
                  />
                </div>

                <Button
                  onClick={handleAddDog}
                  disabled={!canSubmit || uploadingPhoto}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800"
                >
                  {uploadingPhoto ? 'Uploading…' : 'Save dog'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="py-10 text-center text-sm font-medium text-slate-600">Loading your dogs…</CardContent>
          </Card>
        ) : dogs.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-slate-300 bg-white">
            <CardContent className="py-14">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                  <DogIcon className="h-7 w-7 text-emerald-700" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">No dogs yet</h2>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Add your first dog to start booking walks with approved providers.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button onClick={() => setOpen(true)} className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first dog
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-slate-200"
                    onClick={() => navigate('/book')}
                  >
                    Book a walker
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dogs.map((dog) => (
              <Card key={dog.id} className="overflow-hidden rounded-2xl border-slate-200 bg-white">
                <div className="relative">
                  <div className="aspect-[16/9] w-full bg-emerald-50">
                    {dog.image_url ? (
                      <img src={dog.image_url} alt={dog.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center">
                        <DogIcon className="h-8 w-8 text-emerald-700" />
                      </div>
                    )}
                  </div>
                  <div className="absolute left-3 top-3">
                    <Badge className="rounded-full bg-white/90 text-emerald-900 shadow-sm hover:bg-white/90">Active</Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{dog.name}</CardTitle>
                      <CardDescription>{dog.breed}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <p className="text-xs font-semibold text-slate-500">Age</p>
                      <p className="mt-0.5 font-bold text-slate-900">{dog.age ? `${dog.age}y` : '—'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <p className="text-xs font-semibold text-slate-500">Weight</p>
                      <p className="mt-0.5 font-bold text-slate-900">{dog.weight ? `${dog.weight}` : '—'}</p>
                    </div>
                  </div>

                  {dog.special_instructions ? (
                    <p className="line-clamp-3 text-sm text-slate-600">{dog.special_instructions}</p>
                  ) : (
                    <p className="text-sm text-slate-500">No special instructions.</p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      className="rounded-full border-slate-200"
                      onClick={() => navigate('/book')}
                    >
                      Book a walk
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      onClick={() => handleDeleteDog(dog.id)}
                      aria-label={`Remove ${dog.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}