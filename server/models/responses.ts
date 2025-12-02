import { z } from "zod";
import { convertKeysToCamelCase } from "../api/helpers/camel-case";

export const Channel = z.object({
  id: z.string(),
  name: z.string(),
});

export const Server = z.object({
  id: z.string(),
  name: z.string(),
  serverImageUrl: z.string().nullable(),
  channels: Channel.array(),
  serverCreatorId: z.string(),
});

export const EditedServer = Server.omit({
  channels: true,
  serverCreatorId: true,
});

export const Profile = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  accountType: z.enum(["worker", "employer"]).default("worker"),
});

export const MessageReaction = z.object({
  id: z.string(),
  reaction: z.string(),
  profileId: z.string(),
});

export const MessageReactionWithoutId = MessageReaction.omit({ id: true });

export const Message = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date({ coerce: true }).nullable().default(null),
  attachmentUrl: z.string().nullable(),
  author: Profile,
  reactions: MessageReaction.array().default([]),
});

export const DraftMessage = z.preprocess(
  (data) => convertKeysToCamelCase(data),
  z.object({
    id: z.string(),
    content: z.string(),
    authorId: z.string(),
    channelId: z.string(),
    attachmentUrl: z.string().nullable(),
    createdAt: z.coerce.date().nullable(),
  }),
);

export const Reaction = z.preprocess(
  (data) => convertKeysToCamelCase(data),
  z.object({
    id: z.string(),
    messageId: z.string(),
    reaction: z.string(),
    profileId: z.string(),
  }),
);

// Worker Management Response Types
export const Worker = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string().nullable(),
  birthdate: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  emergencyContact: z.string().nullable(),
  emergencyPhone: z.string().nullable(),
  createdAt: z.date({ coerce: true }),
  updatedAt: z.date({ coerce: true }),
});

export const WorkHistory = z.object({
  id: z.string(),
  workerId: z.string(),
  employer: z.string(),
  position: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  responsibilities: z.string().nullable(),
  createdAt: z.date({ coerce: true }),
});

export const Skill = z.object({
  id: z.string(),
  workerId: z.string(),
  skillName: z.string(),
  proficiencyLevel: z.string().nullable(),
  yearsOfExperience: z.string().nullable(),
  createdAt: z.date({ coerce: true }),
});

export const Document = z.object({
  id: z.string(),
  workerId: z.string(),
  documentType: z.string(),
  documentName: z.string(),
  documentUrl: z.string(),
  uploadedAt: z.date({ coerce: true }),
});

export const WorkerWithDetails = Worker.extend({
  workHistory: WorkHistory.array(),
  skills: Skill.array(),
  documents: Document.array(),
});

// Job Posting Response (for employers)
export const JobPosting = z.object({
  id: z.string(),
  employerId: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string().nullable(),
  payRate: z.string().nullable(),
  requirements: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  workersNeeded: z.number().default(1),
  status: z.enum(["active", "filled", "closed"]),
  createdAt: z.date({ coerce: true }),
  updatedAt: z.date({ coerce: true }),
});

// Job Posting with application count
export const JobPostingWithApplications = JobPosting.extend({
  applicationCount: z.number().default(0),
});

// Job Application Response
export const JobApplication = z.object({
  id: z.string(),
  jobId: z.string(),
  workerId: z.string(),
  status: z.enum(["pending", "accepted", "rejected"]),
  appliedAt: z.date({ coerce: true }),
});

// Worker Job History Response (for workers)
export const WorkerJobHistory = z.object({
  id: z.string(),
  workerId: z.string(),
  employer: z.string(),
  position: z.string(),
  location: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.date({ coerce: true }),
});
