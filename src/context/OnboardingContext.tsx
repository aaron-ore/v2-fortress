import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { useProfile } from "./ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { generateUniqueCode } from "@/utils/numberGenerator"; // Import the new utility

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
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      // Onboarding is considered complete if a company profile exists AND the user has an organizationId
      const storedProfile = localStorage.getItem("companyProfile");
      return storedProfile !== null && profile?.organizationId !== null;
    }
    return false;
  });

  const [companyProfile, setCompanyProfileState] = useState<CompanyProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem("companyProfile");
      return storedProfile ? JSON.parse(storedProfile) : null;
    }
    return null;
  });

  const [locations, setLocations] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedLocations = localStorage.getItem("inventoryLocations");
      return storedLocations ? JSON.parse(storedLocations) : [];
    }
    return [];
  });

  // Effect to determine if onboarding is complete based on profile and companyProfile
  useEffect(() => {
    if (!isLoadingProfile && profile) {
      const storedProfile = localStorage.getItem("companyProfile");
      const hasCompanyProfile = storedProfile !== null;
      const hasOrganizationId = profile.organizationId !== null;

      // Onboarding is complete if company profile is set AND user has an organization ID
      setIsOnboardingComplete(hasCompanyProfile && hasOrganizationId);
    } else if (!isLoadingProfile && !profile) {
      // If no profile (not logged in), onboarding is not complete
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
    showSuccess("Onboarding complete! Welcome to Fortress.");
  };

  const setCompanyProfile = async (profileData: CompanyProfile) => {
    setCompanyProfileState(profileData);

    // If the current user doesn't have an organization_id, this is the first admin.
    // Create an organization and assign it to them.
    if (profile && !profile.organizationId) {
      try {
        // 1. Create new organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: profileData.name })
          .select()
          .single();

        if (orgError) throw orgError;

        const newOrganizationId = orgData.id;
        const newUniqueCode = generateUniqueCode(); // Generate unique code

        // 2. Update the newly created organization with the unique code
        const { error: updateOrgError } = await supabase
          .from('organizations')
          .update({ unique_code: newUniqueCode })
          .eq('id', newOrganizationId);

        if (updateOrgError) throw updateOrgError;

        // 3. Update user's profile with organization_id and set role to admin
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ organization_id: newOrganizationId, role: 'admin' })
          .eq('id', profile.id);

        if (profileUpdateError) throw profileUpdateError;

        // 4. Refresh the profile context to get the updated organizationId and role
        await fetchProfile();
        showSuccess(`Organization "${profileData.name}" created and assigned! You are now an admin. Your unique company code is: ${newUniqueCode}`);

      } catch (error: any) {
        console.error("Error during initial organization setup:", error);
        showError(`Failed to set up organization: ${error.message}`);
      }
    }
  };

  const addLocation = (location: string) => {
    setLocations((prev) => {
      const newLocations = [...prev, location];
      return Array.from(new Set(newLocations)); // Ensure uniqueness
    });
  };

  const removeLocation = (location: string) => {
    setLocations((prev) => prev.filter((loc) => loc !== location));
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