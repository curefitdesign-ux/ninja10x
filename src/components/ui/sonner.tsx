import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      style={{ zIndex: 99999 }}
      offset={60}
      toastOptions={{
        style: {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          padding: '14px 18px',
        },
        classNames: {
          toast: "group toast",
          description: "text-white/60 text-sm",
          actionButton: "bg-white/20 text-white border border-white/20",
          cancelButton: "bg-white/10 text-white/70",
          success: "",
          error: "",
          info: "",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
