import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useUpdateSellerProfile } from "@/hooks/useSeller";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/Field";
import { PROVINCES } from "@/lib/constants";
import { ImageUploadButton } from "@/components/ui/image-upload";

export function SellerSettings() {
  const { seller, refresh } = useAuth();
  const update = useUpdateSellerProfile();

  const bank = (seller?.bank_details as Record<string, unknown> | null) ?? {};
  const socials = (seller?.social_links as Record<string, unknown> | null) ?? {};

  const [businessName, setBusinessName] = useState(seller?.business_name ?? "");
  const [description, setDescription] = useState(seller?.description ?? "");
  const [province, setProvince] = useState(seller?.province ?? "");
  const [phone, setPhone] = useState(seller?.phone ?? "");
  const [email, setEmail] = useState(seller?.email ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(seller?.logo_url ?? null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(seller?.banner_url ?? null);
  const [instagram, setInstagram] = useState(typeof socials.instagram === "string" ? socials.instagram : "");
  const [tiktok, setTiktok] = useState(typeof socials.tiktok === "string" ? socials.tiktok : "");
  const [bankName, setBankName] = useState(typeof bank.bank_name === "string" ? bank.bank_name : "");
  const [accountName, setAccountName] = useState(typeof bank.account_name === "string" ? bank.account_name : "");
  const [accountNumber, setAccountNumber] = useState(typeof bank.account_number === "string" ? bank.account_number : "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await update.mutateAsync({
        businessName,
        description,
        province,
        phone,
        email,
        logoUrl,
        bannerUrl,
        socialLinks: { instagram, tiktok },
        bankDetails: { bank_name: bankName, account_name: accountName, account_number: accountNumber },
      });
      await refresh();
      setMessage({ ok: true, text: "Store settings saved." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Store settings</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Business name">
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </Field>
          <Field label="Province">
            <Select value={province} onChange={(e) => setProvince(e.target.value)}>
              <option value="">Select…</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 …" inputMode="tel" />
          </Field>
          <Field label="Business email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>

        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </Field>

        <Field label="Store logo">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={supabase.storage.from("store-assets").getPublicUrl(logoUrl).data.publicUrl}
                alt=""
                className="h-12 w-12 object-cover"
              />
            )}
            <ImageUploadButton bucket="store-assets" onUploaded={setLogoUrl} />
          </div>
        </Field>

        <Field label="Store banner" hint="Wide banner shown on your store page.">
          <div className="flex items-center gap-3">
            {bannerUrl && (
              <img
                src={supabase.storage.from("store-assets").getPublicUrl(bannerUrl).data.publicUrl}
                alt=""
                className="h-16 w-32 object-cover"
              />
            )}
            <ImageUploadButton bucket="store-assets" onUploaded={setBannerUrl} />
          </div>
        </Field>

        <fieldset className="border border-neutral-200 p-5">
          <legend className="px-2 text-sm font-semibold text-neutral-900">Social links</legend>
          <div className="grid gap-5 pt-2 sm:grid-cols-2">
            <Field label="Instagram">
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="username" />
            </Field>
            <Field label="TikTok">
              <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="username" />
            </Field>
          </div>
        </fieldset>

        <fieldset className="border border-neutral-200 p-5">
          <legend className="px-2 text-sm font-semibold text-neutral-900">Bank details</legend>
          <div className="grid gap-5 pt-2 sm:grid-cols-2">
            <Field label="Bank name">
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </Field>
            <Field label="Account holder">
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </Field>
            <Field label="Account number">
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} inputMode="numeric" />
            </Field>
          </div>
        </fieldset>

        {message && (
          <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>
        )}

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save settings
        </Button>
      </form>
    </div>
  );
}
