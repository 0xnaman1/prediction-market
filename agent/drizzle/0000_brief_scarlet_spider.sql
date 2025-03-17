CREATE TYPE "public"."resolution" AS ENUM('no', 'yes', 'not_resolved');--> statement-breakpoint
CREATE TABLE "bets" (
	"id" integer PRIMARY KEY NOT NULL,
	"betCategoryType" varchar(255),
	"prompt" text NOT NULL,
	"startTimestamp" integer NOT NULL,
	"endTimestamp" integer NOT NULL,
	"isExpired" boolean NOT NULL,
	"isResolved" boolean NOT NULL,
	"resolution" varchar(255) DEFAULT 'not_resolved' NOT NULL
);
