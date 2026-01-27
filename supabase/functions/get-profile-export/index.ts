import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface SavedQuestionsData {
  questions: Record<string, { questions: AnalysisQuestion[] }>;
  profile: string;
  country: string;
  language: string;
  jobsScrapedCount?: number;
  savedAt: string;
}

interface AnswerOption {
  label: string;
  emoji?: string;
  score?: number;
  isPreferred?: boolean;
}

interface AnalysisQuestion {
  question: string;
  mentions: number;
  certainty: 'high' | 'medium' | 'low';
  quotes: string[];
  sources: string[];
  answerType: 'yes_no' | 'multiple_choice' | 'experience' | 'text';
  options?: AnswerOption[];
  userAnswer?: string | string[] | number | boolean;
  scoring?: {
    yesNoScoring?: { yesScore: number; noScore: number };
    isRequired?: boolean;
    weight?: number;
  };
}

// Default emojis for options without specific emoji
const defaultEmojis = ['📌', '✨', '💡', '🔹', '⭐', '📎', '🔸', '💠'];

// Experience options (predefined)
const experienceOptions = [
  { value: 0, label: 'No experience', emoji: '0️⃣' },
  { value: 1, label: 'Less than 1 year', emoji: '1️⃣' },
  { value: 2, label: '1-3 years', emoji: '2️⃣' },
  { value: 3, label: '3-5 years', emoji: '3️⃣' },
  { value: 5, label: '5+ years', emoji: '5️⃣' },
];

function countQuestions(questions: Record<string, { questions: AnalysisQuestion[] }>): number {
  return Object.values(questions).reduce(
    (total, category) => total + (category?.questions?.length || 0),
    0
  );
}

function isProfileComplete(analysisData: SavedQuestionsData): boolean {
  const totalQuestions = countQuestions(analysisData.questions || {});
  return totalQuestions > 0;
}

function formatQuestionForExport(q: AnalysisQuestion, defaultEmojis: string[]) {
  return {
    question: q.question,
    answerType: q.answerType,
    options: q.answerType === 'multiple_choice' ? (q.options || []).map((opt: AnswerOption, idx: number) => ({
      label: opt.label,
      emoji: opt.emoji || defaultEmojis[idx % defaultEmojis.length],
      score: opt.score,
      isPreferred: opt.isPreferred,
    })) : undefined,
    experienceOptions: q.answerType === 'experience' ? experienceOptions : undefined,
    yesNoOptions: q.answerType === 'yes_no' ? [
      { label: 'Yes', emoji: '✅', value: true },
      { label: 'No', emoji: '❌', value: false },
    ] : undefined,
    userAnswer: q.userAnswer,
    mentions: q.mentions,
    certainty: q.certainty,
    quotes: q.quotes,
    sources: q.sources,
    scoring: q.scoring,
  };
}

function buildStructuredExport(profile: { id: string; created_at: string; analysis_data: unknown }) {
  const analysisData = profile.analysis_data as SavedQuestionsData;
  const questions = analysisData.questions || {};

  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      profileId: profile.id,
      createdAt: profile.created_at,
      profile: analysisData.profile,
      country: analysisData.country,
      language: analysisData.language,
      jobsScrapedCount: analysisData.jobsScrapedCount || 0,
    },
    categories: {
      license: {
        title: 'License Requirements',
        emoji: '🚗',
        questions: (questions.license?.questions || []).map(q => formatQuestionForExport(q, defaultEmojis)),
      },
      certification: {
        title: 'Certification Requirements',
        emoji: '🏆',
        questions: (questions.certification?.questions || []).map(q => formatQuestionForExport(q, defaultEmojis)),
      },
      qualification: {
        title: 'Qualification Requirements',
        emoji: '🎓',
        questions: (questions.qualification?.questions || []).map(q => formatQuestionForExport(q, defaultEmojis)),
      },
      operationele_fit: {
        title: 'Operational Fit',
        emoji: '🔧',
        questions: (questions.operationele_fit?.questions || []).map(q => formatQuestionForExport(q, defaultEmojis)),
      },
    },
    summary: {
      totalQuestions: countQuestions(questions),
      questionsByCategory: {
        license: questions.license?.questions?.length || 0,
        certification: questions.certification?.questions?.length || 0,
        qualification: questions.qualification?.questions?.length || 0,
        operationele_fit: questions.operationele_fit?.questions?.length || 0,
      },
    },
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from header
    const apiKey = req.headers.get("x-api-key");
    const expectedApiKey = Deno.env.get("PROFILE_API_KEY");

    // Validate API key if configured
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid or missing API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let profileId: string | null = null;
    let format: string = "full"; // Default format

    // Support both GET and POST methods
    if (req.method === "GET") {
      const url = new URL(req.url);
      profileId = url.searchParams.get("profileId");
      format = url.searchParams.get("format") || "full";
    } else if (req.method === "POST") {
      const body = await req.json();
      profileId = body.profileId;
      format = body.format || "full";
    }

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "Profile ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the profile
    const { data: profile, error } = await supabase
      .from("analysis_results")
      .select("id, analysis_data, created_at")
      .eq("id", profileId)
      .single();

    if (error || !profile) {
      console.error("Profile not found:", error);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysisData = profile.analysis_data as unknown as SavedQuestionsData;

    // Check if profile is complete (has questions)
    if (!isProfileComplete(analysisData)) {
      return new Response(
        JSON.stringify({ error: "Profile is not complete - no questions available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return structured JSON format for API consumption
    if (format === "json" || format === "structured") {
      const structuredExport = buildStructuredExport(profile);
      return new Response(
        JSON.stringify(structuredExport),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: Return the profile data for web viewing (backwards compatible)
    return new Response(
      JSON.stringify({
        profile: {
          id: profile.id,
          created_at: profile.created_at,
          analysis_data: {
            profile: analysisData.profile,
            country: analysisData.country,
            language: analysisData.language,
            jobsScrapedCount: analysisData.jobsScrapedCount,
            questions: analysisData.questions,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-profile-export:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
