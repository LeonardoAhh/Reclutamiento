export interface DailyWorkRecruiter {
  id: string;
  displayName: string;
}

export interface DailyWorkAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  signedUrl?: string;
  createdAt: string;
}

export interface DailyWorkActivity {
  id: string;
  recruiterId: string;
  recruiterName: string;
  workDate: string;
  description: string;
  startTime: string | null;
  endTime: string | null;
  attachments: DailyWorkAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyWorkActivityInput {
  workDate: string;
  description: string;
  startTime: string | null;
  endTime: string | null;
}

export interface DailyWorkActivityDraft extends DailyWorkActivityInput {
  id?: string;
  files: File[];
}
