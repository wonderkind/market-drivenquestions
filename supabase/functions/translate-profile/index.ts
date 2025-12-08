import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, country, language } = await req.json();
    
    console.log('Translating profile:', { profile, country, language });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const countryNames: Record<string, string> = {
      'nl': 'Netherlands',
      'de': 'Germany',
      'be': 'Belgium',
      'gb': 'United Kingdom',
      'us': 'United States',
      'fr': 'France',
    };

    const languageNames: Record<string, string> = {
      'en': 'English',
      'nl': 'Dutch',
      'de': 'German',
      'fr': 'French',
    };

    const countryName = countryNames[country] || country;
    const languageName = languageNames[language] || language;

    const systemPrompt = `You are a job market expert. Given an ONET-SOC occupational profile, return exactly 3 commonly used job titles for this occupation in ${countryName}. 
The job titles should be in ${languageName} language and reflect how employers in ${countryName} typically advertise these positions.
Return practical, searchable job titles that job seekers would find on job boards.`;

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
          { role: 'user', content: `ONET-SOC Profile: "${profile}"\n\nProvide 3 job titles.` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_job_titles',
              description: 'Return exactly 3 job titles for the given occupational profile',
              parameters: {
                type: 'object',
                properties: {
                  jobTitles: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 3,
                    maxItems: 3,
                    description: 'Array of exactly 3 job titles'
                  }
                },
                required: ['jobTitles'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'return_job_titles' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const args = JSON.parse(toolCall.function.arguments);
    const jobTitles = args.jobTitles;

    if (!Array.isArray(jobTitles) || jobTitles.length === 0) {
      throw new Error('Invalid job titles response');
    }

    return new Response(JSON.stringify({
      jobTitles,
      originalProfile: profile
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in translate-profile:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
