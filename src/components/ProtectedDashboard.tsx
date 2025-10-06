'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { DemoRfiTable } from '@/components/DemoRfiTable';
import { type RfiRow } from '@/types/rfi';
import { getLastUpdatedTimestamp } from '@/lib/date';

const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'rfi2025demo';

export function ProtectedDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [data, setData] = useState<RfiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('Loading...');

  // Check if user is already authenticated (session storage)
  useEffect(() => {
    const authStatus = sessionStorage.getItem('rfi-web-dashboard-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (password: string) => {
    if (password === DEMO_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
      sessionStorage.setItem('rfi-web-dashboard-auth', 'true');
    } else {
      setLoginError('Incorrect password. Please try again.');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rfis', {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result.rows);
      
      // Try to get the last refresh timestamp, fallback to data timestamp
      try {
        const timestampResponse = await fetch('/api/last-refresh', {
          cache: 'no-store',
        });
        if (timestampResponse.ok) {
          const timestampData = await timestampResponse.json();
          setLastUpdated(timestampData.lastRefresh);
        } else {
          setLastUpdated(getLastUpdatedTimestamp(result.rows));
        }
      } catch {
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

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} error={loginError} />;
  }

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
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
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
            <div className="text-right">
              <p className="text-sm text-[var(--domaco-gray)] font-medium">
                Demo Version
              </p>
              <button
                onClick={() => {
                  sessionStorage.removeItem('rfi-web-dashboard-auth');
                  setIsAuthenticated(false);
                }}
                className="text-sm text-[var(--domaco-red)] hover:text-[var(--domaco-red-hover)] underline font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto py-8 px-4">
        
        {/* Demo version - no refresh button */}
        <DemoRfiTable 
          data={data} 
          lastUpdated={lastUpdated}
        />
      </div>
    </div>
  );
}
