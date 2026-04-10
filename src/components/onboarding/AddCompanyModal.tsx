import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Company } from "@/types/onboarding";

const INDUSTRIES = [
  "Retail",
  "Hospitality",
  "Food & Beverage",
  "Health & Wellness",
  "Professional Services",
  "Education",
  "Technology",
  "Finance",
  "Manufacturing",
  "Transportation",
  "Construction",
  "Real Estate",
  "Entertainment",
  "Other",
];

interface AddCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (company: Partial<Company>) => void;
  initialData?: Company;
}

const AddCompanyModal = ({ open, onClose, onSave, initialData }: AddCompanyModalProps) => {
  const [form, setForm] = useState({
    registeredCompanyName: initialData?.registeredCompanyName || "",
    registrationNumber: initialData?.registrationNumber || "",
    vatNumber: initialData?.vatNumber || "",
    tradingName: initialData?.tradingName || "",
    industry: initialData?.industry || "",
    buildingName: initialData?.buildingName || "",
    buildingNumber: initialData?.buildingNumber || "",
    streetNumber: initialData?.streetNumber || "",
    streetAddress: initialData?.streetAddress || "",
    suburb: initialData?.suburb || "",
    city: initialData?.city || "",
    province: initialData?.province || "",
    country: initialData?.country || "",
    postalCode: initialData?.postalCode || "",
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.registeredCompanyName.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Company" : "Add Company"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Registered Company Name *</Label>
              <Input value={form.registeredCompanyName} onChange={(e) => update("registeredCompanyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Trading As Name *</Label>
              <Input value={form.tradingName} onChange={(e) => update("tradingName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Registration Number *</Label>
              <Input value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>VAT Number</Label>
              <Input value={form.vatNumber} onChange={(e) => update("vatNumber", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Industry *</Label>
            <Select value={form.industry} onValueChange={(value) => update("industry", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 border-t pt-4">
            <p className="font-semibold text-sm">Registered Address</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Building Name</Label>
                <Input value={form.buildingName} onChange={(e) => update("buildingName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Building Number</Label>
                <Input value={form.buildingNumber} onChange={(e) => update("buildingNumber", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Street Number</Label>
                <Input value={form.streetNumber} onChange={(e) => update("streetNumber", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input value={form.streetAddress} onChange={(e) => update("streetAddress", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Suburb</Label>
                <Input value={form.suburb} onChange={(e) => update("suburb", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Province</Label>
                <Input value={form.province} onChange={(e) => update("province", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.registeredCompanyName.trim() || !form.tradingName.trim() || !form.registrationNumber.trim() || !form.industry.trim()}>Save Company</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyModal;
