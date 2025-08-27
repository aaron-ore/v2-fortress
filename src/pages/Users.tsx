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

const Users: React.FC = () => {
  const { profile, allProfiles, updateUserRole, fetchAllProfiles } = useProfile();
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  useEffect(() => {
    // Fetch all profiles when component mounts or profile changes (especially role)
    if (profile?.role === 'admin') {
      fetchAllProfiles();
    }
  }, [profile?.role, fetchAllProfiles]);

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      showError("Please enter an email address to invite.");
      return;
    }
    if (!profile?.organizationId) {
      showError("Your organization ID is not set. Cannot invite users.");
      return;
    }

    // 1. Admin uses Supabase client-side signUp to create a new auth user.
    // The handle_new_user trigger will create a profile with default role 'viewer' and organization_id = NULL.
    const { data, error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: Math.random().toString(36).substring(2, 15), // Temporary password, user will reset
      options: {
        // Supabase will now use the "Site URL" configured in your project settings for email redirects.
        // No need for emailRedirectTo here.
      },
    });

    if (error) {
      showError(`Failed to invite user: ${error.message}`);
    } else {
      showSuccess(`Invitation sent to ${inviteEmail}! User will set their password upon first login.`);
      setInviteEmail("");
      
      if (data.user) {
        const newUserId = data.user.id;
        const maxRetries = 5;
        let retries = 0;
        const pollInterval = 1000; // 1 second

        const pollForProfile = async () => {
          try {
            const { data: newProfile, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', newUserId)
              .single();

            if (newProfile && !profileError) {
              // Profile found, proceed to update role
              await updateUserRole(newUserId, inviteRole, profile.organizationId); // Pass admin's organizationId
              fetchAllProfiles(); // Refresh list
            } else if (retries < maxRetries) {
              retries++;
              console.log(`[Users.tsx] Profile not found for ${newUserId}, retrying... (${retries}/${maxRetries})`);
              setTimeout(pollForProfile, pollInterval);
            } else {
              showError(`Failed to find profile for new user ${newUserId} after multiple attempts. Please check Supabase logs.`);
              fetchAllProfiles(); // Still refresh in case of partial success
            }
          } catch (pollError) {
            console.error("[Users.tsx] Error polling for profile:", pollError);
            if (retries < maxRetries) {
              retries++;
              setTimeout(pollForProfile, pollInterval);
            } else {
              showError(`Failed to find profile for new user ${newUserId} due to an error after multiple attempts.`);
              fetchAllProfiles();
            }
          }
        };
        pollForProfile();
      } else {
        // If data.user is null (e.g., user already exists), just refresh profiles
        fetchAllProfiles();
      }
    }
  };

  const handleDeleteUserClick = (user: UserProfile) => {
    setUserToDelete(user);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    // Note: Deleting a user from `auth.users` requires admin privileges
    // and is typically done via a server-side function or Supabase dashboard.
    // Here, we're only deleting the profile entry.
    // For a full user deletion, you'd need a Supabase Edge Function or similar.
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userToDelete.id)
      .eq("organization_id", profile?.organizationId); // Ensure admin can only delete within their org

    if (error) {
      showError(`Failed to delete profile: ${error.message}`);
    } else {
      showSuccess(`Profile for ${userToDelete.fullName || userToDelete.email} deleted.`);
      fetchAllProfiles(); // Refresh the list
    }
    setIsConfirmDeleteDialogOpen(false);
    setUserToDelete(null);
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

      {/* Invite New User */}
      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4 flex flex-row items-center gap-4">
          <UserPlus className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl font-semibold">Invite New User</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">Email Address</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="newuser@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteRole">Assign Role</Label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger id="inviteRole">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer (Warehouse/Sales Associate)</SelectItem>
                <SelectItem value="inventory_manager">Manager (Inventory & Orders)</SelectItem>
                <SelectItem value="admin">Admin (Full Access)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleInviteUser}>Send Invitation</Button>
          </div>
        </CardContent>
      </Card>

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
                            onValueChange={(newRole) => updateUserRole(user.id, newRole, profile.organizationId)}
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