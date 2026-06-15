'use client'
import { useEffect, useState } from 'react'

export type ToastMessage = {
  id: string
  text: string
  type: 'info' | 'success' | 'error'
}

export default function ToastContainer({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded shadow-lg text-white text-sm ${
            toast.type === 'info' ? 'bg-blue-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.text}
        </div>
      ))}
    </div>
  )
}