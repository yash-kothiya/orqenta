import { pgEnum } from "drizzle-orm/pg-core";
import { TEMPLATE_TYPES } from "@/lib/types";

export const templateTypeEnum = pgEnum("template_type", TEMPLATE_TYPES);
