ALTER TABLE "step" DROP CONSTRAINT "step_iconDark_asset_id_fk";
--> statement-breakpoint
ALTER TABLE "step" DROP CONSTRAINT "step_iconLight_asset_id_fk";
--> statement-breakpoint
DROP INDEX "idx_icon_dark_steps";--> statement-breakpoint
DROP INDEX "idx_icon_light_steps";--> statement-breakpoint
ALTER TABLE "step" DROP COLUMN "iconDark";--> statement-breakpoint
ALTER TABLE "step" DROP COLUMN "iconLight";