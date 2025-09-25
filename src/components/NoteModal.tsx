'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfiNumber: string;
  rfiSubject: string;
  initialNote: string;
  onSave: (note: string) => Promise<void>;
}

export function NoteModal({ 
  isOpen, 
  onClose, 
  rfiNumber, 
  rfiSubject, 
  initialNote, 
  onSave 
}: NoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(note);
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNote(initialNote); // Reset to original
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Note for RFI {rfiNumber}</DialogTitle>
          <DialogDescription className="text-sm">
            <strong>Subject:</strong> {rfiSubject}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your notes about this RFI..."
            className="min-h-[120px] resize-y"
            disabled={isSaving}
          />
          <div className="text-xs text-muted-foreground">
            Use notes to track status, conversations, or reasons for delays.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
