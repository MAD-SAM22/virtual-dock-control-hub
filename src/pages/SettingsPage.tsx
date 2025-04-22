
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Loader, Save } from 'lucide-react';

const SettingsPage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [apiSettings, setApiSettings] = useState({
    apiEndpoint: 'http://localhost:3000',
    apiTimeout: '30',
    enableAuthentication: true,
    username: 'admin',
    password: '',
    apiKey: 'sk_12345678901234567890',
  });

  const [preferences, setPreferences] = useState({
    theme: 'system',
    refreshInterval: '30',
    enableNotifications: true,
    notificationSound: true,
    autoStartContainers: false,
    confirmDangerous: true,
    defaultLogLines: '100',
  });

  const [dockerSettings, setDockerSettings] = useState({
    dockerHost: 'unix:///var/run/docker.sock',
    dockerApiVersion: 'v1.41',
    registryUrl: 'https://index.docker.io/v1/',
    registryUsername: '',
    registryPassword: '',
    insecureRegistry: false,
    pruneInterval: 'weekly',
  });

  const [qemuSettings, setQemuSettings] = useState({
    qemuBinary: '/usr/bin/qemu-system-x86_64',
    defaultVNCPort: '5900',
    vncPassword: '',
    vncKeyboardLayout: 'en-us',
    isoDirectory: '/var/lib/qemu/iso',
    vmDirectory: '/var/lib/qemu/vms',
    enableKVM: true,
    enableNesting: false,
  });

  const handleApiSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setApiSettings({
      ...apiSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handlePreferencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleDockerSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setDockerSettings({
      ...dockerSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleQemuSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setQemuSettings({
      ...qemuSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSelectChange = (section: string, name: string, value: string) => {
    if (section === 'preferences') {
      setPreferences({
        ...preferences,
        [name]: value,
      });
    } else if (section === 'docker') {
      setDockerSettings({
        ...dockerSettings,
        [name]: value,
      });
    } else if (section === 'qemu') {
      setQemuSettings({
        ...qemuSettings,
        [name]: value,
      });
    }
  };

  const handleSwitchChange = (section: string, name: string, checked: boolean) => {
    if (section === 'api') {
      setApiSettings({
        ...apiSettings,
        [name]: checked,
      });
    } else if (section === 'preferences') {
      setPreferences({
        ...preferences,
        [name]: checked,
      });
    } else if (section === 'docker') {
      setDockerSettings({
        ...dockerSettings,
        [name]: checked,
      });
    } else if (section === 'qemu') {
      setQemuSettings({
        ...qemuSettings,
        [name]: checked,
      });
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    
    // In a real app, this would be an API call to save settings
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved successfully');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your Virtual Dock Control Hub preferences
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API Connection</TabsTrigger>
          <TabsTrigger value="docker">Docker</TabsTrigger>
          <TabsTrigger value="qemu">QEMU</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interface Settings</CardTitle>
              <CardDescription>
                Configure how the application looks and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => handleSelectChange('preferences', 'theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refreshInterval">Auto-refresh Interval (seconds)</Label>
                <Input
                  id="refreshInterval"
                  name="refreshInterval"
                  type="number"
                  value={preferences.refreshInterval}
                  onChange={handlePreferencesChange}
                />
                <p className="text-sm text-muted-foreground">
                  Set to 0 to disable auto-refresh
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultLogLines">Default Log Lines</Label>
                <Select
                  value={preferences.defaultLogLines}
                  onValueChange={(value) => handleSelectChange('preferences', 'defaultLogLines', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of lines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 lines</SelectItem>
                    <SelectItem value="100">100 lines</SelectItem>
                    <SelectItem value="500">500 lines</SelectItem>
                    <SelectItem value="1000">1000 lines</SelectItem>
                    <SelectItem value="all">All available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableNotifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about container and VM events
                  </p>
                </div>
                <Switch
                  id="enableNotifications"
                  checked={preferences.enableNotifications}
                  onCheckedChange={(checked) => handleSwitchChange('preferences', 'enableNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notificationSound">Notification Sound</Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound when notifications appear
                  </p>
                </div>
                <Switch
                  id="notificationSound"
                  checked={preferences.notificationSound}
                  onCheckedChange={(checked) => handleSwitchChange('preferences', 'notificationSound', checked)}
                  disabled={!preferences.enableNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="confirmDangerous">Confirm Dangerous Actions</Label>
                  <p className="text-sm text-muted-foreground">
                    Show confirmation for destructive operations
                  </p>
                </div>
                <Switch
                  id="confirmDangerous"
                  checked={preferences.confirmDangerous}
                  onCheckedChange={(checked) => handleSwitchChange('preferences', 'confirmDangerous', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoStartContainers">Auto-Start Containers</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start containers marked as auto-start
                  </p>
                </div>
                <Switch
                  id="autoStartContainers"
                  checked={preferences.autoStartContainers}
                  onCheckedChange={(checked) => handleSwitchChange('preferences', 'autoStartContainers', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Connection Settings</CardTitle>
              <CardDescription>
                Configure how to connect to the Docker and QEMU API gateway
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="apiEndpoint">API Endpoint URL</Label>
                <Input
                  id="apiEndpoint"
                  name="apiEndpoint"
                  value={apiSettings.apiEndpoint}
                  onChange={handleApiSettingsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiTimeout">Request Timeout (seconds)</Label>
                <Input
                  id="apiTimeout"
                  name="apiTimeout"
                  type="number"
                  value={apiSettings.apiTimeout}
                  onChange={handleApiSettingsChange}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableAuthentication">Enable Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require authentication for API requests
                  </p>
                </div>
                <Switch
                  id="enableAuthentication"
                  checked={apiSettings.enableAuthentication}
                  onCheckedChange={(checked) => handleSwitchChange('api', 'enableAuthentication', checked)}
                />
              </div>
              
              {apiSettings.enableAuthentication && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={apiSettings.username}
                      onChange={handleApiSettingsChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={apiSettings.password}
                      onChange={handleApiSettingsChange}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="apiKey"
                        name="apiKey"
                        value={apiSettings.apiKey}
                        onChange={handleApiSettingsChange}
                        className="font-mono"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          // In a real app, this would generate a new API key
                          setApiSettings({
                            ...apiSettings,
                            apiKey: `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
                          });
                          toast.info('New API key generated');
                        }}
                      >
                        Regenerate
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use this API key for programmatic access
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="docker" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Docker Settings</CardTitle>
              <CardDescription>
                Configure Docker connection and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dockerHost">Docker Host</Label>
                <Input
                  id="dockerHost"
                  name="dockerHost"
                  value={dockerSettings.dockerHost}
                  onChange={handleDockerSettingsChange}
                />
                <p className="text-sm text-muted-foreground">
                  Unix socket path or TCP address (e.g., unix:///var/run/docker.sock or tcp://localhost:2375)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dockerApiVersion">Docker API Version</Label>
                <Input
                  id="dockerApiVersion"
                  name="dockerApiVersion"
                  value={dockerSettings.dockerApiVersion}
                  onChange={handleDockerSettingsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pruneInterval">Auto-Prune Interval</Label>
                <Select
                  value={dockerSettings.pruneInterval}
                  onValueChange={(value) => handleSelectChange('docker', 'pruneInterval', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Automatically remove unused containers, networks, and images
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium">Registry Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure Docker registry authentication
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="registryUrl">Registry URL</Label>
                  <Input
                    id="registryUrl"
                    name="registryUrl"
                    value={dockerSettings.registryUrl}
                    onChange={handleDockerSettingsChange}
                  />
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="registryUsername">Registry Username</Label>
                  <Input
                    id="registryUsername"
                    name="registryUsername"
                    value={dockerSettings.registryUsername}
                    onChange={handleDockerSettingsChange}
                  />
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="registryPassword">Registry Password</Label>
                  <Input
                    id="registryPassword"
                    name="registryPassword"
                    type="password"
                    placeholder="••••••••"
                    value={dockerSettings.registryPassword}
                    onChange={handleDockerSettingsChange}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="insecureRegistry">Allow Insecure Registry</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow connections to registries without SSL
                    </p>
                  </div>
                  <Switch
                    id="insecureRegistry"
                    checked={dockerSettings.insecureRegistry}
                    onCheckedChange={(checked) => handleSwitchChange('docker', 'insecureRegistry', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="qemu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QEMU Settings</CardTitle>
              <CardDescription>
                Configure QEMU virtual machine settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="qemuBinary">QEMU Binary Path</Label>
                <Input
                  id="qemuBinary"
                  name="qemuBinary"
                  value={qemuSettings.qemuBinary}
                  onChange={handleQemuSettingsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="isoDirectory">ISO Images Directory</Label>
                <Input
                  id="isoDirectory"
                  name="isoDirectory"
                  value={qemuSettings.isoDirectory}
                  onChange={handleQemuSettingsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vmDirectory">VM Storage Directory</Label>
                <Input
                  id="vmDirectory"
                  name="vmDirectory"
                  value={qemuSettings.vmDirectory}
                  onChange={handleQemuSettingsChange}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableKVM">Enable KVM Acceleration</Label>
                  <p className="text-sm text-muted-foreground">
                    Use hardware virtualization for better performance
                  </p>
                </div>
                <Switch
                  id="enableKVM"
                  checked={qemuSettings.enableKVM}
                  onCheckedChange={(checked) => handleSwitchChange('qemu', 'enableKVM', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableNesting">Enable Nested Virtualization</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow VMs to run other VMs (requires CPU support)
                  </p>
                </div>
                <Switch
                  id="enableNesting"
                  checked={qemuSettings.enableNesting}
                  onCheckedChange={(checked) => handleSwitchChange('qemu', 'enableNesting', checked)}
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium">VNC Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure VNC remote access for virtual machines
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultVNCPort">Default VNC Starting Port</Label>
                  <Input
                    id="defaultVNCPort"
                    name="defaultVNCPort"
                    value={qemuSettings.defaultVNCPort}
                    onChange={handleQemuSettingsChange}
                  />
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="vncPassword">VNC Password (optional)</Label>
                  <Input
                    id="vncPassword"
                    name="vncPassword"
                    type="password"
                    placeholder="••••••••"
                    value={qemuSettings.vncPassword}
                    onChange={handleQemuSettingsChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Set global password for VNC connections
                  </p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="vncKeyboardLayout">VNC Keyboard Layout</Label>
                  <Select
                    value={qemuSettings.vncKeyboardLayout}
                    onValueChange={(value) => handleSelectChange('qemu', 'vncKeyboardLayout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select keyboard layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-us">English (US)</SelectItem>
                      <SelectItem value="en-gb">English (UK)</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
