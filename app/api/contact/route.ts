export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, email, topic, message } = await request.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const topicLabels: Record<string, string> = {
      general: 'General Inquiry',
      support: 'Technical Support',
      bug: 'Bug Report',
      feature: 'Feature Request',
      partnership: 'Partnership / Business',
      privacy: 'Privacy / Data Request',
    };

    const topicLabel = topicLabels[topic] || 'General Inquiry';
    const appUrl = process.env.NEXTAUTH_URL || 'https://citablehub.com';

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0a1a; color: #e2e0e7; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6D28D9, #7C3AED); padding: 24px 32px;">
          <h1 style="margin: 0; font-size: 20px; color: white; font-weight: 700;">📬 New Contact Form Submission</h1>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #a78bfa; font-weight: 600; width: 100px;">Name:</td><td style="padding: 8px 0;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #a78bfa; font-weight: 600;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #c4b5fd;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #a78bfa; font-weight: 600;">Topic:</td><td style="padding: 8px 0;">${topicLabel}</td></tr>
          </table>
          <div style="margin-top: 20px; background: #1a1128; padding: 16px; border-radius: 8px; border-left: 4px solid #7C3AED;">
            <p style="margin: 0 0 4px; color: #a78bfa; font-weight: 600; font-size: 13px;">Message:</p>
            <p style="margin: 0; white-space: pre-line; line-height: 1.6;">${message}</p>
          </div>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid #2a2040; color: #6b6280; font-size: 12px;">
          <p style="margin: 0;">Submitted via <a href="${appUrl}/contact" style="color: #a78bfa;">CitableHub Contact Form</a></p>
        </div>
      </div>
    `;

    // Send email to admin
    try {
      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_CONTACT_FORM_SUBMISSION,
          subject: `[CitableHub Contact] ${topicLabel} from ${name}`,
          body: htmlBody,
          is_html: true,
          recipient_email: process.env.ADMIN_EMAIL || 'admin@citablehub.com',
          reply_to: email,
          sender_email: `noreply@${new URL(appUrl).hostname}`,
          sender_alias: 'CitableHub',
        }),
      });
    } catch (emailErr) {
      console.error('[Contact] Email send error:', emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact API] Error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
