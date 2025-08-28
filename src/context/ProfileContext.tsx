import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { mockUserProfile, mockAllProfiles } from "@/utils/mockData";
// REMOVED: import { useActivityLogs } from "./ActivityLogContext";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  role: string;
  organizationId: string | null;
  createdAt: string;
}

interface ProfileContextType {
  profile: UserProfile | null;
  allProfiles: UserProfile[];
  isLoadingProfile: boolean;
  updateProfile: (updates: Partial<Omit<UserProfile, "id" | "email" | "createdAt" | "role" | "organizationId">>) => Promise<void>;
  updateUserRole: (userId: string, newRole: string, organizationId: string | null) => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchAllProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const errorToastId = useRef<string | number | null>(null);
  // REMOVED: const { addActivity } = useActivityLogs();

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setProfile(null);
      setIsLoadingProfile(false);
      if (import.meta.env.DEV) {
        console.warn("Loading mock user profile as no session found in development mode.");
        setProfile(mockUserProfile);
      }
      return;
    }

    let userProfileData = null;
    let profileFetchError = null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, address, avatar_url, role, organization_id, created_at, email")
      .eq("id", session.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      console.warn(`[ProfileContext] No profile found for user ${session.user.id}. This indicates the 'on_auth_user_created' trigger might not have run, or the SELECT RLS policy is too restrictive.`);
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
      if (import.meta.env.DEV) {
        console.warn("Loading mock user profile due to Supabase error in development mode.");
        setProfile(mockUserProfile);
      }
    } else if (userProfileData) {
      setProfile({
        id: userProfileData.id,
        fullName: userProfileData.full_name,
        email: userProfileData.email || session.user.email || "",
        phone: userProfileData.phone || undefined,
        address: userProfileData.address || undefined,
        avatarUrl: userProfileData.avatar_url || undefined,
        role: userProfileData.role,
        organizationId: userProfileData.organization_id,
        createdAt: userProfileData.created_at,
      });
    }
    setIsLoadingProfile(false);
  }, []);

  const fetchAllProfiles = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || profile?.role !== 'admin' || !profile?.organizationId) { // Use optional chaining for profile
      setAllProfiles([]);
      if (import.meta.env.DEV) {
        console.warn("Loading mock all profiles as current user is not admin or has no organization in development mode.");
        setAllProfiles(mockAllProfiles);
      }
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, address, avatar_url, role, organization_id, created_at, email")
      .eq("organization_id", profile.organizationId);

    if (error) {
      console.error("Error fetching all profiles:", error);
      showError("Failed to load all user profiles.");
      if (import.meta.env.DEV) {
        console.warn("Loading mock all profiles due to Supabase error in development mode.");
        setAllProfiles(mockAllProfiles);
      }
    } else if (data) {
      const fetchedProfiles: UserProfile[] = data.map((p: any) => ({
        id: p.id,
        fullName: p.full_name,
        email: p.email || "Email N/A",
        phone: p.phone || undefined,
        address: p.address || undefined,
        avatarUrl: p.avatar_url || undefined,
        role: p.role,
        organizationId: p.organization_id,
        createdAt: p.created_at,
      }));
      if (fetchedProfiles.length === 0 && import.meta.env.DEV) {
        console.warn("Loading mock all profiles as Supabase returned no data in development mode.");
        setAllProfiles(mockAllProfiles);
      } else {
        setAllProfiles(fetchedProfiles);
      }
    }
  }, [profile?.role, profile?.organizationId]);

  useEffect(() => {
    fetchProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile();
      } else {
        setProfile(null);
        setAllProfiles([]);
        setIsLoadingProfile(false);
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

    // REMOVED: const oldProfile = profile;

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
      // REMOVED: addActivity("Profile Update Failed", `Failed to update own profile.`, { error: error.message, userId: session.user.id });
      showError(`Failed to update profile: ${error.message}`);
    } else if (data) {
      setProfile({
        id: data.id,
        fullName: data.full_name,
        email: data.email || session.user.email || "",
        phone: data.phone || undefined,
        address: data.address || undefined,
        avatarUrl: data.avatar_url || undefined,
        role: data.role,
        organizationId: data.organization_id,
        createdAt: data.created_at,
      });
      // REMOVED: addActivity("Profile Updated", `Updated own profile details.`, { oldProfile: oldProfile, newProfile: data });
      showSuccess("Profile updated successfully!");
    }
  };

  const updateUserRole = async (userId: string, newRole: string, organizationId: string | null) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || profile?.role !== 'admin' || !profile?.organizationId) { // Use optional chaining for profile
      showError("You do not have permission to update user roles.");
      return;
    }

    // REMOVED: const targetUser = allProfiles.find(p => p.id === userId);
    // REMOVED: const oldRole = targetUser?.role;

    try {
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

      const updatedProfileData = data.profile;

      setAllProfiles((prevProfiles) =>
        prevProfiles.map((p) =>
          p.id === updatedProfileData.id ? {
            ...p,
            role: updatedProfileData.role,
            organizationId: updatedProfileData.organization_id,
            fullName: updatedProfileData.full_name,
            phone: updatedProfileData.phone,
            address: updatedProfileData.address,
            avatarUrl: updatedProfileData.avatar_url,
            email: updatedProfileData.email,
          } : p
        )
      );
      // REMOVED: addActivity("User Role Updated", `Updated role for user ${targetUser?.fullName || userId} from "${oldRole}" to "${newRole}".`, { targetUserId: userId, oldRole, newRole });
      showSuccess(`Role for ${updatedProfileData.full_name || updatedProfileData.id} updated to ${newRole}!`);
      if (session.user.id === updatedProfileData.id) {
        fetchProfile();
      }
    } catch (error: any) {
      console.error("Error calling Edge Function to update user role:", error);
      // REMOVED: addActivity("User Role Update Failed", `Failed to update role for user ${targetUser?.fullName || userId} to "${newRole}".`, { error: error.message, targetUserId: userId, newRole });
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