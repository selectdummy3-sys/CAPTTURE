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
import { Checkbox } from "@/components/ui/checkbox";
import { PROVINCES } from "@/lib/constants";
import { ImageUploadButton } from "@/components/ui/image-upload";
import { getSellerTermsBlocks, RenderBlock } from "@/pages/StaticPages";

function notifyApplicationSubmitted(type: "registered" | "reapplied", businessName: string) {
  void supabase.functions
    .invoke("seller-applied", { body: { type, businessName } })
    .catch((err) => console.error("application email failed:", err));
}

export function SellerApplyPage() {
  const { user, seller, refresh } = useAuth();
  const navigate = useNavigate();

  const isReapply = seller?.application_status === "rejected";
  const bank = (seller?.bank_details as Record<string, string> | null) ?? {};
  const socials = (seller?.social_links as Record<string, string> | null) ?? {};

  const [businessName, setBusinessName] = useState(seller?.business_name ?? "");
  const [storeUsername, setStoreUsername] = useState(seller?.store_username ?? "");
  const [province, setProvince] = useState(seller?.province ?? "");
  const [addressLine1, setAddressLine1] = useState(seller?.address_line1 ?? "");
  const [city, setCity] = useState(seller?.city ?? "");
  const [postalCode, setPostalCode] = useState(seller?.postal_code ?? "");
  const [phone, setPhone] = useState(seller?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [description, setDescription] = useState(seller?.description ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(seller?.logo_url ?? null);
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(seller?.id_document_url ?? null);
  const [proofOfResidenceUrl, setProofOfResidenceUrl] = useState<string | null>(seller?.proof_of_residence_url ?? null);
  const [socialInstagram, setSocialInstagram] = useState(socials.instagram ?? "");
  const [socialTiktok, setSocialTiktok] = useState(socials.tiktok ?? "");
  const [socialFacebook, setSocialFacebook] = useState(socials.facebook ?? "");
  const [bankName, setBankName] = useState(bank.bank_name ?? "");
  const [bankAccountName, setBankAccountName] = useState(bank.account_name ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(bank.account_number ?? "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "terms">("form");
  const termBlocks = getSellerTermsBlocks();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step === "form") {
      setError(null);
      if (!/^[a-z0-9_]{3,24}$/.test(storeUsername)) {
        setError("Store handle must be 3–24 characters: lowercase letters, numbers or underscores.");
        return;
      }
      if (!idDocumentUrl) {
        setError("Please upload your ID document (front).");
        return;
      }
      if (!proofOfResidenceUrl) {
        setError("Please upload your proof of residence.");
        return;
      }
      if (!/^0\d{9}$/.test(phone.trim())) {
        setError("Phone number must be 10 digits starting with 0 (e.g. 0821234567).");
        return;
      }
      setStep("terms");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (!/^[a-z0-9_]{3,24}$/.test(storeUsername)) {
        throw new Error("Store handle must be 3–24 characters: lowercase letters, numbers or underscores.");
      }
      if (!idDocumentUrl) {
        throw new Error("Please upload your ID document (front).");
      }
      if (!proofOfResidenceUrl) {
        throw new Error("Please upload your proof of residence.");
      }
      if (!/^0\d{9}$/.test(phone.trim())) {
        throw new Error("Phone number must be 10 digits starting with 0 (e.g. 0821234567).");
      }
      if (!acceptedTerms) {
        throw new Error("Please read and accept the Seller Terms & Conditions to continue.");
      }

      const social_links: Record<string, string> = {};
      if (socialInstagram.trim()) social_links.instagram = socialInstagram.trim();
      if (socialTiktok.trim()) social_links.tiktok = socialTiktok.trim();
      if (socialFacebook.trim()) social_links.facebook = socialFacebook.trim();

      const { data: existing } = await supabase
        .from("sellers")
        .select("id, application_status")
        .eq("user_id", user!.id)
        .maybeSingle();

      const isReapply = existing?.application_status === "rejected";

      if (isReapply) {
        const { error: updateError } = await supabase
          .from("sellers")
          .update({
            business_name: businessName,
            store_username: slugify(storeUsername).replace(/-/g, "_").slice(0, 24),
            province,
            address_line1: addressLine1 || null,
            city: city || null,
            postal_code: postalCode || null,
            phone: phone || null,
            email: email || null,
            description: description || null,
            logo_url: logoUrl,
            id_document_url: idDocumentUrl,
            proof_of_residence_url: proofOfResidenceUrl,
            social_links,
            bank_details: {
              bank_name: bankName,
              account_name: bankAccountName,
              account_number: bankAccountNumber,
            },
            application_status: "pending",
            rejection_reason: null,
            accepted_terms_at: new Date().toISOString(),
          })
          .eq("id", existing!.id);
        if (updateError) {
          if (updateError.message.toLowerCase().includes("duplicate")) {
            throw new Error("That store handle is already taken. Try another.");
          }
          throw updateError;
        }
        void notifyApplicationSubmitted("reapplied", businessName);
      } else {
        const { error: insertError } = await supabase.from("sellers").insert({
          user_id: user!.id,
          accepted_terms_at: new Date().toISOString(),
          business_name: businessName,
          store_username: slugify(storeUsername).replace(/-/g, "_").slice(0, 24),
          province,
          address_line1: addressLine1 || null,
          city: city || null,
          postal_code: postalCode || null,
          phone: phone || null,
          email: email || null,
          description: description || null,
          logo_url: logoUrl,
          id_document_url: idDocumentUrl,
          proof_of_residence_url: proofOfResidenceUrl,
          social_links,
          bank_details: {
            bank_name: bankName,
            account_name: bankAccountName,
            account_number: bankAccountNumber,
          },
        });
        if (insertError) {
          if (insertError.message.toLowerCase().includes("duplicate")) {
            throw new Error("That store handle is already taken. Try another.");
          }
          throw insertError;
        }
        void notifyApplicationSubmitted("registered", businessName);
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
      {step === "form" ? (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            {isReapply ? "Re-apply to sell" : "Become a seller"}
          </h1>
          <p className="mt-2 text-neutral-500">
            {isReapply
              ? "Your previous application was declined. Update your details and submit again for review."
              : "Tell us about your business. We'll review your application within 24–48 hours."}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Review &amp; accept the Seller Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-neutral-500">
            Read the terms below, tick the agreement box, then submit your application for review.
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {step === "form" && (
          <>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Business name" hint="Shown on your store page.">
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </Field>
          <Field label="Store handle" hint="Your URL: captture.co.za/store/…">
            <Input
              value={storeUsername}
              onChange={(e) => setStoreUsername(e.target.value)}
              placeholder="e.g. my_awesome_store"
              required
            />
          </Field>
        </div>

        <Field label="Business email" hint="All seller updates and notifications will be sent to this address.">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>

        <Field label="Contact phone" hint="10 digits starting with 0, e.g. 0821234567.">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0XXXXXXXXX"
            inputMode="tel"
            maxLength={10}
            required
          />
        </Field>

        <Field label="Description" hint="A short pitch for your brand.">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </Field>

        <fieldset className="border border-neutral-200 p-5">
          <legend className="px-2 text-sm font-semibold text-neutral-900">Address</legend>
          <div className="space-y-5 pt-2">
            <Field label="Street address">
              <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="123 Main St" required />
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="City">
                <Input value={city} onChange={(e) => setCity(e.target.value)} required />
              </Field>
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
              <Field label="Postal code">
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} inputMode="numeric" required />
              </Field>
            </div>
          </div>
        </fieldset>

        <Field label="Store logo">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={supabase.storage.from("store-assets").getPublicUrl(logoUrl).data.publicUrl}
                alt=""
                className="h-12 w-12 object-cover"
              />
            )}
            <ImageUploadButton bucket="store-assets" onUploaded={setLogoUrl} crop={{ aspect: 1, width: 512, height: 512 }} />
          </div>
        </Field>

        <fieldset className="border border-neutral-200 p-5">
          <legend className="px-2 text-sm font-semibold text-neutral-900">Verification documents</legend>
          <p className="mb-4 text-xs text-neutral-500">Required for admin review. Images or PDF, max 5 MB each.</p>
          <div className="space-y-5">
            <Field label="ID document (front)" hint="National ID, passport or driver's licence.">
              <div className="flex items-center gap-3">
                {idDocumentUrl && (
                  <span className="text-sm text-green-600 font-medium">Uploaded ✓</span>
                )}
                <ImageUploadButton bucket="documents" onUploaded={setIdDocumentUrl} />
              </div>
            </Field>
            <Field label="Proof of residence" hint="Utility bill, bank statement or lease agreement (max 3 months old).">
              <div className="flex items-center gap-3">
                {proofOfResidenceUrl && (
                  <span className="text-sm text-green-600 font-medium">Uploaded ✓</span>
                )}
                <ImageUploadButton bucket="documents" onUploaded={setProofOfResidenceUrl} />
              </div>
            </Field>
          </div>
        </fieldset>

        <fieldset className="border border-neutral-200 p-5">
          <legend className="px-2 text-sm font-semibold text-neutral-900">Social handles</legend>
          <p className="mb-4 text-xs text-neutral-500">At least one is recommended to build trust with buyers.</p>
          <div className="space-y-5">
            <Field label="Instagram">
              <Input
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="@yourbrand"
              />
            </Field>
            <Field label="TikTok">
              <Input
                value={socialTiktok}
                onChange={(e) => setSocialTiktok(e.target.value)}
                placeholder="@yourbrand"
              />
            </Field>
            <Field label="Facebook">
              <Input
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                placeholder="facebook.com/yourbrand"
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="border border-neutral-200 p-5">
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

        <div className="flex justify-end">
          <Button type="submit">Next</Button>
        </div>
          </>
        )}

        {step === "terms" && (
          <div className="space-y-5">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-4">
              {termBlocks.map((block, i) => (
                <RenderBlock key={i} block={block} />
              ))}
            </div>
            <fieldset className="border border-neutral-200 p-5">
              <legend className="px-2 text-sm font-semibold text-neutral-900">Agreement</legend>
              <div className="pt-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  label={
                    <>
                      I confirm that I have read and agree to the{" "}
                      <span className="font-medium text-neutral-900">Seller Terms &amp; Conditions</span>, and that all
                      information provided is accurate.
                    </>
                  }
                />
              </div>
            </fieldset>
            <div className="flex items-center gap-3">
              <Button variant="outline" type="button" onClick={() => setStep("form")} disabled={submitting}>
                ← Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isReapply ? "Re-submit application" : "Submit application"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
