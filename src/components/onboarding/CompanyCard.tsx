import { useState } from "react";
import { Company, Contact, Store } from "@/types/onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, User, MapPin, Plus, Pencil, Trash2, Upload, FileText } from "lucide-react";
import AddContactModal from "./AddContactModal";
import AddStoreModal from "./AddStoreModal";

interface CompanyCardProps {
  company: Company;
  onUpdateCompany: (company: Company) => void;
  onEditCompany: () => void;
  onDeleteCompany: () => void;
  canDelete: boolean;
}

const CompanyCard = ({ company, onUpdateCompany, onEditCompany, onDeleteCompany, canDelete }: CompanyCardProps) => {
  const [contactModal, setContactModal] = useState<{ open: boolean; editContact?: Contact }>({ open: false });
  const [storeModal, setStoreModal] = useState<{ open: boolean; editStore?: Store }>({ open: false });

  const handleSaveContact = (contactData: Partial<Contact>) => {
    const updated = { ...company };
    if (contactModal.editContact) {
      updated.contacts = updated.contacts.map((c) =>
        c.id === contactModal.editContact!.id ? { ...c, ...contactData } : c
      );
    } else {
      updated.contacts = [...updated.contacts, { id: crypto.randomUUID(), ...contactData } as Contact];
    }
    onUpdateCompany(updated);
  };

  const handleDeleteContact = (contactId: string) => {
    const updated = { ...company, contacts: company.contacts.filter((c) => c.id !== contactId) };
    onUpdateCompany(updated);
  };

  const handleSaveStore = (storeData: Partial<Store>) => {
    const updated = { ...company };
    if (storeModal.editStore) {
      updated.stores = updated.stores.map((s) =>
        s.id === storeModal.editStore!.id ? { ...s, ...storeData } : s
      );
    } else {
      updated.stores = [...updated.stores, { id: crypto.randomUUID(), ...storeData } as Store];
    }
    onUpdateCompany(updated);
  };

  const handleDeleteStore = (storeId: string) => {
    const updated = { ...company, stores: company.stores.filter((s) => s.id !== storeId) };
    onUpdateCompany(updated);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const updated = { ...company };
    Array.from(files).forEach((file) => {
      updated.documents = [
        ...updated.documents,
        {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      ];
    });
    onUpdateCompany(updated);
  };

  const handleDeleteDocument = (docId: string) => {
    const updated = { ...company, documents: company.documents.filter((d) => d.id !== docId) };
    onUpdateCompany(updated);
  };

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {company.companyName || "Unnamed Company"}
                </CardTitle>
                {company.tradingName && (
                  <p className="text-sm text-muted-foreground">t/a {company.tradingName}</p>
                )}
                {company.registrationNumber && (
                  <p className="text-xs text-muted-foreground font-mono">Reg: {company.registrationNumber}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onEditCompany}>
                <Pencil className="h-4 w-4" />
              </Button>
              {canDelete && (
                <Button variant="ghost" size="icon" onClick={onDeleteCompany} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Contacts
                <Badge variant="secondary" className="text-xs">{company.contacts.length}</Badge>
              </h4>
              <Button variant="outline" size="sm" onClick={() => setContactModal({ open: true })}>
                <Plus className="h-3 w-3 mr-1" /> Add Contact
              </Button>
            </div>
            {company.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic pl-6">No contacts added yet</p>
            ) : (
              <div className="space-y-2 pl-6">
                {company.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-muted-foreground">{contact.role} {contact.email && `· ${contact.email}`}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setContactModal({ open: true, editContact: contact })}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteContact(contact.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Stores
                <Badge variant="secondary" className="text-xs">{company.stores.length}</Badge>
              </h4>
              <Button variant="outline" size="sm" onClick={() => setStoreModal({ open: true })}>
                <Plus className="h-3 w-3 mr-1" /> Add Store
              </Button>
            </div>
            {company.stores.length === 0 ? (
              <p className="text-sm text-muted-foreground italic pl-6">No stores added yet</p>
            ) : (
              <div className="space-y-2 pl-6">
                {company.stores.map((store) => (
                  <div key={store.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{store.storeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[store.city, store.province].filter(Boolean).join(", ")}
                        {store.terminalCount > 0 && ` · ${store.terminalCount} terminal${store.terminalCount > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStoreModal({ open: true, editStore: store })}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteStore(store.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Documents
                <Badge variant="secondary" className="text-xs">{company.documents.length}</Badge>
              </h4>
              <label>
                <input type="file" multiple className="hidden" onChange={handleDocumentUpload} />
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="h-3 w-3 mr-1" /> Upload</span>
                </Button>
              </label>
            </div>
            {company.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground italic pl-6">No documents uploaded yet</p>
            ) : (
              <div className="space-y-2 pl-6">
                {company.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{doc.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteDocument(doc.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddContactModal
        open={contactModal.open}
        onClose={() => setContactModal({ open: false })}
        onSave={handleSaveContact}
        initialData={contactModal.editContact}
      />
      <AddStoreModal
        open={storeModal.open}
        onClose={() => setStoreModal({ open: false })}
        onSave={handleSaveStore}
        initialData={storeModal.editStore}
      />
    </>
  );
};

export default CompanyCard;
