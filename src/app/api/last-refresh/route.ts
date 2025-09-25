import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const timestampPath = join(process.cwd(), 'data', 'last_refresh.json');
    const timestampData = readFileSync(timestampPath, 'utf-8');
    const parsed = JSON.parse(timestampData);
    return NextResponse.json(parsed);
  } catch (error) {
    // If file doesn't exist, return a fallback
    return NextResponse.json(
      { lastRefresh: 'Never' },
      { status: 404 }
    );
  }
}
