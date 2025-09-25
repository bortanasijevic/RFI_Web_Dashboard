'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginFormProps {
  onLogin: (password: string) => void;
  error?: string;
}

export function LoginForm({ onLogin, error }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simple delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onLogin(password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--domaco-light-gray)] py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/images/Domaco-Encocorp-Projects-1.png" 
              alt="Domaco-Encocorp" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[var(--domaco-gray)]">RFI Dashboard</CardTitle>
          <CardDescription className="text-[var(--domaco-gray)]">
            Enter the password to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={error ? 'border-red-500' : ''}
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[var(--domaco-red)] hover:bg-[var(--domaco-red-hover)] text-white border-0"
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? 'Signing in...' : 'Access Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


