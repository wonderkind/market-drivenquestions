import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, country, language, date_posted, page = 1 } = await req.json();
    
    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    console.log('Searching jobs with params:', { query, location, country, language, date_posted, page });

    const params = new URLSearchParams({
      query: query || '',
      page: String(page),
      num_pages: '5',
      date_posted: date_posted || 'all',
      country: country || 'nl',
      language: language || 'en',
    });

    if (location) {
      params.append('location', location);
    }

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('JSearch API error:', response.status, errorText);
      throw new Error(`JSearch API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('JSearch response status:', data.status, 'Jobs found:', data.data?.length || 0);

    // Store jobs in database using service role
    if (data.data && data.data.length > 0) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      console.log('Storing', data.data.length, 'jobs in database...');

      for (const job of data.data) {
        const { error: upsertError } = await supabaseAdmin
          .from('jobs')
          .upsert({
            job_id: job.job_id,
            job_title: job.job_title,
            employer_name: job.employer_name,
            employer_logo: job.employer_logo,
            employer_website: job.employer_website,
            job_publisher: job.job_publisher,
            job_employment_type: job.job_employment_type,
            job_apply_link: job.job_apply_link,
            job_description: job.job_description,
            job_is_remote: job.job_is_remote,
            job_posted_at: job.job_posted_at,
            job_location: job.job_location,
            job_city: job.job_city,
            job_state: job.job_state,
            job_country: job.job_country,
            job_benefits: job.job_benefits,
            job_min_salary: job.job_min_salary,
            job_max_salary: job.job_max_salary,
            job_salary_period: job.job_salary_period,
            job_highlights: job.job_highlights,
            enhanced_data_fetched: false,
          }, { onConflict: 'job_id' });

        if (upsertError) {
          console.error('Error storing job:', job.job_id, upsertError);
        }
      }

      console.log('Jobs stored successfully');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search-jobs function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
