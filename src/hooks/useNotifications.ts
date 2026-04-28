"use client";

export type NotifPermission = "default" | "granted" | "denied";

export function getNotifPermission(): NotifPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission as NotifPermission;
}

export async function requestNotifPermission(): Promise<NotifPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

export function showMessageNotification({
  senderName,
  senderInitial,
  text,
  onClick,
}: {
  senderName: string;
  senderInitial: string;
  text: string;
  onClick?: () => void;
}) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  // Don't notify if the tab is visible and focused
  if (document.visibilityState === "visible") return;

  const notif = new Notification(`${senderName} · SkillSnap`, {
    body: text,
    icon: "/icon-192.png",
    tag: `skillsnap-msg-${senderName}`,
  } as NotificationOptions);

  notif.onclick = () => {
    window.focus();
    onClick?.();
    notif.close();
  };
}
