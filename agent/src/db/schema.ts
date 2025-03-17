import {
  integer,
  pgTable,
  varchar,
  text,
  json,
  boolean,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { number } from "zod";

export const resolutionEnum = pgEnum("resolution", [
  "no",
  "yes",
  "not_resolved",
]);

export const betsTable = pgTable("bets", {
  id: bigint({ mode: "number" }).primaryKey(),
  betCategoryType: varchar({ length: 255 }),
  prompt: text().notNull(),
  startTimestamp: bigint({ mode: "number" }).notNull(),
  endTimestamp: bigint({ mode: "number" }).notNull(),
  isExpired: boolean().notNull(),
  isResolved: boolean().notNull(),
  creator: varchar({ length: 255 }).notNull(),
  settleTx: varchar({ length: 500 }),
  resolution: varchar({
    length: 255,
    enum: ["no", "yes", "not_settled"],
  })
    .notNull()
    .default("not_settled"),
});

// en enum for the bet category type
