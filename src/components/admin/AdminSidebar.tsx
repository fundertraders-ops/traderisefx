import { Link, useRouterState } from "@tanstack/react-router";
import { Shield, ImageIcon, LayoutDashboard, ChevronRight, Users, Receipt, Wallet, MessageSquare, MessagesSquare, Mail, FileText, Percent, Tag, Briefcase, Trophy } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const adminNavItems = [
  { title: "Control Panel", url: "/admin", icon: Shield },
  { title: "Orders", url: "/admin/orders", icon: Receipt },
  { title: "Trading Accounts", url: "/admin/accounts", icon: Wallet },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Referrals", url: "/admin/referrals", icon: Percent },
  { title: "Promo Codes", url: "/admin/promo-codes", icon: Tag },
  { title: "Sales Team", url: "/admin/sales-team", icon: Briefcase },
  { title: "Competitions", url: "/admin/competitions", icon: Trophy },
  { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
  { title: "Live Chats", url: "/admin/chats", icon: MessagesSquare },
  { title: "Email Log", url: "/admin/emails", icon: Mail },
  { title: "Generated PDFs", url: "/admin/documents", icon: FileText },
  { title: "Trade Results", url: "/admin/trade-results", icon: ImageIcon },
  { title: "User Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

export function AdminSidebar() {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="px-3 py-4">
        <Link
          to="/admin"
          className="flex items-center gap-2 font-display font-bold text-sm min-w-0"
        >
          <span className="size-7 rounded-md bg-gold-gradient grid place-items-center text-primary-foreground shrink-0">
            T
          </span>
          {!collapsed && (
            <span className="truncate">
              Trade Rise <span className="text-gold-gradient">FX</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      to={item.url}
                      className="flex items-center gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {isActive(item.url) && (
                        <ChevronRight className="ml-auto h-3 w-3 text-gold" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
