import { useEffect, useState } from "react";
import { Megaphone, Percent, Wallet } from "lucide-react";
import { toast } from "sonner";

import {
  useAdminCommissionStats,
  useAnnouncement,
  useCommissionSettings,
  useSetAnnouncement,
  useSetCommissionSettings,
} from "@/hooks/useAdminSettings";
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
    </div>
  );
}
