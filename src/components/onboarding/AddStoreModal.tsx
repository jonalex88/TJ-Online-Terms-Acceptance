import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store } from "@/types/onboarding";

const BRANDS = [
  "Checkers",
  "Pick n Pay",
  "Woolworths",
  "Spar",
  "Shoprite",
  "Clicks",
  "Dis-Chem",
  "Edgars",
  "Truworths",
  "Mr Price",
  "Pepkor",
  "The Foschini Group",
  "Other",
];

const POS_PROVIDERS = [
  "Hisense",
  "PAX Technology",
  "Verifone",
  "Ingenico",
  "Yoco",
  "iKhokha",
  "Netsol",
  "Paycorp",
  "Synthesis",
  "Other",
];

const ACQUIRING_BANKS = [
  "ABSA",
  "Capitec",
  "Discovery Bank",
  "First National Bank (FNB)",
  "Nedbank",
  "Standard Bank",
  "Tymebank",
  "Other",
];

interface AddStoreModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (store: Partial<Store>) => void;
  initialData?: Store;
}

const AddStoreModal = ({ open, onClose, onSave, initialData }: AddStoreModalProps) => {
  const [form, setForm] = useState({
    brand: initialData?.brand || "",
    tradingSiteName: initialData?.tradingSiteName || "",
    posProvider: initialData?.posProvider || "",
    buildingName: initialData?.buildingName || "",
    buildingNumber: initialData?.buildingNumber || "",
    streetNumber: initialData?.streetNumber || "",
    streetAddress: initialData?.streetAddress || "",
    suburb: initialData?.suburb || "",
    city: initialData?.city || "",
    province: initialData?.province || "",
    country: initialData?.country || "",
    postalCode: initialData?.postalCode || "",
    counterDevices: initialData?.counterDevices ?? 0,
    mobileDevices: initialData?.mobileDevices ?? 0,
    acquiringBank: initialData?.acquiringBank || "",
    acquiringBankMid: initialData?.acquiringBankMid || "",
  });

  const update = (field: string, value: string | number) => setForm((prev) => ({ ...prev, [field]: value }));

  const isValid = form.tradingSiteName.trim() && form.posProvider && form.acquiringBank && form.acquiringBankMid.trim();

  const handleSave = () => {
    if (!isValid) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Store" : "Add Store"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select value={form.brand} onValueChange={(value) => update("brand", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a brand (optional)" />
              </SelectTrigger>
              <SelectContent>
                {BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Trading As Site Name *</Label>
            <Input value={form.tradingSiteName} onChange={(e) => update("tradingSiteName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>POS Provider *</Label>
            <Select value={form.posProvider} onValueChange={(value) => update("posProvider", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a POS provider" />
              </SelectTrigger>
              <SelectContent>
                {POS_PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 border-t pt-4">
            <p className="font-semibold text-sm">Site Address</p>
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
          <div className="space-y-3 border-t pt-4">
            <p className="font-semibold text-sm">Payment Devices</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Counter Payment Devices</Label>
                <Input type="number" min={0} value={form.counterDevices} onChange={(e) => update("counterDevices", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Mobile Payment Devices</Label>
                <Input type="number" min={0} value={form.mobileDevices} onChange={(e) => update("mobileDevices", parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>
          <div className="space-y-3 border-t pt-4">
            <p className="font-semibold text-sm">Acquiring Details</p>
            <div className="space-y-2">
              <Label>Acquiring Bank *</Label>
              <Select value={form.acquiringBank} onValueChange={(value) => update("acquiringBank", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an acquiring bank" />
                </SelectTrigger>
                <SelectContent>
                  {ACQUIRING_BANKS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Acquiring Bank MID *</Label>
              <Input value={form.acquiringBankMid} onChange={(e) => update("acquiringBankMid", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid}>Save Store</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStoreModal;
