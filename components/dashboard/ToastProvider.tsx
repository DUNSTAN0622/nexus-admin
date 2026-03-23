"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      closeButton
      richColors
      position="top-right"
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            "border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl shadow-slate-950/40",
          title: "text-sm font-semibold",
          description: "text-sm text-slate-300",
          closeButton:
            "border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white",
        },
      }}
    />
  );
}
