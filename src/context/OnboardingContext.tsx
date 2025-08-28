import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { useProfile } from "./ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { generateUniqueCode } from "@/utils/numberGenerator";
import { mockLocations, mockCompanyProfile } from "@/utils/mockData";
import { useActivityLogs } from "./ActivityLogContext"; // NEW: Import useActivityLogs

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
  const { addActivity } = useActivityLogs(); // NEW: Use addActivity
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
      if (!storedProfile && import.meta.env.DEV) {
        console.warn("Loading mock company profile as local storage is empty in development mode.");
        return mockCompanyProfile;
      }
      return storedProfile ? JSON.parse(storedProfile) : null;
    }
    return null;
  });

  const [locations, setLocations] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedLocations = localStorage.getItem("inventoryLocations");
      if (!storedLocations && import.meta.env.DEV) {
        console.warn("Loading mock locations as local storage is empty in development mode.");
        return mockLocations;
      }
      return storedLocations ? JSON.parse(storedLocations) : [];
    }
    return [];
  });

  useEffect(() => {
    if (!isLoadingProfile && profile) {
      const storedProfile = localStorage.getItem("companyProfile");
      const hasCompanyProfile = storedProfile !== null;
      const hasOrganizationId = profile.organizationId !== null;

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
    addActivity("Onboarding Complete", "User completed the onboarding wizard.", {}); // NEW: Log onboarding completion
    showSuccess("Onboarding complete! Welcome to Fortress.");
  };

  const setCompanyProfile = async (profileData: CompanyProfile) => {
    setCompanyProfileState(profileData);

    if (profile && !profile.organizationId) {
      try {
        const newUniqueCode = generateUniqueCode();

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: profileData.name, unique_code: newUniqueCode })
          .select()
          .single();

        if (orgError) throw orgError;

        const newOrganizationId = orgData.id;

        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ organization_id: newOrganizationId, role: 'admin' })
          .eq('id', profile.id);

        if (profileUpdateError) throw profileUpdateError;

        await fetchProfile();
        addActivity("Organization Created", `New organization "${profileData.name}" created with code: ${newUniqueCode}.`, { organizationId: newOrganizationId, companyName: profileData.name, uniqueCode: newUniqueCode }); // NEW: Log organization creation
        showSuccess(`Organization "${profileData.name}" created and assigned! You are now an admin. Your unique company code is: ${newUniqueCode}`);

      } catch (error: any) {
        console.error("Error during initial organization setup:", error);
        addActivity("Organization Creation Failed", `Failed to create new organization "${profileData.name}".`, { error: error.message, companyName: profileData.name }); // NEW: Log failed organization creation
        showError(`Failed to set up organization: ${error.message}`);
      }
    } else {
      addActivity("Company Profile Updated", `Company profile updated to: ${profileData.name}.`, { companyName: profileData.name, currency: profileData.currency, address: profileData.address }); // NEW: Log company profile update
    }
  };

  const addLocation = (location: string) => {
    setLocations((prev) => {
      const newLocations = [...prev, location];
      const uniqueLocations = Array.from(new Set(newLocations));
      if (uniqueLocations.length > prev.length) { // Only log if a new unique location was actually added
        addActivity("Location Added", `Added new inventory location: ${location}.`, { locationName: location }); // NEW: Log location add
      }
      return uniqueLocations;
    });
  };

  const removeLocation = (location: string) => {
    setLocations((prev) => {
      const filteredLocations = prev.filter((loc) => loc !== location);
      if (filteredLocations.length < prev.length) { // Only log if a location was actually removed
        addActivity("Location Removed", `Removed inventory location: ${location}.`, { locationName: location }); // NEW: Log location remove
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