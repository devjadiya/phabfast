import { NextResponse } from 'next/server';
import axios from 'axios';

const GERRIT_API_URL = process.env.GERRIT_API_URL || 'https://gerrit.wikimedia.org/r';

export async function GET(req: Request, { params }: { params: { tid: string }}) {
  try {
    const tid = params.tid.startsWith('T') ? params.tid : `T${params.tid}`;
    
    // Gerrit search for commit message containing the task ID
    const response = await axios.get(`${GERRIT_API_URL}/changes/?q=message:${tid}&n=1`);
    
    if (response.data && response.data.length > 0) {
      const change = response.data[0];
      const changeId = change.id;
      return NextResponse.json({ url: `${GERRIT_API_URL}/c/${change._number}` });
    }

    return NextResponse.json({ url: null });

  } catch (error: any) {
    // It's okay if a patch isn't found, don't treat as a server error.
    if (error.response && error.response.status === 404) {
        return NextResponse.json({ url: null });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
