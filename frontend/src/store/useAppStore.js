import { create } from 'zustand'
import {
  sampleDrafts, samplePrecedents, sampleOrders, sampleNotifications,
  users, currentUser,
} from '../data/mockData'

export const useAppStore = create((set, get) => ({
  user: currentUser,
  users,

  // Notifications
  notifications: sampleNotifications,
  unreadCount: () => get().notifications.filter(n => !n.read).length,
  markAllRead: () => set({ notifications: get().notifications.map(n => ({ ...n, read: true })) }),
  markRead: (id) => set({ notifications: get().notifications.map(n => n.id === id ? { ...n, read: true } : n) }),

  // Drafts
  drafts: sampleDrafts,
  getDraft: (id) => get().drafts.find(d => d.id === id),
  addDraft: (draft) => {
    const newDraft = {
      ...draft,
      id: `D-2024-${String(get().drafts.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      status: 'draft',
      owner: get().user,
      wordCount: draft.content ? draft.content.split(/\s+/).length : 0,
      changes: [{ id: `c-${Date.now()}`, action: 'Draft created', user: get().user, timestamp: new Date().toISOString() }],
      discussion: [],
      sources: draft.sources || [],
    }
    set({ drafts: [newDraft, ...get().drafts] })
    return newDraft
  },
  updateDraft: (id, updates) => set({
    drafts: get().drafts.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d),
  }),
  deleteDraft: (id) => set({ drafts: get().drafts.filter(d => d.id !== id) }),
  addDiscussionMessage: (draftId, message) => set({
    drafts: get().drafts.map(d => d.id === draftId ? {
      ...d,
      discussion: [...d.discussion, { ...message, id: `d-${Date.now()}`, timestamp: new Date().toISOString() }],
    } : d),
  }),

  // Precedents
  precedents: samplePrecedents,
  getPrecedent: (id) => get().precedents.find(p => p.id === id),

  // Orders
  orders: sampleOrders,
  getOrder: (id) => get().orders.find(o => o.id === id),
  addOrder: (order) => {
    const newOrder = {
      ...order,
      id: `ORDER-2024-${String(get().orders.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      owner: get().user,
      progress: 0,
      status: 'pending',
      attachments: order.attachments || [],
      watchers: order.watchers || [],
      timeline: [{ id: `t-${Date.now()}`, date: new Date().toISOString().slice(0, 10), title: 'Order created', description: 'Order created and tracking started', by: get().user, status: 'completed' }],
      activityLog: [{ id: `al-${Date.now()}`, timestamp: new Date().toISOString(), type: 'user', user: get().user, description: 'Order created' }],
    }
    set({ orders: [newOrder, ...get().orders] })
    return newOrder
  },
  updateOrder: (id, updates) => set({
    orders: get().orders.map(o => o.id === id ? { ...o, ...updates } : o),
  }),
  updateOrderAction: (orderId, actionId, updates) => set({
    orders: get().orders.map(o => o.id === orderId ? {
      ...o,
      actions: o.actions.map(a => a.id === actionId ? { ...a, ...updates } : a),
    } : o),
  }),

  // Research chat
  chatMessages: [],
  isResearching: false,
  addChatMessage: (msg) => set({ chatMessages: [...get().chatMessages, msg] }),
  setResearching: (val) => set({ isResearching: val }),
  clearChat: () => set({ chatMessages: [] }),

  // Saved research
  savedResearch: [],
  saveResearch: (item) => set({ savedResearch: [...get().savedResearch, { ...item, id: `r-${Date.now()}` }] }),
}))
