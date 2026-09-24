import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import notificationRepository from "./notification.repository.js";
import type {
  INotification,
  NotificationPriority,
  NotificationType,
} from "./notification.interface.js";

export class NotificationService {
  private validateObjectId(id: string, field: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ${field}.`);
    }

    return new Types.ObjectId(id);
  }

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    resourceType?: string;
    resourceId?: string;
  }): Promise<INotification> {
    const userId = this.validateObjectId(data.userId, "user ID");

    let resourceId: Types.ObjectId | undefined;

    if (data.resourceId !== undefined) {
      resourceId = this.validateObjectId(data.resourceId, "resource ID");
    }

    const notificationData: INotification = {
      userId,
      type: data.type,
      title: data.title.trim(),
      message: data.message.trim(),
      priority: data.priority ?? "medium",
      isRead: false,
      ...(data.resourceType !== undefined && {
        resourceType: data.resourceType,
      }),
      ...(resourceId !== undefined && {
        resourceId,
      }),
    };

    if (!notificationData.title) {
      throw new ApiError(400, "Notification title is required.");
    }

    if (!notificationData.message) {
      throw new ApiError(400, "Notification message is required.");
    }

    return notificationRepository.create(notificationData);
  }

  async getNotificationById(notificationId: string): Promise<INotification> {
    const notificationObjectId = this.validateObjectId(
      notificationId,
      "notification ID",
    );

    const notification =
      await notificationRepository.findById(notificationObjectId);

    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    return notification;
  }

  async getUserNotifications(userId: string): Promise<INotification[]> {
    const userObjectId = this.validateObjectId(userId, "user ID");

    return notificationRepository.findByUser(userObjectId);
  }

  async getUnreadNotifications(userId: string): Promise<INotification[]> {
    const userObjectId = this.validateObjectId(userId, "user ID");

    return notificationRepository.findUnreadByUser(userObjectId);
  }

  async getNotificationsByType(
    userId: string,
    type: NotificationType,
  ): Promise<INotification[]> {
    const userObjectId = this.validateObjectId(userId, "user ID");

    return notificationRepository.findByUserAndType(userObjectId, type);
  }

  async markAsRead(notificationId: string): Promise<INotification> {
    const notificationObjectId = this.validateObjectId(
      notificationId,
      "notification ID",
    );

    const notification =
      await notificationRepository.findById(notificationObjectId);

    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    if (notification.isRead) {
      return notification;
    }

    const updatedNotification =
      await notificationRepository.markAsRead(notificationObjectId);

    if (!updatedNotification) {
      throw new ApiError(404, "Notification not found.");
    }

    return updatedNotification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const userObjectId = this.validateObjectId(userId, "user ID");

    await notificationRepository.markAllAsRead(userObjectId);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notificationObjectId = this.validateObjectId(
      notificationId,
      "notification ID",
    );

    const deletedNotification =
      await notificationRepository.deleteById(notificationObjectId);

    if (!deletedNotification) {
      throw new ApiError(404, "Notification not found.");
    }
  }

  async deleteUserNotifications(userId: string): Promise<void> {
    const userObjectId = this.validateObjectId(userId, "user ID");

    await notificationRepository.deleteByUser(userObjectId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const userObjectId = this.validateObjectId(userId, "user ID");

    return notificationRepository.countUnread(userObjectId);
  }

  async getNotificationCount(userId: string): Promise<number> {
    const userObjectId = this.validateObjectId(userId, "user ID");

    return notificationRepository.countByUser(userObjectId);
  }
}

export const notificationService = new NotificationService();

export default notificationService;
