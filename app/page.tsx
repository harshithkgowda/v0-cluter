"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import FluxChat from "@/components/flux-chat"

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="h-[100dvh] w-screen overflow-hidden bg-black bg-radial-gradient">
          <FluxChat />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
