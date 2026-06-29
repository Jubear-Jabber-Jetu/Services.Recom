export interface LeadPayload {
  name: string;
  company: string;
  companySize: string;
  phone: string;
  email: string;
  services: string[];
  details: string;
  submittedAt: string;
}

export type VideoKey = 'overview' | 'pf';

export interface VideoConfig {
  url: string;
  title: string;
  meta: string;
  portrait?: boolean;
}
