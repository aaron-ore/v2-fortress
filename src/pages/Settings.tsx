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
import { Loader2, Palette, Settings as SettingsIcon } from "lucide-react"; // NEW: Import SettingsIcon
import { useOnboarding } from "@/context/OnboardingContext";
import { Link } from "react-router-dom";
// REMOVED: import { FileText, Plug, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";
// REMOVED: import { supabase } from "@/lib/supabaseClient";

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme(); // Current active theme from next-themes
  const { profile, updateProfile, isLoadingProfile, fetchProfile, updateOrganizationTheme } = useProfile(); // NEW: Get updateOrganizationTheme
  const { companyProfile, setCompanyProfile, locations, addLocation, removeLocation } = useOnboarding();

  const [companyName, setCompanyName] = useState(companyProfile?.name || "");
  const [companyAddress, setCompanyAddress] = useState(companyProfile?.address || "");
  const [companyCurrency, setCompanyCurrency] = useState(companyProfile?.currency || "USD");
  const [isSavingCompanyProfile, setIsSavingCompanyProfile] = useState(false);
  const [organizationCodeInput, setOrganizationCodeInput] = useState(profile?.organizationCode || ""); // NEW: State for organization code input
  const [isSavingOrganizationCode, setIsSavingOrganizationCode] = useState(false); // NEW: State for saving organization code

  useEffect(() => {
    if (companyProfile) {
      setCompanyName(companyProfile.name);
      setCompanyAddress(companyProfile.address);
      setCompanyCurrency(companyProfile.currency);
    }
  }, [companyProfile]);

  // NEW: Update organizationCodeInput when profile.organizationCode changes
  useEffect(() => {
    if (profile?.organizationCode) {
      setOrganizationCodeInput(profile.organizationCode);
    }
  }, [profile?.organizationCode]);

  const handleSaveCompanyProfile = async () => {
    setIsSavingCompanyProfile(true);
    try {
      // Pass the current organizationCodeInput when saving company profile
      await setCompanyProfile({
        name: companyName,
        address: companyAddress,
        currency: companyCurrency,
      }, organizationCodeInput); // Pass organizationCodeInput
      showSuccess("Company profile updated successfully!");
    } catch (error: any) {
      showError(`Failed to update company profile: ${error.message}`);
    } finally {
      setIsSavingCompanyProfile(false);
    }
  };

  const handleSaveOrganizationCode = async () => {
    if (!profile?.organizationId) {
      showError("Organization not found. Please set up your company profile first.");
      return;
    }
    if (!organizationCodeInput.trim()) {
      showError("Organization Code cannot be empty.");
      return;
    }
    if (organizationCodeInput === profile.organizationCode) {
      showSuccess("No changes to save for Organization Code.");
      return;
    }

    setIsSavingOrganizationCode(true);
    try {
      // Call setCompanyProfile with current company profile data and the new unique code
      await setCompanyProfile({
        name: companyName,
        address: companyAddress,
        currency: companyCurrency,
      }, organizationCodeInput.trim());
      showSuccess("Organization Code updated successfully!");
    } catch (error: any) {
      showError(`Failed to update Organization Code: ${error.message}`);
    } finally {
      setIsSavingOrganizationCode(false);
    }
  };

  const hasCompanyProfileChanges =
    companyName !== (companyProfile?.name || "") ||
    companyAddress !== (companyProfile?.address || "") ||
    companyCurrency !== (companyProfile?.currency || "USD");

  const hasOrganizationCodeChanges = organizationCodeInput !== (profile?.organizationCode || "");

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

      {/* NEW: Organization Code Settings */}
      {profile?.role === 'admin' && profile?.organizationId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-6 w-6 text-primary" /> Organization Code
            </CardTitle>
            <CardDescription>
              Set or update the unique code for your organization. New users can use this code to join.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationCode">Unique Organization Code</Label>
              <Input
                id="organizationCode"
                value={organizationCodeInput}
                onChange={(e) => setOrganizationCodeInput(e.target.value)}
                placeholder="e.g., MYCOMPANY123"
              />
            </div>
            <Button onClick={handleSaveOrganizationCode} disabled={isSavingOrganizationCode || !hasOrganizationCodeChanges}>
              {isSavingOrganizationCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Code...
                </>
              ) : (
                "Save Organization Code"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;