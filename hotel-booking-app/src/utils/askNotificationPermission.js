export async function askNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return;
  }

  const permission = await Notification.requestPermission();

  console.log("Notification permission:", permission);
}