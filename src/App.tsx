
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ContainersPage from "@/pages/ContainersPage";
import ImagesPage from "@/pages/ImagesPage";
import VMsPage from "@/pages/VMsPage";
import LogsPage from "@/pages/LogsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// The main issue is likely caused by how React is imported and used with QueryClientProvider
const App = () => (
  // Wrap everything with BrowserRouter first
  <BrowserRouter>
    <TooltipProvider>
      {/* Put QueryClientProvider after other providers that don't depend on React hooks */}
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/containers" element={
              <ProtectedRoute>
                <AppLayout>
                  <ContainersPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/images" element={
              <ProtectedRoute>
                <AppLayout>
                  <ImagesPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/vms" element={
              <ProtectedRoute>
                <AppLayout>
                  <VMsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/logs" element={
              <ProtectedRoute>
                <AppLayout>
                  <LogsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </QueryClientProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
);

export default App;
