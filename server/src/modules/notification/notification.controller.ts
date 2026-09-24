import type { Request, Response } from "express";
import notificationService from "./notification.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import type { NotificationType } from "./notification.interface.js";

class NotificationController {
  createNotification = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.createNotification({
      userId: req.body.userId,
      type: req.body.type,
      title: req.body.title,
      message: req.body.message,
      priority: req.body.priority,
      resourceType: req.body.resourceType,
      resourceId: req.body.resourceId,
    });

    sendResponse(res, 201, "Notification created successfully.", notification);
  });

  getNotificationById = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.getNotificationById(
      req.params.notificationId as string,
    );

    sendResponse(
      res,
      200,
      "Notification retrieved successfully.",
      notification,
    );
  });

  getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const notifications = await notificationService.getUserNotifications(
      req.user.userId,
    );

    sendResponse(
      res,
      200,
      "Notifications retrieved successfully.",
      notifications,
    );
  });

  getUnreadNotifications = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const notifications = await notificationService.getUnreadNotifications(
      req.user.userId,
    );

    sendResponse(
      res,
      200,
      "Unread notifications retrieved successfully.",
      notifications,
    );
  });

  getNotificationsByType = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const notifications = await notificationService.getNotificationsByType(
      req.user.userId,
      req.params.type as NotificationType,
    );

    sendResponse(
      res,
      200,
      "Notifications retrieved successfully.",
      notifications,
    );
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.markAsRead(
      req.params.notificationId as string,
    );

    sendResponse(res, 200, "Notification marked as read.", notification);
  });

  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    await notificationService.markAllAsRead(req.user.userId);

    sendResponse(res, 200, "All notifications marked as read.");
  });

  deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.deleteNotification(
      req.params.notificationId as string,
    );

    sendResponse(res, 200, "Notification deleted successfully.");
  });

  deleteMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    await notificationService.deleteUserNotifications(req.user.userId);

    sendResponse(res, 200, "All notifications deleted successfully.");
  });

  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const count = await notificationService.getUnreadCount(req.user.userId);

    sendResponse(
      res,
      200,
      "Unread notification count retrieved successfully.",
      { count },
    );
  });

  getNotificationCount = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const count = await notificationService.getNotificationCount(
      req.user.userId,
    );

    sendResponse(res, 200, "Notification count retrieved successfully.", {
      count,
    });
  });
}

export const notificationController = new NotificationController();

export default notificationController;
