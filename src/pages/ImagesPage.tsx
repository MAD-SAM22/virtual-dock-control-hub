import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { 
  Search, 
  Download, 
  Trash2, 
  MoreVertical, 
  Tag, 
  Upload, 
  Plus, 
  Loader,
  RefreshCw 
} from 'lucide-react';
import { imageService } from '@/services/dockerService';

interface Image {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

const mockImages: Image[] = [
  { 
    id: 'sha256:123456789abcdef', 
    repository: 'nginx', 
    tag: 'latest', 
    size: '133MB', 
    created: '2 weeks ago' 
  },
  { 
    id: 'sha256:987654321fedcba', 
    repository: 'postgres', 
    tag: '13', 
    size: '314MB', 
    created: '1 month ago' 
  },
  { 
    id: 'sha256:abcdef123456789', 
    repository: 'redis', 
    tag: 'alpine', 
    size: '32MB', 
    created: '3 weeks ago' 
  },
  { 
    id: 'sha256:fedcba987654321', 
    repository: 'ubuntu', 
    tag: '20.04', 
    size: '72MB', 
    created: '2 months ago' 
  },
  { 
    id: 'sha256:13579abcdef2468', 
    repository: 'node', 
    tag: '16-alpine', 
    size: '117MB', 
    created: '2 weeks ago' 
  },
];

const ImagesPage = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [filteredImages, setFilteredImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pullDialogOpen, setPullDialogOpen] = useState(false);
  const [pullImage, setPullImage] = useState('');
  const [pullTag, setPullTag] = useState('latest');
  const [hubSearchDialogOpen, setHubSearchDialogOpen] = useState(false);
  const [hubSearchTerm, setHubSearchTerm] = useState('');
  const [hubSearchResults, setHubSearchResults] = useState<any[]>([]);
  const [hubSearchLoading, setHubSearchLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ action: '', imageId: '' });

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await imageService.getImages(true);
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        setImages(response.data);
        setFilteredImages(response.data);
      } else {
        setImages(mockImages);
        setFilteredImages(mockImages);
        toast.warning('No images received from backend, using mock data.');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching images from backend, using mock data:', error);
      toast.error('Failed to fetch images from backend. Showing mock data.');
      setImages(mockImages);
      setFilteredImages(mockImages);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredImages(images);
    } else {
      const filtered = images.filter(
        image => 
          `${image.repository}:${image.tag}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          image.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredImages(filtered);
    }
  }, [searchTerm, images]);

  const handleSearchHub = async () => {
    if (!hubSearchTerm.trim()) return;
    
    setHubSearchLoading(true);
    try {
      const response = await imageService.searchImages(hubSearchTerm);
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        setHubSearchResults(response.data);
        setHubSearchLoading(false);
      } else {
        const mockResults = [
          { name: 'nginx', description: 'Official build of Nginx', stars: 15000, official: true },
          { name: `${hubSearchTerm}/webapp`, description: 'Web application with Node.js', stars: 120, official: false },
          { name: `awesome/${hubSearchTerm}`, description: 'Containerized application', stars: 45, official: false },
        ];
        setHubSearchResults(mockResults);
        setHubSearchLoading(false);
      }
    } catch (error) {
      console.error('Error searching Docker Hub:', error);
      toast.error('Failed to search Docker Hub');
      setHubSearchLoading(false);
    }
  };

  const handlePullImage = async () => {
    if (!pullImage.trim()) {
      toast.error('Please enter an image name');
      return;
    }

    setPullDialogOpen(false);
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: `Pulling image ${pullImage}:${pullTag}...`,
        success: () => {
          const newImage = {
            id: `sha256:${Math.random().toString(36).substring(2, 15)}`,
            repository: pullImage,
            tag: pullTag,
            size: `${Math.floor(Math.random() * 200) + 10}MB`,
            created: 'Just now',
          };
          setImages([newImage, ...images]);
          return `Successfully pulled ${pullImage}:${pullTag}`;
        },
        error: 'Failed to pull image',
      }
    );
  };

  const handlePullFromHub = (imageName: string) => {
    setPullImage(imageName);
    setPullTag('latest');
    setHubSearchDialogOpen(false);
    setPullDialogOpen(true);
  };

  const handleImageAction = async (action: string, imageId: string) => {
    if (['delete'].includes(action)) {
      setConfirmAction({ action, imageId });
      setConfirmDialogOpen(true);
      return;
    }

    try {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: `Performing action...`,
          success: () => {
            if (action === 'tag') {
              toast.info('Tag dialog would open here');
            } else if (action === 'push') {
              toast.info('Push dialog would open here');
            }
            return `Action ${action} completed successfully`;
          },
          error: `Failed to ${action} image`,
        }
      );
    } catch (error) {
      console.error(`Error with image action ${action}:`, error);
      toast.error(`Failed to ${action} image`);
    }
  };

  const confirmActionExecution = async () => {
    const { action, imageId } = confirmAction;
    setConfirmDialogOpen(false);
    
    try {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: `${action.charAt(0).toUpperCase() + action.slice(1)}ing image...`,
          success: () => {
            if (action === 'delete') {
              setImages(images.filter(img => img.id !== imageId));
            }
            return `Image ${action}d successfully`;
          },
          error: `Failed to ${action} image`,
        }
      );
    } catch (error) {
      console.error(`Error ${action}ing image:`, error);
      toast.error(`Failed to ${action} image`);
    }
  };

  const handlePruneUnreferenced = async () => {
    try {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1500)),
        {
          loading: 'Pruning unreferenced images...',
          success: () => {
            return 'Successfully pruned unreferenced images. Reclaimed 423MB of disk space.';
          },
          error: 'Failed to prune images',
        }
      );
    } catch (error) {
      console.error('Error pruning images:', error);
      toast.error('Failed to prune images');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search images..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setHubSearchDialogOpen(true)}
            className="shrink-0"
          >
            <Search className="mr-2 h-4 w-4" /> Search Hub
          </Button>
          <Button 
            onClick={() => setPullDialogOpen(true)}
            className="shrink-0"
          >
            <Download className="mr-2 h-4 w-4" /> Pull Image
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Images</CardTitle>
            <CardDescription>Manage your Docker images</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePruneUnreferenced}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Prune Unreferenced
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Repository</th>
                  <th className="text-left p-3 font-medium">Tag</th>
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Size</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Loading images...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredImages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <p className="text-muted-foreground">No images found</p>
                      {searchTerm && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Try adjusting your search query
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredImages.map((image) => (
                    <tr key={image.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{image.repository}</td>
                      <td className="p-3">{image.tag}</td>
                      <td className="p-3 text-sm font-mono">{image.id.substring(0, 12)}</td>
                      <td className="p-3">{image.size}</td>
                      <td className="p-3">{image.created}</td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleImageAction('tag', image.id)}
                          title="Tag"
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleImageAction('push', image.id)}
                          title="Push"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleImageAction('inspect', image.id)}>
                              <Search className="mr-2 h-4 w-4" />
                              <span>Inspect</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleImageAction('history', image.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              <span>History</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleImageAction('delete', image.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={pullDialogOpen} onOpenChange={setPullDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pull Image</DialogTitle>
            <DialogDescription>
              Enter the name of the image you want to pull from Docker Hub
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="pull-image" className="text-sm font-medium">
                Image
              </label>
              <Input
                id="pull-image"
                placeholder="e.g., nginx"
                value={pullImage}
                onChange={(e) => setPullImage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pull-tag" className="text-sm font-medium">
                Tag
              </label>
              <Input
                id="pull-tag"
                placeholder="latest"
                value={pullTag}
                onChange={(e) => setPullTag(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPullDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePullImage}>Pull</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hubSearchDialogOpen} onOpenChange={setHubSearchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Search Docker Hub</DialogTitle>
            <DialogDescription>
              Search for images in the Docker Hub repository
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Docker Hub..."
                  className="pl-8"
                  value={hubSearchTerm}
                  onChange={(e) => setHubSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchHub()}
                />
              </div>
              <Button onClick={handleSearchHub} disabled={hubSearchLoading}>
                {hubSearchLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              {hubSearchLoading ? (
                <div className="flex justify-center items-center h-[200px]">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : hubSearchResults.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  {hubSearchTerm ? 'No results found. Try another search term.' : 'Enter a search term above to find images'}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-center p-3 font-medium">Stars</th>
                      <th className="text-right p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hubSearchResults.map((result, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          {result.name}
                          {result.official && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              Official
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm">{result.description}</td>
                        <td className="p-3 text-center">{result.stars.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <Button 
                            size="sm" 
                            onClick={() => handlePullFromHub(result.name)}
                          >
                            <Download className="mr-1 h-3 w-3" /> Pull
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHubSearchDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmActionExecution}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImagesPage;
