import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, screenshotUrl, videoUrl, audioUrl, currentRoute, deviceInfo, userEmail, userName } = await req.json();

    const attachmentLinks = [];
    if (screenshotUrl) attachmentLinks.push(`<p><strong>Screenshot:</strong> <a href="${screenshotUrl}">View Screenshot</a></p>`);
    if (videoUrl) attachmentLinks.push(`<p><strong>Video:</strong> <a href="${videoUrl}">View Video</a></p>`);
    if (audioUrl) attachmentLinks.push(`<p><strong>Voice Note:</strong> <a href="${audioUrl}">Listen</a></p>`);

    const htmlBody = `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7C3AED; margin-bottom: 4px;">Ninja10X Feedback</h2>
        <p style="color: #888; font-size: 13px; margin-top: 0;">From ${userName || 'Unknown'} (${userEmail || 'No email'})</p>
        
        <div style="background: #f8f7ff; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0;">${message || '<em>No message provided</em>'}</p>
        </div>

        ${attachmentLinks.length > 0 ? `
          <div style="margin: 16px 0;">
            <h3 style="color: #555; font-size: 14px; margin-bottom: 8px;">Attachments</h3>
            ${attachmentLinks.join('')}
          </div>
        ` : ''}

        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
          <p><strong>Route:</strong> ${currentRoute || 'N/A'}</p>
          <p><strong>Device:</strong> ${deviceInfo || 'N/A'}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ninja10X Feedback <onboarding@resend.dev>',
        to: ['uttam@curefit.com'],
        subject: `Ninja10X Feedback — ${userName || 'User'}`,
        html: htmlBody,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend error:', result);
      return new Response(JSON.stringify({ error: 'Email send failed', details: result }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send feedback error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
