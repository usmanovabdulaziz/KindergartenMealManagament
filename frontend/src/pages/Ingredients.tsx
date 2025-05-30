import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Search, AlertTriangle } from "lucide-react";
import { Product, Unit } from '@/types';
import { toast } from "@/components/ui/sonner";
import { useApiService } from '@/hooks/useApiService';

const getProductsList = (productsData: any): Product[] => {
  if (Array.isArray(productsData)) return productsData;
  if (productsData && Array.isArray(productsData.products)) return productsData.products;
  return [];
};

const Ingredients = () => {
  const { apiBaseUrl, user, api } = useApiService();
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    totalWeight: 0,
    unitId: 0,
    threshold: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    totalWeight: 0,
    unitId: 0,
    threshold: 0,
  });

  // WebSocket ref to avoid multiple connections
  const wsRef = useRef<WebSocket | null>(null);

  // Get token from user or localStorage
  const token = (() => {
    if (user && (user as any).token) return (user as any).token;
    const auth = localStorage.getItem('auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        return parsed.token;
      } catch {}
    }
    return null;
  })();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, unitsData] = await Promise.all([
          api.getProducts(),
          api.getUnits()
        ]);
        setProducts(getProductsList(productsData));
        setUnits(Array.isArray(unitsData) ? unitsData : []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load ingredients data');
        setProducts([]);
        setUnits([]);
      }
    };
    loadData();

    // Setup inventory websocket for real-time updates
    const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
    let wsUrl = `${wsProtocol}://${apiBaseUrl.replace(/^https?:\/\//, '')}/ws/inventory/`;
    if (token) wsUrl += `?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "inventory_update") {
          api.getProducts().then(data => setProducts(getProductsList(data)));
        }
      } catch (e) {}
    };

    ws.onerror = (err) => {
      // Optional logging
    };

    return () => {
      ws.close();
    };
  }, [apiBaseUrl, token]);

  // --- ADD ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'name' ? value : Number(value),
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      unitId: Number(value),
    });
  };

  const handleAddProduct = async () => {
    try {
      const selectedUnit = units.find(unit => unit.id === formData.unitId);
      if (!selectedUnit) {
        toast.error('Please select a valid unit');
        return;
      }

      await api.addProduct({
        name: formData.name,
        total_weight: formData.totalWeight,
        unit: selectedUnit.id,
        threshold: formData.threshold,
        is_active: true,
      });

      // Optimistic refresh
      const productsData = await api.getProducts();
      setProducts(getProductsList(productsData));

      setFormData({ name: '', totalWeight: 0, unitId: 0, threshold: 0 });
      setIsAddDialogOpen(false);
      toast.success('Ingredient added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add ingredient');
    }
  };

  // --- EDIT ---
  const handleEditClick = (product: Product) => {
    setEditProductId(product.id);
    setEditFormData({
      name: product.name,
      totalWeight: product.total_weight,
      unitId: product.unit.id,
      threshold: product.threshold || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'name' ? value : Number(value),
    });
  };

  const handleEditSelectChange = (value: string) => {
    setEditFormData({
      ...editFormData,
      unitId: Number(value),
    });
  };

  const handleUpdateProduct = async () => {
    if (editProductId == null) return;
    try {
      const selectedUnit = units.find(unit => unit.id === editFormData.unitId);
      if (!selectedUnit) {
        toast.error('Please select a valid unit');
        return;
      }
      await api.updateProduct(editProductId, {
        name: editFormData.name,
        total_weight: editFormData.totalWeight,
        unit: selectedUnit.id,
        threshold: editFormData.threshold,
        is_active: true,
      });

      // Refresh products list
      const productsData = await api.getProducts();
      setProducts(getProductsList(productsData));

      setIsEditDialogOpen(false);
      setEditProductId(null);
      toast.success('Ingredient updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update ingredient');
    }
  };

  const filteredProducts = searchTerm
    ? products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search ingredients..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
              <DialogDescription>
                Enter the details of the new ingredient to add to inventory.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Potatoes"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="totalWeight">Quantity</Label>
                  <Input
                    id="totalWeight"
                    name="totalWeight"
                    type="number"
                    min="0"
                    value={formData.totalWeight || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    onValueChange={handleSelectChange}
                    value={formData.unitId ? formData.unitId.toString() : ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(units) && units.length > 0 ? (
                        units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-units" disabled>
                          No units found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="threshold">Threshold (for low stock alert)</Label>
                <Input
                  id="threshold"
                  name="threshold"
                  type="number"
                  min="0"
                  value={formData.threshold || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct}>
                Add Ingredient
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Ingredient Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Ingredient</DialogTitle>
              <DialogDescription>
                Update the details of the ingredient.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editName">Name</Label>
                <Input
                  id="editName"
                  name="name"
                  placeholder="e.g. Potatoes"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editTotalWeight">Quantity</Label>
                  <Input
                    id="editTotalWeight"
                    name="totalWeight"
                    type="number"
                    min="0"
                    value={editFormData.totalWeight || ''}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editUnit">Unit</Label>
                  <Select
                    onValueChange={handleEditSelectChange}
                    value={editFormData.unitId ? editFormData.unitId.toString() : ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(units) && units.length > 0 ? (
                        units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-units" disabled>
                          No units found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editThreshold">Threshold (for low stock alert)</Label>
                <Input
                  id="editThreshold"
                  name="threshold"
                  type="number"
                  min="0"
                  value={editFormData.threshold || ''}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProduct}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const percentage = product.threshold
                  ? Math.min(100, (product.total_weight / product.threshold) * 100)
                  : 100;
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.total_weight} {product.unit.abbreviation}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={percentage} className="w-24" />
                        {product.threshold && product.total_weight < product.threshold && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(product)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No ingredients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Ingredients;