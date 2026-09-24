/** Org allowlist / roles (ALF-062). */

import { Hono } from "hono";
import { isSession, requireSession } from "../lib/auth";
import {
  addOrgMember,
  canManageOrg,
  countAdmins,
  getMemberByAddress,
  isAllowlistEnabled,
  isOrgRole,
  isValidGAddress,
  listOrgMembers,
  removeOrgMember,
} from "../lib/org";

type Bindings = {
  SESSION_SECRET?: string;
  DB?: D1Database;
};

export const orgRoutes = new Hono<{ Bindings: Bindings }>();

function publicMember(row: {
  stellar_address: string;
  role: string;
  label: string | null;
  created_at: string;
}) {
  return {
    stellarAddress: row.stellar_address,
    role: row.role,
    label: row.label,
    createdAt: row.created_at,
  };
}

orgRoutes.get("/me", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const db = c.env.DB!;
  const enabled = await isAllowlistEnabled(db);
  const member = await getMemberByAddress(db, session.addr);
  return c.json({
    ok: true,
    allowlistEnabled: enabled,
    role: member?.role ?? null,
    canIssue: !enabled || member?.role === "admin" || member?.role === "issuer",
    canManage: !enabled || member?.role === "admin",
  });
});

orgRoutes.get("/members", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const db = c.env.DB!;
  const enabled = await isAllowlistEnabled(db);
  const members = await listOrgMembers(db);
  return c.json({
    ok: true,
    allowlistEnabled: enabled,
    members: members.map(publicMember),
  });
});

orgRoutes.post("/members", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const db = c.env.DB!;

  let body: {
    stellarAddress?: string;
    role?: string;
    label?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const stellarAddress = body.stellarAddress?.trim();
  const roleRaw = (body.role ?? "issuer").trim();
  if (!stellarAddress || !isValidGAddress(stellarAddress)) {
    return c.json({ ok: false, code: "INVALID_ADDRESS" }, 400);
  }
  if (!isOrgRole(roleRaw)) {
    return c.json({ ok: false, code: "INVALID_ROLE" }, 400);
  }

  const enabled = await isAllowlistEnabled(db);
  if (enabled) {
    if (!(await canManageOrg(db, session.addr))) {
      return c.json({ ok: false, code: "FORBIDDEN" }, 403);
    }
  } else {
    // Bootstrap: first member must be admin (caller adds themselves or anyone).
    if (roleRaw !== "admin") {
      return c.json(
        { ok: false, code: "BOOTSTRAP_REQUIRES_ADMIN" },
        400,
      );
    }
  }

  const existing = await getMemberByAddress(db, stellarAddress);
  if (existing) {
    return c.json({ ok: false, code: "ALREADY_MEMBER" }, 409);
  }

  const row = await addOrgMember(db, {
    stellarAddress,
    role: roleRaw,
    label: body.label,
    createdByUserId: session.uid,
  });

  return c.json({ ok: true, member: publicMember(row) }, 201);
});

orgRoutes.delete("/members/:address", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const db = c.env.DB!;
  const address = c.req.param("address")?.trim();
  if (!address || !isValidGAddress(address)) {
    return c.json({ ok: false, code: "INVALID_ADDRESS" }, 400);
  }

  if (!(await canManageOrg(db, session.addr))) {
    return c.json({ ok: false, code: "FORBIDDEN" }, 403);
  }

  const target = await getMemberByAddress(db, address);
  if (!target) {
    return c.json({ ok: false, code: "NOT_FOUND" }, 404);
  }

  if (target.role === "admin" && (await countAdmins(db)) <= 1) {
    return c.json({ ok: false, code: "LAST_ADMIN" }, 400);
  }

  await removeOrgMember(db, address);
  return c.json({ ok: true });
});
