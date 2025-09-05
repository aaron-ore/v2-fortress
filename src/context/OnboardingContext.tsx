import React, { createContext, useState, useContext, ReactNode, useEffect } = "react";
import { showSuccess, showError } from "@/utils/toast";
import { useProfile } from "./ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { generateUniqueCode } from "@/utils/numberGenerator";
import { mockCompanyProfile } from "@/utils/mockData"; // Import mock data, but locations will be fetched from DB
import { parseLocationString } from "@/utils/locationParser"; // Import parseLocationString

export interface CompanyProfile {
  name: string;
  currency: string;
  address: string;
}

export interface Location {
  id: string;
  organizationId: string;
  fullLocationString: string; // e.g., "A-01-01-1-A"
  displayName?: string; // e.g., "Main Warehouse"
  area: string;
  row: string;
  bay: string;
  level: string;
  pos: string;
  color: string; // Hex code
  createdAt: string;
  userId: string;
}

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  companyProfile: CompanyProfile | null;
  locations: Location[]; // Changed to Location[]
  markOnboardingComplete: () => void;
  setCompanyProfile: (profile: CompanyProfile) => void;
  addLocation: (location: Omit<Location, "id" | "createdAt" | "userId" | "organizationId">) => Promise<void>; // Takes structured data
  updateLocation: (location: Omit<Location, "createdAt" | "userId" | "organizationId">) => Promise<void>; // Takes structured data
  removeLocation: (locationId: string) => Promise<void>; // Removes by ID
  fetchLocations: () => Promise<void>; // Added fetch function
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, isLoadingProfile, fetchProfile } = useProfile();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem("companyProfile");
      return storedProfile !== null && profile?.organizationId !== null;
    }
    return false;
  });

  const [companyProfile, setCompanyProfileState] = useState<CompanyProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem("companyProfile");
      return storedProfile ? JSON.parse(storedProfile) : mockCompanyProfile;
    }
    return null;
  });

  const [locations, setLocations] = useState<Location[]>([]); // Now stores Location objects

  // Effect to check onboarding status
  useEffect(() => {
    if (!isLoadingProfile) {
      const storedProfile = localStorage.getItem("companyProfile");
      const hasCompanyProfile = storedProfile !== null;
      const hasOrganizationId = profile?.organizationId !== null;

      setIsOnboardingComplete(hasCompanyProfile && hasOrganizationId);
    } else if (!isLoadingProfile && !profile) {
      setIsOnboardingComplete(false);
    }
  }, [profile, isLoadingProfile]);

  // Effect to persist company profile to local storage
  useEffect(() => {
    localStorage.setItem("companyProfile", JSON.stringify(companyProfile));
  }, [companyProfile]);

  // Helper to map Supabase data to Location interface
  const mapSupabaseLocationToLocation = (data: any): Location => ({
    id: data.id,
    organizationId: data.organization_id,
    fullLocationString: data.full_location_string,
    displayName: data.display_name || undefined,
    area: data.area,
    row: data.row,
    bay: data.bay,
    level: data.level,
    pos: data.pos,
    color: data.color,
    createdAt: data.created_at,
    userId: data.user_id,
  });

  // Fetch locations from Supabase
  const fetchLocations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      setLocations([]);
      return;
    }

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("organization_id", profile.organizationId)
      .order("full_location_string", { ascending: true });

    if (error) {
      console.error("Error fetching locations:", error);
      showError("Failed to load locations.");
      setLocations([]);
    } else {
      setLocations(data.map(mapSupabaseLocationToLocation));
    }
  };

  // Effect to fetch locations on profile load or change
  useEffect(() => {
    if (!isLoadingProfile && profile?.organizationId) {
      fetchLocations();
    } else if (!isLoadingProfile && !profile?.organizationId) {
      setLocations([]); // Clear locations if no organization
    }
  }, [isLoadingProfile, profile?.organizationId]);


  const markOnboardingComplete = () => {
    setIsOnboardingComplete(true);
    showSuccess("Onboarding complete! Welcome to Fortress.");
  };

  const setCompanyProfile = async (profileData: CompanyProfile) => {
    setCompanyProfileState(profileData);
    console.log("[OnboardingContext] setCompanyProfile called with profileData:", profileData);

    if (profile) {
      console.log("[OnboardingContext] Current profile:", profile);
      try {
        let organizationIdToUse = profile.organizationId;
        let uniqueCodeToUse = profile.organizationCode;

        if (!profile.organizationId) {
          console.log("[OnboardingContext] User has no organization_id. Creating new organization.");
          const newUniqueCode = generateUniqueCode();
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({ name: profileData.name, unique_code: newUniqueCode })
            .select()
            .single();

          if (orgError) throw orgError;

          organizationIdToUse = orgData.id;
          uniqueCodeToUse = newUniqueCode;
          console.log("[OnboardingContext] New organization created:", orgData);

          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ organization_id: organizationIdToUse, role: 'admin' })
            .eq('id', profile.id);

          if (profileUpdateError) throw profileUpdateError;
          console.log("[OnboardingContext] Profile updated with new organization_id and role.");

          showSuccess(`Organization "${profileData.name}" created and assigned! You are now an admin. Your unique company code is: ${uniqueCodeToUse}`);
        } else {
          console.log("[OnboardingContext] User already has organization_id:", profile.organizationId);
          const { data: existingOrg, error: fetchOrgError } = await supabase
            .from('organizations')
            .select('unique_code')
            .eq('id', profile.organizationId)
            .single();

          if (fetchOrgError && fetchOrgError.code !== 'PGRST116') {
            throw fetchOrgError;
          }
          console.log("[OnboardingContext] Existing organization fetched:", existingOrg);

          if (!existingOrg?.unique_code) {
            uniqueCodeToUse = generateUniqueCode();
            console.log(`[OnboardingContext] Generated missing unique_code: ${uniqueCodeToUse} for organization ${profile.organizationId}`);
          } else {
            uniqueCodeToUse = existingOrg.unique_code;
            console.log(`[OnboardingContext] Existing unique_code found: ${uniqueCodeToUse}`);
          }

          const { error: updateOrgError } = await supabase
            .from('organizations')
            .update({
              name: profileData.name,
              unique_code: uniqueCodeToUse,
              default_theme: profile.organizationTheme,
            })
            .eq('id', profile.organizationId);

          if (updateOrgError) throw updateOrgError;
          console.log("[OnboardingContext] Organization updated with name and unique_code:", { name: profileData.name, unique_code: uniqueCodeToUse });

          showSuccess(`Company profile for "${profileData.name}" updated successfully!`);
        }
        
        console.log("[OnboardingContext] Calling fetchProfile to refresh user data.");
        await fetchProfile();
        console.log("[OnboardingContext] fetchProfile completed after organization update.");

      } catch (error: any) {
        console.error("[OnboardingContext] Error during organization setup/update:", error);
        showError(`Failed to set up/update organization: ${error.message}`);
      }
    } else {
      console.warn("[OnboardingContext] Profile is null, cannot save company profile to Supabase.");
    }
  };

  // Add a new structured location
  const addLocation = async (location: Omit<Location, "id" | "createdAt" | "userId" | "organizationId">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to add locations.");
      return;
    }

    const { data, error } = await supabase
      .from("locations")
      .insert({
        organization_id: profile.organizationId,
        full_location_string: location.fullLocationString,
        display_name: location.displayName,
        area: location.area,
        row: location.row,
        bay: location.bay,
        level: location.level,
        pos: location.pos,
        color: location.color,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding location:", error);
      showError(`Failed to add location: ${error.message}`);
    } else if (data) {
      setLocations((prev) => [...prev, mapSupabaseLocationToLocation(data)]);
      showSuccess(`Location "${location.displayName || location.fullLocationString}" added.`);
    }
  };

  // Update an existing structured location
  const updateLocation = async (location: Omit<Location, "createdAt" | "userId" | "organizationId">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to update locations.");
      return;
    }

    const { data, error } = await supabase
      .from("locations")
      .update({
        full_location_string: location.fullLocationString,
        display_name: location.displayName,
        area: location.area,
        row: location.row,
        bay: location.bay,
        level: location.level,
        pos: location.pos,
        color: location.color,
      })
      .eq("id", location.id)
      .eq("organization_id", profile.organizationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating location:", error);
      showError(`Failed to update location: ${error.message}`);
    } else if (data) {
      setLocations((prev) =>
        prev.map((loc) => (loc.id === data.id ? mapSupabaseLocationToLocation(data) : loc))
      );
      showSuccess(`Location "${location.displayName || location.fullLocationString}" updated.`);
    }
  };

  // Remove a structured location by ID
  const removeLocation = async (locationId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to remove locations.");
      return;
    }

    const locationToRemove = locations.find(loc => loc.id === locationId);

    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", locationId)
      .eq("organization_id", profile.organizationId);

    if (error) {
      console.error("Error removing location:", error);
      showError(`Failed to remove location: ${error.message}`);
    } else {
      setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
      showSuccess(`Location "${locationToRemove?.displayName || locationToRemove?.fullLocationString}" removed.`);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        companyProfile,
        locations,
        markOnboardingComplete,
        setCompanyProfile,
        addLocation,
        updateLocation,
        removeLocation,
        fetchLocations,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};