import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Contact } from "@/types/onboarding";
import { toast } from "sonner";

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => void;
  initialData?: Contact;
}

const AddContactModal = ({ open, onClose, onSave, initialData }: AddContactModalProps) => {
  const getInitialForm = (data?: Contact) => ({
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    email: data?.email || "",
    phone: data?.phone || "",
    designation: data?.designation || "",
    receiveInvoices: data?.receiveInvoices || false,
    allowMarketing: data?.allowMarketing || false,
  });

  const [form, setForm] = useState(getInitialForm(initialData));

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(initialData));
    }
  }, [initialData, open]);

  const update = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleReceiveInvoicesChange = (checked: boolean) => {
    if (!checked && form.receiveInvoices) {
      toast.message("to change this, set another user to receive invoices");
      return;
    }

    update("receiveInvoices", checked);
  };

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
          <div className="space-y-2">
            <Label>Designation</Label>
            <Input value={form.designation} onChange={(e) => update("designation", e.target.value)} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="receiveInvoices"
                checked={form.receiveInvoices}
                onCheckedChange={(checked) => handleReceiveInvoicesChange(Boolean(checked))}
              />
              <Label htmlFor="receiveInvoices" className="font-normal cursor-pointer">
                {form.receiveInvoices
                  ? "Invoices should be sent to this contact"
                  : "set this user to receive invoices."}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowMarketing"
                checked={form.allowMarketing}
                onCheckedChange={(checked) => update("allowMarketing", checked as boolean)}
              />
              <Label htmlFor="allowMarketing" className="font-normal cursor-pointer">
                Allow TJ to send information to this contact (every email will have an opt out link)
              </Label>
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
