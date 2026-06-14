import { prisma } from '@/lib/db';

export type NotificationType = 
  | 'completeness_reminder'
  | 'ranking_movement'
  | 'citability_score'
  | 'boost_education'
  | 'weekly_digest'
  | 'general';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  projectId?: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
  recipientEmail?: string;
}

const NOTIF_ENV_MAP: Record<NotificationType, string> = {
  completeness_reminder: 'NOTIF_ID_PROFILE_COMPLETENESS_REMINDER',
  ranking_movement: 'NOTIF_ID_RANKING_MOVEMENT_ALERT',
  citability_score: 'NOTIF_ID_CITABILITY_SCORE_UPDATE',
  boost_education: 'NOTIF_ID_BOOST_BENEFITS_INFO',
  weekly_digest: 'NOTIF_ID_WEEKLY_PERFORMANCE_DIGEST',
  general: '',
};

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, actionUrl, projectId, metadata, sendEmail = true, recipientEmail } = params;

  try {
    // Check for duplicate in last 24h (same type + project)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        ...(projectId ? { projectId } : {}),
        createdAt: { gte: oneDayAgo },
      },
    });
    if (existing) return existing; // Skip duplicate

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl,
        projectId,
        metadata: metadata || undefined,
        emailSent: false,
      },
    });

    // Send email in background (fire-and-forget)
    if (sendEmail && recipientEmail) {
      sendNotificationEmail(type, title, message, recipientEmail, actionUrl)
        .then((sent) => {
          if (sent) {
            prisma.notification.update({ where: { id: notification.id }, data: { emailSent: true } }).catch(() => {});
          }
        })
        .catch(() => {});
    }

    return notification;
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error);
    return null;
  }
}

async function sendNotificationEmail(
  type: NotificationType,
  subject: string,
  bodyText: string,
  recipientEmail: string,
  actionUrl?: string
): Promise<boolean> {
  try {
    const envKey = NOTIF_ENV_MAP[type];
    const notifId = envKey ? process.env[envKey] : null;
    if (!notifId) return false;

    const appUrl = process.env.NEXTAUTH_URL || 'https://citablehub.com';
    const appName = 'CitableHub';
    const fullActionUrl = actionUrl ? (actionUrl.startsWith('http') ? actionUrl : `${appUrl}${actionUrl}`) : appUrl;

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0a1a; color: #e2e0e7; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6D28D9, #7C3AED); padding: 24px 32px;">
          <h1 style="margin: 0; font-size: 20px; color: white; font-weight: 700;">🔔 CitableHub</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #c4b5fd; font-size: 18px; margin: 0 0 16px 0;">${subject}</h2>
          <div style="color: #d1cdd8; font-size: 15px; line-height: 1.7; white-space: pre-line;">${bodyText}</div>
          ${actionUrl ? `
            <div style="margin-top: 24px;">
              <a href="${fullActionUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Details →</a>
            </div>
          ` : ''}
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid #2a2040; color: #6b6280; font-size: 12px;">
          <p style="margin: 0;">You're receiving this because you have a project on <a href="${appUrl}" style="color: #a78bfa;">CitableHub</a>.</p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: notifId,
        subject: `[CitableHub] ${subject}`,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        sender_email: `noreply@${new URL(appUrl).hostname}`,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    if (result.notification_disabled) {
      console.log(`[Notifications] Email disabled by user for type: ${type}`);
      return false;
    }
    return result.success === true;
  } catch (error) {
    console.error('[Notifications] Email send error:', error);
    return false;
  }
}

// ---------- Trigger Helpers ----------

export async function triggerCompletenessReminder(userId: string, email: string, project: any) {
  const { getCompleteness } = await import('@/lib/completeness');
  const completeness = Math.round(getCompleteness(project) * 100);
  if (completeness >= 80) return null; // Already good

  const missingFields: string[] = [];
  if (!project.description?.trim()) missingFields.push('Description');
  if (!project.outcome?.trim()) missingFields.push('Expected Outcome');
  if (!project.targetAudience?.trim()) missingFields.push('Target Audience');
  if (!project.founderName?.trim()) missingFields.push('Founder Name');
  if (!project.demoUrl?.trim()) missingFields.push('Demo URL');
  if (!project.supportUrl?.trim()) missingFields.push('Support URL');
  if (!project.privacyUrl?.trim()) missingFields.push('Privacy Policy URL');
  if (!project.version?.trim()) missingFields.push('Version');
  if (!project.differentiators?.length) missingFields.push('Differentiators');
  if (!project.alternatives?.length) missingFields.push('Alternatives');

  const topMissing = missingFields.slice(0, 4);
  const message = `Your project "${project.name}" has a completeness score of ${completeness}%. Complete these fields to improve AI citability:\n\n• ${topMissing.join('\n• ')}${missingFields.length > 4 ? `\n• ...and ${missingFields.length - 4} more` : ''}\n\nProjects with higher completeness rank better in AI search results.`;

  return createNotification({
    userId,
    type: 'completeness_reminder',
    title: `Your project is ${completeness}% complete — improve your AI visibility`,
    message,
    actionUrl: '/dashboard',
    projectId: project.id,
    recipientEmail: email,
  });
}

export async function triggerRankingMovement(userId: string, email: string, project: any, oldPosition: number, newPosition: number) {
  const diff = oldPosition - newPosition; // positive = moved up
  if (Math.abs(diff) < 3) return null; // Only notify for 3+ moves

  const direction = diff > 0 ? 'up' : 'down';
  const emoji = diff > 0 ? '📈' : '📉';
  const message = `${emoji} Your project "${project.name}" moved ${direction} by ${Math.abs(diff)} positions — now ranked #${newPosition}.\n\n${diff > 0 ? 'Great momentum! Keep your profile updated to maintain your ranking.' : 'Tip: Update your project details and add missing fields to improve your position.'}`;

  return createNotification({
    userId,
    type: 'ranking_movement',
    title: `${project.name} moved ${direction} ${Math.abs(diff)} positions to #${newPosition}`,
    message,
    actionUrl: `/p/${project.slug}`,
    projectId: project.id,
    recipientEmail: email,
  });
}

export async function triggerCitabilityScoreChange(userId: string, email: string, project: any, oldScore: number, newScore: number) {
  const diff = newScore - oldScore;
  if (Math.abs(diff) < 5) return null; // Only notify for 5+ point change

  const direction = diff > 0 ? 'improved' : 'decreased';
  const emoji = diff > 0 ? '✅' : '⚠️';
  const message = `${emoji} The Citability Score for "${project.name}" ${direction} from ${oldScore} to ${newScore}.\n\n${diff > 0 ? 'Your project is becoming more AI-citable. Keep adding verified information!' : 'Add more trust signals (founder name, demo URL, privacy policy) to recover your score.'}`;

  return createNotification({
    userId,
    type: 'citability_score',
    title: `Citability Score ${direction}: ${oldScore} → ${newScore}`,
    message,
    actionUrl: `/p/${project.slug}`,
    projectId: project.id,
    recipientEmail: email,
  });
}

export async function triggerBoostEducation(userId: string, email: string, projectName: string, projectId: string) {
  const message = `Did you know? Projects with GQI Boost get prioritized visibility across AI systems like Google AI Overviews, Perplexity, and ChatGPT.\n\n🎯 What Boost does:\n• Higher ranking in Discovery AI results\n• Priority placement in the directory\n• Enhanced visibility to AI crawlers\n• 10-point bonus to your Dynamic Score\n\nLearn more about how Boost can help "${projectName}" get discovered by AI assistants.`;

  return createNotification({
    userId,
    type: 'boost_education',
    title: `Boost your project's AI visibility — here's how`,
    message,
    actionUrl: '/boost',
    projectId,
    recipientEmail: email,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, read: false },
    });
  } catch {
    return 0;
  }
}
