
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
