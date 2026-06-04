import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { campaignGoal = '', campaignTheme = '', userGoal = '' } = await req.json().catch(() => ({}));
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'missing_key' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const prompt = `You are a CMO advising an expertise-based founder. Based on their campaign goal: "${campaignGoal}" and their current business goal: "${userGoal}", write 1-2 sentences recommending a posting strategy for this campaign. Be direct and specific. Reference the goal. No filler. No em-dashes.`;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt + (campaignTheme ? `\n\nTheme: ${campaignTheme}` : '') }],
      }),
      signal: ac.signal,
    });
    clearTimeout(timer);
    const j = await res.json();
    const text = j?.content?.[0]?.text?.trim() ?? '';
    return new Response(JSON.stringify({ recommendation: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});