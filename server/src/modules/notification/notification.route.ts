import { Router } from "express";
import notificationController from "./notification.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
    validateBody,
    validateParams,
} from "../../middlewares/validation.middleware.js";
import {
    createNotificationSchema,
    notificationIdParamSchema,
    notificationTypeParamSchema,
} from "./notification.validation.js";

const router = Router();

router.use(authMiddleware);

router.post(
    "/",
    validateBody(createNotificationSchema),
    notificationController.createNotification
);

router.get(
    "/my",
    notificationController.getMyNotifications
);

router.get(
    "/my/unread",
    notificationController.getUnreadNotifications
);

router.get(
    "/my/count",
    notificationController.getNotificationCount
);

router.get(
    "/my/unread/count",
    notificationController.getUnreadCount
);

router.get(
    "/my/type/:type",
    validateParams(notificationTypeParamSchema),
    notificationController.getNotificationsByType
);

router.patch(
    "/my/read-all",
    notificationController.markAllAsRead
);

router.delete(
    "/my",
    notificationController.deleteMyNotifications
);

router.get(
    "/:notificationId",
    validateParams(notificationIdParamSchema),
    notificationController.getNotificationById
);

router.patch(
    "/:notificationId/read",
    validateParams(notificationIdParamSchema),
    notificationController.markAsRead
);

router.delete(
    "/:notificationId",
    validateParams(notificationIdParamSchema),
    notificationController.deleteNotification
);

export default router;