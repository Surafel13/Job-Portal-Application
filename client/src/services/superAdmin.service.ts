import { request } from "../lib/api";
import type { User, UserStatus } from "../types/models";

/**
 * /admin/* routes only accept the `admin` role on the server, so a superAdmin
 * would get a 403 there. The generic /users routes accept any authenticated
 * user, so super admin mutations go through them.
 */
export const superAdminService = {
  setUserStatus: (id: string, status: UserStatus) =>
    request<User>("patch", `/users/status/${id}`, { data: { status } }),

  deleteUser: (id: string) => request<undefined>("delete", `/users/${id}`),
};
