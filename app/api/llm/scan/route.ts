export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { processLLMRequest } from '@/lib/llm-broker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body?.url;
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const projectName = body?.projectName || '';
    const userSummary = body?.userSummary || '';
    const userDescription = body?.userDescription || '';

    const systemInstruction = `You are CitableHub's AI Autofill engine. Your job is to analyze a software product and generate SPECIFIC, CONCRETE profile fields. Never be vague or generic.

RULES:
- summary: Exactly 1 sentence. State what the product does in concrete terms. BAD: "A tool for productivity". GOOD: "Open-source deployment pipeline that automates Docker container builds and rollbacks for Node.js apps."
- description: 2-3 sentences. What it does + who it's for + the key benefit. Be specific about the technology, domain, and use case.
- outcome: A specific, measurable claim. Must include a number, percentage, or concrete comparison. BAD: "Improves workflow". GOOD: "Reduces CI/CD pipeline setup time from 2 hours to 15 minutes for teams using GitHub Actions."
- targetAudience: Name the specific role + context. BAD: "Developers". GOOD: "Backend engineers at Series A-C startups managing 5-50 microservices on AWS/GCP."
- mainCategory: One of: developer-tools, finance, productivity, marketing-sales, design-creative, education, healthcare, ecommerce, security, data-analytics, communication, infrastructure
- tags: 3-5 tags from: build, automate, analyze, secure, collaborate, learn, design, sell, communicate, optimize. Pick ONLY tags that genuinely apply. Never include "other".
- approved: false only if site contains pornography, gambling, drugs, hate speech, phishing, or speculative crypto schemes.

Respond with raw JSON only:
{
  "approved": boolean,
  "mainCategory": string,
  "summary": string,
  "description": string,
  "targetAudience": string,
  "outcome": string,
  "tags": string[],
  "flagReasons": string[]
}`;

    let userPrompt = `Analyze this software product and generate its CitableHub profile:\nURL: ${url}`;
    if (projectName) userPrompt += `\nProduct Name: ${projectName}`;
    if (userSummary) userPrompt += `\nUser-provided summary: ${userSummary}`;
    if (userDescription) userPrompt += `\nUser-provided description: ${userDescription}`;
    userPrompt += `\n\nGenerate specific, non-generic fields. Be concrete.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ];

    const response = await processLLMRequest(messages);

    try {
      let cleanedText = (response?.text ?? '').replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        approved: !(url ?? '').includes('gamble') && !(url ?? '').includes('crypto'),
        mainCategory: 'developer-tools',
        targetAudience: 'Software Developers',
        outcome: `Active software stack at ${url}`,
        flagReasons: [],
      });
    }
  } catch (error: any) {
    console.error('Scan Error:', error);
    return NextResponse.json({ error: error?.message || 'Scan failed' }, { status: 500 });
  }
}
