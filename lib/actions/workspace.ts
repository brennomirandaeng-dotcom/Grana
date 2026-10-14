"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { WORKSPACE_COOKIE, requireUser } from "@/lib/session";
import type { Workspace } from "@/lib/constants";

export async function setActiveWorkspace(workspace: Workspace) {
  await requireUser();
  const store = await cookies();
  store.set(WORKSPACE_COOKIE, workspace, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
