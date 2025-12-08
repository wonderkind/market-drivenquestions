import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobHighlights {
  Qualifications?: string[];
  Responsibilities?: string[];
  Benefits?: string[];
}

interface JobDetailsResponse {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_description: string;
  job_highlights: JobHighlights;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobIds, country } = await req.json() as { jobIds: string[]; country: string };
    
    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    if (!jobIds || jobIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No job IDs provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching details for ${jobIds.length} jobs`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const jobDetails: JobDetailsResponse[] = [];
    
    // Fetch job details for each job ID (with rate limiting consideration)
    for (const jobId of jobIds) {
      try {
        const url = `https://jsearch.p.rapidapi.com/job-details?job_id=${encodeURIComponent(jobId)}&country=${country}`;
        
        console.log(`Fetching job details for: ${jobId}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch job ${jobId}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const job = data.data?.[0];
        
        if (job) {
          const jobHighlights = {
            Qualifications: job.job_highlights?.Qualifications || [],
            Responsibilities: job.job_highlights?.Responsibilities || [],
            Benefits: job.job_highlights?.Benefits || [],
          };

          jobDetails.push({
            job_id: job.job_id,
            job_title: job.job_title,
            employer_name: job.employer_name,
            job_description: job.job_description,
            job_highlights: jobHighlights,
          });

          // Update the job in database with enhanced data
          const { error: updateError } = await supabaseAdmin
            .from('jobs')
            .update({
              job_highlights: jobHighlights,
              enhanced_data_fetched: true,
            })
            .eq('job_id', jobId);

          if (updateError) {
            console.error('Error updating job:', jobId, updateError);
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching job ${jobId}:`, error);
      }
    }

    console.log(`Successfully fetched ${jobDetails.length} job details`);

    return new Response(JSON.stringify({ 
      jobs: jobDetails,
      totalRequested: jobIds.length,
      totalFetched: jobDetails.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-job-details function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
