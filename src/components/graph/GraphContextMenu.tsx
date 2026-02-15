"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface ContextMenuData {
  nodeId: string;
  nodeName: string;
  pinned: boolean;
  x: number;
  y: number;
}

interface GraphContextMenuProps {
  data: ContextMenuData | null;
  onClose: () => void;
  onTogglePin: (nodeId: string) => void;
}

export function GraphContextMenu({ data, onClose, onTogglePin }: GraphContextMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [data, onClose]);

  if (!data) return null;

  const items = [
    {
      label: "View Details",
      onClick: () => { router.push(`/graph/${data.nodeId}`); onClose(); },
    },
    {
      label: "Edit",
      onClick: () => { router.push(`/graph/${data.nodeId}/edit`); onClose(); },
    },
    {
      label: data.pinned ? "Unpin" : "Pin",
      onClick: () => { onTogglePin(data.nodeId); onClose(); },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute z-50 min-w-[140px] bg-popover border rounded-md shadow-lg py-1 text-sm"
      style={{ left: data.x, top: data.y }}
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
        {data.nodeName}
      </div>
      <div className="border-t my-1" />
      {items.map((item) => (
        <button
          key={item.label}
          className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
