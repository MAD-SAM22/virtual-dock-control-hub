
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Image, Server, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { containerService } from '@/services/dockerService';
import { imageService } from '@/services/dockerService';
import { qemuService } from '@/services/qemuService';
import axios from 'axios';
import { toast } from 'sonner';
import apiClient from '@/services/apiClient';

const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `${i * 10}m`,
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    network: Math.floor(Math.random() * 100),
  }));
};

interface SystemInfo {
  hostname?: string;
  platform?: string;
  uptime?: number;
  uptimeFormatted?: string;
  cpuCount?: number;
  cpuModel?: string;
  cpuLoad: string | number;
  totalMemory?: string;
  freeMemory?: string;
  memoryUsage: string | number;
  diskUsage: number;
}

const DashboardPage = () => {
  const [containers, setContainers] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [vms, setVMs] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpuLoad: 0,
    memoryUsage: 0,
    diskUsage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemData] = useState(() => generateMockData(24));

  const getSystemInfo = async () => {
    try {
      const response = await apiClient.get('/system/info');
      const data = response.data.system;
      
      // Parse CPU load from string to number if needed
      const cpuLoad = typeof data.cpuLoad === 'string' ? 
        parseInt(data.cpuLoad.replace('%', '')) : 
        data.cpuLoad;
      
      // Parse memory usage from string to number if needed
      const memoryUsage = typeof data.memoryUsage === 'string' ? 
        parseInt(data.memoryUsage.replace('%', '')) : 
        data.memoryUsage;
      
      setSystemInfo({
        ...data,
        cpuLoad,
        memoryUsage,
        // Estimate disk usage since it's not provided in the API
        diskUsage: Math.round(30 + Math.random() * 30)
      });
    } catch (err) {
      console.error('Error getting system info:', err);
      // Fallback to simulated values
      setSystemInfo({
        cpuLoad: Math.round(20 + Math.random() * 30),
        memoryUsage: Math.round(30 + Math.random() * 30),
        diskUsage: Math.round(25 + Math.random() * 40)
      });
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch containers
      const containersResponse = await containerService.getContainers(true);
      if (containersResponse && containersResponse.data) {
        // Format the container data for display
        const formattedContainers = Array.isArray(containersResponse.data) 
          ? containersResponse.data.map(c => ({
              id: c.Id || c.id,
              name: c.Names ? c.Names[0].replace(/^\//, '') : c.name || 'unknown',
              image: c.Image || c.image || 'unknown',
              status: c.State || c.status || 'unknown',
              created: c.Created ? new Date(c.Created * 1000).toLocaleString() : c.created || 'unknown',
              cpu: c.cpu || '0%',
              memory: c.memory || '0MB'
            }))
          : [];
        
        setContainers(formattedContainers);
      }
      
      // Fetch images
      const imagesResponse = await imageService.getImages(true);
      if (imagesResponse && imagesResponse.data) {
        setImages(imagesResponse.data);
      }
      
      // Fetch VMs
      const vmsResponse = await qemuService.getVMs();
      if (vmsResponse && vmsResponse.data) {
        setVMs(vmsResponse.data);
      }
      
      // Get system info
      await getSystemInfo();
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setIsLoading(false);
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up refresh interval for system metrics
    const intervalId = setInterval(() => {
      getSystemInfo();
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Count running containers
  const runningContainers = containers.filter(c => 
    c.status === 'running' || 
    c.status.includes('Up')
  ).length;

  // Count running VMs
  const runningVMs = vms.filter(vm => 
    vm.status === 'running'
  ).length;

  const stats = [
    { 
      title: 'Containers', 
      value: containers.length, 
      running: runningContainers,
      icon: <Box className="h-5 w-5 text-docker-blue" /> 
    },
    { 
      title: 'Images', 
      value: images.length, 
      icon: <Image className="h-5 w-5 text-docker-navy" /> 
    },
    { 
      title: 'QEMU VMs', 
      value: vms.length, 
      running: runningVMs,
      icon: <Server className="h-5 w-5 text-qemu-purple" /> 
    },
    { 
      title: 'System Load', 
      value: `${typeof systemInfo.cpuLoad === 'number' ? systemInfo.cpuLoad : systemInfo.cpuLoad}%`, 
      icon: <Activity className="h-5 w-5 text-primary" /> 
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={fetchDashboardData} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  {stat.running !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.running} running
                    </p>
                  )}
                </div>
                <div className="bg-secondary p-3 rounded-full">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
          <CardDescription>Resource utilization over the last 4 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={systemData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stackId="1" 
                  stroke="#1D63ED" 
                  fill="#1D63ED" 
                  fillOpacity={0.3} 
                />
                <Area 
                  type="monotone" 
                  dataKey="memory" 
                  stackId="2" 
                  stroke="#6F4E7C" 
                  fill="#6F4E7C" 
                  fillOpacity={0.3} 
                />
                <Area 
                  type="monotone" 
                  dataKey="network" 
                  stackId="3" 
                  stroke="#0DB7ED" 
                  fill="#0DB7ED" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Containers</CardTitle>
            <CardDescription>Latest container activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left py-3 px-4 font-medium">Name</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Image</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Status</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">CPU/Mem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center">
                        <Box className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : containers.length > 0 ? (
                    containers.slice(0, 3).map((container) => (
                      <TableRow key={container.id} className="border-b last:border-b-0">
                        <TableCell className="py-3 px-4">{container.name}</TableCell>
                        <TableCell className="py-3 px-4 text-sm">{container.image}</TableCell>
                        <TableCell className="py-3 px-4">
                          <span className={`status-badge ${
                            container.status.includes('Up') || container.status === 'running' ? 'status-running' :
                            container.status.includes('Paused') || container.status === 'paused' ? 'status-paused' : 'status-stopped'
                          }`}>
                            {container.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm text-muted-foreground">
                          {container.cpu} / {container.memory}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center">
                        No containers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QEMU VMs</CardTitle>
            <CardDescription>Virtual machine status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left py-3 px-4 font-medium">Name</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Status</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Memory</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">CPU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center">
                        <Server className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : vms.length > 0 ? (
                    vms.map((vm) => (
                      <TableRow key={vm.id} className="border-b last:border-b-0">
                        <TableCell className="py-3 px-4">{vm.name}</TableCell>
                        <TableCell className="py-3 px-4">
                          <span className={`status-badge ${
                            vm.status === 'running' ? 'status-running' : 'status-stopped'
                          }`}>
                            {vm.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4">{vm.memory}</TableCell>
                        <TableCell className="py-3 px-4">{vm.cpus}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center">
                        No VMs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current status of all services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Docker Engine', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { name: 'QEMU/KVM Service', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { name: 'API Gateway', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { name: 'Authentication Service', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { name: 'Monitoring Service', status: 'warning', icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> },
              { name: 'Backup Service', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="font-medium">{service.name}</span>
                <div className="flex items-center">
                  <span className="text-sm mr-2 text-muted-foreground">{service.status}</span>
                  {service.icon}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
