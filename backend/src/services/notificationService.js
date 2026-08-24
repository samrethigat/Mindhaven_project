import Notification from "../models/Notification.js";

export async function createNotification({
  recipient,
  type,
  title,
  message,
  relatedAppointment = null,
  relatedChat = null,
}) {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    relatedAppointment,
    relatedChat,
  });
  return notification;
}

export async function getNotificationsForUser(userId, { unreadOnly = false, limit = 50 } = {}) {
  const filter = { recipient: userId };
  if (unreadOnly) filter.read = false;
  return Notification.find(filter).sort({ createdAt: -1 }).limit(limit);
}

export async function markNotificationRead(notificationId, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  );
  return notification;
}

export async function markAllNotificationsRead(userId) {
  return Notification.updateMany({ recipient: userId, read: false }, { read: true });
}

export async function unreadCount(userId) {
  return Notification.countDocuments({ recipient: userId, read: false });
}
