"use server";

import { getSessionUser as getUser } from "./session";

export async function getSessionUser() {
  return getUser();
}
