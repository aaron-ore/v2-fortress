import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes"; // Corrected import for useTheme
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile } from "@/context/ProfileContext";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2 } from "lucide-react";
import { useOnboarding } from "@/context/OnboardingContext";
import { Link } from "react-router-dom"; // Import Link for navigation
import { FileText, Plug, CheckCircle, RefreshCw } from "lucide-react"; // NEW: Import RefreshCw icon
import { supabase } from "@/lib/supabaseClient";

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile, isLoadingProfile, fetchProfile } = useProfile();
  const { companyProfile, setCompanyProfile, locations, addLocation, removeLocation } = useOnboarding();

  const [companyName, setCompanyName] = useState(companyProfile?.name || "");
  const [companyAddress, setCompanyAddress] = useState(companyProfile?.address || "");
  const [companyCurrency, setCompanyCurrency] = useState(companyProfile?.currency || "USD");
  const [isSavingCompanyProfile, setIsSavingCompanyProfile] = useState(false);
  const [isSyncingQuickBooks, setIsSyncingQuickBooks] = useState(false); // NEW: State for QuickBooks sync loading

  useEffect(() => {
    if (companyProfile) {
      setCompanyName(companyProfile.name);
      setCompanyAddress(companyProfile.address);
      setCompanyCurrency(companyProfile.currency);
    }
  }, [companyProfile]);

  const handleSaveCompanyProfile = async () => {
    setIsSavingCompanyProfile(true);
    try {
      await setCompanyProfile({
        name: companyName,
        address: companyAddress,
        currency: companyCurrency,
      });
      showSuccess("Company profile updated successfully!");
    } catch (error: any) {
      showError(`Failed to update company profile: ${error.message}`);
    } finally {
      setIsSavingCompanyProfile(false);
    }
  };

  const handleConnectQuickBooks = () => {
    if (!profile?.id) {
      showError("You must be logged in to connect to QuickBooks.");
      return;
    }

    const clientId = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;
    // const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // REMOVED: No longer needed for explicit URL

    if (!clientId) {
      showError("QuickBooks Client ID is not configured. Please add VITE_QUICKBOOKS_CLIENT_ID to your .env file.");
      return;
    }
    // if (!supabaseUrl) { // REMOVED: No longer needed for explicit URL
    //   showError("Supabase URL is not configured. Please add VITE_SUPABASE_URL to your .env file.");
    //   return;
    // }

    // Construct the OAuth 2.0 authorization URL
    // The redirect URI MUST match the one registered in your QuickBooks Developer Portal
    // and the one used in the Edge Function.
    // Using explicit Supabase project ID and function name for redirect URI
    const redirectUri = `https://nojumocxivfjsbqnnkqe.supabase.co/functions/v1/quickbooks-oauth-callback`;
    
    const scope = "com.intuit.quickbooks.accounting openid profile email address phone"; // Required scopes
    const responseType = "code";
    const state = profile.id; // Use profile.id as state to identify the user

    const authUrl = `https://appcenter.intuit.com/app/connect/oauth2?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&state=${state}`;
    
    window.location.href = authUrl;
  };

  const handleDisconnectQuickBooks = async () => {
    if (!profile?.quickbooksAccessToken) {
      showError("Not connected to QuickBooks.");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ quickbooks_access_token: null, quickbooks_refresh_token: null })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;

      await fetchProfile(); // Refresh profile context
      showSuccess("Disconnected from QuickBooks.");
    } catch (error: any) {
      console.error("Error disconnecting QuickBooks:", error);
      showError(`Failed to disconnect from QuickBooks: ${error.message}`);
    }
  };

  // NEW: Function to trigger sales order sync
  const handleSyncSalesOrders = async () => {
    if (!profile?.quickbooksAccessToken) {
      showError("QuickBooks is not connected. Please connect your account first.");
      return;
    }
    setIsSyncingQuickBooks(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
       console.log("Client-side session before sync:", session);
      console.log("Client-side access token before sync:", session?.access_token);
      
      if (!session) {
        showError("You must be logged in to sync with QuickBooks.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-sales-orders-to-quickbooks', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      showSuccess(data.message || "Sales orders synced successfully!");
      console.log("QuickBooks Sync Results:", data.results);
      await fetchProfile(); // Refresh profile to ensure quickbooks_synced status is updated
    } catch (error: any) {
      console.error("Error syncing sales orders to QuickBooks:", error);
      showError(`Failed to sync sales orders: ${error.message}`);
    } finally {
      setIsSyncingQuickBooks(false);
    }
  };

  const hasCompanyProfileChanges =
    companyName !== (companyProfile?.name || "") ||
    companyAddress !== (companyProfile?.address || "") ||
    companyCurrency !== (companyProfile?.currency || "USD");

  return (
    <div className="flex flex-col space-y-6 p-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>Manage your company's basic information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCurrency">Default Currency</Label>
              <Select value={companyCurrency} onValueChange={setCompanyCurrency}>
                <SelectTrigger id="companyCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  {/* Add more currencies as needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyAddress">Company Address</Label>
            <Textarea
              id="companyAddress"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveCompanyProfile} disabled={isSavingCompanyProfile || !hasCompanyProfileChanges}>
            {isSavingCompanyProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Company Profile"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-6 w-6 text-primary" /> QuickBooks Integration
          </CardTitle>
          <CardDescription>
            Connect your Fortress account with QuickBooks for seamless accounting synchronization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.quickbooksAccessToken ? (
            <div className="flex flex-col gap-2">
              <p className="text-green-500 font-semibold">
                <CheckCircle className="inline h-4 w-4 mr-2" /> Connected to QuickBooks!
              </p>
              <p className="text-sm text-muted-foreground">
                Your Fortress account is linked. You can now synchronize data.
              </p>
              <Button onClick={handleSyncSalesOrders} disabled={isSyncingQuickBooks}> {/* NEW: Sync button */}
                {isSyncingQuickBooks ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" /> Sync Sales Orders to QuickBooks
                  </>
                )}
              </Button>
              <Button variant="destructive" onClick={handleDisconnectQuickBooks}>
                Disconnect QuickBooks
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">
                Connect your QuickBooks account to enable automatic syncing of orders, inventory, and more.
              </p>
              <Button onClick={handleConnectQuickBooks} disabled={!profile?.id}>
                Connect to QuickBooks
              </Button>
              {!profile?.id && (
                <p className="text-sm text-red-500">
                  Please log in to connect to QuickBooks.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;