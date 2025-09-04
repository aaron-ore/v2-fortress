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
import { Loader2, Palette } from "lucide-react"; // NEW: Import Palette icon
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
  const [selectedOrganizationTheme, setSelectedOrganizationTheme] = useState(profile?.organizationTheme || "dark"); // NEW: State for organization theme

  useEffect(() => {
    if (companyProfile) {
      setCompanyName(companyProfile.name);
      setCompanyAddress(companyProfile.address);
      setCompanyCurrency(companyProfile.currency);
    }
  }, [companyProfile]);

  // NEW: Update selectedOrganizationTheme when profile.organizationTheme changes
  useEffect(() => {
    if (profile?.organizationTheme) {
      setSelectedOrganizationTheme(profile.organizationTheme);
    }
  }, [profile?.organizationTheme]);

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

  // NEW: Handle saving organization theme
  const handleSaveOrganizationTheme = async () => {
    if (!profile || profile.role !== 'admin' || !profile.organizationId) {
      showError("You do not have permission to update the organization's theme.");
      return;
    }
    if (selectedOrganizationTheme === profile.organizationTheme) {
      showSuccess("No changes to save for organization theme.");
      return;
    }
    await updateOrganizationTheme(selectedOrganizationTheme);
    // Also apply the theme locally immediately
    setTheme(selectedOrganizationTheme);
  };

  const hasCompanyProfileChanges =
    companyName !== (companyProfile?.name || "") ||
    companyAddress !== (companyProfile?.address || "") ||
    companyCurrency !== (companyProfile?.currency || "USD");

  // NEW: Check for organization theme changes
  const hasOrganizationThemeChanges = selectedOrganizationTheme !== (profile?.organizationTheme || "dark");

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

      {/* NEW: Organization Theme Settings */}
      {profile?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" /> Organization Theme
            </CardTitle>
            <CardDescription>Set the default theme for all users in your organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationTheme">Default Theme</Label>
              <Select value={selectedOrganizationTheme} onValueChange={setSelectedOrganizationTheme}>
                <SelectTrigger id="organizationTheme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark (Default)</SelectItem>
                  <SelectItem value="ocean-breeze">Ocean Breeze</SelectItem>
                  <SelectItem value="sunset-glow">Sunset Glow</SelectItem>
                  <SelectItem value="forest-whisper">Forest Whisper</SelectItem>
                  <SelectItem value="emerald">Emerald</SelectItem>
                  <SelectItem value="deep-forest">Deep Forest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveOrganizationTheme} disabled={!hasOrganizationThemeChanges}>
              Save Organization Theme
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;