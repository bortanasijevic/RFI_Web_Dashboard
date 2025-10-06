'use client';

import { useState } from 'react';
import { Edit3, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NoteModal } from '@/components/NoteModal';

interface NoteCellProps {
  value: string;
  rfiNumber: string;
  rfiSubject: string;
  onSave: (note: string) => Promise<void>;
}

export function NoteCell({ value, rfiNumber, rfiSubject, onSave }: NoteCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveNote = async (note: string) => {
    await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rfiNumber,
        note,
      }),
    });
    
    await onSave(note);
  };

  const handleDeleteNote = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    setIsDeleting(true);
    
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rfiNumber,
          note: '', // Empty note = delete
        }),
      });
      
      await onSave('');
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasNote = value && value.trim().length > 0;
  const displayText = value.length > 50 ? `${value.substring(0, 47)}...` : value;

  return (
    <>
      <div className="flex items-center gap-2 w-full">
        <div 
          className="flex-1 cursor-pointer p-2 rounded border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors relative group min-w-0"
          onClick={() => setIsModalOpen(true)}
        >
          {hasNote ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 pr-6 min-w-0">
                    <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm flex-1 truncate min-w-0">{displayText}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p className="whitespace-pre-wrap">{value}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <Edit3 className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm truncate">Add note...</span>
            </div>
          )}
          
          {/* Delete button - only show when there's a note */}
          {hasNote && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleDeleteNote}
                    disabled={isDeleting}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete note</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rfiNumber={rfiNumber}
        rfiSubject={rfiSubject}
        initialNote={value}
        onSave={handleSaveNote}
      />
    </>
  );
}
