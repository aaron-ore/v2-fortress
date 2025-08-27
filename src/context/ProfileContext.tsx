import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { mockUserProfile, mockAllProfiles } from "@/utils/mockData"; // NEW: Import mock data

export interface UserProfile {
  id: string; // This will be the user's UUID from auth.users
  fullName: string;
  email: string; // Now stored in profiles table
  phone?: string;
  address?: string;
  avatarUrl?: string;
  role: string; // New: role field
  organizationId: string | null; // NEW: organization_id field, can be null initially
  createdAt: string;
}

interface ProfileContextType {
  profile: UserProfile | null;
  allProfiles: UserProfile[]; // New: for admin to see all profiles
  isLoadingProfile: boolean; // NEW: Add loading state for profile
  updateProfile: (updates: Partial<Omit<UserProfile, "id" | "email" | "createdAt" | "role" | "organizationId">>) => Promise<void>;
  updateUserRole: (userId: string, newRole: string, organizationId: string | null) => Promise<void>; // New: for admin to update roles, now includes organizationId
  fetchProfile: () => Promise<void>;
  fetchAllProfiles: () => Promise<void>; // New: for admin to fetch all profiles
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Initialize as true
  const errorToastId = useRef<string | number | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true); // Set loading true at start
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setProfile(null);
      setIsLoadingProfile(false); // Set loading false if no session
      // NEW: If no session and in dev, load mock user profile
      if (import.meta.env.DEV) {
        console.warn("Loading mock user profile as no session found in development mode.");
        setProfile(mockUserProfile);
      }
      return;
    }

    let userProfileData = null;
    let profileFetchError = null;

    // Attempt to fetch the profile
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, address, avatar_url, role, organization_id, created_at, email") // Explicitly list columns, including email
      .eq("id", session.user.id)
      .single();

    if (error && error.code === 'PGRST116') { // PGRST116 means "no rows found"
      console.warn(`[ProfileContext] No profile found for user ${session.user.id}. This indicates the 'on_auth_user_created' trigger might not have run, or the SELECT RLS policy is too restrictive.`);
      // If no profile exists, we now treat this as an error, expecting the trigger to have created it.
      profileFetchError = new Error("User profile not found after authentication. Please ensure the 'on_auth_user_created' trigger is active in Supabase.");
    } else if (error) {
      console.error("[ProfileContext] Error fetching profile:", error);
      profileFetchError = error;
    } else if (data) {
      userProfileData = data;
    }

    if (profileFetchError) {
      if (errorToastId.current === null) {
        errorToastId.current = showError("Failed to load user profile. Please try again.");
        setTimeout(() => { errorToastId.current = null; }, 3000);
      }
      setProfile(null);
      // NEW: If error and in dev, load mock user profile
      if (import.meta.env.DEV) {
        console.warn("Loading mock user profile due to Supabase error in development mode.");
        setProfile(mockUserProfile);
      }
    } else if (userProfileData) {
      setProfile({
        id: userProfileData.id,
        fullName: userProfileData.full_name,
        email: userProfileData.email || session.user.email || "", // Use email from profile, fallback to session
        phone: userProfileData.phone || undefined,
        address: userProfileData.address || undefined,
        avatarUrl: userProfileData.avatar_url || undefined,
        role: userProfileData.role,
        organizationId: userProfileData.organization_id, // Map organization_id
        createdAt: userProfileData.created_at,
      });
    }
    setIsLoadingProfile(false); // Set loading false at end
  }, []);

  const fetchAllProfiles = useCallback(async () => {
    // Only attempt to fetch all profiles if a session exists AND the current profile's role is 'admin'
    if (!profile?.role || profile.role !== 'admin' || !profile.organizationId) { // Check profile role and organizationId
      setAllProfiles([]);
      // NEW: If not admin/no orgId and in dev, load mock all profiles
      if (import.meta.env.DEV) {
        console.warn("Loading mock all profiles as current user is not admin or has no organization in development mode.");
        setAllProfiles(mockAllProfiles);
      }
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, address, avatar_url, role, organization_id, created_at, email") // Explicitly list columns, including email
      .eq("organization_id", profile.organizationId); // Filter by organization_id

    if (error) {
      console.error("Error fetching all profiles:", error);
      showError("Failed to load all user profiles.");
      // NEW: If error and in dev, load mock all profiles
      if (import.meta.env.DEV) {
        console.warn("Loading mock all profiles due to Supabase error in development mode.");
        setAllProfiles(mockAllProfiles);
      }
    } else if (data) {
      const fetchedProfiles: UserProfile[] = data.map((p: any) => ({
        id: p.id,
        fullName: p.full_name,
        email: p.email || "Email N/A", // Use email from profile
        phone: p.phone || undefined,
        address: p.address || undefined,
        avatarUrl: p.avatar_url || undefined,
        role: p.role,
        organizationId: p.organization_id, // Map organization_id
        createdAt: p.created_at,
      }));
      // NEW: If no data from Supabase and in dev, load mock all profiles
      if (fetchedProfiles.length === 0 && import.meta.env.DEV) {
        console.warn("Loading mock all profiles as Supabase returned no data in development mode.");
        setAllProfiles(mockAllProfiles);
      } else {
        setAllProfiles(fetchedProfiles);
      }
    }
  }, [profile?.role, profile?.organizationId]); // Depend on profile.role and organizationId

  useEffect(() => {
    fetchProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile();
      } else {
        setProfile(null);
        setAllProfiles([]);
        setIsLoadingProfile(false); // Also set loading false if session is null
        // NEW: If no session and in dev, load mock user profile and all profiles
        if (import.meta.env.DEV) {
          console.warn("Loading mock user profile and all profiles as no session found in development mode.");
          setProfile(mockUserProfile);
          setAllProfiles(mockAllProfiles);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?.role === 'admin' && profile.organizationId) {
      fetchAllProfiles();
    } else {
      setAllProfiles([]);
      // NEW: If not admin/no orgId and in dev, load mock all profiles
      if (import.meta.env.DEV) {
        console.warn("Loading mock all profiles as current user is not admin or has no organization in development mode.");
        setAllProfiles(mockAllProfiles);
      }
    }
  }, [profile?.role, profile?.organizationId, fetchAllProfiles]);

  const updateProfile = async (updates: Partial<Omit<UserProfile, "id" | "email" | "createdAt" | "role" | "organizationId">>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showError("You must be logged in to update your profile.");
      return;
    }

    // Only allow updating non-sensitive fields for the current user
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: updates.fullName,
        phone: updates.phone,
        address: updates.address,
        avatar_url: updates.avatarUrl,
      })
      .eq("id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      showError(`Failed to update profile: ${error.message}`);
    } else if (data) {
      setProfile({
        id: data.id,
        fullName: data.full_name,
        email: data.email || session.user.email || "", // Use email from profile, fallback to session
        phone: data.phone || undefined,
        address: data.address || undefined,
        avatarUrl: data.avatar_url || undefined,
        role: data.role,
        organizationId: data.organization_id, // Map organization_id
        createdAt: data.created_at,
      });
      showSuccess("Profile updated successfully!");
    }
  };

  const updateUserRole = async (userId: string, newRole: string, organizationId: string | null) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || profile?.role !== 'admin' || !profile.organizationId) {
      showError("You do not have permission to update user roles.");
      return;
    }

    try {
      // Call the Edge Function to update the user's role and organization_id
      const { data, error } = await supabase.functions.invoke('update-user-profile', {
        body: JSON.stringify({
          targetUserId: userId,
          newRole: newRole,
          organizationId: organizationId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Assuming the Edge Function returns the updated profile data
      const updatedProfileData = data.profile;

      setAllProfiles((prevProfiles) =>
        prevProfiles.map((p) =>
          p.id === updatedProfileData.id ? {
            ...p,
            role: updatedProfileData.role,
            organizationId: updatedProfileData.organization_id,
            fullName: updatedProfileData.full_name, // Update other fields if returned
            phone: updatedProfileData.phone,
            address: updatedProfileData.address,
            avatarUrl: updatedProfileData.avatar_url,
            email: updatedProfileData.email, // Update email if returned
          } : p
        )
      );
      showSuccess(`Role for ${updatedProfileData.full_name || updatedProfileData.id} updated to ${newRole}!`);
      if (session.user.id === updatedProfileData.id) {
        fetchProfile(); // Refresh current user's profile if their role was changed
      }
    } catch (error: any) {
      console.error("Error calling Edge Function to update user role:", error);
      showError(`Failed to update role for user ${userId}: ${error.message}`);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, allProfiles, isLoadingProfile, updateProfile, updateUserRole, fetchProfile, fetchAllProfiles }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};