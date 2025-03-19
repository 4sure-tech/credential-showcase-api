ALTER TABLE "credentialRepresentation" ADD COLUMN "step_action_id" uuid;--> statement-breakpoint
ALTER TABLE "credentialRepresentation" ADD CONSTRAINT "credentialRepresentation_step_action_id_fk" FOREIGN KEY ("step_action_id") REFERENCES "public"."stepAction"("id") ON DELETE no action ON UPDATE no action;
