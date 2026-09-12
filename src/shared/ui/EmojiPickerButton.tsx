'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface EmojiPickerButtonProps {
  value: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
}

export default function EmojiPickerButton({
  value,
  onChange,
  placeholder = '📦',
}: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

  const isDark =
    theme === 'dark' ||
    theme === 'admin-dark';

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 text-xl h-10 w-10"
        onClick={() => setOpen(true)}
        title="Pick an icon"
      >
        {value || placeholder}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 w-auto max-w-none border-0 bg-transparent shadow-none">
          <DialogTitle className="sr-only">Pick an icon</DialogTitle>
          <EmojiPicker
            theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            onEmojiClick={(emojiData) => {
              onChange(emojiData.emoji);
              setOpen(false);
            }}
            width={350}
            height={400}
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
