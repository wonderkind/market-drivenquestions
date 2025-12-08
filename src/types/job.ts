export interface ApplyOption {
  publisher: string;
  apply_link: string;
  is_direct: boolean;
}

export interface ProfileTranslateParams {
  profile: string;
  country: string;
  language: string;
}

export interface ProfileTranslateResponse {
  jobTitles: string[];
  originalProfile: string;
}

export interface Job {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  employer_website: string | null;
  job_publisher: string;
  job_employment_type: string;
  job_employment_types: string[];
  job_apply_link: string;
  job_apply_is_direct: boolean;
  apply_options: ApplyOption[];
  job_description: string;
  job_is_remote: boolean;
  job_posted_at: string | null;
  job_posted_at_timestamp: number | null;
  job_posted_at_datetime_utc: string | null;
  job_location: string;
  job_city: string | null;
  job_state: string | null;
  job_country: string;
  job_latitude: number | null;
  job_longitude: number | null;
  job_benefits: string[] | null;
  job_google_link: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_period: string | null;
  job_highlights: Record<string, unknown>;
  job_onet_soc: string | null;
  job_onet_job_zone: string | null;
}

export interface SearchParams {
  query: string;
  location: string;
  country: string;
  language: string;
  date_posted: string;
  page?: number;
}

export interface SearchResponse {
  status: string;
  request_id: string;
  parameters: Record<string, unknown>;
  data: Job[];
}

export interface AnalysisQuestion {
  question: string;
  mentions: number;
  certainty: 'high' | 'medium' | 'low';
  quotes: string[];
  sources: string[];
}

export interface AnalysisCategory {
  questions: AnalysisQuestion[];
}

export interface AnalysisResult {
  license: AnalysisCategory;
  qualification: AnalysisCategory;
  certification: AnalysisCategory;
  summary: string;
}
