'use client';

import { useState, useEffect } from 'react';
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
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'x-refresh-key': process.env.NEXT_PUBLIC_REFRESH_KEY || '' }
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
    } catch {
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
    
    // Check token status on load
    checkTokenStatus();
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
      setData(result.rows);
      // Only update lastUpdated on initial load, not on subsequent fetches
      if (!lastRefreshTime) {
        setLastUpdated(getLastUpdatedTimestamp(result.rows));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setLastUpdated('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // Function specifically for the refresh button (updates timestamp)
  const fetchDataWithTimestamp = async () => {
    await fetchData(true); // Include cleanup
    
    // After refresh, try to get the timestamp from the file (most accurate)
    try {
      const timestampResponse = await fetch('/api/last-refresh', {
        cache: 'no-store',
      });
      if (timestampResponse.ok) {
        const timestampData = await timestampResponse.json();
        setLastRefreshTime(timestampData.lastRefresh);
        localStorage.setItem('rfi-last-refresh-time', timestampData.lastRefresh);
        return;
      }
    } catch (error) {
      console.log('Could not load timestamp from file after refresh');
    }
    
    // Fallback to current time if file timestamp is not available
    const newRefreshTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    setLastRefreshTime(newRefreshTime);
    localStorage.setItem('rfi-last-refresh-time', newRefreshTime);
  };

  // Separate function for refreshing data without updating timestamp
  const refreshDataOnly = async () => {
    try {
      const response = await fetch('/api/rfis', {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result.rows);
      // Don't update lastUpdated timestamp for note-only refreshes
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    <div className="min-h-screen bg-[var(--domaco-light-gray)]">
      {/* Header with company branding */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="w-[90%] mx-auto px-4 py-6">
          <div className="flex items-center gap-8">
            <img 
              src="/images/Domaco-Encocorp-Projects-1.png" 
              alt="Domaco-Encocorp" 
              className="h-20 w-auto"
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight text-[var(--domaco-gray)] mb-1">RFI Dashboard</h1>
              <p className="text-[var(--domaco-gray)] text-lg font-medium">
                Request for Information Management System
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Status Alert */}
      {tokenStatus === 'expired' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Authentication Token Expired
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Your Procore tokens have expired (this happens overnight for security).</p>
                <p className="mt-1">
                  <button 
                    onClick={() => window.open('/api/refresh-tokens', '_blank')}
                    className="font-medium underline hover:text-red-600"
                  >
                    Click here to refresh tokens automatically
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="w-[90%] mx-auto py-8 px-4">
        <div className="space-y-6">
        
          <RfiTable 
            data={data} 
            onRefresh={fetchDataWithTimestamp}
            onDataRefresh={refreshDataOnly}
            lastUpdated={lastRefreshTime || lastUpdated}
          />
        </div>
      </div>
    </div>
  );
}