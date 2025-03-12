CREATE TYPE "public"."OriginType" AS ENUM('IMPORTED', 'CREATED');--> statement-breakpoint
ALTER TABLE "credentialSchema" ADD COLUMN "origin_type" "OriginType" DEFAULT 'CREATED';