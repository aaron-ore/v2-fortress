"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { DndContext, DragEndEvent, useDroppable, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { nanoid } from "nanoid"; // For unique IDs
import { FloorPlanElement, useFloorPlans } from "@/context/FloorPlanContext";
import DraggableFloorPlanElement from "./DraggableFloorPlanElement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Save, Trash2, LayoutGrid, Loader2, FolderOpen } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface FloorPlanEditorProps {
  initialFloorPlanId?: string;
  onElementSelect: (element: FloorPlanElement | null) => void;
  selectedElement: FloorPlanElement | null;
  onUpdateSelectedElement: (updatedElement: FloorPlanElement) => void;
  onDeleteSelectedElement: (id: string) => void;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  initialFloorPlanId,
  onElementSelect,
  selectedElement,
  onUpdateSelectedElement,
  onDeleteSelectedElement,
}) => {
  const {
    floorPlans,
    currentFloorPlan,
    isLoadingFloorPlans,
    fetchFloorPlans,
    fetchFloorPlanById,
    addFloorPlan,
    updateFloorPlan,
    deleteFloorPlan,
    setCurrentFloorPlan,
  } = useFloorPlans();

  const [elements, setElements] = useState<FloorPlanElement[]>([]);
  const [floorPlanName, setFloorPlanName] = useState("New Floor Plan");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [floorPlanToDelete, setFloorPlanToDelete] = useState<FloorPlan | null>(null);
  const [isNewFloorPlanDialogOpen, setIsNewFloorPlanDialogOpen] = useState(false);
  const [newFloorPlanName, setNewFloorPlanName] = useState("");

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: 'floor-plan-canvas',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Load initial floor plan or reset
  useEffect(() => {
    if (initialFloorPlanId && !isLoadingFloorPlans && floorPlans.length > 0) {
      const plan = floorPlans.find(fp => fp.id === initialFloorPlanId);
      if (plan) {
        setCurrentFloorPlan(plan);
        setElements(plan.layoutData);
        setFloorPlanName(plan.name);
      } else {
        showError("Initial floor plan not found.");
        setCurrentFloorPlan(null);
        setElements([]);
        setFloorPlanName("New Floor Plan");
      }
    } else if (!initialFloorPlanId && !isLoadingFloorPlans && !currentFloorPlan) {
      // If no initial ID and no current plan, start fresh
      setElements([]);
      setFloorPlanName("New Floor Plan");
      setCurrentFloorPlan(null);
    }
  }, [initialFloorPlanId, isLoadingFloorPlans, floorPlans, setCurrentFloorPlan]);

  // Update local elements state if currentFloorPlan changes externally
  useEffect(() => {
    if (currentFloorPlan) {
      setElements(currentFloorPlan.layoutData);
      setFloorPlanName(currentFloorPlan.name);
    } else {
      setElements([]);
      setFloorPlanName("New Floor Plan");
    }
  }, [currentFloorPlan]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    if (!over || over.id !== 'floor-plan-canvas') {
      // If dropped outside canvas, or not on a droppable area, do nothing
      return;
    }

    if (active.data.current?.type === 'newElement') {
      // Add new element to canvas
      const elementType = active.data.current.elementType as FloorPlanElement['type'];
      const label = active.data.current.label as string;
      const color = active.data.current.color as string;

      const newElement: FloorPlanElement = {
        id: nanoid(),
        type: elementType,
        name: label,
        x: active.rect.current.translated?.left || 0,
        y: active.rect.current.translated?.top || 0,
        width: 100,
        height: 100,
        color: color,
      };
      setElements((prev) => [...prev, newElement]);
      onElementSelect(newElement); // Select the newly added element
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
        onUpdateSelectedElement({ ...selectedElement, x: selectedElement.x + delta.x, y: selectedElement.y + delta.y });
      }
    }
  };

  const handleSaveFloorPlan = async () => {
    setIsSaving(true);
    try {
      if (currentFloorPlan) {
        await updateFloorPlan(currentFloorPlan.id, floorPlanName, elements);
      } else {
        const newPlan = await addFloorPlan(floorPlanName, elements);
        if (newPlan) {
          setCurrentFloorPlan(newPlan);
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadFloorPlan = async (id: string) => {
    const plan = floorPlans.find(fp => fp.id === id);
    if (plan) {
      setCurrentFloorPlan(plan);
      setElements(plan.layoutData);
      setFloorPlanName(plan.name);
      onElementSelect(null); // Deselect any element when loading a new plan
      showSuccess(`Floor plan "${plan.name}" loaded.`);
    } else {
      showError("Selected floor plan not found.");
    }
  };

  const handleNewFloorPlan = () => {
    setIsNewFloorPlanDialogOpen(true);
  };

  const confirmCreateNewFloorPlan = async () => {
    if (!newFloorPlanName.trim()) {
      showError("Floor plan name cannot be empty.");
      return;
    }
    const newPlan = await addFloorPlan(newFloorPlanName.trim(), []);
    if (newPlan) {
      setCurrentFloorPlan(newPlan);
      setElements([]);
      setFloorPlanName(newPlan.name);
      onElementSelect(null);
      setNewFloorPlanName("");
      setIsNewFloorPlanDialogOpen(false);
    }
  };

  const handleDeleteFloorPlanClick = (floorPlan: FloorPlan) => {
    setFloorPlanToDelete(floorPlan);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteFloorPlan = async () => {
    if (floorPlanToDelete) {
      await deleteFloorPlan(floorPlanToDelete.id);
      setFloorPlanToDelete(null);
      setIsConfirmDeleteDialogOpen(false);
      // If the deleted plan was the current one, clear current
      if (currentFloorPlan?.id === floorPlanToDelete.id) {
        setCurrentFloorPlan(null);
        setElements([]);
        setFloorPlanName("New Floor Plan");
        onElementSelect(null);
      }
    }
  };

  // Handle updates from properties panel
  const handleUpdateElementFromPanel = useCallback((updatedElement: FloorPlanElement) => {
    setElements(prev => prev.map(el => el.id === updatedElement.id ? updatedElement : el));
    onUpdateSelectedElement(updatedElement); // Also update the selected element in parent state
  }, [onUpdateSelectedElement]);

  // Handle delete from properties panel
  const handleDeleteElementFromPanel = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    onDeleteSelectedElement(id); // Also clear selected element in parent state
    showSuccess("Element deleted.");
  }, [onDeleteSelectedElement]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        <Card className="mb-4 bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" /> Floor Plan:
              <Input
                value={floorPlanName}
                onChange={(e) => setFloorPlanName(e.target.value)}
                onBlur={handleSaveFloorPlan}
                className="ml-2 text-xl font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button onClick={handleNewFloorPlan} variant="outline" size="sm">
              <PlusCircle className="h-4 w-4 mr-2" /> New Plan
            </Button>
            <Select value={currentFloorPlan?.id || ""} onValueChange={handleLoadFloorPlan} disabled={isLoadingFloorPlans || floorPlans.length === 0}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Load Existing Plan" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingFloorPlans ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : floorPlans.length === 0 ? (
                  <SelectItem value="no-plans" disabled>No saved plans</SelectItem>
                ) : (
                  floorPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button onClick={handleSaveFloorPlan} disabled={isSaving || !currentFloorPlan} size="sm">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Plan
            </Button>
            {currentFloorPlan && (
              <Button variant="destructive" onClick={() => handleDeleteFloorPlanClick(currentFloorPlan)} size="sm">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Plan
              </Button>
            )}
          </CardContent>
        </Card>

        <div
          ref={setDroppableNodeRef}
          className="relative flex-grow border-2 border-dashed border-muted-foreground/50 rounded-lg bg-muted/10 overflow-hidden"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          {elements.map((element) => (
            <DraggableFloorPlanElement
              key={element.id}
              element={element}
              isSelected={selectedElement?.id === element.id}
              onSelect={onElementSelect}
            />
          ))}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-lg">
              Drag elements from the left toolbar here to start building your floor plan.
            </div>
          )}
        </div>
      </div>

      {/* New Floor Plan Dialog */}
      <ConfirmDialog
        isOpen={isNewFloorPlanDialogOpen}
        onClose={() => setIsNewFloorPlanDialogOpen(false)}
        onConfirm={confirmCreateNewFloorPlan}
        title="Create New Floor Plan"
        description={
          <div className="space-y-4">
            <p>Enter a name for your new floor plan. This will clear the current canvas.</p>
            <div className="space-y-2">
              <Label htmlFor="new-plan-name">Floor Plan Name</Label>
              <Input
                id="new-plan-name"
                value={newFloorPlanName}
                onChange={(e) => setNewFloorPlanName(e.target.value)}
                placeholder="e.g., Main Warehouse Layout"
              />
            </div>
          </div>
        }
        confirmText="Create"
        cancelText="Cancel"
      />

      {/* Confirm Delete Floor Plan Dialog */}
      {floorPlanToDelete && (
        <ConfirmDialog
          isOpen={isConfirmDeleteDialogOpen}
          onClose={() => setIsConfirmDeleteDialogOpen(false)}
          onConfirm={confirmDeleteFloorPlan}
          title="Confirm Delete Floor Plan"
          description={`Are you sure you want to delete the floor plan "${floorPlanToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </DndContext>
  );
};

export default FloorPlanEditor;