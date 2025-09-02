"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { FloorPlanElement } from "@/context/FloorPlanContext";
import { Box, LayoutGrid, Table, Desk } from "lucide-react";

interface DraggableFloorPlanElementProps {
  element: FloorPlanElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const iconMap = {
  shelf: Box,
  aisle: LayoutGrid,
  bin: Table,
  desk: Desk,
  custom: Box, // Default icon for custom
};

const DraggableFloorPlanElement: React.FC<DraggableFloorPlanElementProps> = ({ element, isSelected, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.id,
    data: { type: 'existingElement', elementId: element.id },
  });

  const style = {
    transform: CSS.Transform.translate3d(transform?.x || 0, transform?.y || 0, 0),
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    backgroundColor: element.color,
    zIndex: isDragging ? 50 : (isSelected ? 40 : 30),
  };

  const Icon = iconMap[element.type] || iconMap.custom;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute flex flex-col items-center justify-center p-1 rounded-md shadow-md text-white text-xs font-semibold cursor-grab",
        "border-2 transition-all duration-100 ease-out",
        isSelected ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-muted-foreground/50",
        isDragging && "opacity-70"
      )}
      onClick={() => onSelect(element.id)}
    >
      <Icon className="h-4 w-4 mb-1" />
      <span className="truncate max-w-full px-1">{element.name}</span>
    </div>
  );
};

export default DraggableFloorPlanElement;