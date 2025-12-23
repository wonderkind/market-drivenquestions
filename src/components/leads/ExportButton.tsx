import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  onExport: () => void;
  disabled: boolean;
  count: number;
}

export function ExportButton({ onExport, disabled, count }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onExport}
      disabled={disabled}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export CSV {count > 0 && `(${count})`}
    </Button>
  );
}
