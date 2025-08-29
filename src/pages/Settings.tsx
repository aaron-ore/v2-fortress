import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
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

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [pendingTheme, setPendingTheme] = useState(theme);
  const { profile, updateProfile, isLoadingProfile } = useProfile();
  const { companyProfile, setCompanyProfile, locations, addLocation, removeLocation } = useOnboarding();

  const [companyName, setCompanyName] = useState(companyProfile?.name || "");
  const [companyAddress, setCompanyAddress] = useState(companyProfile?.address || "");
  const [companyCurrency, setCompanyCurrency] = useState(companyProfile?.currency || "USD");
  const [newLocation, setNewLocation] = useState("");
  const [isSavingCompanyProfile, setIsSavingCompanyProfile] = useState(false);

  useEffect(() => {
    setPendingTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (companyProfile) {
      setCompanyName(companyProfile.name);
      setCompanyAddress(companyProfile.address);
      setCompanyCurrency(companyProfile.currency);
    }
  }, [companyProfile]);

  const handleSaveTheme = () => {
    setTheme(pendingTheme);
    showSuccess("Theme updated successfully!");
  };

  const handleCancelTheme = () => {
    setPendingTheme(theme);
  };

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

  const handleAddLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      addLocation(newLocation.trim());
      setNewLocation("");
      showSuccess(`Location "${newLocation.trim()}" added.`);
    } else if (locations.includes(newLocation.trim())) {
      showError(`Location "${newLocation.trim()}" already exists.`);
    }
  };

  const handleRemoveLocation = (locationToRemove: string) => {
    removeLocation(locationToRemove);
    showSuccess(`Location "${locationToRemove}" removed.`);
  };

  const hasThemeChanges = pendingTheme !== theme;
  const hasCompanyProfileChanges =
    companyName !== (companyProfile?.name || "") ||
    companyAddress !== (companyProfile?.address || "") ||
    companyCurrency !== (companyProfile?.currency || "USD");

  return (
    <div className="flex flex-col space-y-6 p-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Customize the appearance of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={pendingTheme} onValueChange={setPendingTheme}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark">Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system">System</Label>
            </div>
          </RadioGroup>

          {hasThemeChanges && (
            <div className="mt-4 flex space-x-2">
              <Button onClick={handleSaveTheme}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancelTheme}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
          <CardTitle>Inventory Locations</CardTitle>
          <CardDescription>Manage the physical locations where your inventory is stored.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Add new location"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLocation();
                }
              }}
            />
            <Button onClick={handleAddLocation}>Add Location</Button>
          </div>
          <div className="space-y-2">
            {locations.length === 0 ? (
              <p className="text-muted-foreground">No locations added yet.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {locations.map((loc, index) => (
                  <li key={index} className="flex items-center justify-between">
                    {loc}
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveLocation(loc)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Other settings sections can go here */}
    </div>
  );
};

export default Settings;