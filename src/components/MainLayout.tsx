import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Wrench, 
  AlertTriangle,
  Shield,
  Menu,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  User,
  ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface MainLayoutProps {
  children: React.ReactNode;
}

const adminNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Ordens de Serviço", href: "/service-orders", icon: ClipboardList },
  { name: "Equipamentos", href: "/equipment", icon: Wrench },
  { name: "EPIs", href: "/epis", icon: Shield },
  { name: "Análise de Riscos", href: "/risk-analysis", icon: AlertTriangle },
];

const employeeNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Minhas Ordens", href: "/my-orders", icon: ClipboardCheck },
];

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, role, isAdmin, signOut } = useAuth();

  const navigation = isAdmin ? adminNavigation : employeeNavigation;

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const NavLinks = ({ showText = true }: { showText?: boolean }) => (
    <TooltipProvider delayDuration={0}>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        const linkContent = (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              !showText && "justify-center"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {showText && item.name}
          </Link>
        );

        if (!showText) {
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                {linkContent}
              </TooltipTrigger>
              <TooltipContent side="right">
                {item.name}
              </TooltipContent>
            </Tooltip>
          );
        }

        return linkContent;
      })}
    </TooltipProvider>
  );

  const UserMenu = ({ collapsed = false }: { collapsed?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "w-full flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed ? "justify-center p-2" : "justify-start"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.email ? getInitials(user.email) : 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <Badge variant="outline" className="text-xs mt-0.5">
                {isAdmin ? 'Admin' : 'Funcionário'}
              </Badge>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user?.email}</p>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? 'Administrador' : 'Funcionário'}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <div className="flex flex-col flex-grow bg-sidebar border-r border-sidebar-border pt-5 overflow-y-auto">
          <div className={cn(
            "flex items-center flex-shrink-0 px-4 mb-8",
            collapsed && "justify-center px-2"
          )}>
            {collapsed ? (
              <Wrench className="h-6 w-6 text-sidebar-foreground" />
            ) : (
              <h1 className="text-xl font-bold text-sidebar-foreground">
                Sistema de Manutenção
              </h1>
            )}
          </div>
          <nav className={cn("flex-1 px-3 space-y-1", collapsed && "px-2")}>
            <NavLinks showText={!collapsed} />
          </nav>
          
          {/* User Menu */}
          <div className={cn("px-3 py-2 border-t border-sidebar-border", collapsed && "px-2")}>
            <UserMenu collapsed={collapsed} />
          </div>
          
          {/* Collapse Button */}
          <div className={cn("px-3 py-4 border-t border-sidebar-border", collapsed && "px-2")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-full flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent/50",
                collapsed && "justify-center"
              )}
            >
              {collapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <>
                  <PanelLeftClose className="h-5 w-5" />
                  <span>Minimizar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-sidebar-foreground">
            Sistema de Manutenção
          </h1>
          <div className="flex items-center gap-2">
            <UserMenu />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0">
                <div className="flex flex-col h-full pt-8">
                  <div className="flex items-center px-4 mb-8">
                    <h2 className="text-xl font-bold text-sidebar-foreground">Menu</h2>
                  </div>
                  <nav className="flex-1 px-3 space-y-1">
                    <NavLinks showText={true} />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300",
        collapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        <main className="flex-1 pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
