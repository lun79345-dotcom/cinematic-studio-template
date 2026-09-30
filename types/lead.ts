export type LeadPayload = {
  name: string;
  company: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
  consent: boolean;
  website: string;
};

export type StoredLead = Omit<LeadPayload, "website"> & {
  id: string;
  submittedAt: string;
  status: "new";
  notificationStatus: "not-configured" | "pending" | "sent" | "partial" | "failed";
};
