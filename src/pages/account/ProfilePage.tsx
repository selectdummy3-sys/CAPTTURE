import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import { ImageUploadButton } from "@/components/ui/image-upload";

export function ProfilePage() {
  const { profile, refresh } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (authError) throw authError;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq("id", profile!.id);
      if (error) throw error;

      await refresh();
      setMessage({ ok: true, text: "Profile updated." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Profile</h1>
      <p className="mt-1 text-sm text-neutral-500">Keep your details up to date.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">Profile photo</p>
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center overflow-hidden bg-neutral-100">
              {avatarUrl ? (
                <img
                  src={supabase.storage.from("avatars").getPublicUrl(avatarUrl).data.publicUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-neutral-400">Photo</span>
              )}
            </div>
            <ImageUploadButton bucket="avatars" onUploaded={setAvatarUrl} crop={{ aspect: 1, width: 512, height: 512 }} />
          </div>
        </div>

        <Field label="Full name">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>

        <Field label="Phone number" hint="Used for delivery and order updates.">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 …" inputMode="tel" />
        </Field>

        <Field label="Email">
          <Input value={profile?.email ?? ""} disabled />
        </Field>

        {message && (
          <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>
        )}

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </form>
    </div>
  );
}
