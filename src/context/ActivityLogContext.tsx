import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import { useProfile } from "./ProfileContext"; // NEW: Import useProfile
import { UserProfile } from "./ProfileContext"; // Import type
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string | null;
  organizationId: string | null;
  activityType: string;
  description: string;
  details: Record<string, any> | null;
  userName?: string; // To be populated from profiles
}

interface ActivityLogContextType {
  activityLogs: ActivityLog[];
  addActivity: (type: string, description: string, details?: Record<string, any>) => Promise<void>;
  fetchActivityLogs: (dateRange?: DateRange | undefined) => Promise<void>;
  isLoadingLogs: boolean;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

// REMOVED: ActivityLogProviderProps interface as props are now consumed internally

// CHANGE: ActivityLogProvider no longer accepts profile and allProfiles as props
export const ActivityLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const { profile, allProfiles, isLoadingProfile } = useProfile(); // NEW: Consume ProfileContext internally

  const fetchActivityLogs = useCallback(async (dateRange?: DateRange | undefined) => {
    setIsLoadingLogs(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !profile?.organizationId) { // Uses internal 'profile'
      setActivityLogs([]);
      setIsLoadingLogs(false);
      return;
    }

    let query = supabase
      .from("activity_logs")
      .select("*")
      .eq("organization_id", profile.organizationId) // Uses internal 'profile'
      .order("timestamp", { ascending: false });

    if (dateRange?.from) {
      query = query.gte("timestamp", format(dateRange.from, "yyyy-MM-dd"));
    }
    if (dateRange?.to) {
      query = query.lte("timestamp", format(dateRange.to, "yyyy-MM-dd") + " 23:59:59");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching activity logs:", error);
      showError("Failed to load activity logs.");
      setActivityLogs([]);
    } else {
      const logsWithUserNames: ActivityLog[] = data.map((log: any) => {
        const userProfile = allProfiles.find(p => p.id === log.user_id); // Uses internal 'allProfiles'
        return {
          id: log.id,
          timestamp: log.timestamp,
          userId: log.user_id,
          organizationId: log.organization_id,
          activityType: log.activity_type,
          description: log.description,
          details: log.details,
          userName: userProfile?.fullName || userProfile?.email || "Unknown User",
        };
      });
      setActivityLogs(logsWithUserNames);
    }
    setIsLoadingLogs(false);
  }, [profile?.organizationId, allProfiles]); // Dependencies now refer to internal state/hooks

  useEffect(() => {
    // Only fetch if profile is loaded and has an organizationId
    if (!isLoadingProfile && profile && !profile.organizationId) {
      // If profile is loaded but no organization, clear logs
      setActivityLogs([]);
      setIsLoadingLogs(false);
    } else if (!isLoadingProfile && profile?.organizationId) {
      fetchActivityLogs();
    }
  }, [fetchActivityLogs, isLoadingProfile, profile?.organizationId, profile]); // Dependencies now refer to internal state/hooks

  const addActivity = useCallback(async (type: string, description: string, details?: Record<string, any>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) { // Uses internal 'profile'
      console.warn("Cannot log activity: User not logged in or no organization ID.");
      return;
    }

    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: session.user.id,
        organization_id: profile.organizationId, // Uses internal 'profile'
        activity_type: type,
        description: description,
        details: details || {},
      })
      .select();

    if (error) {
      console.error("Error adding activity log:", error);
    } else if (data && data.length > 0) {
      const newLog: ActivityLog = {
        id: data[0].id,
        timestamp: data[0].timestamp,
        userId: data[0].user_id,
        organizationId: data[0].organization_id,
        activityType: data[0].activity_type,
        description: data[0].description,
        details: data[0].details,
        userName: profile.fullName || profile.email, // Uses internal 'profile'
      };
      setActivityLogs((prev) => [newLog, ...prev]);
    }
  }, [profile?.organizationId, profile?.fullName, profile?.email]); // Dependencies now refer to internal state/hooks

  return (
    <ActivityLogContext.Provider value={{ activityLogs, addActivity, fetchActivityLogs, isLoadingLogs }}>
      {children}
    </ActivityLogContext.Provider>
  );
};

export const useActivityLogs = () => {
  const context = useContext(ActivityLogContext);
  if (context === undefined) {
    throw new Error("useActivityLogs must be used within an ActivityLogProvider");
  }
  return context;
};