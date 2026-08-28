import { useEffect, useState } from "react";
import { Megaphone, Percent, Wallet, Zap } from "lucide-react";
import { toast } from "sonner";

import {
  useAdminCommissionStats,
  useAnnouncement,
  useCommissionSettings,
  useSetAnnouncement,
  useSetCommissionSettings,
} from "@/hooks/useAdminSettings";
import { useAdminPayFastConfig, useSetPayFastConfig } from "@/hooks/usePayFast";
import { StatCard } from "@/components/ui/stat-card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { formatZAR } from "@/lib/utils";

const toPercent = (rate: number) => Number((rate * 100).toFixed(2));

export default function AdminSettings() {
  const { data: settings, isLoading } = useCommissionSettings();
  const { data: stats, isLoading: statsLoading } = useAdminCommissionStats();
  const save = useSetCommissionSettings();

  const { data: announcement, isLoading: announcementLoading } = useAnnouncement();
  const saveAnnouncement = useSetAnnouncement();

  const [enabled, setEnabled] = useState(true);
  const [rate, setRate] = useState("8");
  const [saving, setSaving] = useState(false);

  const [announcementText, setAnnouncementText] = useState("");
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  const { data: payfast, isLoading: payfastLoading } = useAdminPayFastConfig();
  const savePayFast = useSetPayFastConfig();

  const [pfMerchantId, setPfMerchantId] = useState("");
  const [pfMerchantKey, setPfMerchantKey] = useState("");
  const [pfPassphrase, setPfPassphrase] = useState("");
  const [pfSandbox, setPfSandbox] = useState(true);
  const [pfMerchantName, setPfMerchantName] = useState("CAPPTURE");
  const [pfReturnUrl, setPfReturnUrl] = useState("");
  const [pfCancelUrl, setPfCancelUrl] = useState("");
  const [pfNotifyUrl, setPfNotifyUrl] = useState("");
  const [savingPayFast, setSavingPayFast] = useState(false);

  useEffect(() => {
    if (payfast) {
      setPfMerchantId(payfast.merchant_id);
      setPfSandbox(payfast.sandbox);
      setPfMerchantName(payfast.merchant_name);
      setPfReturnUrl(payfast.return_url);
      setPfCancelUrl(payfast.cancel_url);
      setPfNotifyUrl(payfast.notify_url);
    }
  }, [payfast]);

  const payFastDirty = payfast
    ? pfMerchantId !== payfast.merchant_id ||
      pfSandbox !== payfast.sandbox ||
      pfMerchantName !== payfast.merchant_name ||
      pfReturnUrl !== payfast.return_url ||
      pfCancelUrl !== payfast.cancel_url ||
      pfNotifyUrl !== payfast.notify_url ||
      pfMerchantKey.trim() !== "" ||
      pfPassphrase.trim() !== ""
    : false;

  const handleSavePayFast = async () => {
    const urlFields: Array<[string, string]> = [
      ["Return URL", pfReturnUrl],
      ["Cancel URL", pfCancelUrl],
      ["Notify URL", pfNotifyUrl],
    ];
    for (const [label, value] of urlFields) {
      if (value && !/^https?:\/\//i.test(value)) {
        toast.error(`${label} must start with http:// or https://`);
        return;
      }
    }
    if (pfReturnUrl && !pfCancelUrl) {
      toast.error("Cancel URL is required when a Return URL is set (PayFast redirects to both).");
      return;
    }
    setSavingPayFast(true);
    try {
      await savePayFast.mutateAsync({
        merchant_id: pfMerchantId.trim(),
        merchant_key: pfMerchantKey.trim(),
        passphrase: pfPassphrase.trim(),
        sandbox: pfSandbox,
        merchant_name: pfMerchantName.trim(),
        return_url: pfReturnUrl.trim(),
        cancel_url: pfCancelUrl.trim(),
        notify_url: pfNotifyUrl.trim(),
      });
      setPfMerchantKey("");
      setPfPassphrase("");
      toast.success("PayFast settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save PayFast settings");
    } finally {
      setSavingPayFast(false);
    }
  };

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setRate(String(toPercent(settings.rate)));
    }
  }, [settings]);

  useEffect(() => {
    if (announcement) {
      setAnnouncementText(announcement.text);
      setAnnouncementEnabled(announcement.enabled);
    }
  }, [announcement]);

  const dirty = settings
    ? enabled !== settings.enabled || rate !== String(toPercent(settings.rate))
    : false;

  const handleSave = async () => {
    const parsed = Number(rate);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 50) {
      toast.error("Commission rate must be between 0% and 50%");
      return;
    }
    setSaving(true);
    try {
      await save.mutateAsync({ enabled, rate: Number((parsed / 100).toFixed(4)) });
      toast.success("Commission settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save commission settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (announcementText.length > 500) {
      toast.error("Announcement must be at most 500 characters");
      return;
    }
    setSavingAnnouncement(true);
    try {
      await saveAnnouncement.mutateAsync({ text: announcementText.trim(), enabled: announcementEnabled });
      toast.success("Announcement saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save announcement");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">Manage platform fees and marketplace commission.</p>
      </div>

      {/* Commission totals */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total commission"
          value={formatZAR(stats?.total ?? 0)}
          icon={<Percent className="h-5 w-5" />}
          hint={`${stats?.count ?? 0} order${(stats?.count ?? 0) === 1 ? "" : "s"} charged`}
          loading={statsLoading}
        />
        <StatCard
          label="Collected"
          value={formatZAR(stats?.collected ?? 0)}
          icon={<Wallet className="h-5 w-5" />}
          hint="Marked as paid"
          loading={statsLoading}
        />
        <StatCard
          label="Pending"
          value={formatZAR(stats?.pending ?? 0)}
          icon={<Wallet className="h-5 w-5" />}
          hint="Awaiting payout"
          loading={statsLoading}
        />
      </div>

      {/* Commission settings */}
      <section className="mt-8 max-w-xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold text-neutral-900">Marketplace commission</h2>
        <p className="mt-1 text-sm text-neutral-500">
          A percentage of every order paid to the receiving seller. Turned off means no commission is
          charged on new orders.
        </p>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">Charge commission</p>
            <p className="text-xs text-neutral-500">
              {enabled ? "Commission applies to new orders" : "New orders are commission-free"}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={isLoading || saving}
          />
        </div>

        <div className="mt-5">
          <Field label="Commission rate (%)">
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="50"
                step="0.25"
                value={rate}
                disabled={!enabled || isLoading || saving}
                onChange={(e) => setRate(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">%</span>
            </div>
          </Field>
          <p className="mt-1 text-xs text-neutral-400">Between 0% and 50%. Applied to the order total.</p>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave} disabled={!dirty || saving} loading={saving}>
            Save changes
          </Button>
        </div>
      </section>

      {/* Announcement bar */}
      <section className="mt-8 max-w-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-neutral-500" />
          <h2 className="font-semibold text-neutral-900">Announcement bar</h2>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          A short message shown at the top of every storefront page. Great for promotions and shipping
          notices.
        </p>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">Show announcement</p>
            <p className="text-xs text-neutral-500">
              {announcementEnabled ? "Visible to shoppers" : "Hidden from shoppers"}
            </p>
          </div>
          <Switch
            checked={announcementEnabled}
            onCheckedChange={setAnnouncementEnabled}
            disabled={announcementLoading || savingAnnouncement}
          />
        </div>

        <div className="mt-5">
          <Field label="Message">
            <Textarea
              rows={3}
              maxLength={500}
              value={announcementText}
              placeholder="e.g. Free shipping over R1,000 this weekend"
              disabled={announcementLoading || savingAnnouncement}
              onChange={(e) => setAnnouncementText(e.target.value)}
            />
          </Field>
          <p className="mt-1 text-xs text-neutral-400">{announcementText.length}/500</p>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSaveAnnouncement} disabled={savingAnnouncement} loading={savingAnnouncement}>
            Save announcement
          </Button>
        </div>
      </section>

      {/* PayFast payments */}
      <section className="mt-8 max-w-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-neutral-900">PayFast payments</h2>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          PayFast is the online payment gateway used at checkout. Payments are made to this single merchant account.
          Add your own sandbox credentials (or live credentials later) from your{" "}
          <a
            href="https://sandbox.payfast.co.za"
            target="_blank"
            rel="noreferrer"
            className="text-brand-700 underline underline-offset-2"
          >
            PayFast portal
          </a>
          .
        </p>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">Sandbox mode</p>
            <p className="text-xs text-neutral-500">
              {pfSandbox ? "Test mode — no real money moves" : "Live mode — real payments"}
            </p>
          </div>
          <Switch checked={pfSandbox} onCheckedChange={setPfSandbox} disabled={payfastLoading || savingPayFast} />
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Merchant ID">
              <Input value={pfMerchantId} placeholder="10000100" onChange={(e) => setPfMerchantId(e.target.value)} disabled={payfastLoading || savingPayFast} />
            </Field>
            <Field label="Merchant name (shown to buyers)">
              <Input value={pfMerchantName} placeholder="CAPPTURE" onChange={(e) => setPfMerchantName(e.target.value)} disabled={payfastLoading || savingPayFast} />
            </Field>
            <Field label="Merchant key" hint={payfast?.merchant_key_set ? "A key is already saved — leave blank to keep it" : undefined}>
              <Input type="password" value={pfMerchantKey} placeholder={payfast?.merchant_key_set ? "••••••••" : "Enter merchant key"} onChange={(e) => setPfMerchantKey(e.target.value)} disabled={payfastLoading || savingPayFast} />
            </Field>
            <Field label="Passphrase" hint={payfast?.passphrase_set ? "A passphrase is already saved — leave blank to keep it" : undefined}>
              <Input type="password" value={pfPassphrase} placeholder={payfast?.passphrase_set ? "••••••••" : "Optional"} onChange={(e) => setPfPassphrase(e.target.value)} disabled={payfastLoading || savingPayFast} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Return URL" hint="Where buyers land after paying">
              <Input value={pfReturnUrl} placeholder="https://…/order/payment/return" onChange={(e) => setPfReturnUrl(e.target.value)} disabled={payfastLoading || savingPayFast} />
            </Field>
            <Field label="Cancel URL" hint="Where buyers land if they leave">
              <Input value={pfCancelUrl} placeholder="https://…/order/payment/return" onChange={(e) => setPfCancelUrl(e.target.value)} disabled={payfastLoading || savingPayFast} />
            </Field>
            <Field label="Notify URL" hint="PayFast posts payment updates here" className="sm:col-span-2">
              <Input value={pfNotifyUrl} placeholder="https://<ref>.functions.supabase.co/payfast-itn" onChange={(e) => setPfNotifyUrl(e.target.value)} disabled={payfastLoading || savingPayFast} />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSavePayFast} disabled={!payFastDirty || savingPayFast || payfastLoading} loading={savingPayFast}>
            Save PayFast settings
          </Button>
        </div>
      </section>
    </div>
  );
}
