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
    const { jobs, enhanced, language, country, jobTitle } = await req.json() as { 
      jobs: Job[]; 
      enhanced?: boolean;
      language?: string;
      country?: string;
      jobTitle?: string;
    };
    
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

    // Determine output language
    const outputLanguage = language === 'nl' ? 'Dutch' : 'English';
    const profileName = jobTitle || 'this position';

    const systemPrompt = `You are an expert job market analyst specializing in Dutch/European labor requirements. Analyze job descriptions and extract requirements into three DISTINCT categories.

## OUTPUT LANGUAGE
Generate ALL interview questions in **${outputLanguage}**.
${language === 'nl' ? 'Use natural Dutch phrasing and expressions. Write as a native Dutch speaker would.' : ''}

## QUESTION STYLE (Gen-Z Friendly)
Write questions that are:
- Direct and conversational (no corporate-speak or formal language)
- Action-oriented, starting with "Please specify...", "Please indicate...", "Do you have..."
- Practical with real-world examples when relevant
- Friendly and relatable

${language === 'nl' ? `
Examples of the Gen-Z friendly Dutch tone:
- "Geef aan welke ervaring je hebt als ${profileName}."
- "Welke materialen heb je eerder mee gewerkt als ${profileName}?"
- "Ben je geboren in de EU? Zoals Nederland of een ander EU-land?"
- "Heb je een geldig rijbewijs? Bijvoorbeeld Rijbewijs B of hoger?"
- "Welke certificaten heb je behaald? Zoals VCA of BHV?"
` : `
Examples of the Gen-Z friendly English tone:
- "Please specify your experience as a ${profileName}."
- "Please indicate which materials you have worked with as a ${profileName}?"
- "Were you born in the EU? Like The Netherlands or another EU country?"
- "Do you have a valid driver's license? Like category B or higher?"
- "Which certifications do you have? Like VCA or first aid?"
`}

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

## CRITICAL QUESTION FORMATTING RULES

**NEVER combine multiple questions into one.** Each question must be a single, focused inquiry.

❌ BAD EXAMPLES (compound questions - NEVER do this):
- "Do you have a valid Class A CDL, and where was it issued?"
- "What certifications do you have, and when did you obtain them?"
- "Do you have a driver's license and experience operating heavy machinery?"

✅ GOOD EXAMPLES (single focused questions):
- "Do you have a valid Class A CDL?"
- "Which certifications have you obtained?"
- "Do you have a driver's license?"

## ANSWER TYPE RULES

For each question, determine the appropriate answer type:

1. **yes_no**: Use for binary questions that can be answered with Yes or No
   - Examples: "Do you have a valid driver's license?", "Are you EU citizen?"
   
2. **multiple_choice**: Use for questions where multiple options apply (like languages, certifications held)
   - MUST include "options" array with label and optional emoji
   - Examples: "Which languages do you speak?", "Which certifications do you have?"
   - Always include 3-6 relevant options based on job requirements
   
3. **experience**: Use for questions about years/months of experience
   - MUST include "experienceConfig" with min, max, and unit ("years" or "months")
   - Examples: "How many years of warehouse experience?", "How long have you worked as a forklift operator?"
   
4. **text**: Use for open-ended questions (use sparingly)
   - Examples: "Describe your previous role as...", "What specific equipment have you operated?"

## OUTPUT INSTRUCTIONS

For each category, provide maximum 2 suggested interview questions that a job seeker should prepare for:
- **License questions**: Focus on validity, renewal dates, endorsements, legal compliance
- **Certification questions**: Focus on when obtained, expiration, practical experience using it
- **Qualification questions**: Focus on depth of experience, education relevance, language proficiency
- **IMPORTANT**: Each question must ask about ONE thing only. Never use "and" or commas to combine multiple questions.

Return your analysis as a JSON object with this exact structure:
{
  "license": {
    "questions": [
      {
        "question": "The interview question in ${outputLanguage}",
        "answerType": "yes_no | multiple_choice | experience | text",
        "options": [{"label": "Option 1", "emoji": "🏷️"}, ...],
        "experienceConfig": {"min": 0, "max": 10, "unit": "years"},
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
  "summary": "Brief overall summary of requirements trends in ${outputLanguage}"
}

**IMPORTANT for answer types:**
- "options" field is ONLY required when answerType is "multiple_choice"
- "experienceConfig" field is ONLY required when answerType is "experience"
- For "yes_no" and "text" types, do NOT include options or experienceConfig

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

    // Apply relevance threshold: filter out questions mentioned in less than 15% of jobs
    const totalJobs = jobs.length;
    const relevanceThreshold = Math.ceil(totalJobs * 0.15); // 15% threshold
    
    console.log(`Applying relevance threshold: ${relevanceThreshold} mentions required (15% of ${totalJobs} jobs)`);
    
    const filterQuestions = (questions: any[]) => {
      if (!Array.isArray(questions)) return [];
      return questions.filter(q => {
        const mentions = typeof q.mentions === 'number' ? q.mentions : 0;
        return mentions >= relevanceThreshold;
      });
    };
    
    // Filter each category
    if (analysis.license?.questions) {
      const before = analysis.license.questions.length;
      analysis.license.questions = filterQuestions(analysis.license.questions);
      console.log(`License: ${before} -> ${analysis.license.questions.length} questions after threshold`);
    }
    if (analysis.qualification?.questions) {
      const before = analysis.qualification.questions.length;
      analysis.qualification.questions = filterQuestions(analysis.qualification.questions);
      console.log(`Qualification: ${before} -> ${analysis.qualification.questions.length} questions after threshold`);
    }
    if (analysis.certification?.questions) {
      const before = analysis.certification.questions.length;
      analysis.certification.questions = filterQuestions(analysis.certification.questions);
      console.log(`Certification: ${before} -> ${analysis.certification.questions.length} questions after threshold`);
    }

    return new Response(JSON.stringify({ 
      analysis,
      jobCount: jobs.length,
      relevanceThreshold
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
