
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, File, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ISOFile, qemuService } from '@/services/qemuService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ISOFileSelectorProps {
  selectedISO: string;
  onISOChange: (iso: string) => void;
  customISOPath: string;
  onCustomISOPathChange: (path: string) => void;
  useCustomPath: boolean;
  onUseCustomPathChange: (use: boolean) => void;
}

const ISOFileSelector = ({ 
  selectedISO, 
  onISOChange,
  customISOPath,
  onCustomISOPathChange,
  useCustomPath,
  onUseCustomPathChange
}: ISOFileSelectorProps) => {
  const [isoFiles, setIsoFiles] = useState<ISOFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchISOFiles();
  }, []);

  const fetchISOFiles = async () => {
    try {
      const files = await qemuService.getISOFiles();
      setIsoFiles(files);
      
      // If no ISO is selected but we have files, select the first one
      if (!selectedISO && files.length > 0 && !useCustomPath) {
        onISOChange(files[0].name);
      }
    } catch (error) {
      console.error('Error fetching ISO files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setUploadError(null);

    // Validate file is .iso
    if (!file.name.toLowerCase().endsWith('.iso')) {
      setUploadError('Only .iso files are supported');
      toast.error('Only .iso files are supported');
      return;
    }

    setIsUploading(true);
    try {
      await qemuService.uploadISO(file);
      await fetchISOFiles();
      onISOChange(file.name);
      // If successful, switch to uploaded tab
      onUseCustomPathChange(false);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload ISO file. Check file type and size.';
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleDeleteISO = async (filename: string) => {
    if (!filename) return;
    
    setIsDeleting(true);
    try {
      await qemuService.deleteISO(filename);
      await fetchISOFiles();
      
      // If the deleted file was selected, clear the selection
      if (selectedISO === filename) {
        onISOChange('');
      }
    } catch (error) {
      console.error('Error deleting ISO:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs 
        defaultValue={useCustomPath ? "custom" : "uploaded"} 
        onValueChange={(value) => onUseCustomPathChange(value === "custom")}
      >
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="uploaded">Use Uploaded ISO</TabsTrigger>
          <TabsTrigger value="custom">Use Custom ISO Path</TabsTrigger>
        </TabsList>
        
        <TabsContent value="uploaded" className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="iso">ISO Image</Label>
            <div className="flex items-center gap-2">
              <Select 
                value={selectedISO} 
                onValueChange={onISOChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an ISO image" />
                </SelectTrigger>
                <SelectContent>
                  {isoFiles.length === 0 ? (
                    <div className="py-2 px-2 text-sm text-muted-foreground">No ISO files available</div>
                  ) : (
                    isoFiles.map(file => (
                      <SelectItem key={file.name} value={file.name}>
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <span>{file.name}</span>
                          <span className="text-xs text-muted-foreground">({file.size})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {selectedISO && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleDeleteISO(selectedISO)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="upload-iso">Upload New ISO</Label>
            <div className="flex items-center gap-2">
              <Input
                id="upload-iso"
                type="file"
                accept=".iso"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="flex-1"
              />
              <Button variant="outline" asChild disabled={isUploading}>
                <label htmlFor="upload-iso" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </label>
              </Button>
            </div>

            {uploadError && (
              <div className="flex items-center text-sm text-destructive mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>{uploadError}</span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Upload an ISO image file to use for VM installation
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="custom-iso-path">Custom ISO Path</Label>
            <Input
              id="custom-iso-path"
              placeholder="C:\path\to\iso\file.iso"
              value={customISOPath}
              onChange={(e) => onCustomISOPathChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Specify a full path to an ISO file on the host system
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ISOFileSelector;
