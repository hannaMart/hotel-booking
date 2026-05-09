import { useEffect, useState } from "react";
import { subscribeToPush } from "../utils/src/utils/subscribeToPush";
import { askNotificationPermission } from "../utils/askNotificationPermission";

export default function EnableNotificationsButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      if (!("serviceWorker" in navigator)) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setIsSubscribed(!!subscription);
    }

    checkSubscription();
  }, []);

  const enableNotifications = async () => {
    await askNotificationPermission();
    await subscribeToPush();
    setIsSubscribed(true);
  };

  if (isSubscribed) return null;

  return (
    <button onClick={enableNotifications}>
      Enable notifications
    </button>
  );
}