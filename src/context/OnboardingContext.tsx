import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { useProfile } from "./ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { generateUniqueCode } from "@/utils/numberGenerator";
import { mockLocations, mockCompanyProfile } from "@/utils/mockData";
// REMOVED: import { useActivityLogs } from "./ActivityLogContext";

interface CompanyProfile {
  name: string;
  currency: string;
  address: string;
}

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  companyProfile: CompanyProfile | null;
  locations: string[];
  markOnboardingComplete: () => void;
  setCompanyProfile: (profile: CompanyProfile) => void;
  addLocation: (location: string) => void;
  removeLocation: (location: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, isLoadingProfile, fetchProfile } = useProfile();
  // REMOVED: const { addActivity } = useActivityLogs();
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
      // If no stored profile, initialize with a default, but don't log as "mock"
      return storedProfile ? JSON.parse(storedProfile) : mockCompanyProfile;
    }
    return null;
  });

  const [locations, setLocations] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedLocations = localStorage.getItem("inventoryLocations");
      // If no stored locations, initialize with an empty array
      return storedLocations ? JSON.parse(storedLocations) : [];
    }
    return [];
  });

  useEffect(() => {
    if (!isLoadingProfile) {
      const storedProfile = localStorage.getItem("companyProfile");
      const hasCompanyProfile = storedProfile !== null;
      const hasOrganizationId = profile?.organizationId !== null; // Check profile?.organizationId

      setIsOnboardingComplete(hasCompanyProfile && hasOrganizationId);
    } else if (!isLoadingProfile && !profile) {
      setIsOnboardingComplete(false);
    }
  }, [profile, isLoadingProfile]);

  useEffect(() => {
    localStorage.setItem("companyProfile", JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem("inventoryLocations", JSON.stringify(locations));
  }, [locations]);

  const markOnboardingComplete = () => {
    setIsOnboardingComplete(true);
    // REMOVED: addActivity("Onboarding Complete", "User completed the onboarding wizard.", {});
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
          // Case 1: User has no organization yet, create a new one
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
          // Case 2: User already has an organization, update it
          const { data: existingOrg, error: fetchOrgError } = await supabase
            .from('organizations')
            .select('unique_code')
            .eq('id', profile.organizationId)
            .single();

          if (fetchOrgError && fetchOrgError.code !== 'PGRST116') { // PGRST116 means no rows found
            throw fetchOrgError;
          }
          console.log("[OnboardingContext] Existing organization fetched:", existingOrg);

          if (!existingOrg?.unique_code) {
            // If unique_code is missing, generate one
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
              unique_code: uniqueCodeToUse, // Update even if it was already there, or set if missing
              default_theme: profile.organizationTheme, // Ensure theme is also passed if it exists in profile
            })
            .eq('id', profile.organizationId);

          if (updateOrgError) throw updateOrgError;
          console.log("[OnboardingContext] Organization updated with name and unique_code:", { name: profileData.name, unique_code: uniqueCodeToUse });

          showSuccess(`Company profile for "${profileData.name}" updated successfully!`);
        }
        
        // Always refresh profile to get the latest organization data (including unique_code)
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

  const addLocation = (location: string) => {
    setLocations((prev) => {
      const newLocations = [...prev, location];
      const uniqueLocations = Array.from(new Set(newLocations));
      if (uniqueLocations.length > prev.length) { // Only log if a new unique location was actually added
        // REMOVED: addActivity("Location Added", `Added new inventory location: ${location}.`, { locationName: location });
      }
      return uniqueLocations;
    });
  };

  const removeLocation = (location: string) => {
    setLocations((prev) => {
      const filteredLocations = prev.filter((loc) => loc !== location);
      if (filteredLocations.length < prev.length) { // Only log if a location was actually removed
        // REMOVED: addActivity("Location Removed", `Removed inventory location: ${location}.`, { locationName: location });
      }
      return filteredLocations;
    });
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
        removeLocation,
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