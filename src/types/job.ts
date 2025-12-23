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

export interface JobHighlights {
  Qualifications?: string[];
  Responsibilities?: string[];
  Benefits?: string[];
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
  job_highlights: JobHighlights;
  job_onet_soc: string | null;
  job_onet_job_zone: string | null;
}

export interface EnhancedJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_description: string;
  job_highlights: JobHighlights;
}

export interface SearchParams {
  query?: string;
  jobTitles?: string[];
  location?: string;
  country: string;
  language: string;
  date_posted: string;
  page?: number;
  num_pages?: number;
}

export interface SearchResponse {
  status: string;
  request_id: string;
  parameters: Record<string, unknown>;
  data: Job[];
}

export type AnswerType = 'yes_no' | 'multiple_choice' | 'experience' | 'text';

export interface AnswerOption {
  label: string;
  emoji?: string;
  score?: number; // 0-100 match percentage
  isPreferred?: boolean; // Mark as the ideal answer
}

export interface ExperienceScoreTier {
  minValue: number;
  maxValue: number;
  score: number; // 0-100
  label?: string; // e.g., "Expert", "Intermediate"
}

export interface ExperienceConfig {
  min: number;
  max: number;
  unit: 'years' | 'months';
  scoringTiers?: ExperienceScoreTier[];
}

export interface YesNoScoring {
  yesScore: number; // e.g., 100
  noScore: number;  // e.g., 0, or could be 50 for "preferred but not required"
}

export interface QuestionScoring {
  yesNoScoring?: YesNoScoring;
  isRequired?: boolean; // If true, 0% score = disqualified
  weight?: number; // Importance weight (1-10), default 5
}

export interface AnalysisQuestion {
  question: string;
  mentions: number;
  certainty: 'high' | 'medium' | 'low';
  quotes: string[];
  sources: string[];
  answerType: AnswerType;
  options?: AnswerOption[];
  experienceConfig?: ExperienceConfig;
  userAnswer?: string | string[] | number | boolean;
  scoring?: QuestionScoring;
}

export interface AnalysisCategory {
  questions: AnalysisQuestion[];
}

export interface AnalysisResult {
  license: AnalysisCategory;
  qualification: AnalysisCategory;
  certification: AnalysisCategory;
  operationele_fit: AnalysisCategory;
  summary: string;
}

export interface PotentialQuestions {
  license: AnalysisQuestion[];
  qualification: AnalysisQuestion[];
  certification: AnalysisQuestion[];
  operationele_fit: AnalysisQuestion[];
}

export interface AnalysisMetrics {
  totalJobsAnalyzed: number;
  basicJobsCount: number;
  enhancedJobsCount: number;
  questionsFound: {
    license: number;
    qualification: number;
    certification: number;
  };
  previousQuestionsFound?: {
    license: number;
    qualification: number;
    certification: number;
  };
}

export interface SavedQuestionsData {
  questions: AnalysisResult;
  potentialQuestions?: PotentialQuestions;
  relevanceThresholds?: {
    license: number;
    certification: number;
    qualification: number;
    operationele_fit: number;
  };
  totalJobsAnalyzed?: number;
  profile: string;
  country: string;
  language: string;
  jobsScrapedCount?: number;
  savedAt: string;
}
