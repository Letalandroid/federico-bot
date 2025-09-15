import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Package, 
  ArrowRightLeft, 
  BarChart3, 
  MessageCircle,
  GraduationCap,
  Settings,
  Users
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/',
  },
  {
    title: 'Inventario',
    icon: Package,
    href: '/inventory',
  },
  {
    title: 'Movimientos',
    icon: ArrowRightLeft,
    href: '/movements',
  },
  {
    title: 'Reportes',
    icon: BarChart3,
    href: '/reports',
  },
  // {
  //   title: 'Docentes',
  //   icon: Users,
  //   href: '/teachers',
  // },
  {
    title: 'Chatbot',
    icon: MessageCircle,
    href: '/chat',
  },
  // {
  //   title: 'Configuración',
  //   icon: Settings,
  //   href: '/settings',
  // },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">Sistema Inventario</h1>
            <p className="text-xs text-sidebar-foreground/70">I.E. Federico Helguero</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};