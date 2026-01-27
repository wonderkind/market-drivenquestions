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
  experienceConfig?: {
    min: number;
    max: number;
    unit: string;
    scoringTiers?: Array<{ label: string; score: number; minValue: number; maxValue: number }>;
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

// Map category to step_type
const categoryToStepType: Record<string, string> = {
  license: 'license',
  certification: 'certification',
  qualification: 'experience_level',
  operationele_fit: 'availability',
};

// Map emoji to Lucide icon name
const emojiToIcon: Record<string, string> = {
  '✅': 'Check',
  '❌': 'X',
  '🦺': 'Shield',
  '🏗️': 'Building2',
  '📘': 'BookOpen',
  '⛑️': 'Cross',
  '🎓': 'GraduationCap',
  '📄': 'FileText',
  '🛠️': 'Wrench',
  '🏫': 'School',
  '0️⃣': 'bs-Icon0SquareFill',
  '1️⃣': 'bs-Icon1SquareFill',
  '2️⃣': 'bs-Icon2SquareFill',
  '3️⃣': 'bs-Icon3SquareFill',
  '5️⃣': 'bs-Icon5SquareFill',
  '📌': 'Pin',
  '✨': 'Sparkles',
  '💡': 'Lightbulb',
  '🔹': 'Diamond',
  '⭐': 'Star',
  '📎': 'Paperclip',
  '🔸': 'Square',
  '💠': 'Gem',
  '🔧': 'Wrench',
  '🏅': 'Medal',
  '📜': 'ScrollText',
};

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

function getPattern(answerType: string, optionsCount: number): string {
  switch (answerType) {
    case 'yes_no':
      return 'icon_cards_2x1';
    case 'multiple_choice':
      if (optionsCount <= 2) return 'icon_cards_2x1';
      if (optionsCount <= 4) return 'icon_cards_2x2';
      return 'list_multi';
    case 'experience':
      return 'icon_cards_2x2';
    case 'text':
      return 'form_fields';
    default:
      return 'list_single_icons';
  }
}

function getType(answerType: string): string {
  switch (answerType) {
    case 'yes_no':
      return 'select';
    case 'multiple_choice':
      return 'multiselect';
    case 'experience':
      return 'select';
    case 'text':
      return 'textarea';
    default:
      return 'select';
  }
}

function transformQuestionToStep(
  q: AnalysisQuestion, 
  category: string, 
  index: number
): Record<string, unknown> {
  const questionId = `${category}_${index + 1}`;
  const stepType = categoryToStepType[category] || 'custom';
  
  let options: Array<Record<string, unknown>> = [];
  
  if (q.answerType === 'yes_no') {
    options = [
      {
        value: 'yes',
        label: 'Yes',
        icon: 'Check',
        color: '#22C55E',
        iconBgColor: '#22C55E',
        textColor: '#FFFFFF',
        size: 'L',
        bold: true,
        is_qualifying: true,
      },
      {
        value: 'no',
        label: 'No',
        icon: 'X',
        color: '#EF4444',
        iconBgColor: '#EF4444',
        textColor: '#FFFFFF',
        size: 'L',
        bold: true,
        disqualifies: q.scoring?.isRequired || false,
      },
    ];
  } else if (q.answerType === 'experience') {
    options = experienceOptions.map((opt, idx) => ({
      value: String(opt.value),
      label: opt.label,
      icon: emojiToIcon[opt.emoji] || `bs-Icon${opt.value}SquareFill`,
      color: '#017AFF',
      iconBgColor: '#017AFF',
      textColor: '#FFFFFF',
      size: 'M',
      bold: false,
      is_qualifying: opt.value >= 1,
    }));
  } else if (q.options && q.options.length > 0) {
    options = q.options.map((opt, idx) => {
      const emoji = opt.emoji || defaultEmojis[idx % defaultEmojis.length];
      return {
        value: slugify(opt.label),
        label: opt.label,
        icon: emojiToIcon[emoji] || 'Circle',
        color: opt.isPreferred ? '#22C55E' : '#017AFF',
        iconBgColor: opt.isPreferred ? '#22C55E' : '#017AFF',
        textColor: '#FFFFFF',
        size: 'M',
        bold: opt.isPreferred || false,
        is_qualifying: opt.isPreferred || false,
        disqualifies: opt.label.toLowerCase().includes('none') || opt.label.toLowerCase().includes('no '),
      };
    });
  }

  return {
    question_id: questionId,
    question: q.question,
    type: getType(q.answerType),
    required: q.scoring?.isRequired || false,
    step_type: stepType,
    pattern: getPattern(q.answerType, options.length),
    slug: slugify(q.question),
    textBlocks: [],
    options,
    // Preserve original metadata for reference
    _metadata: {
      mentions: q.mentions,
      certainty: q.certainty,
      sources: q.sources,
      quotes: q.quotes,
      weight: q.scoring?.weight,
    },
  };
}

function buildTemplateExport(profile: { id: string; created_at: string; analysis_data: unknown }) {
  const analysisData = profile.analysis_data as SavedQuestionsData;
  const questions = analysisData.questions || {};

  const steps: Array<Record<string, unknown>> = [];
  
  // Process each category
  const categoryOrder = ['license', 'certification', 'qualification', 'operationele_fit'];
  
  for (const category of categoryOrder) {
    const categoryQuestions = questions[category]?.questions || [];
    for (let i = 0; i < categoryQuestions.length; i++) {
      steps.push(transformQuestionToStep(categoryQuestions[i], category, i));
    }
  }

  return {
    template: {
      name: analysisData.profile,
      description: `Generated from ${analysisData.jobsScrapedCount || 0} job listings`,
      country: (analysisData.country || 'US').toUpperCase(),
      language: analysisData.language || 'en',
      onet_profile_id: profile.id,
      client_id: null,
    },
    styling: {
      backgroundColor: '#F8FAFC',
      buttonColor: '#017AFF',
      fontColor: '#062A64',
      fontFamily: 'Poppins',
    },
    steps,
    _source: {
      profileId: profile.id,
      createdAt: profile.created_at,
      exportedAt: new Date().toISOString(),
      totalQuestions: steps.length,
      jobsScrapedCount: analysisData.jobsScrapedCount || 0,
    },
  };
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

    // Return template format for external tool import
    if (format === "template") {
      const templateExport = buildTemplateExport(profile);
      return new Response(
        JSON.stringify(templateExport),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
