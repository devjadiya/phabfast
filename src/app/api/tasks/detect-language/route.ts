import { NextResponse } from 'next/server';
import { detectTaskLanguage } from '@/ai/flows/detect-task-language';

export async function POST(req: Request) {
  try {
    const { description } = await req.json();
    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const result = await detectTaskLanguage({ description });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
