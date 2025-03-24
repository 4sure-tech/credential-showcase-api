ALTER TABLE "step" ADD COLUMN "screenId" text;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ALTER COLUMN "icon" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stepAction" ALTER COLUMN "step" DROP NOT NULL;