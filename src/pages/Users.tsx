import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Users as UsersIcon, Mail, UserPlus, Trash2 } from "lucide-react";
import { useProfile, UserProfile } from "@/context/ProfileContext";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/lib/supabaseClient";
// REMOVED: import { useActivityLogs } from "@/context/ActivityLogContext";

const Users: React.FC = () => {
  const { profile, allProfiles, updateUserRole, fetchAllProfiles } = useProfile();
  // REMOVED: const { addActivity } = useActivityLogs();
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  // Removed inviteEmail and inviteRole states as invite functionality is removed

  useEffect(() => {
    // Fetch all profiles when component mounts or profile changes (especially role)
    if (profile?.role === 'admin') {
      fetchAllProfiles();
    }
  }, [profile?.role, fetchAllProfiles]);

  // Removed handleInviteUser function

  const handleDeleteUserClick = (user: UserProfile) => {
    setUserToDelete(user);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !profile?.organizationId) return;

    // Note: Deleting a user from `auth.users` requires admin privileges
    // and is typically done via a server-side function or Supabase dashboard.
    // Here, we're only deleting the profile entry.
    // For a full user deletion, you'd need a Supabase Edge Function or similar.
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userToDelete.id)
      .eq("organization_id", profile.organizationId); // Ensure admin can only delete within their org

    if (error) {
      showError(`Failed to delete profile: ${error.message}`);
      // REMOVED: addActivity("User Delete Failed", `Failed to delete profile for ${userToDelete.fullName || userToDelete.email}.`, { error: error.message, targetUserId: userToDelete.id });
    } else {
      showSuccess(`Profile for ${userToDelete.fullName || userToDelete.email} deleted.`);
      // REMOVED: addActivity("User Deleted", `Deleted profile for ${userToDelete.fullName || userToDelete.email}.`, { targetUserId: userToDelete.id });
      fetchAllProfiles(); // Refresh the list
    }
    setIsConfirmDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!profile?.organizationId) {
      showError("Organization ID not found for role update.");
      return;
    }
    const targetUser = allProfiles.find(p => p.id === userId);
    const oldRole = targetUser?.role;

    try {
      await updateUserRole(userId, newRole, profile.organizationId);
      // REMOVED: addActivity("User Role Updated", `Updated role for user ${targetUser?.fullName || userId} from "${oldRole}" to "${newRole}".`, { targetUserId: userId, oldRole, newRole });
    } catch (error: any) {
      // REMOVED: addActivity("User Role Update Failed", `Failed to update role for user ${targetUser?.fullName || userId} to "${newRole}".`, { error: error.message, targetUserId: userId, newRole });
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-6 text-center bg-card border-border">
          <CardTitle className="text-2xl font-bold mb-4">Access Denied</CardTitle>
          <CardContent>
            <p className="text-muted-foreground">You do not have administrative privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      <p className="text-muted-foreground">Manage user accounts and assign roles within Fortress.</p>

      {/* Removed Invite New User Card */}

      {/* All Users Table */}
      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">All Users ({allProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {allProfiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProfiles.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName || "N/A"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.id === profile?.id ? ( // Current user's role is not editable here
                          <span className="font-semibold">{user.role === 'admin' ? 'Admin (Full Access)' : user.role === 'inventory_manager' ? 'Manager (Inventory & Orders)' : 'Viewer (Warehouse/Sales Associate)'}</span>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                          >
                            <SelectTrigger className="w-[250px]"> {/* Increased width for longer labels */}
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer (Warehouse/Sales Associate)</SelectItem>
                              <SelectItem value="inventory_manager">Manager (Inventory & Orders)</SelectItem>
                              <SelectItem value="admin">Admin (Full Access)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-center">
                        {user.id !== profile?.id && ( // Cannot delete self
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUserClick(user)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {userToDelete && (
        <ConfirmDialog
          isOpen={isConfirmDeleteDialogOpen}
          onClose={() => setIsConfirmDeleteDialogOpen(false)}
          onConfirm={confirmDeleteUser}
          title="Confirm User Deletion"
          description={`Are you sure you want to delete the profile for "${userToDelete.fullName || userToDelete.email}"? This will NOT delete the user from Supabase Authentication, only their profile data. Full user deletion requires Supabase dashboard or a server-side function.`}
          confirmText="Delete Profile"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default Users;