import { z } from "zod";

export const ServerIdentity = z.object({ serverId: z.string() });

export const ChannelIdentity = z.object({ channelId: z.string() });

export const ProfileIdentity = z.object({ profileId: z.string() });
export const NewChannel = z.object({
  serverId: z.string(),
  channelName: z.string(),
});

export const PaginatedMessagesRequest = z.object({
  channelId: z.string(),
  cursor: z.number().default(0),
  textSearch: z.string().optional(),
});

export const NewReaction = z.object({
  channelId: z.string(),
  messageId: z.string(),
  emoji: z.string(),
});

export const RemoveReactionRequest = NewReaction;

export const NewProfileImage = z.object({ avatarUrl: z.string().optional() });

export const NewDisplayName = z.object({ newDisplayName: z.string() });

export const NewProfile = z.object({
  displayName: z.string(),
  username: z.string(),
  accountType: z.enum(["worker", "employer"]).default("worker"),
});

// Worker Management Inputs
export const WorkerIdentity = z.object({ workerId: z.string() });

export const NewWorker = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.string().optional(),
  birthdate: z.string().optional(), // ISO date string
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const UpdateWorker = z.object({
  workerId: z.string(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.string().optional(),
  birthdate: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const NewWorkHistory = z.object({
  workerId: z.string(),
  employer: z.string().min(1, "Employer is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string(), // ISO date string
  endDate: z.string().optional(),
  responsibilities: z.string().optional(),
});

export const UpdateWorkHistory = z.object({
  id: z.string(),
  employer: z.string().optional(),
  position: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  responsibilities: z.string().optional(),
});

export const WorkHistoryIdentity = z.object({ id: z.string() });

export const NewSkill = z.object({
  workerId: z.string(),
  skillName: z.string().min(1, "Skill name is required"),
  proficiencyLevel: z.string().optional(),
  yearsOfExperience: z.string().optional(),
});

export const UpdateSkill = z.object({
  id: z.string(),
  skillName: z.string().optional(),
  proficiencyLevel: z.string().optional(),
  yearsOfExperience: z.string().optional(),
});

export const SkillIdentity = z.object({ id: z.string() });

export const NewDocument = z.object({
  workerId: z.string(),
  documentType: z.string().min(1, "Document type is required"),
  documentName: z.string().min(1, "Document name is required"),
  documentUrl: z.string().url("Must be a valid URL"),
});

export const DocumentIdentity = z.object({ id: z.string() });

// Job Posting Inputs (for employers)
export const NewJobPosting = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().optional(),
  payRate: z.string().optional(),
  requirements: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  workersNeeded: z.number().min(1).default(1),
});

export const UpdateJobPosting = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  payRate: z.string().optional(),
  requirements: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["active", "filled", "closed"]).optional(),
  workersNeeded: z.number().min(1).optional(),
});

export const JobPostingIdentity = z.object({ id: z.string() });

// Job Application Inputs
export const NewJobApplication = z.object({
  jobId: z.string(),
});

export const JobApplicationIdentity = z.object({
  jobId: z.string(),
  workerId: z.string(),
});

// Worker Job History Inputs (for workers)
export const NewWorkerJobHistory = z.object({
  employer: z.string().min(1, "Employer is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  startDate: z.string(), // ISO date string
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const UpdateWorkerJobHistory = z.object({
  id: z.string(),
  employer: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const WorkerJobHistoryIdentity = z.object({ id: z.string() });
