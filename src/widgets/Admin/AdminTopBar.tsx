'use client';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminBranchSwitcher } from '@/widgets/Admin/AdminBranchSwitcher';
import AdminNotifications from '@/widgets/Admin/AdminNotifications';

interface AdminTopBarProps {
  onOpenMenu: () => void;
  showMenuButton: boolean;
}

export default function AdminTopBar({ onOpenMenu, showMenuButton }: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 lg:px-6 lg:hidden bg-background border-b border-border">
      {/* Left: hamburger */}
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMenu}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu size={20} />
          </Button>
        )}
      </div>

      {/* Right: branch switcher + notifications */}
      <div className="flex items-center gap-2">
        <AdminBranchSwitcher />
        <AdminNotifications />
      </div>
    </header>
  );
}
