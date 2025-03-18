CREATE TYPE "public"."Source" AS ENUM('IMPORTED', 'CREATED');--> statement-breakpoint
ALTER TABLE "credentialSchema" ADD COLUMN "source" "Source" DEFAULT 'CREATED';