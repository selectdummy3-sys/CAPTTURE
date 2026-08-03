import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/Field";
import { PROVINCES } from "@/lib/constants";
import { ImageUploadButton } from "@/components/ui/image-upload";

export function SellerApplyPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [storeUsername, setStoreUsername] = useState("");
  const [province, setProvince] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!/^[a-z0-9_]{3,24}$/.test(storeUsername)) {
        throw new Error("Store handle must be 3–24 characters: lowercase letters, numbers or underscores.");
      }
      const { error: insertError } = await supabase.from("sellers").insert({
        user_id: user!.id,
        business_name: businessName,
        store_username: slugify(storeUsername).replace(/-/g, "_").slice(0, 24),
        province,
        phone: phone || null,
        email: email || null,
        description: description || null,
        logo_url: logoUrl,
        bank_details: {
          bank_name: bankName,
          account_name: bankAccountName,
          account_number: bankAccountNumber,
        },
      });
      if (insertError) {
        if (insertError.message.toLowerCase().includes("duplicate")) {
          throw new Error("That store handle is already taken. Try another one.");
        }
        throw insertError;
      }
      await refresh();
      navigate("/seller", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Become a seller</h1>
      <p className="mt-2 text-neutral-500">
        Tell us about your business. We'll review your application within 24–48 hours.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Business name" hint="Shown on your store page.">
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </Field>
          <Field label="Store handle" hint="Your URL: cappture.co.za/store/…">
            <Input
              value={storeUsername}
              onChange={(e) => setStoreUsername(e.target.value)}
              placeholder="e.g. my_awesome_store"
              required
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Province">
            <Select value={province} onChange={(e) => setProvince(e.target.value)} required>
              <option value="">Select…</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contact phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 …" inputMode="tel" />
          </Field>
        </div>

        <Field label="Business email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>

        <Field label="Description" hint="A short pitch for your brand.">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </Field>

        <Field label="Store logo">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={supabase.storage.from("store-assets").getPublicUrl(logoUrl).data.publicUrl}
                alt=""
                className="h-12 w-12 rounded-lg object-cover"
              />
            )}
            <ImageUploadButton bucket="store-assets" onUploaded={setLogoUrl} />
          </div>
        </Field>

        <fieldset className="rounded-xl border border-neutral-200 p-5">
          <legend className="px-2 text-sm font-semibold text-neutral-900">Payout details</legend>
          <div className="space-y-5 pt-2">
            <Field label="Bank name">
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Standard Bank" required />
            </Field>
            <Field label="Account holder name">
              <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} required />
            </Field>
            <Field label="Account number">
              <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} inputMode="numeric" required />
            </Field>
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit application
        </Button>
      </form>
    </div>
  );
}
