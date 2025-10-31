/**
 * This file defines the entire database schema - including all tables and relations.
 *
 * To configure the Supabase database using this schema as a guide, use the command:
 * ```
 * npx drizzle-kit push
 * ```
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import {
  index,
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
