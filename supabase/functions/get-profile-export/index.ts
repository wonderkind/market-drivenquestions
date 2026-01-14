import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SavedQuestionsData {
  questions: Record<string, { questions: unknown[] }>;
  profile: string;
  country: string;
  language: string;
  jobsScrapedCount?: number;
  savedAt: string;
}

function countQuestions(questions: Record<string, { questions: unknown[] }>): number {
  return Object.values(questions).reduce(
    (total, category) => total + (category?.questions?.length || 0),
    0
  );
}

function isProfileComplete(analysisData: SavedQuestionsData): boolean {
  const totalQuestions = countQuestions(analysisData.questions || {});
  return totalQuestions > 0;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId } = await req.json();

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

    // Return the profile data for public viewing
    // We strip any sensitive data and only return what's needed for the export view
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
