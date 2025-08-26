import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { useProfile } from "./ProfileContext"; // Import useProfile

interface Category {
  id: string;
  name: string;
  organizationId: string; // NEW: organization_id field
}

interface CategoryContextType {
  categories: Category[];
  addCategory: (name: string) => Promise<Category | null>; // Modified return type
  removeCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { profile, isLoadingProfile } = useProfile(); // Use profile context

  const fetchCategories = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) { // Ensure organizationId is available
      setCategories([]);
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, organization_id")
      .eq("organization_id", profile.organizationId) // Filter by organization_id
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      showError("Failed to load categories.");
    } else {
      const fetchedCategories: Category[] = data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        organizationId: cat.organization_id, // Map organization_id
      }));
      setCategories(fetchedCategories);
    }
  }, [profile?.organizationId]); // Depend on profile.organizationId

  useEffect(() => {
    if (!isLoadingProfile) { // Only fetch once profile is loaded
      fetchCategories();
    }
  }, [fetchCategories, isLoadingProfile]);

  const addCategory = async (name: string): Promise<Category | null> => { // Modified function signature
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to add categories.");
      return null;
    }

    const trimmedName = name.trim();
    // Check if category already exists locally (case-insensitive)
    const existingCategory = categories.find(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingCategory) {
      return existingCategory;
    }

    // Attempt to insert into Supabase
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: trimmedName, user_id: session.user.id, organization_id: profile.organizationId }) // Include organization_id
      .select();

    if (error) {
      // Handle potential unique constraint error if another user added it concurrently
      if (error.code === '23505') { // Unique violation error code
        console.warn(`Category "${trimmedName}" already exists in DB, likely added concurrently.`);
        // Try to fetch it to return the existing one
        const { data: existingDbCategory, error: fetchError } = await supabase
          .from("categories")
          .select("id, name, organization_id")
          .eq("name", trimmedName)
          .eq("organization_id", profile.organizationId) // Filter by organization_id
          .single();
        if (existingDbCategory) {
          setCategories((prev) => Array.from(new Set([...prev, existingDbCategory].map(c => JSON.stringify(c)))).map(s => JSON.parse(s)));
          return existingDbCategory as Category;
        }
      }
      console.error("Error adding category:", error);
      showError(`Failed to add category: ${error.message}`);
      return null;
    } else if (data && data.length > 0) {
      const newCategory: Category = {
        id: data[0].id,
        name: data[0].name,
        organizationId: data[0].organization_id, // Map organization_id
      };
      setCategories((prev) => [...prev, newCategory]);
      showSuccess(`Category "${trimmedName}" added.`);
      return newCategory;
    }
    return null;
  };

  const removeCategory = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to remove categories.");
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("organization_id", profile.organizationId); // Filter by organization_id for delete

    if (error) {
      console.error("Error removing category:", error);
      showError(`Failed to remove category: ${error.message}`);
    } else {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      showSuccess("Category removed.");
    }
  };

  const refreshCategories = async () => {
    await fetchCategories();
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, removeCategory, refreshCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return context;
};