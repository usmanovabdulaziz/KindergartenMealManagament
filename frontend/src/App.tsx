
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Ingredients from "./pages/Ingredients";
import Meals from "./pages/Meals";
import Deliveries from "./pages/Deliveries";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/ingredients" element={
              <ProtectedRoute>
                <Layout><Ingredients /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/meals" element={
              <ProtectedRoute>
                <Layout><Meals /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/deliveries" element={
              <ProtectedRoute>
                <Layout><Deliveries /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout><Reports /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />

            {/* Admin-only routes */}
            <Route path="/users" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Users /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/logs" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Logs /></Layout>
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;