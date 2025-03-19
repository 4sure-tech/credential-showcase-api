CREATE TYPE "public"."StepActionType" AS ENUM('ISSUANCE', 'PRESENTATION');--> statement-breakpoint
ALTER TABLE "stepAction" ALTER COLUMN "action_type" TYPE "public"."StepActionType";--> statement-breakpoint
ALTER TABLE "stepAction" ADD COLUMN "credential_representation_id" uuid;--> statement-breakpoint
ALTER TABLE "stepAction" ADD CONSTRAINT "stepAction_credential_representation_id_fk" FOREIGN KEY ("credential_representation_id") REFERENCES "public"."credentialRepresentation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stepAction" ADD CONSTRAINT "stepAction_type_check" CHECK (
    (action_type = 'PRESENTATION') OR
    (action_type = 'ISSUANCE' AND "credential_representaion_id" IS NOT NULL)