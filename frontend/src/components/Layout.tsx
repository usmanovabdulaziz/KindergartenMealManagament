
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Apple, 
  UtensilsCrossed, 
  Truck, 
  BarChartBig, 
  User, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Ingredients', href: '/ingredients', icon: Apple },
    { name: 'Meals', href: '/meals', icon: UtensilsCrossed },
    { name: 'Deliveries', href: '/deliveries', icon: Truck },
    { name: 'Reports', href: '/reports', icon: BarChartBig },
    { name: 'Users', href: '/users', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="bg-primary/10 w-64 p-4 hidden md:block">
        <div className="flex items-center mb-6">
          <span className="text-xl font-bold text-primary">KinderMeal</span>
        </div>
        
        <nav className="space-y-1">
          {navigation.map((item) => (
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
      </div>
      
      {/* Mobile navbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-10 md:hidden">
        <div className="flex justify-around">
          {navigation.slice(0, 5).map((item) => (
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
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
