ALTER TABLE "bets" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "bets" ALTER COLUMN "startTimestamp" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "bets" ALTER COLUMN "endTimestamp" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "bets" ALTER COLUMN "resolution" SET DEFAULT 'not_settled';