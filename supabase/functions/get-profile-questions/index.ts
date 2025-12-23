import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface AnalysisData {
  profile?: string;
  country?: string;
  language?: string;
  jobsScrapedCount?: number;
  totalJobsAnalyzed?: number;
  savedAt?: string;
  questions?: Record<string, { questions: unknown[] }>;
  potentialQuestions?: Record<string, unknown[]>;
  relevanceThresholds?: Record<string, number>;
}

function countQuestions(questions?: Record<string, { questions: unknown[] }>): number {
  if (!questions) return 0;
  return Object.values(questions).reduce((sum, category) => {
    if (category && Array.isArray(category.questions)) {
      return sum + category.questions.length;
    }
    return sum;
  }, 0);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('get-profile-questions: Request received');

    // Optional API key authentication
    const API_KEY = Deno.env.get('PROFILE_API_KEY');
    if (API_KEY) {
      const providedKey = req.headers.get('x-api-key');
      if (providedKey !== API_KEY) {
        console.log('get-profile-questions: Invalid API key provided');
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      console.log('get-profile-questions: API key validated');
    }

    // Get query params
    const url = new URL(req.url);
    let profileId = url.searchParams.get('profileId');
    let profileName = url.searchParams.get('profileName');
    let country = url.searchParams.get('country');
    const listProfiles = url.searchParams.get('list') === 'true';

    // Handle POST body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        profileId = body.profileId || profileId;
        profileName = body.profileName || profileName;
        country = body.country || country;
      } catch {
        // No body or invalid JSON, continue with query params
      }
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // List all profiles if requested
    if (listProfiles) {
      console.log('get-profile-questions: Listing all profiles');
      const { data: profiles, error } = await supabase
        .from('analysis_results')
        .select('id, created_at, analysis_data')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('get-profile-questions: Error fetching profiles:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const profileList = profiles?.map(p => {
        const data = p.analysis_data as AnalysisData;
        return {
          id: p.id,
          createdAt: p.created_at,
          profile: data?.profile,
          country: data?.country,
          language: data?.language,
          questionCount: countQuestions(data?.questions)
        };
      });

      console.log(`get-profile-questions: Found ${profileList?.length || 0} profiles`);
      return new Response(JSON.stringify({ profiles: profileList }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Require profileId OR profileName for single profile fetch
    if (!profileId && !profileName) {
      console.log('get-profile-questions: Missing profileId and profileName');
      return new Response(JSON.stringify({ 
        error: 'profileId or profileName is required. Use ?list=true to see available profiles.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let profile;
    let matchInfo: { searchedName?: string; matchedName?: string; totalMatches?: number; selectedReason?: string } | null = null;

    // Fetch by profileId (priority) or search by profileName
    if (profileId) {
      console.log(`get-profile-questions: Fetching profile by ID: ${profileId}`);
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (error) {
        console.error('get-profile-questions: Error fetching profile:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      profile = data;
    } else if (profileName) {
      console.log(`get-profile-questions: Searching profile by name: "${profileName}"${country ? ` with country: ${country}` : ''}`);
      
      // Fetch all profiles and filter in memory for case-insensitive partial matching
      const { data: allProfiles, error } = await supabase
        .from('analysis_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('get-profile-questions: Error fetching profiles:', error);
        return new Response(JSON.stringify({ error: 'Failed to search profiles' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Filter profiles by name (case-insensitive partial match)
      const searchTermLower = profileName.toLowerCase();
      let matchingProfiles = allProfiles?.filter(p => {
        const data = p.analysis_data as AnalysisData;
        const profileNameInData = data?.profile?.toLowerCase() || '';
        return profileNameInData.includes(searchTermLower);
      }) || [];

      // Apply country filter if provided
      if (country && matchingProfiles.length > 0) {
        const countryLower = country.toLowerCase();
        matchingProfiles = matchingProfiles.filter(p => {
          const data = p.analysis_data as AnalysisData;
          return data?.country?.toLowerCase() === countryLower;
        });
      }

      console.log(`get-profile-questions: Found ${matchingProfiles.length} matching profiles`);

      if (matchingProfiles.length > 0) {
        // Return the most recent matching profile
        profile = matchingProfiles[0];
        const matchedData = profile.analysis_data as AnalysisData;
        matchInfo = {
          searchedName: profileName,
          matchedName: matchedData?.profile,
          totalMatches: matchingProfiles.length,
          selectedReason: matchingProfiles.length > 1 ? 'Most recent' : 'Exact match'
        };
      }
    }

    if (!profile) {
      console.log('get-profile-questions: Profile not found');
      return new Response(JSON.stringify({ 
        error: 'Profile not found',
        searchedBy: profileId ? 'profileId' : 'profileName',
        searchValue: profileId || profileName,
        ...(country && { countryFilter: country })
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Structure the response
    const analysisData = profile.analysis_data as AnalysisData;
    const response = {
      profileId: profile.id,
      createdAt: profile.created_at,
      ...(matchInfo && { matchInfo }),
      metadata: {
        profile: analysisData?.profile,
        country: analysisData?.country,
        language: analysisData?.language,
        jobsScrapedCount: analysisData?.jobsScrapedCount,
        totalJobsAnalyzed: analysisData?.totalJobsAnalyzed,
        savedAt: analysisData?.savedAt
      },
      questions: analysisData?.questions,
      potentialQuestions: analysisData?.potentialQuestions || null,
      relevanceThresholds: analysisData?.relevanceThresholds || null,
      summary: analysisData?.questions?.summary || null
    };

    console.log(`get-profile-questions: Successfully fetched profile "${analysisData?.profile}" with ${countQuestions(analysisData?.questions)} questions`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('get-profile-questions: Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
