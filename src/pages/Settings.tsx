import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationPreferencesDialog from "@/components/settings/NotificationPreferencesDialog";
import ManageLocationsDialog from "@/components/ManageLocationsDialog";
import { useOnboarding } from "@/context/OnboardingContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/lib/supabaseClient";

const Settings: React.FC = () => {
  const { companyProfile, setCompanyProfile } = useOnboarding();
  const { profile } = useProfile();

  // Company Logo State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);

  // Company Profile State
  const [companyName, setCompanyName] = useState(companyProfile?.name || "");
  const [currency, setCurrency] = useState(companyProfile?.currency || "USD");
  const [address, setAddress] = useState(companyProfile?.address || "");

  // Inventory Defaults State
  const [defaultReorderLevel, setDefaultReorderLevel] = useState<string>(() => localStorage.getItem("defaultReorderLevel") || "10");
  const [defaultUnitOfMeasure, setDefaultUnitOfMeasure] = useState<string>(() => localStorage.getItem("defaultUnitOfMeasure") || "Units");

  // Order Defaults State
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState<string>(() => localStorage.getItem("defaultPaymentTerms") || "Net 30");
  const [defaultShippingMethod, setDefaultShippingMethod] = useState<string>(() => localStorage.getItem("defaultShippingMethod") || "Standard");

  // Dashboard View Preference State
  const [dashboardViewPreference, setDashboardViewPreference] = useState<"default" | "classic">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem("dashboardViewPreference") as "default" | "classic") || "default";
    }
    return "default";
  });

  // Organization Code State
  const [organizationCode, setOrganizationCode] = useState<string | null>(null);

  // Dialog States
  const [isNotificationPreferencesDialogOpen, setIsNotificationPreferencesDialogOpen] = useState(false);
  const [isManageLocationsDialogOpen, setIsManageLocationsDialogOpen] = useState(false);

  useEffect(() => {
    // Load saved logo from local storage on component mount
    const storedLogo = localStorage.getItem("companyLogo");
    if (storedLogo) {
      setSavedLogoUrl(storedLogo);
    }

    // Fetch organization code if profile and organizationId exist
    const fetchOrganizationCode = async () => {
      if (profile?.organizationId) {
        const { data, error } = await supabase
          .from('organizations')
          .select('unique_code')
          .eq('id', profile.organizationId)
          .single();

        if (error) {
          console.error("Error fetching organization code:", error);
          showError("Failed to load organization code.");
        } else if (data) {
          setOrganizationCode(data.unique_code);
        }
      } else {
        setOrganizationCode(null);
      }
    };

    fetchOrganizationCode();
  }, [profile?.organizationId]);

  // Handlers for Dialogs
  const handleIntegrationSetup = () => showSuccess("Setting up third-party integrations (placeholder).");
  const handleNotificationPreferences = () => setIsNotificationPreferencesDialogOpen(true);
  const handleManageLocations = () => setIsManageLocationsDialogOpen(true);

  // Handlers for Company Logo
  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type.startsWith("image/")) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSavedLogoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        showError("Please select an image file for the logo.");
        setLogoFile(null);
        setSavedLogoUrl(null);
      }
    } else {
      setLogoFile(null);
      setSavedLogoUrl(null);
    }
  };

  const handleSaveLogo = () => {
    if (savedLogoUrl) {
      localStorage.setItem("companyLogo", savedLogoUrl);
      showSuccess("Company logo saved successfully!");
    } else {
      showError("No logo selected to save.");
    }
  };

  const handleRemoveLogo = () => {
    localStorage.removeItem("companyLogo");
    setLogoFile(null);
    setSavedLogoUrl(null);
    showSuccess("Company logo removed.");
  };

  // Handlers for Company Profile
  const handleSaveCompanyProfile = () => {
    if (!companyName.trim() || !currency.trim() || !address.trim()) {
      showError("Company Name, Currency, and Address are required.");
      return;
    }
    setCompanyProfile({ name: companyName.trim(), currency: currency.trim(), address: address.trim() });
    showSuccess("Company profile saved!");
  };

  // Handlers for Inventory Defaults
  const handleSaveInventoryDefaults = () => {
    const parsedReorderLevel = parseInt(defaultReorderLevel);
    if (isNaN(parsedReorderLevel) || parsedReorderLevel < 0) {
      showError("Default Reorder Level must be a non-negative number.");
      return;
    }
    localStorage.setItem("defaultReorderLevel", defaultReorderLevel);
    localStorage.setItem("defaultUnitOfMeasure", defaultUnitOfMeasure);
    showSuccess("Inventory default settings saved!");
  };

  // Handlers for Order Defaults
  const handleSaveOrderDefaults = () => {
    if (!defaultPaymentTerms.trim() || !defaultShippingMethod.trim()) {
      showError("Default Payment Terms and Shipping Method are required.");
      return;
    }
    localStorage.setItem("defaultPaymentTerms", defaultPaymentTerms);
    localStorage.setItem("defaultShippingMethod", defaultShippingMethod);
    showSuccess("Order default settings saved!");
  };

  // Handler for Dashboard View Preference
  const handleSaveDashboardViewPreference = () => {
    localStorage.setItem("dashboardViewPreference", dashboardViewPreference);
    showSuccess("Dashboard view preference saved!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="flex flex-wrap items-center gap-2"> {/* Added flex-wrap for mobile */}
        <Button variant="outline" onClick={handleIntegrationSetup}>Integration Setup</Button>
        <Button variant="outline" onClick={handleNotificationPreferences}>Notification Preferences</Button>
        <Button variant="outline" onClick={handleManageLocations}>Manage Locations</Button>
      </div>

      {/* Company Profile Card */}
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Update your company's basic information.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($) - United States Dollar</SelectItem>
                  <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                  <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD ($) - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD ($) - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Company Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Business Rd, Suite 100, City, State, Zip"
                rows={2}
              />
            </div>
          </div>
          <Button onClick={handleSaveCompanyProfile}>Save Company Profile</Button>
        </CardContent>
      </Card>

      {/* Company Logo Card */}
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Company Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Upload your company logo for documents and branding.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4"> {/* Adjusted for mobile stacking */}
            <div className="flex-shrink-0 w-24 h-24 border border-dashed border-border rounded-md flex items-center justify-center overflow-hidden">
              {savedLogoUrl ? (
                <img src={savedLogoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-muted-foreground text-sm text-center">No Logo</span>
              )}
            </div>
            <div className="flex-grow space-y-2 w-full sm:w-auto"> {/* Full width on small screens */}
              <Input
                id="companyLogo"
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="file:text-primary file:bg-primary/10 file:border-primary"
              />
              <div className="flex gap-2 flex-wrap"> {/* Added flex-wrap for mobile */}
                <Button onClick={handleSaveLogo} disabled={!logoFile && !savedLogoUrl}>Save Logo</Button>
                <Button variant="outline" onClick={handleRemoveLogo} disabled={!savedLogoUrl}>Remove Logo</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Defaults Card */}
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Inventory Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Set default values for new inventory items.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultReorderLevel">Default Reorder Level</Label>
              <Input
                id="defaultReorderLevel"
                type="number"
                value={defaultReorderLevel}
                onChange={(e) => setDefaultReorderLevel(e.target.value)}
                placeholder="e.g., 10"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultUnitOfMeasure">Default Unit of Measure</Label>
              <Input
                id="defaultUnitOfMeasure"
                value={defaultUnitOfMeasure}
                onChange={(e) => setDefaultUnitOfMeasure(e.target.value)}
                placeholder="e.g., Units, Pieces, Boxes"
              />
            </div>
          </div>
          <Button onClick={handleSaveInventoryDefaults}>Save Inventory Defaults</Button>
        </CardContent>
      </Card>

      {/* Order Defaults Card */}
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Order Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Set default values for new purchase orders and invoices.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
              <Input
                id="defaultPaymentTerms"
                value={defaultPaymentTerms}
                onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                placeholder="e.g., Net 30, Due on Receipt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultShippingMethod">Default Shipping Method</Label>
              <Input
                id="defaultShippingMethod"
                value={defaultShippingMethod}
                onChange={(e) => setDefaultShippingMethod(e.target.value)}
                placeholder="e.g., Standard, Express, Freight"
              />
            </div>
          </div>
          <Button onClick={handleSaveOrderDefaults}>Save Order Defaults</Button>
        </CardContent>
      </Card>

      {/* Dashboard View Preference Card */}
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Dashboard View Preference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Choose your preferred dashboard layout.</p>
          <div className="space-y-2">
            <Label htmlFor="dashboardViewPreference">Dashboard Layout</Label>
            <Select value={dashboardViewPreference} onValueChange={(value: "default" | "classic") => setDashboardViewPreference(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select view preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Modern Cards)</SelectItem>
                <SelectItem value="classic">Classic (Spreadsheet-like)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveDashboardViewPreference}>Save Preference</Button>
        </CardContent>
      </Card>

      {/* Organization Code Card */}
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Organization Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your organization's unique code. Share this with new users to invite them to your organization.
          </p>
          <div className="space-y-2">
            <Label htmlFor="organizationCode">Unique Organization Code</Label>
            <Input
              id="organizationCode"
              value={organizationCode || "Loading..."}
              readOnly
              className="font-mono bg-muted"
            />
          </div>
          {organizationCode && (
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(organizationCode);
                showSuccess("Organization code copied to clipboard!");
              }}
            >
              Copy Code
            </Button>
          )}
        </CardContent>
      </Card>

      <NotificationPreferencesDialog
        isOpen={isNotificationPreferencesDialogOpen}
        onClose={() => setIsNotificationPreferencesDialogOpen(false)}
      />
      <ManageLocationsDialog
        isOpen={isManageLocationsDialogOpen}
        onClose={() => setIsManageLocationsDialogOpen(false)}
      />
    </div>
  );
};

export default Settings;