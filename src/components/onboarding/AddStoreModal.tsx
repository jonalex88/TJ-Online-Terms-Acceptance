import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store } from "@/types/onboarding";

interface AddStoreModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (store: Partial<Store>) => void;
  initialData?: Store;
}

const AddStoreModal = ({ open, onClose, onSave, initialData }: AddStoreModalProps) => {
  const [form, setForm] = useState({
    storeName: initialData?.storeName || "",
    storeCode: initialData?.storeCode || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    province: initialData?.province || "",
    postalCode: initialData?.postalCode || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    terminalCount: initialData?.terminalCount || 1,
  });

  const update = (field: string, value: string | number) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.storeName.trim()) return;
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Store Name *</Label>
              <Input value={form.storeName} onChange={(e) => update("storeName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Store Code</Label>
              <Input value={form.storeCode} onChange={(e) => update("storeCode", e.target.value)} />
            </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Number of Terminals</Label>
            <Input type="number" min={1} value={form.terminalCount} onChange={(e) => update("terminalCount", parseInt(e.target.value) || 1)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.storeName.trim()}>Save Store</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStoreModal;
