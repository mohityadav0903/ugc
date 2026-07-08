'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useEffect, useState, type ReactNode } from 'react';

interface ToolStepAccordionProps {
  title: string;
  icon: ReactNode;
  summary?: string;
  isLoading: boolean;
  children: ReactNode;
  className?: string;
}

const ITEM_VALUE = 'step';

export function ToolStepAccordion({
  title,
  icon,
  summary,
  isLoading,
  children,
  className,
}: ToolStepAccordionProps) {
  const [userOpen, setUserOpen] = useState(false);
  const open = isLoading || userOpen;

  useEffect(() => {
    if (!isLoading) {
      setUserOpen(false);
    }
  }, [isLoading]);

  return (
    <Accordion
      className={cn('w-full max-w-md', className)}
      value={open ? [ITEM_VALUE] : []}
      onValueChange={(value) => {
        if (!isLoading) {
          setUserOpen(value.includes(ITEM_VALUE));
        }
      }}
    >
      <AccordionItem
        value={ITEM_VALUE}
        className="overflow-hidden rounded-lg border border-border bg-muted/20 px-3"
      >
        <AccordionTrigger className="py-2.5 hover:no-underline" disabled={isLoading}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isLoading ? <Spinner className="size-4 shrink-0" /> : icon}
            <span className="truncate font-medium">{title}</span>
            {!open && summary ? (
              <span className="ml-auto truncate pr-1 text-muted-foreground text-xs">{summary}</span>
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-xs">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
