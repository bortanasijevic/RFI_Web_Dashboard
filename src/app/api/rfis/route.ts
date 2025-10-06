import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { loadRfis } from '@/lib/loadRfis';
import { cleanupNotes } from '@/lib/cleanupNotes';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const rows = loadRfis();
    
    // Load notes and merge with RFI data
    let notes = {};
    try {
      const notesPath = join(process.cwd(), 'data', 'notes.json');
      const notesData = readFileSync(notesPath, 'utf-8');
      notes = JSON.parse(notesData);
    } catch (error) {
      // Notes file doesn't exist, use empty object
      notes = {};
    }
    
    // Merge notes with RFI data
    const rowsWithNotes = rows.map(row => ({
      ...row,
      notes: notes[row.number] || ''
    }));
    
    // Clean up notes for closed RFIs (only when called from refresh button)
    const headersList = await headers();
    const isFromRefresh = headersList.get('x-cleanup-notes') === 'true';
    if (isFromRefresh) {
      cleanupNotes(rowsWithNotes);
    }
    
    return NextResponse.json({ rows: rowsWithNotes });
  } catch (error) {
    console.error('Error loading RFI data:', error);
    return NextResponse.json(
      { error: 'Failed to load RFI data' },
      { status: 500 }
    );
  }
}
