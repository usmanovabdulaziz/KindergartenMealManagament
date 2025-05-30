import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Apple,
  UtensilsCrossed,
  Truck,
  BarChartBig,
  User,
  Settings,
  FileText,
  LogOut,
  Folder,
  Plus,
  Building2 // You can use any suitable icon for Suppliers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'manager'] },
    { name: 'Ingredients', href: '/ingredients', icon: Apple, roles: ['admin', 'cook', 'manager'] },
    { name: 'Meals', href: '/meals', icon: UtensilsCrossed, roles: ['admin', 'cook', 'manager'] },
    { name: 'Deliveries', href: '/deliveries', icon: Truck, roles: ['admin', 'manager'] },
    { name: 'Reports', href: '/reports', icon: BarChartBig, roles: ['admin', 'manager'] },
    { name: 'Product Categories', href: '/product-categories', icon: Folder, roles: ['admin', 'manager', 'cook'] },
    { name: 'Add Unit', href: '/units/add', icon: Plus, roles: ['admin', 'manager', 'cook'] },
    // Suppliers link for admin and manager only
    { name: 'Suppliers', href: '/suppliers', icon: Building2, roles: ['admin', 'manager'] },
    { name: 'Users', href: '/users', icon: User, roles: ['admin'] },
    { name: 'Logs', href: '/logs', icon: FileText, roles: ['admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'manager', 'cook'] },
  ];

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item =>
    !item.roles || (userRole && item.roles.includes(userRole.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="bg-primary/10 w-64 p-4 hidden md:flex md:flex-col">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-bold text-primary">KinderMeal</span>
        </div>

        <nav className="space-y-1 flex-1">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location.pathname === item.href
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-primary/20"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="pt-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>
                      {user.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span>{user.username}</span>
                    <span className="text-xs text-gray-500 capitalize">{userRole}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Mobile navbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-10 md:hidden">
        <div className="flex justify-around">
          {filteredNavigation.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-1",
                location.pathname === item.href
                  ? "text-primary"
                  : "text-gray-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>

            {/* Mobile user menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-16 md:pb-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;