'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface EditableNoteCellProps {
  value: string;
  rfiNumber: string;
  onSave: (note: string) => void;
}

export function EditableNoteCell({ value, rfiNumber, onSave }: EditableNoteCellProps) {
  const [note, setNote] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setNote(value);
  }, [value]);

  const saveNote = async (noteValue: string) => {
    if (noteValue === value) return; // No change, don't save
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rfiNumber,
          note: noteValue,
        }),
      });

      if (response.ok) {
        onSave(noteValue);
      } else {
        console.error('Failed to save note');
        // Revert to original value on error
        setNote(value);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      // Revert to original value on error
      setNote(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = () => {
    if (note !== value) {
      saveNote(note);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger save
    }
    if (e.key === 'Escape') {
      setNote(value); // Revert changes
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Add note..."
        className={`min-w-[200px] ${isSaving ? 'opacity-50' : ''}`}
        disabled={isSaving}
      />
      {isSaving && (
        <div className="absolute right-2 top-2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
