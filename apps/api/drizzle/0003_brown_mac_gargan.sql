CREATE TABLE "review_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"old_status" "review_status",
	"new_status" "review_status" NOT NULL,
	"changed_by_user_id" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_status_history_reason_len_chk" CHECK ("review_status_history"."reason" IS NULL OR char_length("review_status_history"."reason") <= 500)
);
--> statement-breakpoint
ALTER TABLE "review_status_history" ADD CONSTRAINT "review_status_history_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_status_history" ADD CONSTRAINT "review_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_status_history_review_id_idx" ON "review_status_history" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_status_history_new_status_idx" ON "review_status_history" USING btree ("new_status");--> statement-breakpoint
CREATE INDEX "review_status_history_created_at_idx" ON "review_status_history" USING btree ("created_at");