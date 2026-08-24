import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  unreadCount,
} from "../services/notificationService.js";

export async function listNotifications(req, res) {
  try {
    const { unreadOnly } = req.query;
    const notifications = await getNotificationsForUser(req.user._id, {
      unreadOnly: unreadOnly === "true",
    });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const count = await unreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function markRead(req, res) {
  try {
    const notification = await markNotificationRead(req.params.id, req.user._id);
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json({ notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function markAllRead(req, res) {
  try {
    await markAllNotificationsRead(req.user._id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
