import { Alert as ShadcnAlert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle, Info, X } from "lucide-react";

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

const iconMap = {
  success: <CheckCircle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  warning: <AlertCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />
};

const variantMap = {
  success: "default",
  error: "destructive",
  warning: "default",
  info: "default"
};

export default function Alert({ type = 'info', message, onClose, className = '' }: AlertProps) {
  const variant = variantMap[type];

  return (
    <ShadcnAlert
      variant={variant as any}
      className={`relative ${className} ${
        type === 'success' ? 'border-green-200 bg-green-50' :
        type === 'warning' ? 'border-amber-200 bg-amber-50' :
        type === 'info' ? 'border-blue-200 bg-blue-50' :
        ''
      }`}
    >
      <div className="flex items-center gap-2">
        {iconMap[type]}
        <AlertDescription className="flex-1">
          {message}
        </AlertDescription>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </ShadcnAlert>
  );
}