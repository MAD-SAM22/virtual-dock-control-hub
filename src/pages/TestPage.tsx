
import React from 'react';
import ApiTester from '@/components/ApiTester';
import ApiValidator from '@/components/ApiValidator';

const TestPage = () => {
  return (
    <div className="container mx-auto py-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-4">API Testing</h1>
        <p className="text-gray-500 mb-6">
          Test connectivity to the backend API server and validate QEMU endpoints
        </p>
        
        <div className="grid grid-cols-1 gap-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Basic API Connection Test</h2>
            <ApiTester />
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">QEMU API Validator</h2>
            <ApiValidator />
          </section>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
