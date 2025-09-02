"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Box, LayoutGrid, Table, Desk, PlusCircle } from "lucide-react";
import { FloorPlanElement } from "@/context/FloorPlanContext";

interface FloorPlanToolbarProps {
  onAddCustomElement: () => void;
}

interface DraggableShapeProps {
  id: string;
  type: FloorPlanElement['type'];
  label: string;
  icon: React.ElementType;
  color: string;
}

const DraggableShape: React.FC<DraggableShapeProps> = ({ id, type, label, icon: Icon, color }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-new-${id}`,
    data: { type: 'newElement', elementType: type, label, color },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center justify-center p-2 border border-border rounded-md cursor-grab",
        "bg-card hover:bg-muted/20 transition-colors text-foreground",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <Icon className="h-6 w-6 mb-1" style={{ color }} />
      <span className="text-xs font-medium text-center">{label}</span>
    </div>
  );
};

const FloorPlanToolbar: React.FC<FloorPlanToolbarProps> = ({ onAddCustomElement }) => {
  return (
    <Card className="h-full bg-card border-border shadow-sm flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Elements</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 grid grid-cols-2 gap-3 content-start">
        <DraggableShape id="shelf" type="shelf" label="Shelf" icon={Box} color="#2196F3" />
        <DraggableShape id="aisle" type="aisle" label="Aisle" icon={LayoutGrid} color="#4CAF50" />
        <DraggableShape id="bin" type="bin" label="Bin" icon={Table} color="#FF9800" />
        <DraggableShape id="desk" type="desk" label="Desk" icon={Desk} color="#9C27B0" />
        
        <Button onClick={onAddCustomElement} className="col-span-2 flex items-center justify-center gap-2">
          <PlusCircle className="h-4 w-4" /> Add Custom Shape
        </Button>
      </CardContent>
    </Card>
  );
};

export default FloorPlanToolbar;