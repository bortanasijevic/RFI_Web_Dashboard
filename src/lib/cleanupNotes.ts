import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { type RfiRow } from '@/types/rfi';

export function cleanupNotes(currentRfis: RfiRow[]): void {
  try {
    const notesPath = join(process.cwd(), 'data', 'notes.json');
    
    // Read current notes
    let notes: Record<string, string> = {};
    try {
      const notesData = readFileSync(notesPath, 'utf-8');
      notes = JSON.parse(notesData);
    } catch (error) {
      // Notes file doesn't exist, nothing to clean
      return;
    }

    // Get current RFI numbers
    const currentRfiNumbers = new Set(currentRfis.map(rfi => rfi.number));
    
    // Find notes for RFIs that no longer exist
    const notesToRemove: string[] = [];
    const cleanedNotes: Record<string, string> = {};
    
    for (const [rfiNumber, note] of Object.entries(notes)) {
      if (currentRfiNumbers.has(rfiNumber)) {
        // Keep notes for active RFIs
        cleanedNotes[rfiNumber] = note;
      } else {
        // Mark for removal
        notesToRemove.push(rfiNumber);
      }
    }

    // Log cleanup activity
    if (notesToRemove.length > 0) {
      console.log(`🧹 Cleaned up notes for closed RFIs: ${notesToRemove.join(', ')}`);
      console.log(`✅ Notes file updated: ${Object.keys(cleanedNotes).length} active notes remaining`);
      
      // Write cleaned notes back to file
      writeFileSync(notesPath, JSON.stringify(cleanedNotes, null, 2));
    } else {
      console.log(`✅ Notes cleanup: No orphaned notes found`);
    }
    
  } catch (error) {
    console.error('Error during notes cleanup:', error);
  }
}
