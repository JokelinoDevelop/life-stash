import { Hono } from "hono";

import type { PublicEnv } from "../../core/app-env";
import { hashPassword } from "../../core/password";
import { createSession } from "../../core/session";
import { validate } from "../../core/validate";
import { createAccount } from "../auth/accounts";
import { AdminRepository } from "./admin.repository";
import {
  acceptInviteParams,
  acceptInviteRequest,
} from "./dto/accept-invite.request";
import type { AcceptInviteResponse } from "./dto/accept-invite.response";
import { getInviteParams } from "./dto/get-invite.request";
import type { GetInviteResponse } from "./dto/get-invite.response";
import { InvitesService } from "./invites.service";

const invitesService = (c: { var: PublicEnv["Variables"] }) =>
  new InvitesService(
    new AdminRepository(c.var.db),
    async (account) => await createAccount(c.var.db, account)
  );

/** Opening and accepting an invite link; no session needed. Mounted under `/api/auth`. */
export const publicInvitesController = new Hono<PublicEnv>()
  .get("/invites/:token", validate("param", getInviteParams), async (c) => {
    const body: GetInviteResponse = await invitesService(c).lookup(
      c.req.valid("param").token
    );

    return c.json(body);
  })
  .post(
    "/invites/:token/accept",
    validate("param", acceptInviteParams),
    validate("json", acceptInviteRequest),
    async (c) => {
      const { password, ...input } = c.req.valid("json");

      const { recoveryCodes, userId } = await invitesService(c).accept(
        c.req.valid("param").token,
        { ...input, passwordHash: await hashPassword(password) }
      );

      await createSession(c, c.var.db, userId);
      const body: AcceptInviteResponse = { recoveryCodes };

      return c.json(body);
    }
  );
