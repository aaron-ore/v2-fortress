import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboarding } from "@/context/OnboardingContext";
import { showError } from "@/utils/toast";

interface CompanyProfileStepProps {
  onNext: () => void;
  onBack?: () => void; // Added onBack prop
}

const CompanyProfileStep: React.FC<CompanyProfileStepProps> = ({ onNext }) => {
  const { companyProfile, setCompanyProfile } = useOnboarding();
  const [companyName, setCompanyName] = useState(companyProfile?.name || "");
  const [currency, setCurrency] = useState(companyProfile?.currency || "USD");
  const [address, setAddress] = useState(companyProfile?.address || "");

  const handleSave = () => {
    if (!companyName || !currency || !address) {
      showError("Please fill in all company profile fields.");
      return;
    }
    setCompanyProfile({ name: companyName, currency, address });
    onNext();
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-foreground">Company Profile</h2>
      <p className="text-muted-foreground">Let's start by setting up your basic company information.</p>

      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Acme Corp"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Default Currency <span className="text-red-500">*</span></Label>
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
        <div className="space-y-2">
          <Label htmlFor="address">Company Address <span className="text-red-500">*</span></Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Business Rd, Suite 100, City, State, Zip"
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave}>Next</Button>
      </div>
    </div>
  );
};

export default CompanyProfileStep;