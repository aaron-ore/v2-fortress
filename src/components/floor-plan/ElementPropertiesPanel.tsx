"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FloorPlanElement } from "@/context/FloorPlanContext";
import { HexColorPicker, RgbColorPicker } from "react-colorful"; // For color picker
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Paintbrush, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ElementPropertiesPanelProps {
  selectedElement: FloorPlanElement | null;
  onUpdateElement: (updatedElement: FloorPlanElement) => void;
  onDeleteElement: (id: string) => void;
  onClose: () => void;
}

const ElementPropertiesPanel: React.FC<ElementPropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [color, setColor] = useState("#aabbcc");

  useEffect(() => {
    if (selectedElement) {
      setName(selectedElement.name);
      setWidth(String(selectedElement.width));
      setHeight(String(selectedElement.height));
      setColor(selectedElement.color);
    }
  }, [selectedElement]);

  const handleSave = () => {
    if (!selectedElement) return;

    const updatedWidth = parseInt(width);
    const updatedHeight = parseInt(height);

    if (isNaN(updatedWidth) || updatedWidth <= 0) {
      alert("Width must be a positive number.");
      return;
    }
    if (isNaN(updatedHeight) || updatedHeight <= 0) {
      alert("Height must be a positive number.");
      return;
    }

    onUpdateElement({
      ...selectedElement,
      name: name.trim(),
      width: updatedWidth,
      height: updatedHeight,
      color: color,
    });
  };

  if (!selectedElement) {
    return (
      <Card className="h-full bg-card border-border shadow-sm flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Element Properties</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-4 flex items-center justify-center text-muted-foreground text-sm">
          Select an element on the canvas to edit its properties.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card border-border shadow-sm flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Properties: {selectedElement.name}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XCircle className="h-5 w-5 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="element-name">Name</Label>
          <Input
            id="element-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            placeholder="Element Name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="element-width">Width (px)</Label>
            <Input
              id="element-width"
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              onBlur={handleSave}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="element-height">Height (px)</Label>
            <Input
              id="element-height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              onBlur={handleSave}
              min="1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="element-color">Color</Label>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md border border-border" style={{ backgroundColor: color }}></div>
            <Input
              id="element-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              onBlur={handleSave}
              className="flex-grow"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Paintbrush className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <HexColorPicker color={color} onChange={setColor} />
                <div className="p-2">
                  <Button onClick={handleSave} size="sm" className="w-full">Apply Color</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button variant="destructive" onClick={() => onDeleteElement(selectedElement.id)} className="w-full mt-4">
          Delete Element
        </Button>
      </CardContent>
    </Card>
  );
};

export default ElementPropertiesPanel;