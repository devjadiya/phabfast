import { NextResponse } from 'next/server';
import { fetchAllProjectTags } from '@/lib/phabricator';

// This function is configured to revalidate every 24 hours.
// This means the first request will fetch from the Phabricator API,
// and subsequent requests within 24 hours will receive the cached response.
export const revalidate = 86400;

export async function GET() {
  try {
    const tags = await fetchAllProjectTags();
    return NextResponse.json({ tags });
  } catch (err: any) {
    console.error('Error fetching tags:', err);
    return NextResponse.json({ error: 'Could not fetch tags', message: err.message }, { status: 500 });
  }
}
