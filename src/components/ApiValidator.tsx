
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { qemuApiValidator, ValidationResult } from '@/utils/qemuApiValidator';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, CheckCircle, Server, Upload } from 'lucide-react';

const ApiValidator = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');
  
  // ISO upload state
  const [isoName, setIsoName] = useState('');
  const [isoFile, setIsoFile] = useState<File | null>(null);
  
  // VM creation state
  const [vmName, setVmName] = useState('');
  const [vmCpus, setVmCpus] = useState(1);
  const [vmMemory, setVmMemory] = useState(1);
  const [vmDiskSize, setVmDiskSize] = useState(10);
  const [vmDiskFormat, setVmDiskFormat] = useState('qcow2');
  const [vmIso, setVmIso] = useState('');
  const [vmNetworkType, setVmNetworkType] = useState('user');
  const [vmEnableKVM, setVmEnableKVM] = useState(true);
  
  const handleConnectionTest = async () => {
    setLoading(true);
    try {
      const result = await qemuApiValidator.testConnection();
      setValidationResults([result]);
    } catch (error) {
      setValidationResults([{
        success: false,
        message: 'Connection test failed with an exception',
        error
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleListISOsTest = async () => {
    setLoading(true);
    try {
      const result = await qemuApiValidator.testListISOs();
      setValidationResults([result]);
      
      // If successful, populate the VM ISO dropdown with the first ISO
      if (result.success && result.data && result.data.length > 0) {
        setVmIso(result.data[0].name);
      }
    } catch (error) {
      setValidationResults([{
        success: false,
        message: 'List ISOs test failed with an exception',
        error
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUploadISOTest = async () => {
    if (!isoFile) {
      setValidationResults([{
        success: false,
        message: 'Please select an ISO file first'
      }]);
      return;
    }
    
    setLoading(true);
    try {
      // Convert file to base64
      const base64Content = await qemuApiValidator.fileToBase64(isoFile);
      
      // Use the file name or the provided name
      const name = isoName || isoFile.name;
      
      const result = await qemuApiValidator.testUploadISO(name, base64Content);
      setValidationResults([result]);
      
      // If successful, refresh the ISO list
      if (result.success) {
        const listResult = await qemuApiValidator.testListISOs();
        setVmIso(name); // Set the uploaded ISO as the selected one for VM creation
      }
    } catch (error) {
      setValidationResults([{
        success: false,
        message: 'Upload ISO test failed with an exception',
        error
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateVMTest = async () => {
    if (!vmName || !vmIso) {
      setValidationResults([{
        success: false,
        message: 'VM name and ISO file are required'
      }]);
      return;
    }
    
    setLoading(true);
    try {
      const result = await qemuApiValidator.testCreateVM({
        name: vmName,
        cpus: vmCpus,
        memory: vmMemory,
        diskSize: vmDiskSize,
        diskFormat: vmDiskFormat,
        iso: vmIso,
        networkType: vmNetworkType,
        enableKVM: vmEnableKVM
      });
      setValidationResults([result]);
    } catch (error) {
      setValidationResults([{
        success: false,
        message: 'Create VM test failed with an exception',
        error
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRunAllTests = async () => {
    setLoading(true);
    try {
      const results = await qemuApiValidator.runFullValidation();
      setValidationResults(results);
    } catch (error) {
      setValidationResults([{
        success: false,
        message: 'Full validation failed with an exception',
        error
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsoFile(file);
      if (!isoName) {
        setIsoName(file.name);
      }
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" /> 
          QEMU API Validator
        </CardTitle>
        <CardDescription>
          Test and validate the QEMU VM Management API endpoints
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-4">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="list-isos">List ISOs</TabsTrigger>
          <TabsTrigger value="upload-iso">Upload ISO</TabsTrigger>
          <TabsTrigger value="create-vm">Create VM</TabsTrigger>
          <TabsTrigger value="full-validation">Full Validation</TabsTrigger>
        </TabsList>
        
        <CardContent className="space-y-4 pt-4">
          <TabsContent value="connection" className="space-y-4">
            <p>Test basic connectivity to the QEMU API server.</p>
            <Button onClick={handleConnectionTest} disabled={loading}>
              {loading ? 'Testing...' : 'Test Connection'}
            </Button>
          </TabsContent>
          
          <TabsContent value="list-isos" className="space-y-4">
            <p>Test retrieving the list of available ISO files from the server.</p>
            <Button onClick={handleListISOsTest} disabled={loading}>
              {loading ? 'Testing...' : 'List ISO Files'}
            </Button>
          </TabsContent>
          
          <TabsContent value="upload-iso" className="space-y-4">
            <p>Test uploading an ISO file to the server (uses base64 encoding).</p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iso-name">ISO Name</Label>
                <Input 
                  id="iso-name" 
                  placeholder="e.g., ubuntu.iso" 
                  value={isoName} 
                  onChange={(e) => setIsoName(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="iso-file">ISO File</Label>
                <Input 
                  id="iso-file" 
                  type="file" 
                  accept=".iso" 
                  onChange={handleFileChange}
                />
              </div>
            </div>
            
            <Button onClick={handleUploadISOTest} disabled={loading || !isoFile}>
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Uploading...' : 'Upload ISO'}
            </Button>
          </TabsContent>
          
          <TabsContent value="create-vm" className="space-y-4">
            <p>Test creating a new virtual machine.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vm-name">VM Name</Label>
                <Input 
                  id="vm-name" 
                  placeholder="e.g., test-vm" 
                  value={vmName} 
                  onChange={(e) => setVmName(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vm-iso">ISO File</Label>
                <Input 
                  id="vm-iso" 
                  placeholder="e.g., ubuntu.iso" 
                  value={vmIso} 
                  onChange={(e) => setVmIso(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vm-cpus">CPUs</Label>
                <Input 
                  id="vm-cpus" 
                  type="number" 
                  min="1"
                  value={vmCpus} 
                  onChange={(e) => setVmCpus(parseInt(e.target.value))} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vm-memory">Memory (GB)</Label>
                <Input 
                  id="vm-memory" 
                  type="number" 
                  min="1"
                  value={vmMemory} 
                  onChange={(e) => setVmMemory(parseInt(e.target.value))} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vm-disk-size">Disk Size (GB)</Label>
                <Input 
                  id="vm-disk-size" 
                  type="number" 
                  min="1"
                  value={vmDiskSize} 
                  onChange={(e) => setVmDiskSize(parseInt(e.target.value))} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vm-disk-format">Disk Format</Label>
                <select 
                  id="vm-disk-format" 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1"
                  value={vmDiskFormat} 
                  onChange={(e) => setVmDiskFormat(e.target.value)}
                >
                  <option value="qcow2">qcow2</option>
                  <option value="raw">raw</option>
                  <option value="vmdk">vmdk</option>
                  <option value="vdi">vdi</option>
                </select>
              </div>
            </div>
            
            <Button onClick={handleCreateVMTest} disabled={loading || !vmName || !vmIso}>
              {loading ? 'Creating...' : 'Create VM'}
            </Button>
          </TabsContent>
          
          <TabsContent value="full-validation" className="space-y-4">
            <p>Run a complete validation of all API endpoints.</p>
            <Button onClick={handleRunAllTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </TabsContent>
          
          {/* Results section - appears for all tabs */}
          {validationResults.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Test Results</h3>
              {validationResults.map((result, index) => (
                <Alert key={index} variant={result.success ? "default" : "destructive"}>
                  {result.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{result.success ? 'Success' : 'Failed'}</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2">
                      <p className="font-medium">{result.message}</p>
                      
                      {/* Display response data if available */}
                      {result.data && (
                        <pre className="mt-2 bg-secondary p-2 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                      
                      {/* Display error details if available */}
                      {result.error && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-destructive">Error Details:</p>
                          <pre className="bg-destructive/10 p-2 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify({
                              message: result.error.message,
                              code: result.error.code,
                              response: {
                                status: result.error.response?.status,
                                statusText: result.error.response?.statusText,
                                data: result.error.response?.data
                              }
                            }, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3000'}
        </p>
      </CardFooter>
    </Card>
  );
};

export default ApiValidator;
