import { Hono } from "hono";

import type { AppEnv } from "../../core/app-env";
import { requireAdmin, requireAuth } from "../../core/middleware";
import { validate } from "../../core/validate";
import { requireRecentSignIn } from "../auth/password.service";
import { AdminRepository } from "./admin.repository";
import { AdminService } from "./admin.service";
import { createInviteRequest } from "./dto/create-invite.request";
import type { CreateInviteResponse } from "./dto/create-invite.response";
import { toListInvitesResponse } from "./dto/list-invites.response";
import type { ListInvitesResponse } from "./dto/list-invites.response";
import { toListUsersResponse } from "./dto/list-users.response";
import type { ListUsersResponse } from "./dto/list-users.response";
import { moveUserParams } from "./dto/move-user.request";
import type { MoveUserResponse } from "./dto/move-user.response";
import { revokeInviteParams } from "./dto/revoke-invite.request";
import type { RevokeInviteResponse } from "./dto/revoke-invite.response";
import { updateUserParams, updateUserRequest } from "./dto/update-user.request";
import type { UpdateUserResponse } from "./dto/update-user.response";

const adminService = (c: { var: AppEnv["Variables"] }) =>
  new AdminService(new AdminRepository(c.var.db), {
    householdId: c.var.auth.householdId,
    userId: c.var.auth.userId,
  });

/** Admin-only: invite people and manage accounts. Mounted under `/api/admin`. */
export const adminController = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requireAdmin)
  .get("/users", async (c) => {
    const rows = await adminService(c).listAccounts();
    const body: ListUsersResponse = toListUsersResponse(rows);

    return c.json(body);
  })
  .patch(
    "/users/:userId",
    validate("param", updateUserParams),
    validate("json", updateUserRequest),
    async (c) => {
      requireRecentSignIn(c.var.auth);
      await adminService(c).setDisabled(
        c.req.valid("param").userId,
        c.req.valid("json").disabled
      );
      const body: UpdateUserResponse = { ok: true };

      return c.json(body);
    }
  )
  .post(
    "/users/:userId/move-to-my-household",
    validate("param", moveUserParams),
    async (c) => {
      requireRecentSignIn(c.var.auth);
      await adminService(c).moveToMyHousehold(c.req.valid("param").userId);
      const body: MoveUserResponse = { ok: true };

      return c.json(body);
    }
  )
  .get("/invites", async (c) => {
    const rows = await adminService(c).listInvites();
    const body: ListInvitesResponse = toListInvitesResponse(rows);

    return c.json(body);
  })
  .post("/invites", validate("json", createInviteRequest), async (c) => {
    requireRecentSignIn(c.var.auth);

    const body: CreateInviteResponse = await adminService(c).createInvite(
      c.req.valid("json")
    );

    return c.json(body, 201);
  })
  .delete(
    "/invites/:inviteId",
    validate("param", revokeInviteParams),
    async (c) => {
      await adminService(c).revokeInvite(c.req.valid("param").inviteId);
      const body: RevokeInviteResponse = { ok: true };

      return c.json(body);
    }
  );
