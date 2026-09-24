import { Schema, model } from "mongoose";
import type { INotification } from "./notification.interface.js";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "application",
        "job",
        "interview",
        "message",
        "report",
        "employer",
        "system",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      required: true,
    },

    resourceType: {
      type: String,
      trim: true,
    },

    resourceId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationSchema.index({
  userId: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

notificationSchema.index({
  resourceType: 1,
  resourceId: 1,
});

const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema,
);

export default NotificationModel;
