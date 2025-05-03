
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
import { Upload, Trash2, File } from 'lucide-react';
import { toast } from 'sonner';
import { ISOFile, qemuService } from '@/services/qemuService';

interface ISOFileSelectorProps {
  selectedISO: string;
  onISOChange: (iso: string) => void;
}

const ISOFileSelector = ({ selectedISO, onISOChange }: ISOFileSelectorProps) => {
  const [isoFiles, setIsoFiles] = useState<ISOFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchISOFiles();
  }, []);

  const fetchISOFiles = async () => {
    try {
      const files = await qemuService.getISOFiles();
      setIsoFiles(files);
      
      // If no ISO is selected but we have files, select the first one
      if (!selectedISO && files.length > 0) {
        onISOChange(files[0].name);
      }
    } catch (error) {
      console.error('Error fetching ISO files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file is .iso
    if (!file.name.toLowerCase().endsWith('.iso')) {
      toast.error('Only .iso files are supported');
      return;
    }

    setIsUploading(true);
    try {
      await qemuService.uploadISO(file);
      await fetchISOFiles();
      onISOChange(file.name);
    } catch (error) {
      console.error('Error uploading file:', error);
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
          <Button variant="outline" asChild>
            <label htmlFor="upload-iso" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Browse
            </label>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload an ISO image file to use for VM installation
        </p>
      </div>
    </div>
  );
};

export default ISOFileSelector;
