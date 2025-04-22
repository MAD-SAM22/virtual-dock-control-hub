
import React, { useEffect, useState } from 'react';
import { ping } from '@/services/dockerService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';

const TestPage = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testPing = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ping();
      setResponse(JSON.stringify(result.data));
      console.log('Ping response:', result);
    } catch (err) {
      console.error('Ping error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testPing();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Docker API Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            Docker Daemon Ping Test
            <Button variant="outline" className="ml-auto" onClick={testPing} disabled={loading}>
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Connection
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader className="mr-2 h-6 w-6 animate-spin text-primary" />
              <span>Testing connection...</span>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Connection Failed</p>
                <p className="text-sm">{error}</p>
                <p className="text-sm mt-2">Check that the Docker daemon is running and accessible.</p>
              </div>
            </div>
          ) : response ? (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Connection Successful</p>
                <p className="text-sm mt-2">Response:</p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs overflow-auto mt-2 max-h-40">
                  {response}
                </pre>
              </div>
            </div>
          ) : null}
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Endpoint: <code>/_ping</code></p>
            <p>Expected response: <code>OK</code> (string)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPage;
