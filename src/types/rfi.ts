import { z } from 'zod';

// Zod schema for RFI data validation
export const RfiSchema = z.object({
  number: z.string(),
  subject: z.string(),
  status: z.string().optional(),
  ball_in_court: z.string(),
  due_date: z.union([z.string(), z.number()]).optional(),
  days_late: z.number(),
  last_change_of_court: z.string(),
  days_in_court: z.string(),
  mailto_reminder: z.string(),
  link: z.string(),
  last_reminder_date: z.string(),
  notes: z.string(),
});

export type RfiRow = z.infer<typeof RfiSchema>;

export interface RfiResponse {
  rows: RfiRow[];
}
