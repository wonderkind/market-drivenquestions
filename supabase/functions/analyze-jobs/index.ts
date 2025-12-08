import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Job {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobs } = await req.json() as { jobs: Job[] };
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ error: 'No jobs provided for analysis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing', jobs.length, 'job descriptions');

    // Prepare job descriptions for analysis
    const jobSummaries = jobs.map((job, index) => 
      `[Job ${index + 1}] ${job.job_title} at ${job.employer_name}:\n${job.job_description?.slice(0, 1500) || 'No description'}`
    ).join('\n\n---\n\n');

    const systemPrompt = `You are an expert job market analyst. Analyze the provided job descriptions and extract requirements related to three categories:

1. **License** - Any driving licenses (e.g., Rijbewijs B, C1, forklift license) or permits
2. **Qualification** - Education levels (MBO, HBO, Bachelor, etc.) and years of experience
3. **Certification** - Professional certifications (VCA, BHV, forklift certificate, etc.)

For each category, provide maximum 2 suggested interview questions that a job seeker should prepare for.

Return your analysis as a JSON object with this exact structure:
{
  "license": {
    "questions": [
      {
        "question": "The interview question",
        "mentions": <number of jobs mentioning this>,
        "certainty": "<high/medium/low>",
        "quotes": ["Quote 1 from job description", "Quote 2"],
        "sources": ["Company 1", "Company 2"]
      }
    ]
  },
  "qualification": {
    "questions": [...]
  },
  "certification": {
    "questions": [...]
  },
  "summary": "Brief overall summary of requirements trends"
}

Be specific with quotes - use actual text from the job descriptions. Include the employer name in sources.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these ${jobs.length} job listings and extract License, Qualification, and Certification requirements:\n\n${jobSummaries}` }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const analysisContent = aiData.choices?.[0]?.message?.content;
    
    console.log('AI analysis completed');

    let analysis;
    try {
      analysis = JSON.parse(analysisContent);
    } catch {
      console.error('Failed to parse AI response:', analysisContent);
      throw new Error('Failed to parse AI analysis response');
    }

    return new Response(JSON.stringify({ 
      analysis,
      jobCount: jobs.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-jobs function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
