"use client";

import { SpinnerIcon } from "@/components/dashboard/icons";

type LoadingSpinnerProps = {
  className?: string;
};

export default function LoadingSpinner({
  className = "size-4",
}: LoadingSpinnerProps) {
  return <SpinnerIcon className={`${className} animate-spin`} />;
}
