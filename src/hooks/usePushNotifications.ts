import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

function isPushSupported() {
  return Capacitor.isNativePlatform();
}

function routeFromPayload(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const route = data.route;
  if (typeof route === "string" && route.startsWith("/")) return route;
  return null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;

    let unregister = false;

    const saveToken = async (userId: string, token: string) => {
      const { error } = await supabase
        .from("push_tokens")
        .upsert({ user_id: userId, token, platform: "android" }, { onConflict: "user_id,token" });
      if (error) {
        console.warn("push token save failed:", error.message);
      }
    };

    // Keep the device token linked to whoever is signed in. When the auth user
    // changes we drop the row for the previous account and (re)attach it to the
    // new one so pushes never leak between accounts.
    const userListener = supabase.auth.onAuthStateChange(async (event, session) => {
      const token = tokenRef.current;
      const userId = session?.user?.id;
      if (!token) return;
      if (userId) {
        await saveToken(userId, token);
        return;
      }
      if (event === "SIGNED_OUT") {
        await supabase.from("push_tokens").delete().eq("token", token);
      }
    });

    void (async () => {
      try {
        const permission = await PushNotifications.requestPermissions();
        if (unregister) return;
        if (permission.receive !== "granted") return;
        await PushNotifications.register();
      } catch {
        // registration is best-effort on devices without FCM configured
      }
    })();

    const regListener = PushNotifications.addListener("registration", async ({ value }) => {
      tokenRef.current = value;
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) await saveToken(userId, value);
    });
    const errListener = PushNotifications.addListener("registrationError", (err) => {
      console.warn("push registration error:", err.error);
    });
    const recvListener = PushNotifications.addListener("pushNotificationReceived", () => {
      const userId = user?.id;
      if (!userId) return;
      void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", userId, "unread"] });
    });
    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      ({ notification }) => {
        const data = notification.data as Record<string, unknown> | undefined;
        const route = routeFromPayload(data);
        if (route) navigate(route);
        const userId = user?.id;
        if (userId) {
          void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
          void queryClient.invalidateQueries({ queryKey: ["notifications", userId, "unread"] });
        }
      },
    );

    return () => {
      unregister = true;
      void userListener.data.subscription.unsubscribe();
      void regListener.then((l) => l.remove());
      void errListener.then((l) => l.remove());
      void recvListener.then((l) => l.remove());
      void actionListener.then((l) => l.remove());
    };
  }, [navigate, queryClient, user?.id]);

  return null;
}