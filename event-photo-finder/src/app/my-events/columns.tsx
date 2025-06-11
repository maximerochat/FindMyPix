// In src/app/my-events/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Settings, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteEventButton } from '@/components/DeleteEventButton';
import { EventOut } from '@/api/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Define the columns as a function that accepts the delete handler
export const createColumns = (
  onDelete: (id: number) => void,
  deleteLoading: boolean = false,
  router: AppRouterInstance,
): ColumnDef<EventOut>[] => [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue('title')}</div>;
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      return (
        <div className="max-w-xs truncate">
          {description || (
            <em className="text-muted-foreground">No description</em>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return <div className="font-medium">{format(date, 'PPP')}</div>;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const event = row.original;

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/events/${event.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/manage/${event.id}`)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <DeleteEventButton
            onConfirm={() => onDelete(event.id)}
            disabled={deleteLoading}
          />
        </div>
      );
    },
  },
];
