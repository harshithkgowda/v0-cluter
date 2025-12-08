"use client"

import * as React from "react"
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
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Plus, History, Trash2, Bot, ArrowRight } from 'lucide-react'

type ChatItem = {
  id: string
  title: string
  ts: number
}

function getChats(): ChatItem[] {
  try {
    return JSON.parse(localStorage.getItem("flux:chats") || "[]")
  } catch {
    return []
  }
}

function setChats(items: ChatItem[]) {
  localStorage.setItem("flux:chats", JSON.stringify(items.slice(0, 100)))
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { setOpen, isMobile, state } = useSidebar()
  const [chats, setLocal] = React.useState<ChatItem[]>([])

  React.useEffect(() => {
    setLocal(getChats())
    const handler = () => setLocal(getChats())
    window.addEventListener("flux:chats-updated", handler)
    return () => window.removeEventListener("flux:chats-updated", handler)
  }, [])

  const handleNewChat = () => {
    window.location.reload()
  }

  const handleClear = () => {
    setChats([])
    setLocal([])
    window.dispatchEvent(new Event("flux:chats-updated"))
  }

  const openChat = (id: string) => {
    window.location.reload()
  }

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden" // prevent label from overlapping when collapsed
      onMouseEnter={() => !isMobile && setOpen(true)}
      onMouseLeave={() => !isMobile && setOpen(false)}
      {...props}
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Bot className="h-5 w-5" />
          {state === "expanded" && <span className="text-sm font-medium">Cluter AI</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNewChat}>
                  <Plus className="mr-2" />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Previous Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton aria-disabled>
                    <History className="mr-2" />
                    <span>No chats yet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                chats.map((c) => (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton onClick={() => openChat(c.id)} title={c.title}>
                      <History className="mr-2" />
                      <span className="truncate">{c.title}</span>
                      <ArrowRight className="ml-auto opacity-70" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleClear}>
              <Trash2 className="mr-2" />
              <span>Clear history</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#" onClick={(e) => e.preventDefault()}>
                <SidebarTrigger className="mr-2" />
                <span>Toggle</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
