import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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
import { Link } from "react-router-dom";
import { FileText, Plug, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react"; // NEW: Import AlertTriangle
import { supabase } from "@/lib/supabaseClient";

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile, isLoadingProfile, fetchProfile } = useProfile();
  const { companyProfile, setCompanyProfile, locations, addLocation, removeLocation } = useOnboarding();

  const [companyName, setCompanyName] = useState(companyProfile?.name || "");
  const [companyAddress, setCompanyAddress] = useState(companyProfile?.address || "");
  const [companyCurrency, setCompanyCurrency] = useState(companyProfile?.currency || "USD");
  const [isSavingCompanyProfile, setIsSavingCompanyProfile] = useState(false);
  const [isSyncingQuickBooks, setIsSyncingQuickBooks] = useState(false);

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

    if (!clientId) {
      showError("QuickBooks Client ID is not configured. Please add VITE_QUICKBOOKS_CLIENT_ID to your .env file.");
      return;
    }

    const redirectUri = `https://nojumocxivfjsbqnnkqe.supabase.co/functions/v1/quickbooks-oauth-callback`;
    
    const scope = "com.intuit.quickbooks.accounting openid profile email address phone";
    const responseType = "code";
    const state = profile.id;

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
        .update({ quickbooks_access_token: null, quickbooks_refresh_token: null, quickbooks_realm_id: null }) // NEW: Also clear realm_id
        .eq('id', profile.id);
      
      if (updateError) throw updateError;

      await fetchProfile();
      showSuccess("Disconnected from QuickBooks.");
    } catch (error: any) {
      console.error("Error disconnecting QuickBooks:", error);
      showError(`Failed to disconnect from QuickBooks: ${error.message}`);
    }
  };

  const handleSyncSalesOrders = async () => {
    if (!profile?.quickbooksAccessToken || !profile?.quickbooksRealmId) { // NEW: Check for realmId
      showError("QuickBooks is not fully connected. Please ensure your QuickBooks company is selected and try connecting again.");
      return;
    }
    setIsSyncingQuickBooks(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
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
      await fetchProfile();
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

  const isQuickBooksConnected = profile?.quickbooksAccessToken && profile?.quickbooksRefreshToken && profile?.quickbooksRealmId;
  const isQuickBooksPartiallyConnected = profile?.quickbooksAccessToken && profile?.quickbooksRefreshToken && !profile?.quickbooksRealmId;


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
          {isQuickBooksConnected ? (
            <div className="flex flex-col gap-2">
              <p className="text-green-500 font-semibold">
                <CheckCircle className="inline h-4 w-4 mr-2" /> Connected to QuickBooks!
              </p>
              <p className="text-sm text-muted-foreground">
                Your Fortress account is linked. You can now synchronize data.
              </p>
              <Button onClick={handleSyncSalesOrders} disabled={isSyncingQuickBooks}>
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
              {isQuickBooksPartiallyConnected && ( // NEW: Display specific warning for partial connection
                <p className="text-sm text-yellow-500 flex items-center gap-1 mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  QuickBooks tokens received, but company (realmId) not saved. Please ensure you select a company during the QuickBooks authorization flow. If the issue persists, verify your `redirect_uri` in the Intuit Developer portal.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                **Important:** Ensure the following `redirect_uri` is registered in your Intuit Developer application settings:
                <code className="block bg-muted/20 p-1 rounded-sm mt-1 text-xs font-mono break-all">
                  https://nojumocxivfjsbqnnkqe.supabase.co/functions/v1/quickbooks-oauth-callback
                </code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;