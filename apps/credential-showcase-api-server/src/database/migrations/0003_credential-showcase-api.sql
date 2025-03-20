ALTER TABLE "step" ADD COLUMN "screenId" text;
ALTER TABLE "stepAction" ALTER COLUMN "step" DROP NOT NULL;--> statement-breakpoint
