import React, { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext({ notify: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const notify = useCallback((type, text) => {
    const id = crypto.randomUUID()
    setToasts((items) => [...items, { id, type, text }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200)
  }, [])
  return <ToastContext.Provider value={{ notify }}>{children}<div className="fixed bottom-5 right-5 z-[100] w-[min(360px,calc(100vw-2.5rem))] space-y-3" aria-live="polite"><AnimatePresence>{toasts.map((toast) => <motion.div key={toast.id} initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} className={`rounded-2xl border bg-white p-4 shadow-xl ${toast.type === 'error' ? 'border-rose-200' : toast.type === 'warning' ? 'border-amber-200' : 'border-emerald-200'}`}><p className="text-sm font-semibold">{toast.text}</p></motion.div>)}</AnimatePresence></div></ToastContext.Provider>
}
export const useToast = () => useContext(ToastContext)
