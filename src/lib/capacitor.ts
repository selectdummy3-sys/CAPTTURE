import { App } from "@capacitor/app";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { StatusBar, Style } from "@capacitor/status-bar";

export const DEEP_LINK_SCHEME = "com.capture.app";
export const DEEP_LINK_PREFIX = `${DEEP_LINK_SCHEME}://callback`;

type CapacitorGlobal = { isNativePlatform?: () => boolean };

const capacitorGlobal = (typeof window !== "undefined" ? (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor : undefined);

export const isNative = capacitorGlobal?.isNativePlatform?.() === true;

export function setupNativeApp() {
  if (!isNative) return;
  document.documentElement.setAttribute("data-capacitor", "");
  void (async () => {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
    } catch {
      // status bar tweaks are best-effort
    }
  })();
}

export async function hapticLight() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // haptics are best-effort
  }
}

export function registerDeepLinkHandler() {
  if (!isNative) return;

  void App.addListener("appUrlOpen", (event) => {
    const url = event.url;
    if (!url.startsWith(DEEP_LINK_PREFIX)) return;

    const pathWithQuery = url.slice(DEEP_LINK_PREFIX.length) || "/";
    const [path, search] = pathWithQuery.split("?");
    const next = `${path}${search ? `?${search}` : ""}`;

    window.history.replaceState(null, "", next);
    window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
  });
}

export const nativeAuthAppUrl = `${DEEP_LINK_PREFIX}`;