import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dynamic Open Graph image for a project profile (1200x630).
 * Used by /p/[slug] metadata so social cards and AI previews show the
 * project's name + summary instead of a generic logo. No external fonts.
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  let project: any = null;
  try {
    project = await prisma.project.findFirst({
      where: { slug: params?.slug },
      select: { name: true, summary: true, category: true, verificationStatus: true, status: true },
    });
  } catch {}

  const name = (project?.name || 'CitableHub').toString().slice(0, 60);
  const summary = (project?.summary || 'AI-citable software directory').toString().slice(0, 160);
  const category = (project?.category || 'directory').toString();
  const verified = project?.verificationStatus === 'verified' || project?.status === 'verified';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0b1020 0%, #1f2937 100%)',
          padding: '64px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 28, color: '#a78bfa', fontWeight: 700 }}>
          <div style={{ display: 'flex', width: 44, height: 44, borderRadius: 12, background: '#6d28d9', alignItems: 'center', justifyContent: 'center' }}>C</div>
          CitableHub
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 30, color: '#cbd5e1', lineHeight: 1.3 }}>{summary}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 24 }}>
          <div style={{ display: 'flex', background: '#111827', border: '1px solid #374151', borderRadius: 999, padding: '8px 20px', color: '#e5e7eb' }}>{category}</div>
          {verified && (
            <div style={{ display: 'flex', background: '#064e3b', border: '1px solid #10b981', borderRadius: 999, padding: '8px 20px', color: '#6ee7b7' }}>✓ Citable Verified</div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
