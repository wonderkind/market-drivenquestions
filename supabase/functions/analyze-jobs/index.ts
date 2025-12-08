import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobHighlights {
  Qualifications?: string[];
  Responsibilities?: string[];
  Benefits?: string[];
}

interface Job {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_description: string;
  job_highlights?: JobHighlights;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobs, enhanced } = await req.json() as { jobs: Job[]; enhanced?: boolean };
    
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

    console.log('Analyzing', jobs.length, 'job descriptions', enhanced ? '(ENHANCED MODE)' : '');

    // Prepare job data for analysis - use enhanced highlights if available
    const jobSummaries = jobs.map((job, index) => {
      let summary = `[Job ${index + 1}] ${job.job_title} at ${job.employer_name}:`;
      
      if (enhanced && job.job_highlights) {
        // Enhanced mode: use structured highlights for better accuracy
        if (job.job_highlights.Qualifications?.length) {
          summary += `\n\n**QUALIFICATIONS (Structured):**\n${job.job_highlights.Qualifications.map(q => `- ${q}`).join('\n')}`;
        }
        if (job.job_highlights.Responsibilities?.length) {
          summary += `\n\n**RESPONSIBILITIES (Structured):**\n${job.job_highlights.Responsibilities.map(r => `- ${r}`).join('\n')}`;
        }
        // Also include description for context
        summary += `\n\n**Full Description:**\n${job.job_description?.slice(0, 1000) || 'No description'}`;
      } else {
        // Standard mode: use job description
        summary += `\n${job.job_description?.slice(0, 1500) || 'No description'}`;
      }
      
      return summary;
    }).join('\n\n---\n\n');

    const systemPrompt = `You are an expert job market analyst specializing in Dutch/European labor requirements. Analyze job descriptions and extract requirements into three DISTINCT categories.

## CATEGORY DEFINITIONS (CRITICAL - Read Carefully)

### 1. LICENSE (Licensure)
- **Legal Status**: MANDATORY BY LAW. You CANNOT legally perform the job without it.
- **Issuing Authority**: Governmental Regulatory Body (e.g., RDW, CBR, Ministerie, Police, BIG Register)
- **Purpose**: Protect the PUBLIC by ensuring minimum competency for regulated professions (high public risk)
- **Renewal**: Strict government requirements, Continuing Education, sometimes background checks
- **Examples**: 
  - Rijbewijs B, C, CE (driving licenses)
  - BIG Register (healthcare professionals)
  - Taxipas
  - ADR (dangerous goods transport license)

### 2. CERTIFICATION
- **Legal Status**: VOLUNTARY (or mandatory by employer/industry). NOT legally required by government.
- **Issuing Authority**: Private, Professional Body, or Industry Association (e.g., VCA, SSVV, CompTIA)
- **Purpose**: Protect the PROFESSION/CONSUMER by validating specialized expertise beyond legal minimum
- **Renewal**: Requires continuous education or re-examination
- **Examples**:
  - VCA Basis/VOL (safety certification)
  - Heftruck/Reachtruck Certificaat (forklift certificate - NOT a license!)
  - BHV (first aid)
  - HACCP (food safety)
  - EPT/PPT certificates

### 3. QUALIFICATION
- **Legal Status**: General suitability criteria, NOT legally binding
- **Issuing Authority**: Employer requirements, educational institutions, experience itself
- **Purpose**: Determine if candidate has basic suitability for the role
- **Renewal**: No formal renewal; maintained through continuous work experience
- **Examples**:
  - "3-5 years experience"
  - "MBO 3/4 niveau"
  - "HBO diploma"
  - "Fluency in Dutch and English"
  - "Physical fitness"

## IMPORTANT CLASSIFICATION RULES
- Forklift/Heftruck is a CERTIFICATION, not a license (issued by private training companies)
- Driving licenses (Rijbewijs) are LICENSES (issued by CBR/government)
- VCA is a CERTIFICATION (issued by SSVV industry body)
- Education levels are QUALIFICATIONS
- Years of experience are QUALIFICATIONS

## OUTPUT INSTRUCTIONS

For each category, provide maximum 2 suggested interview questions that a job seeker should prepare for:
- **License questions**: Focus on validity, renewal dates, endorsements, legal compliance
- **Certification questions**: Focus on when obtained, expiration, practical experience using it
- **Qualification questions**: Focus on depth of experience, education relevance, language proficiency

Return your analysis as a JSON object with this exact structure:
{
  "license": {
    "questions": [
      {
        "question": "The interview question",
        "mentions": <number of jobs mentioning this requirement>,
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
