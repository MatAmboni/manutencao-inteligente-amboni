import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import ServiceOrders from "./pages/ServiceOrders";
import Equipment from "./pages/Equipment";
import RiskAnalysis from "./pages/RiskAnalysis";
import Epis from "./pages/Epis";
import MyOrders from "./pages/MyOrders";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WorkEntryPermits from "./pages/WorkEntryPermits";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/service-orders"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <ServiceOrders />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MyOrders />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipment"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <Equipment />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk-analysis"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <RiskAnalysis />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/epis"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <Epis />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/work-entry-permits"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <WorkEntryPermits />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
