import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Contact } from "@/types/onboarding";

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => void;
  initialData?: Contact;
}

const AddContactModal = ({ open, onClose, onSave, initialData }: AddContactModalProps) => {
  const [form, setForm] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    role: initialData?.role || "",
    idNumber: initialData?.idNumber || "",
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role / Title</Label>
              <Input value={form.role} onChange={(e) => update("role", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input value={form.idNumber} onChange={(e) => update("idNumber", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.firstName.trim() || !form.lastName.trim()}>Save Contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactModal;
