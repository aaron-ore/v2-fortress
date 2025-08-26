import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { showSuccess } from "@/utils/toast"; // Import showSuccess

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
  // Set isOnboardingComplete to true by default, as the wizard is now optional/removed
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(true);

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

  // Removed useEffect for 'onboardingComplete' as it's now always true
  // useEffect(() => {
  //   localStorage.setItem("onboardingComplete", String(isOnboardingComplete));
  // }, [isOnboardingComplete]);

  useEffect(() => {
    localStorage.setItem("companyProfile", JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem("inventoryLocations", JSON.stringify(locations));
  }, [locations]);

  const markOnboardingComplete = () => {
    // This function might still be called, but it won't change the state to true if it's already true
    setIsOnboardingComplete(true);
    showSuccess("Onboarding complete! Welcome to Fortress.");
  };

  const setCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfileState(profile);
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