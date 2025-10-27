"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  // Disable automatic update notifications
  const toasterProps: ToasterProps = {
    ...props,
    // Disable the built-in update notification
    // This prevents any automatic "new version available" toasts
    toastOptions: {
      ...props.toastOptions,
      // You can customize toast options here if needed
    }
  };

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...toasterProps}
    />
  );
};

export { Toaster };