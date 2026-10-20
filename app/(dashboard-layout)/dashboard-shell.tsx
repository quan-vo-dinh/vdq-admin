"use client";
import React from "react";
import { PersonalProvider } from "@/app/context/personal-context";
import Header from "./layout/vertical/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Footer from "./layout/footer/page";
import { AppSidebar } from "./layout/vertical/sidebar/app-sidebar";
import { cn } from "@/lib/utils";
import RouteErrorBoundary from "@/app/components/shared/route-error-boundary";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PersonalProvider><SidebarProvider
      defaultOpen={true}
      style={{ "--sidebar-width-icon": "52px" } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="dashboard-inset outline outline-border m-2 rounded-none! overflow-hidden">
        <Header />
        <div className="dashboard-content flex min-w-0 flex-1 flex-col gap-4 p-3 sm:p-4">
          <div className={cn("dashboard-container mx-auto min-w-0 w-full", "container")}>
            <div className="dashboard-page min-h-[calc(100vh-140px)]">
              <RouteErrorBoundary title="Page error">{children}</RouteErrorBoundary>
            </div>
            <div className="dashboard-footer pt-6">
              <Footer />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider></PersonalProvider>
  );
}

