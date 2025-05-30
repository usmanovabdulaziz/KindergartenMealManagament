import React, { useEffect, useState } from "react";
import { useApiService } from "@/hooks/useApiService";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "@/components/ui/sonner";

interface Supplier {
  id: number;
  name: string;
  contact_email: string;
  phone: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const Suppliers = () => {
  const { api } = useApiService();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, "id">>({
    name: "",
    contact_email: "",
    phone: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.getSuppliers();
      // Handle both paginated and flat array
      setSuppliers(
        Array.isArray(res)
          ? res
          : Array.isArray(res.results)
          ? res.results
          : []
      );
    } catch {
      toast.error("Failed to load suppliers");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name) {
      toast.error("Supplier name is required");
      return;
    }
    try {
      await api.addSupplier(newSupplier);
      toast.success("Supplier added");
      setNewSupplier({
        name: "",
        contact_email: "",
        phone: "",
        is_active: true,
      });
      fetchSuppliers();
    } catch {
      toast.error("Failed to add supplier");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Suppliers</h1>
      <div className="max-w-md bg-white p-4 rounded shadow space-y-4">
        <h2 className="text-lg font-semibold">Add New Supplier</h2>
        <div className="space-y-2">
          <Label htmlFor="supplier-name">Supplier Name</Label>
          <Input
            id="supplier-name"
            name="name"
            value={newSupplier.name}
            onChange={handleChange}
            placeholder="Supplier name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier-email">Email</Label>
          <Input
            id="supplier-email"
            name="contact_email"
            type="email"
            value={newSupplier.contact_email}
            onChange={handleChange}
            placeholder="Email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier-phone">Phone</Label>
          <Input
            id="supplier-phone"
            name="phone"
            value={newSupplier.phone}
            onChange={handleChange}
            placeholder="Phone"
          />
        </div>
        <Button onClick={handleAddSupplier}>Add Supplier</Button>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Available Suppliers</h2>
        {loading ? (
          <div>Loading...</div>
        ) : suppliers.length === 0 ? (
          <div>No suppliers found.</div>
        ) : (
          <table className="min-w-full text-sm table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">Email</th>
                <th className="px-2 py-1 text-left">Phone</th>
                <th className="px-2 py-1 text-left">Active</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-2 py-1">{s.name}</td>
                  <td className="px-2 py-1">{s.contact_email || "-"}</td>
                  <td className="px-2 py-1">{s.phone || "-"}</td>
                  <td className="px-2 py-1">
                    {s.is_active ? (
                      <span className="text-green-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-red-600 font-semibold">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Suppliers;