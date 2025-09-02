"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import FloorPlanToolbar from "@/components/floor-plan/FloorPlanToolbar";
import FloorPlanEditor from "@/components/floor-plan/FloorPlanEditor";
import ElementPropertiesPanel from "@/components/floor-plan/ElementPropertiesPanel";
import { FloorPlanElement, useFloorPlans } from "@/context/FloorPlanContext"; // Import useFloorPlans
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { showError, showSuccess } from "@/utils/toast";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCorners } from "@dnd-kit/core"; // NEW: Import DndContext and related hooks

const FloorPlanPage: React.FC = () => {
  const { currentFloorPlan, setCurrentFloorPlan, updateFloorPlan, deleteFloorPlan } = useFloorPlans(); // Use context
  const [elements, setElements] = useState<FloorPlanElement[]>([]); // Manage elements here
  const [selectedElement, setSelectedElement] = useState<FloorPlanElement | null>(null);

  // NEW: Initialize Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Sync elements from context when currentFloorPlan changes
  useEffect(() => {
    if (currentFloorPlan) {
      setElements(currentFloorPlan.layoutData);
    } else {
      setElements([]); // Clear elements if no plan is selected
    }
    setSelectedElement(null); // Clear selection when plan changes
  }, [currentFloorPlan]);

  const handleElementSelect = useCallback((element: FloorPlanElement | null) => {
    setSelectedElement(element);
  }, []);

  const handleUpdateElement = useCallback((updatedElement: FloorPlanElement) => {
    setElements(prev => prev.map(el => el.id === updatedElement.id ? updatedElement : el));
    setSelectedElement(updatedElement); // Keep selected element updated
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null); // Clear selection after deletion
    showSuccess("Element deleted.");
  }, []);

  // NEW: Centralized handleDragEnd for DndContext
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    if (!over || over.id !== 'floor-plan-canvas') {
      // If dropped outside canvas, or not on a droppable area, do nothing
      return;
    }

    // Get the bounding rectangle of the droppable canvas
    const canvasRect = over.rect.current;
    if (!canvasRect) {
      console.error("Canvas rect not found for drag end calculation.");
      return;
    }

    if (active.data.current?.type === 'newElement') {
      // Calculate position relative to the droppable canvas
      const newElementX = (active.rect.current.translated?.left || 0) - (canvasRect.left || 0);
      const newElementY = (active.rect.current.translated?.top || 0) - (canvasRect.top || 0);

      const elementType = active.data.current.elementType as FloorPlanElement['type'];
      const label = active.data.current.label as string;
      const color = active.data.current.color as string;

      const newElement: FloorPlanElement = {
        id: nanoid(),
        type: elementType,
        name: label,
        x: newElementX,
        y: newElementY,
        width: 100,
        height: 100,
        color: color,
      };
      setElements((prev) => [...prev, newElement]);
      handleElementSelect(newElement); // Select the newly added element
    } else if (active.data.current?.type === 'existingElement') {
      // Move existing element
      setElements((prev) =>
        prev.map((el) =>
          el.id === active.id
            ? { ...el, x: el.x + delta.x, y: el.y + delta.y }
            : el
        )
      );
      // Update selected element's position if it was the one moved
      if (selectedElement?.id === active.id) {
        setSelectedElement({ ...selectedElement, x: selectedElement.x + delta.x, y: selectedElement.y + delta.y });
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold mb-6">Warehouse Floor Plan Designer</h1>
      <p className="text-muted-foreground mb-6">
        Design and manage your warehouse layouts. Drag elements from the left, then select them to edit properties on the right.
      </p>

      {/* NEW: DndContext wraps the entire ResizablePanelGroup */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={() => {}} collisionDetection={closestCorners}>
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-grow rounded-lg border"
        >
          <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
            <div className="flex h-full flex-col p-4">
              <FloorPlanToolbar />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="flex h-full flex-col p-4">
              <FloorPlanEditor
                elements={elements} // Pass elements state
                setElements={setElements} // Pass setter for elements
                onElementSelect={handleElementSelect}
                selectedElement={selectedElement}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="flex h-full flex-col p-4">
              <ElementPropertiesPanel
                selectedElement={selectedElement}
                onUpdateElement={handleUpdateElement} // Use the new handler
                onDeleteElement={handleDeleteElement} // Use the new handler
                onClose={() => setSelectedElement(null)}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DndContext>
    </div>
  );
};

export default FloorPlanPage;