-- Add birthdate column to profiles table
ALTER TABLE "profiles" ADD COLUMN "birthdate" date;

-- Create blocked_emails table
CREATE TABLE IF NOT EXISTS "blocked_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"birthdate" date NOT NULL,
	"blocked_at" timestamp DEFAULT now() NOT NULL,
	"can_register_at" date NOT NULL,
	CONSTRAINT "blocked_emails_email_unique" UNIQUE("email")
);
