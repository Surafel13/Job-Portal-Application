import type { Types } from "mongoose";
import NotificationModel from "./notification.model.js";
import type {
  INotification,
  NotificationType,
} from "./notification.interface.js";

export class NotificationRepository {
  async create(data: INotification): Promise<INotification> {
    const notification = await NotificationModel.create(data);

    return notification.toObject();
  }

  async findById(
    notificationId: Types.ObjectId,
  ): Promise<INotification | null> {
    return NotificationModel.findById(notificationId).lean().exec();
  }

  async findByUser(userId: Types.ObjectId): Promise<INotification[]> {
    return NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findUnreadByUser(userId: Types.ObjectId): Promise<INotification[]> {
    return NotificationModel.find({
      userId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findByUserAndType(
    userId: Types.ObjectId,
    type: NotificationType,
  ): Promise<INotification[]> {
    return NotificationModel.find({
      userId,
      type,
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async markAsRead(
    notificationId: Types.ObjectId,
  ): Promise<INotification | null> {
    return NotificationModel.findByIdAndUpdate(
      notificationId,
      {
        $set: {
          isRead: true,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .lean()
      .exec();
  }

  async markAllAsRead(userId: Types.ObjectId): Promise<void> {
    await NotificationModel.updateMany(
      {
        userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    ).exec();
  }

  async deleteById(
    notificationId: Types.ObjectId,
  ): Promise<INotification | null> {
    return NotificationModel.findByIdAndDelete(notificationId).lean().exec();
  }

  async deleteByUser(userId: Types.ObjectId): Promise<void> {
    await NotificationModel.deleteMany({
      userId,
    }).exec();
  }

  async countUnread(userId: Types.ObjectId): Promise<number> {
    return NotificationModel.countDocuments({
      userId,
      isRead: false,
    });
  }

  async countByUser(userId: Types.ObjectId): Promise<number> {
    return NotificationModel.countDocuments({
      userId,
    });
  }
}

export const notificationRepository = new NotificationRepository();

export default notificationRepository;
