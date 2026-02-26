import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, Shield, UserRound } from "lucide-react";

import RoleNavbar from "@/components/RoleNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const AVATAR_BUCKET = "avatars";
const AVATAR_BUCKET_FALLBACK = "dog-photos";

export default function Profile() {
  const { currentUser, setCurrentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [walkRate, setWalkRate] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setFullName(currentUser.full_name || "");
    setPhone(currentUser.phone || "");
    setWalkRate(currentUser.walk_rate === null || currentUser.walk_rate === undefined ? "" : String(currentUser.walk_rate));
    setAvatarUrl(currentUser.avatar_url || null);
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [currentUser]);

  const roleLabel = useMemo(() => {
    switch (currentUser?.role) {
      case "admin":
        return "Admin";
      case "provider":
        return "Provider";
      case "client":
        return "Client";
      default:
        return "";
    }
  }, [currentUser?.role]);

  const handleAvatarPick = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please choose a PNG/JPG image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please choose an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const uploadToBucket = async (bucket: string, path: string, file: File) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadAvatarIfNeeded = async () => {
    if (!avatarFile || !currentUser) return avatarUrl;

    setUploading(true);
    try {
      const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${currentUser.id}/avatar-${Date.now()}.${ext}`;

      try {
        return await uploadToBucket(AVATAR_BUCKET, path, avatarFile);
      } catch (e: any) {
        // If the dedicated avatar bucket doesn't exist, fall back to the shared dog photos bucket.
        if (typeof e?.message === "string" && /bucket/i.test(e.message) && /not found/i.test(e.message)) {
          return await uploadToBucket(AVATAR_BUCKET_FALLBACK, path, avatarFile);
        }
        throw e;
      }
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const nextAvatarUrl = await uploadAvatarIfNeeded();

      const walkRateValue = walkRate.trim() === "" ? null : Number(walkRate);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          avatar_url: nextAvatarUrl,
          ...(currentUser.role === "provider" ? { walk_rate: walkRateValue } : {}),
        })
        .eq("id", currentUser.id);

      if (error) throw error;

      setAvatarUrl(nextAvatarUrl || null);
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);

      setCurrentUser({
        ...currentUser,
        full_name: fullName,
        phone: phone || null,
        avatar_url: nextAvatarUrl || null,
        ...(currentUser.role === "provider" ? { walk_rate: walkRateValue ?? undefined } : {}),
      });

      toast({
        title: "Saved",
        description: "Your profile has been updated.",
      });
    } catch (e: any) {
      toast({
        title: "Could not save",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  const displayAvatar = avatarPreview || avatarUrl;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <RoleNavbar />

      <main className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          <Card className="rounded-3xl border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-extrabold tracking-tight text-slate-900">Your account</CardTitle>
              <CardDescription className="text-slate-600">Keep your details up to date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-green-100 ring-1 ring-green-200">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center">
                        <UserRound className="h-7 w-7 text-green-700" />
                      </div>
                    )}
                  </div>
                  <Label
                    htmlFor="avatar"
                    className="absolute -bottom-2 -right-2 grid h-9 w-9 cursor-pointer place-items-center rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm hover:bg-green-50"
                    title="Change photo"
                  >
                    <Camera className="h-4 w-4 text-slate-700" />
                  </Label>
                </div>

                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold tracking-tight text-slate-900">
                    {currentUser?.full_name || "—"}
                  </div>
                  <div className="truncate text-sm font-semibold text-green-700">{currentUser?.email}</div>
                </div>
              </div>

              <input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarPick(f);
                }}
              />

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-700" />
                  <div className="text-sm font-bold text-slate-900">Role</div>
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {roleLabel}
                  {currentUser?.role !== "admin" ? (
                    <span className="ml-1">(read-only)</span>
                  ) : (
                    <span className="ml-1">(managed in Admin Dashboard)</span>
                  )}
                </div>
              </div>

              <Separator />

              <Button
                onClick={onLogout}
                className="w-full rounded-2xl bg-rose-600 text-white hover:bg-rose-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <p className="text-xs text-slate-500">
                Use this logout button anytime—it's always available here as a backup.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-extrabold tracking-tight text-slate-900">Profile settings</CardTitle>
              <CardDescription className="text-slate-600">
                Update your name, phone number, and profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-2xl"
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-2xl"
                    placeholder="e.g. +1 555 123 4567"
                  />
                </div>
              </div>

              {currentUser?.role === "provider" && (
                <div className="space-y-2">
                  <Label htmlFor="walkRate">Your Walk Rate</Label>
                  <Input
                    id="walkRate"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={1}
                    value={walkRate}
                    onChange={(e) => setWalkRate(e.target.value)}
                    className="rounded-2xl"
                    placeholder="e.g. 250"
                  />
                  <p className="text-xs text-slate-500">Used for provider pricing (saved to profiles.walk_rate).</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={roleLabel} disabled className="rounded-2xl" />
                <p className="text-xs text-slate-500">
                  {currentUser?.role === "admin"
                    ? "Role changes are done from the Admin Dashboard."
                    : "Your role is locked. Only an Admin can change it."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={onSave}
                  disabled={saving || uploading}
                  className="rounded-2xl bg-green-700 text-white hover:bg-green-800"
                >
                  {saving ? "Saving…" : uploading ? "Uploading…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    if (!currentUser) return;
                    setFullName(currentUser.full_name || "");
                    setPhone(currentUser.phone || "");
                    setWalkRate(
                      currentUser.walk_rate === null || currentUser.walk_rate === undefined
                        ? ""
                        : String(currentUser.walk_rate)
                    );
                    setAvatarFile(null);
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                    setAvatarPreview(null);
                    setAvatarUrl(currentUser.avatar_url || null);
                  }}
                >
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}