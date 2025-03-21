ALTER TABLE "step" ADD COLUMN "iconDark" uuid;--> statement-breakpoint
ALTER TABLE "step" ADD COLUMN "iconLight" uuid;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_iconDark_asset_id_fk" FOREIGN KEY ("iconDark") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_iconLight_asset_id_fk" FOREIGN KEY ("iconLight") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_icon_dark_steps" ON "step" USING btree ("iconDark");--> statement-breakpoint
CREATE INDEX "idx_icon_light_steps" ON "step" USING btree ("iconLight");