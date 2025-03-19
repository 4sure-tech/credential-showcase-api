ALTER TABLE "stepAction" ADD COLUMN "credential_representation_id" uuid;--> statement-breakpoint
ALTER TABLE "stepAction" ADD CONSTRAINT "stepAction_credential_representation_id_fk" FOREIGN KEY ("credential_representation_id") REFERENCES "public"."credentialRepresentation"("id") ON DELETE no action ON UPDATE no action;
