import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationPreferencesDialog from "@/components/settings/NotificationPreferencesDialog";
import ManageLocationsDialog from "@/components/ManageLocationsDialog"; // New import
import { useOnboarding } from "@/context/OnboardingContext";
import { useProfile } from "@/context/ProfileContext"; // Import useProfile
import { supabase } from "@/lib/supabaseClient"; // Import supabase

const Settings: React.FC = () => {
  const { companyProfile, setCompanyProfile } = useOnboarding();
  const { profile } = useProfile(); // Get current user's profile

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
  const [isManageLocationsDialogOpen, setIsManageLocationsDialogOpen] = useState(false); // New state for locations dialog

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
  const handleManageLocations = () => setIsManageLocationsDialogOpen(true); // New handler

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
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={handleIntegrationSetup}>Integration Setup</Button>
        <Button variant="outline" onClick={handleNotificationPreferences}>Notification Preferences</Button>
        <Button variant="outline" onClick={handleManageLocations}>Manage Locations</Button> {/* New button */}
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
                rows={3}
              />
            </div>
          </div>
          <Button onClick={handleSaveCompanyProfile}>Save Company Profile</Button>
        </CardContent>
      </Card>

      {/* Organization Code Card (New) */}
      {profile?.role === 'admin' && profile.organizationId && (
        <Card className="bg-card border-border rounded-lg p-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Your Company Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Share this unique code with new users so they can join your organization when they sign up.
            </p>
            <div className="flex items-center space-x-2">
              <Input
                id="organizationCode"
                value={organizationCode || "Loading..."}
                readOnly
                className="font-mono text-lg"
              />
              <Button onClick={() => {
                if (organizationCode) {
                  navigator.clipboard.writeText(organizationCode);
                  showSuccess("Company code copied to clipboard!");
                }
              }}>Copy Code</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              New users can enter this code during their sign-up process to automatically be assigned to your company.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inventory Defaults Card */}
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Inventory Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Set default values for new inventory items and general inventory behavior.</p>
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
              <Select value={defaultUnitOfMeasure} onValueChange={setDefaultUnitOfMeasure}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Units">Units</SelectItem>
                  <SelectItem value="Pieces">Pieces</SelectItem>
                  <SelectItem value="KG">KG (Kilograms)</SelectItem>
                  <SelectItem value="LBS">LBS (Pounds)</SelectItem>
                  <SelectItem value="Boxes">Boxes</SelectItem>
                </SelectContent>
              </Select>
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
          <p className="text-muted-foreground">Configure default settings for new sales and purchase orders.</p>
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
              <Select value={defaultShippingMethod} onValueChange={setDefaultShippingMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard Shipping</SelectItem>
                  <SelectItem value="Express">Express Shipping</SelectItem>
                  <SelectItem value="Pickup">Local Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSaveOrderDefaults}>Save Order Defaults</Button>
        </CardContent>
      </Card>

      {/* Dashboard View Preference Card */}
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Dashboard View</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Choose your preferred dashboard layout.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dashboardView">Dashboard Layout</Label>
              <Select value={dashboardViewPreference} onValueChange={(value: "default" | "classic") => setDashboardViewPreference(value)}>
                <SelectTrigger id="dashboardView">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default View</SelectItem>
                  <SelectItem value="classic">Classic View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSaveDashboardViewPreference}>Save Dashboard View</Button>
        </CardContent>
      </Card>

      {/* Company Logo Card (already existing) */}
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Company Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Upload your company logo to appear on documents like Purchase Orders.</p>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="companyLogo">Upload Logo (PNG, JPG, SVG)</Label>
            <Input id="companyLogo" type="file" accept="image/*" onChange={handleLogoFileChange} />
          </div>
          {savedLogoUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Current Logo Preview:</p>
              <img src={savedLogoUrl} alt="Company Logo Preview" className="max-w-[150px] max-h-[100px] object-contain border border-border p-2 rounded-md" />
            </div>
          )}
          <div className="flex space-x-2 mt-4">
            <Button onClick={handleSaveLogo} disabled={!logoFile && !savedLogoUrl}>Save Logo</Button>
            <Button variant="outline" onClick={handleRemoveLogo} disabled={!savedLogoUrl}>Remove Logo</Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
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