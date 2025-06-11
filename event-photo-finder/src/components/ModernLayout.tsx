'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Icons
import {
  Calendar,
  Search,
  Settings,
  Menu,
  X,
  Home,
  ChevronLeft,
  User,
  LogOut,
  LogIn,
  UserPlus,
  List,
} from 'lucide-react';

interface ModernLayoutProps {
  children: React.ReactNode;
  session: Session | null;
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Find Events', href: '/list', icon: List },
  { name: 'Events', href: '/my-events', icon: Calendar },
];

export default function ModernLayout({ children, session }: ModernLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <Link href="/">
              <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                Event Photo Finder
              </h1>
            </Link>
          )}

          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex"
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                collapsed && 'rotate-180',
              )}
            />
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-11',
                    collapsed && 'px-2 justify-center',
                    isActive && 'bg-blue-600 text-white hover:bg-blue-700',
                    !isActive &&
                      'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* User section */}
        <div className="p-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 h-11',
                    collapsed && 'px-2 justify-center',
                  )}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session.user?.image || ''} />
                    <AvatarFallback>
                      {session.user?.name?.[0] ||
                        session.user?.email?.[0] ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">
                        {session.user?.name || session.user?.email}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {session.user?.email}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={cn('space-y-2', collapsed && 'space-y-1')}>
              <Link href="/auth/signin">
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 h-11',
                    collapsed && 'px-2 justify-center',
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <LogIn className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">Sign In</span>}
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 h-11',
                    collapsed && 'px-2 justify-center',
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <UserPlus className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">Register</span>}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          collapsed ? 'lg:ml-16' : 'lg:ml-64',
        )}
      >
        {/* Mobile header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Event Photo Finder
            </h1>
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={session.user?.image || ''} />
                      <AvatarFallback>
                        {session.user?.name?.[0] ||
                          session.user?.email?.[0] ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
