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

const FloorPlanPage: React.FC = () => {
  const { currentFloorPlan, setCurrentFloorPlan, updateFloorPlan, deleteFloorPlan } = useFloorPlans(); // Use context
  const [elements, setElements] = useState<FloorPlanElement[]>([]); // Manage elements here
  const [selectedElement, setSelectedElement] = useState<FloorPlanElement | null>(null);

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

  const handleAddCustomElement = () => {
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
    </div>
  );
};

export default FloorPlanPage;