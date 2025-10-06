'use client';

import { useState, useEffect, useCallback } from 'react';
import { RfiTable } from '@/components/RfiTable';
import { type RfiRow } from '@/types/rfi';
import { getLastUpdatedTimestamp } from '@/lib/date';

export default function Home() {
  const [data, setData] = useState<RfiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('Loading...');
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');
  const [tokenStatus, setTokenStatus] = useState<'ok' | 'expiring' | 'expired' | 'unknown'>('unknown');

  // Check token status
  const checkTokenStatus = async () => {
    // Only check token status if we have a refresh key
    if (!process.env.NEXT_PUBLIC_REFRESH_KEY) {
      setTokenStatus('unknown');
      return;
    }
    
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'x-refresh-key': process.env.NEXT_PUBLIC_REFRESH_KEY }
      });
      const result = await response.json();
      
      if (result.ok) {
        setTokenStatus('ok');
      } else {
        const errorMsg = result.stderr || result.error || '';
        if (errorMsg.toLowerCase().includes('invalid') || 
            errorMsg.toLowerCase().includes('expired') || 
            errorMsg.toLowerCase().includes('revoked')) {
          setTokenStatus('expired');
        } else {
          setTokenStatus('unknown');
        }
      }
    } catch (error) {
      console.log('Token check failed:', error);
      setTokenStatus('unknown');
    }
  };

  // Load saved refresh time on component mount
  useEffect(() => {
    // First try localStorage (persists across page refreshes)
    const savedRefreshTime = localStorage.getItem('rfi-last-refresh-time');
    if (savedRefreshTime) {
      setLastRefreshTime(savedRefreshTime);
    } else {
      // Only fetch from file if localStorage is empty (first time visit)
      const loadTimestampFromFile = async () => {
        try {
          const timestampResponse = await fetch('/api/last-refresh', {
            cache: 'no-store',
          });
          if (timestampResponse.ok) {
            const timestampData = await timestampResponse.json();
            setLastRefreshTime(timestampData.lastRefresh);
            // Save to localStorage for future page loads
            localStorage.setItem('rfi-last-refresh-time', timestampData.lastRefresh);
          }
        } catch (error) {
          console.log('Could not load timestamp from file');
        }
      };
      
      loadTimestampFromFile();
    }
    
    // Check token status on load (completely non-blocking)
    // Temporarily disabled to fix loading issue
    // setTimeout(checkTokenStatus, 1000);
  }, []);

  const fetchData = async (cleanupNotes = false) => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (cleanupNotes) {
        headers['x-cleanup-notes'] = 'true';
      }
      
      const response = await fetch('/api/rfis', {
        cache: 'no-store',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      
      setData(result.rows || []);
      // Only update lastUpdated on initial load, not on subsequent fetches
      if (!lastRefreshTime) {
        setLastUpdated(getLastUpdatedTimestamp(result.rows || []));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setLastUpdated('Error loading data');
    } finally {
      setLoading(false);
    }
  };


  // Single source of truth for refreshing RFIs - used by RfiTable
  const refreshRfis = useCallback(async () => {
    try {
      console.log('refreshRfis: Starting refresh...');
      
      // 1) Fetch latest RFI data
      const response = await fetch('/api/rfis', {
        cache: 'no-store',
        headers: { 'x-cleanup-notes': 'true' }
      });
      
      if (!response.ok) {
        throw new Error(`Fetch RFIs failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('refreshRfis: Fetched data, rows count:', data.rows?.length || 0);
      setData(data.rows || []);
      
      // 2) Update timestamp with current time (when refresh actually happened)
      const newRefreshTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      console.log('refreshRfis: Setting new refresh time:', newRefreshTime);
      setLastRefreshTime(newRefreshTime);
      localStorage.setItem('rfi-last-refresh-time', newRefreshTime);
      
      // 3) Update lastUpdated timestamp to show when refresh happened (not data timestamp)
      setLastUpdated(newRefreshTime);
      console.log('refreshRfis: Updated lastUpdated to:', newRefreshTime);
    } catch (error) {
      console.error('Error refreshing RFIs:', error);
      setData([]);
      setLastUpdated('Error loading data');
    }
  }, []);

  // For note updates without timestamp change
  const refreshDataOnly = useCallback(async () => {
    try {
      const response = await fetch('/api/rfis', {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result.rows || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    }
  }, []);



  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading RFI data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">RFI Dashboard</h1>
      </div>

      {tokenStatus === 'expired' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">
            ⚠️ Procore tokens have expired. Please update the tokens to enable data refresh.
          </p>
        </div>
      )}

      <RfiTable 
        data={data} 
        onRefresh={refreshRfis}
        onDataRefresh={refreshDataOnly}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}