import { pgEnum } from "drizzle-orm/pg-core";
import { ACTIONS, RESOURCES } from "@/lib/permissions";

// The permissions grid already enumerates these (§10.13); one list, so the DB
// enum and the UI can never drift apart.
export const permissionResourceEnum = pgEnum("permission_resource", RESOURCES);

export const permissionActionEnum = pgEnum("permission_action", ACTIONS);
