import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching O*NET occupations CSV...');
    
    // Fetch CSV from O*NET
    const csvUrl = 'https://www.onetonline.org/find/all/All_Occupations.csv';
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n');
    
    console.log(`Parsing ${lines.length} lines...`);
    
    // Parse CSV - skip header line
    // Format: Job Zone,Code,Occupation,Data-level
    const occupations: { code: string; title: string; job_zone: number | null; has_data: boolean }[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV with proper handling of commas in occupation names
      const parts = line.split(',');
      if (parts.length < 3) continue;
      
      const jobZoneStr = parts[0].trim();
      const code = parts[1].trim();
      
      // Occupation name might contain commas, so join everything except first 2 and last part
      const dataLevel = parts[parts.length - 1].trim();
      const title = parts.slice(2, parts.length - 1).join(',').trim();
      
      if (!code || !title) continue;
      
      // Only include 6-digit detailed occupations (format: XX-XXXX.XX)
      if (!/^\d{2}-\d{4}\.\d{2}$/.test(code)) continue;
      
      const jobZone = jobZoneStr === 'n/a' ? null : parseInt(jobZoneStr, 10);
      const hasData = dataLevel === 'Y';
      
      occupations.push({
        code,
        title,
        job_zone: isNaN(jobZone!) ? null : jobZone,
        has_data: hasData,
      });
    }
    
    console.log(`Parsed ${occupations.length} occupations`);
    
    // Clear existing data and insert new
    const { error: deleteError } = await supabase
      .from('onet_occupations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
    }
    
    // Insert in batches of 100
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < occupations.length; i += batchSize) {
      const batch = occupations.slice(i, i + batchSize);
      const { error } = await supabase
        .from('onet_occupations')
        .upsert(batch, { onConflict: 'code' });
      
      if (error) {
        console.error(`Batch ${i / batchSize} error:`, error);
        throw error;
      }
      
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${occupations.length} occupations`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        count: occupations.length,
        message: `Successfully seeded ${occupations.length} O*NET occupations`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error seeding occupations:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
