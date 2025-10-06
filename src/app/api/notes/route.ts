import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const NOTES_FILE = join(process.cwd(), 'data', 'notes.json');

// Get all notes
export async function GET() {
  try {
    const notesData = readFileSync(NOTES_FILE, 'utf-8');
    const notes = JSON.parse(notesData);
    return NextResponse.json(notes);
  } catch (error) {
    // If file doesn't exist, return empty object
    return NextResponse.json({});
  }
}

// Update a note
export async function POST(request: Request) {
  try {
    const { rfiNumber, note } = await request.json();
    
    if (!rfiNumber) {
      return NextResponse.json(
        { error: 'RFI number is required' },
        { status: 400 }
      );
    }

    // Read existing notes
    let notes = {};
    try {
      const notesData = readFileSync(NOTES_FILE, 'utf-8');
      notes = JSON.parse(notesData);
    } catch (error) {
      // File doesn't exist, start with empty object
      notes = {};
    }

    // Update the note
    if (note && note.trim()) {
      notes[rfiNumber] = note.trim();
    } else {
      // Remove empty notes
      delete notes[rfiNumber];
    }

    // Write back to file
    writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}
