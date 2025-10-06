import { readFileSync } from 'fs';
import { join } from 'path';
import { RfiSchema, type RfiRow } from '@/types/rfi';

/**
 * Load RFI data from JSON file, with CSV fallback
 */
export function loadRfis(): RfiRow[] {
  const dataDir = join(process.cwd(), 'data');
  
  try {
    // Try to read JSON file first
    const jsonPath = join(dataDir, 'rfis_final.json');
    const jsonData = readFileSync(jsonPath, 'utf-8');
    const rawData = JSON.parse(jsonData);
    
    // Validate and transform the data
    const validatedData = rawData.map((item: Record<string, unknown>) => {
      // Transform the data to match our schema
      const transformed = {
        number: item.number,
        subject: item.subject,
        status: item.status || '',
        ball_in_court: item.ball_in_court,
        due_date: item.due_date,
        days_late: item.days_late,
        last_change_of_court: item.anchor_date || item.last_change_of_court || 'N/A',
        days_in_court: item.days_in_court,
        mailto_reminder: item.mailto_reminder,
        link: item.link,
        last_reminder_date: item.last_reminder_date || '',
        notes: item.notes || '',
      };
      
      return RfiSchema.parse(transformed);
    });
    
    return validatedData;
    } catch (error) {
      console.log('JSON file not found or invalid, trying CSV fallback...', error);
    
    try {
      // Fallback to CSV file
      const csvPath = join(dataDir, 'rfis_final_with_days_late.csv');
      const csvData = readFileSync(csvPath, 'utf-8');
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',');
      
      const csvRows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          let value = values[index] || '';
          
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          
          row[header] = value;
        });
        
        // Transform CSV data to match our schema
        return {
          number: row.number,
          subject: row.subject,
          status: '',
          ball_in_court: row.ball_in_court,
          due_date: row.due_date,
          days_late: parseInt(row.days_late) || 0,
          last_change_of_court: row.anchor_date || 'N/A',
          days_in_court: row.days_in_court,
          mailto_reminder: row.mailto_reminder,
          link: row.link,
          last_reminder_date: row.last_reminder_date || '',
          notes: row.notes || '',
        };
      });
      
      // Validate CSV data
      const validatedData = csvRows.map(row => RfiSchema.parse(row));
      return validatedData;
    } catch (csvError) {
      console.error('Both JSON and CSV files failed to load:', csvError);
      
      // Return mock data as last resort
      return [
        {
          number: '197',
          subject: 'Substation: Conflict with Installation of Transition Boxes',
          status: 'Open',
          ball_in_court: 'Jeff Burton (Eramosa International Inc.), Sarah Devare Paquet (CIMA+)',
          due_date: '2025-09-19',
          days_late: 0,
          last_change_of_court: '2025-09-12 15:20',
          days_in_court: '1',
          mailto_reminder: 'mailto:test@example.com',
          link: 'https://example.com/rfi/197',
          last_reminder_date: '',
          notes: '',
        },
        {
          number: '196',
          subject: 'Phase 1.1: 1st Floor Corridors Height Issue',
          status: 'Open',
          ball_in_court: 'Aggeliki Spetsieris (DEC US)',
          due_date: '2025-09-19',
          days_late: 0,
          last_change_of_court: '2025-09-12 15:16',
          days_in_court: '1',
          mailto_reminder: 'mailto:test@example.com',
          link: 'https://example.com/rfi/196',
          last_reminder_date: '',
          notes: '',
        },
        {
          number: '191',
          subject: 'URGENT: Substation: Clarification on Conduit from E-House to Substation',
          status: 'Open',
          ball_in_court: 'Aggeliki Spetsieris (DEC US)',
          due_date: '2025-09-11',
          days_late: 2,
          last_change_of_court: '2025-09-04 17:55',
          days_in_court: '7',
          mailto_reminder: 'mailto:test@example.com',
          link: 'https://example.com/rfi/191',
          last_reminder_date: '',
          notes: '',
        },
      ];
    }
  }
}
