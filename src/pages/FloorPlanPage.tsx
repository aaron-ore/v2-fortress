"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import FloorPlanToolbar from "@/components/floor-plan/FloorPlanToolbar";
import FloorPlanEditor from "@/components/floor-plan/FloorPlanEditor";
import ElementPropertiesPanel from "@/components/floor-plan/ElementPropertiesPanel";
import { FloorPlanElement } from "@/context/FloorPlanContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { showError } from "@/utils/toast";

const FloorPlanPage: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<FloorPlanElement | null>(null);

  const handleElementSelect = useCallback((element: FloorPlanElement | null) => {
    setSelectedElement(element);
  }, []);

  const handleUpdateSelectedElement = useCallback((updatedElement: FloorPlanElement) => {
    setSelectedElement(updatedElement);
  }, []);

  const handleDeleteSelectedElement = useCallback((id: string) => {
    setSelectedElement(null);
  }, []);

  const handleAddCustomElement = () => {
    // This function is called from the toolbar to add a generic custom element
    // The actual addition to the canvas happens in FloorPlanEditor's onDragEnd
    // For now, this can just be a placeholder or trigger a specific drag action
    showError("Drag a shape from the toolbar to add it to the canvas. Custom shape creation is a future enhancement.");
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold mb-6">Warehouse Floor Plan Designer</h1>
      <p className="text-muted-foreground mb-6">
        Design and manage your warehouse layouts. Drag elements from the left, then select them to edit properties on the right.
      </p>

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-grow rounded-lg border"
      >
        <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
          <div className="flex h-full flex-col p-4">
            <FloorPlanToolbar onAddCustomElement={handleAddCustomElement} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="flex h-full flex-col p-4">
            <FloorPlanEditor
              onElementSelect={handleElementSelect}
              selectedElement={selectedElement}
              onUpdateSelectedElement={handleUpdateSelectedElement}
              onDeleteSelectedElement={handleDeleteSelectedElement}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="flex h-full flex-col p-4">
            <ElementPropertiesPanel
              selectedElement={selectedElement}
              onUpdateElement={handleUpdateSelectedElement}
              onDeleteElement={onDeleteSelectedElement}
              onClose={() => setSelectedElement(null)}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default FloorPlanPage;