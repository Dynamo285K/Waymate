DROP INDEX "messages_conversation_id_idx";--> statement-breakpoint
CREATE INDEX "messages_conversation_sent_idx" ON "messages" USING btree ("conversation_id","sent_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "messages"."deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "message_content_length_check" CHECK (char_length("messages"."content") BETWEEN 1 AND 2000);