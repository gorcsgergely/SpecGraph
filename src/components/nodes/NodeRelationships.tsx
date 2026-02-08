"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { NODE_TYPE_COLORS, type NodeType, RelationshipType } from "@/lib/types/graph";

interface Rel {
  id: string;
  type: string;
  source_id: string;
  target_id: string;
  source_name: string;
  target_name: string;
  source_type: string;
  target_type: string;
  notes?: string;
  access_type?: string;
}

interface NodeRelationshipsProps {
  nodeId: string;
  relationships: Rel[];
  onRefresh: () => void;
}

const REL_TYPES = RelationshipType.options;

export function NodeRelationships({
  nodeId,
  relationships,
  onRefresh,
}: NodeRelationshipsProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newRel, setNewRel] = useState({ type: "COMPOSES", targetId: "" });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newRel.targetId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/nodes/${nodeId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newRel.type,
          targetId: newRel.targetId,
        }),
      });
      if (response.ok) {
        setShowAdd(false);
        setNewRel({ type: "COMPOSES", targetId: "" });
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (relId: string) => {
    await fetch(`/api/relationships/${relId}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Relationships ({relationships.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        {showAdd && (
          <div className="flex items-end gap-2 mb-4 p-3 border rounded-md bg-muted/30">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium">Type</label>
              <Select
                value={newRel.type}
                onValueChange={(v) => setNewRel({ ...newRel, type: v })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium">Target Node ID</label>
              <Input
                className="h-8"
                placeholder="Paste target node ID"
                value={newRel.targetId}
                onChange={(e) => setNewRel({ ...newRel, targetId: e.target.value })}
              />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={loading}>
              Link
            </Button>
          </div>
        )}

        {relationships.length === 0 ? (
          <p className="text-sm text-muted-foreground">No relationships</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead>To</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relationships.map((rel) => (
                <TableRow key={rel.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {rel.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/graph/${rel.source_id}`}
                      className="flex items-center gap-1 hover:underline text-sm"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            NODE_TYPE_COLORS[rel.source_type as NodeType] || "#6b7280",
                        }}
                      />
                      {rel.source_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/graph/${rel.target_id}`}
                      className="flex items-center gap-1 hover:underline text-sm"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            NODE_TYPE_COLORS[rel.target_type as NodeType] || "#6b7280",
                        }}
                      />
                      {rel.target_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rel.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
