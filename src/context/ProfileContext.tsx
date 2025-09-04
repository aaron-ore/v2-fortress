import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { parseAndValidateDate } from "@/utils/dateUtils"; // NEW: Import parseAndValidateDate
import { isValid } from "date-fns"; // Import isValid for date validation

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  role: string;
  organizationId: string | null;
  organizationCode?: string; // NEW: Add organizationCode
  createdAt: string;
  quickbooksAccessToken?: string; // NEW: Add QuickBooks Access Token
  quickbooksRefreshToken?: string; // NEW: Add QuickBooks Refresh Token
  quickbooksRealmId?: string; // NEW: Add QuickBooks Realm ID
}

interface ProfileContextType {
  profile: UserProfile | null;
  allProfiles: UserProfile[];
  isLoadingProfile: boolean;
  updateProfile: (updates: Partial<Omit<UserProfile, "id" | "email" | "createdAt" | "role" | "organizationId" | "organizationCode" | "quickbooksAccessToken" | "quickbooksRefreshToken" | "quickbooksRealmId">>) => Promise<void>;
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

  const mapSupabaseProfileToUserProfile = (p: any, sessionEmail?: string): UserProfile => {
    // Ensure created_at is always a valid ISO string
    const validatedCreatedAt = parseAndValidateDate(p.created_at);
    const createdAtString = validatedCreatedAt ? validatedCreatedAt.toISOString() : new Date().toISOString(); // Fallback to current date if invalid

    return {
      id: p.id,
      fullName: p.full_name || "", // Ensure string fallback
      email: p.email || sessionEmail || "", // Ensure string fallback
      phone: p.phone || undefined,
      address: p.address || undefined,
      avatarUrl: p.avatar_url || undefined,
      role: p.role || "viewer", // Default role
      organizationId: p.organization_id,
      organizationCode: p.organizations?.[0]?.unique_code || undefined, // Access as array if it's a join
      createdAt: createdAtString,
      quickbooksAccessToken: p.quickbooks_access_token || undefined,
      quickbooksRefreshToken: p.quickbooks_refresh_token || undefined,
      quickbooksRealmId: p.quickbooks_realm_id || undefined,
    };
  };

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setProfile(null);
      setIsLoadingProfile(false);
      return;
    }

    let userProfileData = null;
    let profileFetchError = null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, address, avatar_url, role, organization_id, created_at, email, organizations(unique_code), quickbooks_access_token, quickbooks_refresh_token, quickbooks_realm_id")
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
      setProfile(null);
    } else if (userProfileData) {
      setProfile(mapSupabaseProfileToUserProfile(userProfileData, session.user.email));
    }
    setIsLoadingProfile(false);
  }, []);

  const fetchAllProfiles = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || profile?.role !== 'admin' || !profile?.organizationId) {
      setAllProfiles([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, address, avatar_url, role, organization_id, created_at, email, quickbooks_access_token, quickbooks_refresh_token, quickbooks_realm_id")
      .eq("organization_id", profile.organizationId);

    if (error) {
      console.error("Error fetching all profiles:", error);
      setAllProfiles([]);
    } else if (data) {
      const fetchedProfiles: UserProfile[] = data.map((p: any) => mapSupabaseProfileToUserProfile(p));
      setAllProfiles(fetchedProfiles);
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
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?.role === 'admin' && profile.organizationId) {
      fetchAllProfiles();
    } else {
      setAllProfiles([]);
    }
  }, [profile?.role, profile?.organizationId, fetchAllProfiles]);

  const updateProfile = async (updates: Partial<Omit<UserProfile, "id" | "email" | "createdAt" | "role" | "organizationId" | "organizationCode" | "quickbooksAccessToken" | "quickbooksRefreshToken" | "quickbooksRealmId">>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showError("You must be logged in to update your profile.");
      return;
    }

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
      setProfile(mapSupabaseProfileToUserProfile(data, session.user.email));
      showSuccess("Profile updated successfully!");
    }
  };

  const updateUserRole = async (userId: string, newRole: string, organizationId: string | null) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || profile?.role !== 'admin' || !profile?.organizationId) {
      showError("You do not have permission to update user roles.");
      return;
    }

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
            ...mapSupabaseProfileToUserProfile(updatedProfileData),
            organizationCode: profile?.organizationCode, // Keep existing organizationCode
          } : p
        )
      );
      showSuccess(`Role for ${updatedProfileData.full_name || updatedProfileData.id} updated to ${newRole}!`);
      if (session.user.id === updatedProfileData.id) {
        fetchProfile();
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