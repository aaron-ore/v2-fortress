"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { useProfile } from "./ProfileContext";

export interface FloorPlanElement {
  id: string; // Unique ID for the element on the canvas
  type: 'shelf' | 'aisle' | 'desk' | 'bin' | 'custom'; // Predefined types
  name: string; // User-defined name
  x: number; // Position X (relative to canvas)
  y: number; // Position Y (relative to canvas)
  width: number;
  height: number;
  color: string; // Background color
  rotation?: number; // Optional: for future rotation
}

export interface FloorPlan {
  id: string;
  name: string;
  layoutData: FloorPlanElement[]; // Array of elements
  organizationId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface FloorPlanContextType {
  floorPlans: FloorPlan[];
  currentFloorPlan: FloorPlan | null;
  isLoadingFloorPlans: boolean;
  fetchFloorPlans: () => Promise<void>;
  fetchFloorPlanById: (id: string) => Promise<FloorPlan | null>;
  addFloorPlan: (name: string, layoutData: FloorPlanElement[]) => Promise<FloorPlan | null>;
  updateFloorPlan: (id: string, name: string, layoutData: FloorPlanElement[]) => Promise<FloorPlan | null>;
  deleteFloorPlan: (id: string) => Promise<void>;
  setCurrentFloorPlan: (floorPlan: FloorPlan | null) => void;
}

const FloorPlanContext = createContext<FloorPlanContextType | undefined>(undefined);

export const FloorPlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [currentFloorPlan, setCurrentFloorPlanState] = useState<FloorPlan | null>(null);
  const [isLoadingFloorPlans, setIsLoadingFloorPlans] = useState(true);
  const { profile, isLoadingProfile } = useProfile();

  const mapSupabaseFloorPlanToFloorPlan = (data: any): FloorPlan => ({
    id: data.id,
    name: data.name,
    layoutData: data.layout_data || [],
    organizationId: data.organization_id,
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });

  const fetchFloorPlans = useCallback(async () => {
    setIsLoadingFloorPlans(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !profile?.organizationId) {
      setFloorPlans([]);
      setIsLoadingFloorPlans(false);
      return;
    }

    const { data, error } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('organization_id', profile.organizationId)
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching floor plans:", error);
      showError("Failed to load floor plans.");
      setFloorPlans([]);
    } else {
      setFloorPlans(data.map(mapSupabaseFloorPlanToFloorPlan));
    }
    setIsLoadingFloorPlans(false);
  }, [profile?.organizationId]);

  const fetchFloorPlanById = useCallback(async (id: string): Promise<FloorPlan | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in to fetch floor plans.");
      return null;
    }

    const { data, error } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('id', id)
      .eq('organization_id', profile.organizationId)
      .single();

    if (error) {
      console.error(`Error fetching floor plan ${id}:`, error);
      showError(`Failed to load floor plan: ${error.message}`);
      return null;
    }
    return mapSupabaseFloorPlanToFloorPlan(data);
  }, [profile?.organizationId]);

  const addFloorPlan = async (name: string, layoutData: FloorPlanElement[]): Promise<FloorPlan | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in to create floor plans.");
      return null;
    }

    const { data, error } = await supabase
      .from('floor_plans')
      .insert({
        name,
        layout_data: layoutData,
        organization_id: profile.organizationId,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding floor plan:", error);
      showError(`Failed to add floor plan: ${error.message}`);
      return null;
    }
    const newFloorPlan = mapSupabaseFloorPlanToFloorPlan(data);
    setFloorPlans(prev => [...prev, newFloorPlan]);
    showSuccess(`Floor plan "${name}" created successfully!`);
    return newFloorPlan;
  };

  const updateFloorPlan = async (id: string, name: string, layoutData: FloorPlanElement[]): Promise<FloorPlan | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in to update floor plans.");
      return null;
    }

    const { data, error } = await supabase
      .from('floor_plans')
      .update({
        name,
        layout_data: layoutData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', profile.organizationId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating floor plan ${id}:`, error);
      showError(`Failed to update floor plan: ${error.message}`);
      return null;
    }
    const updatedFloorPlan = mapSupabaseFloorPlanToFloorPlan(data);
    setFloorPlans(prev => prev.map(fp => fp.id === id ? updatedFloorPlan : fp));
    if (currentFloorPlan?.id === id) {
      setCurrentFloorPlanState(updatedFloorPlan);
    }
    showSuccess(`Floor plan "${name}" updated successfully!`);
    return updatedFloorPlan;
  };

  const deleteFloorPlan = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in to delete floor plans.");
      return;
    }

    const { error } = await supabase
      .from('floor_plans')
      .delete()
      .eq('id', id)
      .eq('organization_id', profile.organizationId);

    if (error) {
      console.error(`Error deleting floor plan ${id}:`, error);
      showError(`Failed to delete floor plan: ${error.message}`);
    } else {
      setFloorPlans(prev => prev.filter(fp => fp.id !== id));
      if (currentFloorPlan?.id === id) {
        setCurrentFloorPlanState(null);
      }
      showSuccess("Floor plan deleted successfully!");
    }
  };

  const setCurrentFloorPlan = (floorPlan: FloorPlan | null) => {
    setCurrentFloorPlanState(floorPlan);
  };

  useEffect(() => {
    if (!isLoadingProfile) {
      fetchFloorPlans();
    }
  }, [fetchFloorPlans, isLoadingProfile]);

  return (
    <FloorPlanContext.Provider
      value={{
        floorPlans,
        currentFloorPlan,
        isLoadingFloorPlans,
        fetchFloorPlans,
        fetchFloorPlanById,
        addFloorPlan,
        updateFloorPlan,
        deleteFloorPlan,
        setCurrentFloorPlan,
      }}
    >
      {children}
    </FloorPlanContext.Provider>
  );
};

export const useFloorPlans = () => {
  const context = useContext(FloorPlanContext);
  if (context === undefined) {
    throw new Error("useFloorPlans must be used within a FloorPlanProvider");
  }
  return context;
};