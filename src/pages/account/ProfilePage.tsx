import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { appUrl, supabase } from "@/lib/supabase";
import { MobilePageNav } from "@/components/account/MobilePageNav";
import { PhoneField } from "@/components/account/PhoneField";
import { SupportFab } from "@/components/support/SupportFab";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import { isNative } from "@/lib/capacitor";

function splitName(full?: string | null): [string, string] {
  const parts = (full ?? "").trim().split(/\s+/);
  return [parts[0] ?? "", parts.slice(1).join(" ")];
}

export function ProfilePage() {
  const { profile, user, refresh, signOut } = useAuth();
  const navigate = useNavigate();

  const [initialName, initialSurname] = splitName(profile?.full_name);
  const [name, setName] = useState(initialName);
  const [surname, setSurname] = useState(initialSurname);
  const [email, setEmail] = useState(profile?.email ?? user?.email ?? "");
  const [mobile, setMobile] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (!user) throw new Error("Not signed in.");
      const fullName = [name, surname].filter(Boolean).join(" ");

      if (email !== profile?.email && email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email },
          { emailRedirectTo: `${appUrl}/account/profile` }
        );
        if (emailError) throw emailError;
      }

      const { error: metaError } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (metaError) throw metaError;

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone: mobile || null })
        .eq("id", user.id);
      if (error) throw error;

      await refresh();
      setMessage({ ok: true, text: "Profile details saved." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (user) {
        await supabase.from("profiles").delete().eq("id", user.id);
      }
    } catch {
      // best-effort: profile removal may be restricted; the session is cleared below
    } finally {
      await signOut();
      setDeleting(false);
      setConfirmDelete(false);
      toast("You've been signed out. To permanently delete your account and data, contact support.");
      navigate("/", { replace: true });
    }
  };

  const inputClass =
    "h-12 rounded-xl border border-transparent bg-neutral-100 px-3.5 text-[15px] text-neutral-900 shadow-none placeholder:text-neutral-400 focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500";

  return (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
    >
      <div className="sticky top-0 z-20">
        <MobilePageNav title="Profile details" />
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
        {message && (
          <p className={`mb-4 text-sm ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="pd-name">
              <Input id="pd-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Surname" htmlFor="pd-surname">
              <Input id="pd-surname" className={inputClass} value={surname} onChange={(e) => setSurname(e.target.value)} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Email" htmlFor="pd-email">
              <Input id="pd-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Mobile number" hint="We'll confirm the number starting with +27.">
              <PhoneField value={mobile} onChange={setMobile} />
            </Field>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="mt-6 h-12 w-full rounded-xl bg-neutral-900 text-[15px] font-bold text-white hover:bg-neutral-800 active:bg-neutral-900"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </form>

        <section className="mt-6 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900">Login details</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-neutral-500">Email</dt>
              <dd className="truncate text-sm font-semibold text-neutral-900">{user?.email ?? profile?.email ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3">
              <dt className="text-sm text-neutral-500">Phone</dt>
              <dd className="text-sm font-semibold text-neutral-900">{mobile || profile?.phone || "Not set"}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900">Delete my online profile</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
            Deleting your profile removes your personal details and signs you out of this device. Your order history will be kept for record-keeping.
          </p>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-3 text-sm font-semibold text-red-500 underline underline-offset-4 transition-colors hover:text-red-600"
          >
            Delete my profile
          </button>
        </section>

        <Dialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          size="sm"
          title="Delete your profile?"
          description="This will remove your saved details and sign you out. This action can't be undone."
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void handleDelete()} loading={deleting}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-neutral-500">
            Your wishlist and saved address book will be removed from this profile.
          </p>
        </Dialog>
      </div>

      <SupportFab />
    </div>
  );
}