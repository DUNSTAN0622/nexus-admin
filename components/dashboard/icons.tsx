import type { SVGProps } from "react";

export type DashboardIconName =
  | "analytics"
  | "customers"
  | "dashboard"
  | "materials"
  | "production"
  | "users";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 21V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V21" />
      <path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
      <path d="M8 10h.01" />
      <path d="M8 13h.01" />
      <path d="M12 10h.01" />
      <path d="M12 13h.01" />
      <path d="M16 10h.01" />
      <path d="M16 13h.01" />
    </BaseIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </BaseIcon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </BaseIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </BaseIcon>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2h8A1.5 1.5 0 0 1 20.5 9.5v7A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="M3.5 10.5h17" />
    </BaseIcon>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M21 12a9 9 0 1 1-9-9" />
    </BaseIcon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7 7 20a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7" />
      <path d="M9 7V4.8a.8.8 0 0 1 .8-.8h4.4a.8.8 0 0 1 .8.8V7" />
    </BaseIcon>
  );
}

export function DashboardNavIcon({
  name,
  ...props
}: IconProps & {
  name: DashboardIconName;
}) {
  if (name === "dashboard") {
    return (
      <BaseIcon {...props}>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="4" rx="1.5" />
        <rect x="13" y="11" width="7" height="9" rx="1.5" />
        <rect x="4" y="14" width="7" height="6" rx="1.5" />
      </BaseIcon>
    );
  }

  if (name === "analytics") {
    return (
      <BaseIcon {...props}>
        <path d="M4 19h16" />
        <path d="M7 15.5 10.5 12l3 2 4.5-6" />
        <path d="M17 8h1.5V9.5" />
      </BaseIcon>
    );
  }

  if (name === "production") {
    return (
      <BaseIcon {...props}>
        <path d="M4 20h16" />
        <path d="M5 20v-6l4-2 3 2 3-5 4 2v9" />
        <path d="M10 9V5h3v4" />
      </BaseIcon>
    );
  }

  if (name === "customers") {
    return (
      <BaseIcon {...props}>
        <path d="M16 20a4 4 0 0 0-8 0" />
        <circle cx="12" cy="8" r="3" />
        <path d="M20 19a3 3 0 0 0-2.3-2.9" />
        <path d="M4 19a3 3 0 0 1 2.3-2.9" />
      </BaseIcon>
    );
  }

  if (name === "materials") {
    return (
      <BaseIcon {...props}>
        <path d="m4 8 8-4 8 4-8 4-8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 16 8 4 8-4" />
      </BaseIcon>
    );
  }

  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </BaseIcon>
  );
}
