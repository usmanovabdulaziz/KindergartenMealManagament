import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ProductCategories from "./pages/ProductCategories";
import AddUnitPage from "./pages/AddUnit";
import Suppliers from "./pages/Suppliers";
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

            {/* Dashboard route - accessible to admin and manager, but not cook */}
            <Route path="/" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />

            {/* Standard protected routes */}
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
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <Layout><Deliveries /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
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

            <Route path="/product-categories" element={
              <ProtectedRoute requiredRole={['admin', 'manager', 'cook']}>
                <Layout><ProductCategories /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/units/add" element={
              <ProtectedRoute>
                <Layout><AddUnitPage /></Layout>
              </ProtectedRoute>
            } />

            {/* Suppliers - admin and manager only */}
            <Route path="/suppliers" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <Layout><Suppliers /></Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;