import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Company } from "@/types/onboarding";

interface AddCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (company: Partial<Company>) => void;
  initialData?: Company;
}

const AddCompanyModal = ({ open, onClose, onSave, initialData }: AddCompanyModalProps) => {
  const [form, setForm] = useState({
    companyName: initialData?.companyName || "",
    registrationNumber: initialData?.registrationNumber || "",
    vatNumber: initialData?.vatNumber || "",
    tradingName: initialData?.tradingName || "",
    industry: initialData?.industry || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    province: initialData?.province || "",
    postalCode: initialData?.postalCode || "",
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.companyName.trim()) return;
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
              <Label>Company Name *</Label>
              <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Trading Name</Label>
              <Input value={form.tradingName} onChange={(e) => update("tradingName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>VAT Number</Label>
              <Input value={form.vatNumber} onChange={(e) => update("vatNumber", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={form.industry} onChange={(e) => update("industry", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Province</Label>
              <Input value={form.province} onChange={(e) => update("province", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.companyName.trim()}>Save Company</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyModal;
