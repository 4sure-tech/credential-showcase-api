ALTER TABLE "step" ADD COLUMN "screenId" text;
CREATE TYPE "public"."CredentialRepresentationType" AS ENUM('OCA', 'CREDENTIAL');--> statement-breakpoint
ALTER TABLE "stepAction" ADD COLUMN "credential_representation_id" uuid;--> statement-breakpoint
ALTER TABLE "stepAction" ADD CONSTRAINT "stepAction_credential_representation_id_fk" FOREIGN KEY ("credential_representation_id") REFERENCES "public"."credentialRepresentation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialRepresentation" ADD COLUMN "credential_type" "CredentialRepresentationType" NOT NULL;--> statement-breakpoint
ALTER TABLE "credentialRepresentation" ADD COLUMN "oca_bundle_url" text;--> statement-breakpoint
ALTER TABLE "credentialRepresentation" ADD COLUMN "schema_id" uuid;--> statement-breakpoint
ALTER TABLE "credentialRepresentation" ADD CONSTRAINT "credentialRepresentation_schema_id_pk" FOREIGN KEY("schema_id") REFERENCES "public"."credentialSchema"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialRepresentation" ADD CONSTRAINT "credentialRepresentation_type_check" CHECK (
    (credential_type = 'OCA' AND schema_id IS NOT NULL) OR
    (credential_type = 'CREDENTIAL' AND schema_id IS NULL AND oca_bundle_url IS NULL )
    )
