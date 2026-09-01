import type { NotificationFeed } from "../domain/notification";
export async function getNotifications(): Promise<NotificationFeed | null> { const r=await fetch("/api/notifications",{cache:"no-store"}); if(r.status===401)return null; if(!r.ok)throw new Error("Unable to load notifications."); return r.json(); }
export async function markNotificationRead(id:string){await fetch(`/api/notifications/${encodeURIComponent(id)}/read`,{method:"POST"});}
export async function markAllNotificationsRead(){await fetch("/api/notifications/read-all",{method:"POST"});}
