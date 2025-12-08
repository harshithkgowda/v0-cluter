export type ChatItem = {
  id: string
  title: string
  ts: number
}

export function getChats(): ChatItem[] {
  try {
    return JSON.parse(localStorage.getItem("flux:chats") || "[]")
  } catch {
    return []
  }
}

export function addChat(title: string) {
  const items = getChats()
  const id = crypto.randomUUID()
  const item = { id, title: title.slice(0, 120), ts: Date.now() }
  const next = [item, ...items].slice(0, 100)
  localStorage.setItem("flux:chats", JSON.stringify(next))
  window.dispatchEvent(new Event("flux:chats-updated"))
}
