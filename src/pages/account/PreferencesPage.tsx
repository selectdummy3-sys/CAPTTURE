import { useState } from "react";
import { BellRing, Megaphone, Store } from "lucide-react";
import { toast } from "sonner";

import {
  usePreferences,
  type NotificationPreferences,
} from "@/hooks/usePreferences";
import { MobilePageNav } from "@/components/account/MobilePageNav";
import { Switch } from "@/components/ui/switch";
import { isNative } from "@/lib/capacitor";

interface PreferenceOption {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: typeof BellRing;
}

const OPTIONS: PreferenceOption[] = [
  {
    key: "order_updates",
    title: "Order updates",
    description: "Status changes, dispatch and delivery notifications for your orders.",
    icon: BellRing,
  },
  {
    key: "promotional",
    title: "Promotions and offers",
    description: "Sales, discounts and new product drops from stores you follow.",
    icon: Megaphone,
  },
  {
    key: "seller_announcements",
    title: "New seller announcements",
    description: "Let us know when new sellers join CAPTTURE.",
    icon: Store,
  },
];

export function PreferencesPage() {
  const { preferences, isSaving, update } = usePreferences();
  const [values, setValues] = useState<NotificationPreferences>(preferences);
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null);

  const toggle = async (key: keyof NotificationPreferences) => {
    const next = { ...values, [key]: !values[key] };
    setValues(next);
    setSavingKey(key);
    try {
      await update({ [key]: next[key] });
      toast.success("Preference saved.");
    } catch (err) {
      setValues(preferences);
      toast.error(err instanceof Error ? err.message : "Could not save your preference.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      <div className="sticky top-0 z-20">
        <MobilePageNav title="Preferences" backTo="/account" />
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
        <p className="text-sm leading-relaxed text-neutral-500">
          Choose how CAPTTURE keeps in touch with you. Changes apply as soon as you toggle them.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
          <div className="divide-y divide-neutral-100">
            {OPTIONS.map(({ key, title, description, icon: Icon }) => (
              <div key={key} className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-royal-50 text-royal-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{description}</p>
                </div>
                <Switch
                  checked={Boolean(values[key])}
                  onCheckedChange={() => void toggle(key)}
                  disabled={isSaving || savingKey === key}
                />
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Prefer to opt out of everything? Toggle each setting off.
        </p>
      </div>
    </div>
  );
}