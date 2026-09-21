import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";

import {
  DEFAULT_APP_SETTINGS,
  useAppSettings,
  useSetAppSettings,
} from "@/hooks/useAdminSettings";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import { Button } from "@/components/ui/button";

const SECTION_FIELDS: Array<{
  key: "edit_label" | "fresh_label" | "categories_label" | "deals_label" | "stores_label";
  toggleKey: "show_edit" | "show_fresh" | "show_categories" | "show_deals" | "show_stores";
  label: string;
  description: string;
}> = [
  {
    key: "edit_label",
    toggleKey: "show_edit",
    label: "The edit",
    description: "Featured products rail at the top of the app home.",
  },
  {
    key: "fresh_label",
    toggleKey: "show_fresh",
    label: "Fresh drops",
    description: "Newest arrivals product grid on the app home.",
  },
  {
    key: "categories_label",
    toggleKey: "show_categories",
    label: "Shop by category",
    description: "Image tiles for each category on the app home.",
  },
  {
    key: "deals_label",
    toggleKey: "show_deals",
    label: "On sale",
    description: "Discounted products rail on the app home.",
  },
  {
    key: "stores_label",
    toggleKey: "show_stores",
    label: "Local stores",
    description: "Approved seller strip on the app home.",
  },
];

const MAX_LEN = 30;

export default function AdminAppSettings() {
  const { data: settings, isLoading } = useAppSettings();
  const save = useSetAppSettings();

  const [homeHeader, setHomeHeader] = useState(DEFAULT_APP_SETTINGS.home_header);
  const [labels, setLabels] = useState<Record<string, string>>({
    edit_label: DEFAULT_APP_SETTINGS.edit_label,
    fresh_label: DEFAULT_APP_SETTINGS.fresh_label,
    categories_label: DEFAULT_APP_SETTINGS.categories_label,
    deals_label: DEFAULT_APP_SETTINGS.deals_label,
    stores_label: DEFAULT_APP_SETTINGS.stores_label,
  });
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTION_FIELDS.map((f) => [f.toggleKey, DEFAULT_APP_SETTINGS[f.toggleKey] ?? true]))
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setHomeHeader(settings.home_header);
    setLabels({
      edit_label: settings.edit_label,
      fresh_label: settings.fresh_label,
      categories_label: settings.categories_label,
      deals_label: settings.deals_label,
      stores_label: settings.stores_label,
    });
    setToggles(
      Object.fromEntries(SECTION_FIELDS.map((f) => [f.toggleKey, settings[f.toggleKey] ?? true]))
    );
  }, [settings]);

  const dirty = settings
    ? homeHeader !== settings.home_header ||
      SECTION_FIELDS.some((f) => labels[f.key] !== settings[f.key]) ||
      SECTION_FIELDS.some((f) => toggles[f.toggleKey] !== settings[f.toggleKey])
    : false;

  const handleSave = async () => {
    const trimmedHeader = homeHeader.trim();
    if (!trimmedHeader) {
      toast.error("Home header text is required");
      return;
    }
    for (const f of SECTION_FIELDS) {
      if (labels[f.key].trim().length > MAX_LEN) {
        toast.error(`${f.label} heading must be at most ${MAX_LEN} characters`);
        return;
      }
    }
    setSaving(true);
    try {
      await save.mutateAsync({
        home_header: trimmedHeader,
        edit_label: labels.edit_label.trim(),
        fresh_label: labels.fresh_label.trim(),
        categories_label: labels.categories_label.trim(),
        deals_label: labels.deals_label.trim(),
        stores_label: labels.stores_label.trim(),
        show_edit: toggles.show_edit,
        show_fresh: toggles.show_fresh,
        show_categories: toggles.show_categories,
        show_deals: toggles.show_deals,
        show_stores: toggles.show_stores,
      });
      toast.success("App settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save app settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">App settings</h1>
        <p className="text-sm text-neutral-500">
          Maintain the look of the CAPTTURE mobile app. Toggle which home sections show and rename
          their headings.
        </p>
      </div>

      <section className="mt-6 max-w-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-neutral-900">App home header</h2>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          The brand wordmark shown at the very top of the app home screen.
        </p>

        <div className="mt-5">
          <Field label="Header text">
            <Input
              value={homeHeader}
              disabled={isLoading || saving}
              onChange={(e) => setHomeHeader(e.target.value)}
            />
          </Field>
          <p className="mt-1 text-xs text-neutral-400">Shown above the search bar on the home tab.</p>
        </div>
      </section>

      <section className="mt-8 max-w-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-neutral-900">Home sections</h2>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Every mobile storefront has multiple brands. Choose which sections appear and what they say.
        </p>

        <div className="mt-5 space-y-6">
          {SECTION_FIELDS.map((f) => (
            <div key={f.key} className="border-t border-neutral-100 pt-5 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{f.label}</p>
                  <p className="text-xs text-neutral-500">{f.description}</p>
                </div>
                <Switch
                  checked={toggles[f.toggleKey]}
                  onCheckedChange={(v) => setToggles((p) => ({ ...p, [f.toggleKey]: v }))}
                  disabled={isLoading || saving}
                />
              </div>
              <div className="mt-3">
                <Input
                  value={labels[f.key]}
                  disabled={!toggles[f.toggleKey] || isLoading || saving}
                  maxLength={MAX_LEN}
                  onChange={(e) => setLabels((p) => ({ ...p, [f.key]: e.target.value }))}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  {labels[f.key].length}/{MAX_LEN} · shown above this section on the app home
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={!dirty || saving || isLoading} loading={saving}>
            Save app settings
          </Button>
        </div>
      </section>
    </div>
  );
}