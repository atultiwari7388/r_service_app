"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Wrench,
  Database,
  ArrowLeft,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  CreditCard,
  Truck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContexts";

interface SubNavItem {
  name: string;
  href: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage registered users",
  },
  {
    name: "Mechanics",
    href: "/admin/mechanics",
    icon: Wrench,
    description: "Workshops & mechanics",
  },
  {
    name: "Services Data",
    href: "/admin/services-data",
    icon: Database,
    description: "Maintenance service catalog",
  },
  {
    name: "Subscription Plans",
    href: "/admin/subscription-plans",
    icon: CreditCard,
    description: "Pricing tiers & packages",
    subItems: [
      {
        name: "For Owners/Drivers",
        href: "/admin/subscription-plans/owners-drivers",
        description: "Truck & trailer fleet plans",
        icon: Truck,
      },
      {
        name: "For Mechanics",
        href: "/admin/subscription-plans/mechanics",
        description: "Shops & technician plans",
        icon: Wrench,
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const user = auth?.user;
  const logout = auth?.logout;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "/admin/subscription-plans": true,
  });

  useEffect(() => {
    if (pathname?.startsWith("/admin/subscription-plans")) {
      setExpandedMenus((prev) => ({ ...prev, "/admin/subscription-plans": true }));
    }
  }, [pathname]);

  const toggleExpand = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const isActive = (href: string) => {
    if (href === "/admin/users" && (pathname === "/admin/users" || pathname?.startsWith("/admin/users/"))) {
      return true;
    }
    if (href === "/admin/mechanics" && (pathname === "/admin/mechanics" || pathname?.startsWith("/admin/mechanics/"))) {
      return true;
    }
    if (href === "/admin/services-data" && pathname?.startsWith("/admin/services-data")) {
      return true;
    }
    if (href === "/admin/subscription-plans" && pathname === "/admin/subscription-plans") {
      return true;
    }
    return pathname === href;
  };

  const isParentOrChildActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    if (item.subItems?.some((sub) => pathname === sub.href || pathname?.startsWith(sub.href + "/"))) {
      return true;
    }
    return false;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-gray-800 border-r border-gray-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-200 flex items-center justify-between">
        <Link href="/admin/users" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#F96176] flex items-center justify-center font-bold text-white shadow-md shadow-[#F96176]/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-gray-900 flex items-center gap-2">
              TrenoOps Admin
            </h1>
            <p className="text-[11px] text-gray-400 font-medium">Control Center</p>
          </div>
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
          aria-label="Close Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
            Admin Management
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const parentOrChildActive = isParentOrChildActive(item);
              const hasSubItems = !!item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus[item.href] ?? true;
              const Icon = item.icon;

              return (
                <div key={item.href} className="space-y-1">
                  <div
                    className={`group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-[#F96176] text-white shadow-md shadow-[#F96176]/25 font-bold"
                        : parentOrChildActive
                        ? "bg-rose-50/80 text-[#F96176] font-bold border border-rose-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                    }`}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                          active
                            ? "bg-white/20 text-white"
                            : parentOrChildActive
                            ? "bg-white text-[#F96176] shadow-xs"
                            : "bg-gray-100 text-gray-600 group-hover:text-gray-900 group-hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="leading-tight truncate">{item.name}</div>
                        <div
                          className={`text-[11px] font-normal truncate ${
                            active
                              ? "text-white/90"
                              : parentOrChildActive
                              ? "text-[#F96176]/80"
                              : "text-gray-400 group-hover:text-gray-500"
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </Link>

                    {hasSubItems ? (
                      <button
                        type="button"
                        onClick={(e) => toggleExpand(item.href, e)}
                        className={`p-1 rounded-md transition-colors ${
                          active
                            ? "text-white/80 hover:text-white hover:bg-white/20"
                            : parentOrChildActive
                            ? "text-[#F96176] hover:bg-rose-100"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-200/60"
                        }`}
                        aria-label="Toggle Submenu"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          active
                            ? "text-white opacity-90 translate-x-0.5"
                            : "text-gray-400 opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    )}
                  </div>

                  {/* Submenu Items */}
                  {hasSubItems && isExpanded && (
                    <div className="ml-5 pl-3 border-l-2 border-rose-100/80 space-y-1 py-1">
                      {item.subItems!.map((sub) => {
                        const isSubActive =
                          pathname === sub.href || pathname?.startsWith(sub.href + "/");
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setMobileOpen(false)}
                            className={`group/sub flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                              isSubActive
                                ? "bg-[#F96176] text-white shadow-xs font-bold"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {SubIcon && (
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSubActive ? "text-white" : "text-gray-400 group-hover/sub:text-gray-700"
                                  }`}
                                />
                              )}
                              <span className="truncate">{sub.name}</span>
                            </div>
                            <ChevronRight
                              className={`w-3 h-3 shrink-0 ${
                                isSubActive
                                  ? "text-white"
                                  : "text-gray-400 opacity-0 group-hover/sub:opacity-100"
                              }`}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Quick Return to User App */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
            Navigation
          </p>
          <Link
            href="/records"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition group"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-gray-900 group-hover:bg-gray-200">
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
            <span>Back to User App</span>
            <ExternalLink className="w-3 h-3 ml-auto text-gray-400 opacity-0 group-hover:opacity-100" />
          </Link>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-[#F96176]">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate" title={user?.email || ""}>
                {user?.email || "Admin User"}
              </p>
              <span className="inline-block text-[10px] px-1.5 py-0.2 bg-rose-50 border border-rose-200 text-[#F96176] font-bold rounded">
                Admin
              </span>
            </div>
          </div>
          {logout && (
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-200/70 rounded-lg transition shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 text-gray-900 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F96176] flex items-center justify-center font-bold text-white shadow-xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-gray-900">TrenoOps Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
