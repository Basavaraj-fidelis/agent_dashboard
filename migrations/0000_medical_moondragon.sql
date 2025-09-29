CREATE TABLE "agent_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"report_type" text NOT NULL,
	"report_data" jsonb NOT NULL,
	"collected_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"agent_id" varchar PRIMARY KEY NOT NULL,
	"hostname" text NOT NULL,
	"os" text NOT NULL,
	"location" text NOT NULL,
	"username" text NOT NULL,
	"last_heartbeat" timestamp NOT NULL,
	"status" text DEFAULT 'offline' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heartbeat_current" (
	"agent_id" varchar PRIMARY KEY NOT NULL,
	"collected_at" timestamp NOT NULL,
	"local_ip" text,
	"public_ip" text,
	"location" text
);
--> statement-breakpoint
CREATE TABLE "heartbeat_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"collected_at" timestamp NOT NULL,
	"local_ip" text,
	"public_ip" text,
	"location" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "agent_reports" ADD CONSTRAINT "agent_reports_agent_id_agents_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("agent_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat_current" ADD CONSTRAINT "heartbeat_current_agent_id_agents_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("agent_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat_history" ADD CONSTRAINT "heartbeat_history_agent_id_agents_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("agent_id") ON DELETE no action ON UPDATE no action;