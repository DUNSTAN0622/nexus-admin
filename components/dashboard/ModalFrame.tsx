"use client";

import { useId, type ReactNode } from "react";
import { CloseIcon } from "@/components/dashboard/icons";

type ModalFrameProps = {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  isBusy?: boolean;
  maxWidthClassName?: string;
};

export default function ModalFrame({
  title,
  description,
  children,
  onClose,
  isBusy = false,
  maxWidthClassName = "max-w-lg",
}: ModalFrameProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl ${maxWidthClassName}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id={titleId} className="text-lg font-semibold text-white">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-slate-400">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-full border border-slate-700 bg-slate-950/70 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="關閉視窗"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
