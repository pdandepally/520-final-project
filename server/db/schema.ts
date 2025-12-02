import {
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const profilesTable = pgTable("profiles", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  accountType: text("account_type").notNull().default("worker"), // 'worker' or 'employer'
});

export const serversTable = pgTable("servers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  serverImageUrl: text("server_image_url"),
  serverCreatorId: text("server_creator_id").references(() => profilesTable.id),
});

export const serverMembershipsTable = pgTable(
  "server_memberships",
  {
    serverId: uuid("server_id")
      .notNull()
      .references(() => serversTable.id),
    profileId: text("profile_id")
      .notNull()
      .references(() => profilesTable.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.serverId, t.profileId] }),
  }),
);

export const channelsTable = pgTable("channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  serverId: uuid("server_id").references(() => serversTable.id),
});

export const messagesTable = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content"),
    authorId: text("author_id").references(() => profilesTable.id),
    channelId: uuid("channel_id").references(() => channelsTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    attachmentUrl: text("attachment_url"),
  },
  // NOTE: This special index is used for full text search.
  // @see https://orm.drizzle.team/docs/guides/postgresql-full-text-search
  (table) => [
    index("content_search_index").using(
      "gin",
      sql`to_tsvector('english', ${table.content})`,
    ),
  ],
);

export const reactionsTable = pgTable("reactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  reaction: text("reaction").notNull(),
  messageId: uuid("message_id").references(() => messagesTable.id),
  profileId: text("profile_id").references(() => profilesTable.id),
  channelId: uuid("channel_id").references(() => channelsTable.id),
});

// Job Postings Table (for employers)
export const jobPostingsTable = pgTable("job_postings", {
  id: uuid("id").defaultRandom().primaryKey(),
  employerId: text("employer_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  payRate: text("pay_rate"),
  requirements: text("requirements"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  workersNeeded: integer("workers_needed").notNull().default(1),
  status: text("status").notNull().default("active"), // 'active', 'filled', 'closed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Worker Job History Table (for workers)
export const workerJobHistoryTable = pgTable("worker_job_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  workerId: text("worker_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  employer: text("employer").notNull(),
  position: text("position").notNull(),
  location: text("location"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Job Applications Table (workers applying to job postings)
export const jobApplicationsTable = pgTable(
  "job_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobPostingsTable.id, { onDelete: "cascade" }),
    workerId: text("worker_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'rejected'
    appliedAt: timestamp("applied_at").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.jobId, t.workerId] }),
  }),
);

// Worker/Employee Management Tables (admin use - keeping for backward compatibility)
export const workersTable = pgTable("workers", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role"), // e.g., "Obrero", "Empleado"
  birthdate: date("birthdate"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workHistoryTable = pgTable("work_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workersTable.id, { onDelete: "cascade" }),
  employer: text("employer").notNull(),
  position: text("position").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  responsibilities: text("responsibilities"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const skillsTable = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workersTable.id, { onDelete: "cascade" }),
  skillName: text("skill_name").notNull(),
  proficiencyLevel: text("proficiency_level"), // e.g., "Beginner", "Intermediate", "Expert"
  yearsOfExperience: text("years_of_experience"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentsTable = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workersTable.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // e.g., "ID", "Resume", "Certificate"
  documentName: text("document_name").notNull(),
  documentUrl: text("document_url").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const profilesRelations = relations(profilesTable, ({ many }) => ({
  createdServers: many(serversTable),
  messages: many(messagesTable),
  reactions: many(reactionsTable),
  serverMemberships: many(serverMembershipsTable),
}));

export const serversRelations = relations(serversTable, ({ one, many }) => ({
  creator: one(profilesTable, {
    fields: [serversTable.serverCreatorId],
    references: [profilesTable.id],
  }),
  channels: many(channelsTable),
  memberships: many(serverMembershipsTable),
}));

export const serverMembershipsRelations = relations(
  serverMembershipsTable,
  ({ one }) => ({
    server: one(serversTable, {
      fields: [serverMembershipsTable.serverId],
      references: [serversTable.id],
    }),
    profile: one(profilesTable, {
      fields: [serverMembershipsTable.profileId],
      references: [profilesTable.id],
    }),
  }),
);

export const channelsRelations = relations(channelsTable, ({ one, many }) => ({
  server: one(serversTable, {
    fields: [channelsTable.serverId],
    references: [serversTable.id],
  }),
  messages: many(messagesTable),
  reactions: many(reactionsTable),
}));

export const messagesRelations = relations(messagesTable, ({ one, many }) => ({
  author: one(profilesTable, {
    fields: [messagesTable.authorId],
    references: [profilesTable.id],
  }),
  channel: one(channelsTable, {
    fields: [messagesTable.channelId],
    references: [channelsTable.id],
  }),
  reactions: many(reactionsTable),
}));

export const reactionsRelations = relations(reactionsTable, ({ one }) => ({
  message: one(messagesTable, {
    fields: [reactionsTable.messageId],
    references: [messagesTable.id],
  }),
  profile: one(profilesTable, {
    fields: [reactionsTable.profileId],
    references: [profilesTable.id],
  }),
  channel: one(channelsTable, {
    fields: [reactionsTable.channelId],
    references: [channelsTable.id],
  }),
}));

export const workersRelations = relations(workersTable, ({ many }) => ({
  workHistory: many(workHistoryTable),
  skills: many(skillsTable),
  documents: many(documentsTable),
}));

export const workHistoryRelations = relations(workHistoryTable, ({ one }) => ({
  worker: one(workersTable, {
    fields: [workHistoryTable.workerId],
    references: [workersTable.id],
  }),
}));

export const skillsRelations = relations(skillsTable, ({ one }) => ({
  worker: one(workersTable, {
    fields: [skillsTable.workerId],
    references: [workersTable.id],
  }),
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  worker: one(workersTable, {
    fields: [documentsTable.workerId],
    references: [workersTable.id],
  }),
}));
