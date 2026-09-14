import type { UserRole } from "../modules/user/user.interface.js";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: UserRole;
            };
        }
    }
}

export {};