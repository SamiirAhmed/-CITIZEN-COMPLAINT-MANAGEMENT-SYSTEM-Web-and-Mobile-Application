import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/helpers.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return res.json({
    success: true,
    data: {
      unreadCount,
      notifications: notifications.map((item) => item.toClientObject()),
    },
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found.',
    });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return res.json({
    success: true,
    message: 'Notification marked as read.',
    data: { notification: notification.toClientObject() },
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return res.json({
    success: true,
    message: 'All notifications marked as read.',
  });
});
