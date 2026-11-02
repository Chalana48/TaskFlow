const notificationService = require('../services/notificationService');
const {
  validateNotificationQuery,
  validateNotificationPreferences,
} = require('../utils/validators');

class NotificationController {
  /**
   * GET /api/notifications
   * Retrieve the authenticated user's notifications
   */
  async getNotifications(req, res) {
    try {
      const { isValid, errors } = validateNotificationQuery(req.query);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: errors.join(', '),
        });
      }

      const result = await notificationService.getUserNotifications(req.user._id, req.query);

      return res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: result.notifications,
        unreadCount: result.unreadCount,
        pagination: result.pagination,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve notifications',
      });
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Retrieve the authenticated user's unread count
   */
  async getUnreadCount(req, res) {
    try {
      const result = await notificationService.getUnreadNotificationCount(req.user._id);

      return res.status(200).json({
        success: true,
        message: 'Unread count retrieved successfully',
        data: result,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve unread count',
      });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   */
  async markAsRead(req, res) {
    try {
      const notification = await notificationService.markNotificationAsRead(
        req.params.id,
        req.user._id
      );

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to mark notification as read',
      });
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for current user
   */
  async markAllAsRead(req, res) {
    try {
      const result = await notificationService.markAllNotificationsAsRead(req.user._id);

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: result,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to mark all notifications as read',
      });
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete a single notification
   */
  async deleteNotification(req, res) {
    try {
      const result = await notificationService.deleteNotification(
        req.params.id,
        req.user._id
      );

      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
        data: result,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to delete notification',
      });
    }
  }

  /**
   * GET /api/notifications/preferences
   * Get user notification preferences
   */
  async getPreferences(req, res) {
    try {
      const preferences = await notificationService.getUserPreferences(req.user._id);

      return res.status(200).json({
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: preferences,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve notification preferences',
      });
    }
  }

  /**
   * PUT /api/notifications/preferences
   * Update user notification preferences
   */
  async updatePreferences(req, res) {
    try {
      const { isValid, errors } = validateNotificationPreferences(req.body);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: errors.join(', '),
        });
      }

      const updated = await notificationService.updateUserPreferences(
        req.user._id,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: updated,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to update notification preferences',
      });
    }
  }

  /**
   * POST /api/notifications/check-deadlines
   * Trigger deadline checks (accessible by authenticated users/admins)
   */
  async checkDeadlines(req, res) {
    try {
      const result = await notificationService.checkDeadlineNotifications();

      return res.status(200).json({
        success: true,
        message: 'Deadline notification check completed',
        data: result,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Deadline check failed',
      });
    }
  }
}

module.exports = new NotificationController();
