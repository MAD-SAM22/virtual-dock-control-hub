
import React from 'react';
import ApiValidator from '@/components/ApiValidator';

const ApiValidatorPage = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">API Validation</h1>
      <p className="text-muted-foreground">
        Test and validate the QEMU VM Management API endpoints to ensure everything is working correctly.
      </p>
      <ApiValidator />
    </div>
  );
};

export default ApiValidatorPage;
