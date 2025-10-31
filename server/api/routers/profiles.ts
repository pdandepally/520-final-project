/**
 * tRPC APIs that contains all of the functionality for creating,
 * reading, updating, and deleting data in our database relating to
 * profiles.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Profile } from "@/server/models/responses";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { profilesTable } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import {
  NewDisplayName,
  NewProfile,
  NewProfileImage,
  ProfileIdentity,
} from "@/server/models/inputs";

/** Gets a profile by its ID. */
const getProfile = protectedProcedure
  .input(ProfileIdentity)
  .output(Profile)
  .query(async ({ input }) => {
    const { profileId } = input;

    const profile = await db.query.profilesTable.findFirst({
      where: eq(profilesTable.id, profileId),
      columns: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
      },
    });

    if (!profile)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "The profile does not exist.",
      });

    return Profile.parse(profile);
  });

/** Changes a profile's profile picture. */
const changeProfileImage = protectedProcedure
  .input(NewProfileImage)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { avatarUrl } = input;

    await db
      .update(profilesTable)
      .set({ avatarUrl })
      .where(eq(profilesTable.id, subject.id));
  });

/** Changes a profile's display name. */
const changeProfileDisplayName = protectedProcedure
  .input(NewDisplayName)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { newDisplayName } = input;

    await db
      .update(profilesTable)
      .set({ displayName: newDisplayName })
      .where(eq(profilesTable.id, subject.id));
  });

/** Handles a new user when a user signs up for Alias. */
const handleNewUser = protectedProcedure
  .input(NewProfile)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { displayName, username } = input;
    await db
      .insert(profilesTable)
      .values({ id: subject.id, displayName, username });
  });

/**
 * Router for all profile-related APIs.
 */
export const profilesApiRouter = createTRPCRouter({
  getProfile: getProfile,
  changeProfileImage: changeProfileImage,
  changeProfileDisplayName: changeProfileDisplayName,
  handleNewUser: handleNewUser,
});
