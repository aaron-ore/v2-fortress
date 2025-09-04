"use client";

import React, { useMemo } from "react";
import { useProfile } from "@/context/ProfileContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppContent from "@/AppContent"; // Assuming AppContent is now a separate component

const ThemedAppContent: React.FC = () => {
  const { profile, isLoadingProfile } = useProfile();

  // Determine the default theme based on organization settings, fallback to 'dark'
  const defaultTheme = useMemo(() => {
    if (!isLoadingProfile && profile?.organizationTheme) {
      return profile.organizationTheme;
    }
    return "dark";
  }, [profile?.organizationTheme, isLoadingProfile]);

  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <AppContent />
    </ThemeProvider>
  );
};

export default ThemedAppContent;