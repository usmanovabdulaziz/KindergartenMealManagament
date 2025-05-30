import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { PlusCircle, PackageOpen } from "lucide-react";
import { DeliveryLog, Product, Supplier, User } from '@/types';
import { useApiService } from "@/hooks/useApiService";
import { format } from 'date-fns';
import { toast } from "@/components/ui/sonner";

function extractArray<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

const Deliveries = () => {
  const { api } = useApiService();
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    productId: 0,
    supplierId: 0,
    quantityReceived: 0,
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [logsData, productsData, suppliersData, userData] = await Promise.all([
          api.getDeliveryLogs(),
          api.getProducts(),
          api.getSuppliers(),
          api.getCurrentUser()
        ]);
        setProducts(extractArray<Product>(productsData.products || productsData));
        setSuppliers(extractArray<Supplier>(suppliersData));
        setDeliveryLogs(extractArray<DeliveryLog>(logsData));
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load delivery data');
      }
    };
    loadData();
    // eslint-disable-next-line
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'notes' || name === 'deliveryDate' ? value : Number(value),
    });
  };

  const handleAddDelivery = async () => {
    try {
      if (!currentUser) throw new Error('User not found');
      if (!formData.productId) throw new Error('Please select a valid product');
      if (!formData.supplierId) throw new Error('Please select a valid supplier');
      if (formData.quantityReceived <= 0) throw new Error('Quantity must be greater than 0');

      await api.addDelivery({
        product_id: formData.productId,      // Correct backend field name
        supplier_id: formData.supplierId,    // Correct backend field name
        quantity_received: formData.quantityReceived,
        delivery_date: formData.deliveryDate,
        notes: formData.notes
      });

      // Refresh data
      const [logsData, productsData, suppliersData] = await Promise.all([
        api.getDeliveryLogs(),
        api.getProducts(),
        api.getSuppliers()
      ]);
      setProducts(extractArray<Product>(productsData.products || productsData));
      setSuppliers(extractArray<Supplier>(suppliersData));
      setDeliveryLogs(extractArray<DeliveryLog>(logsData));

      // Reset form and close dialog
      setFormData({
        productId: 0,
        supplierId: 0,
        quantityReceived: 0,
        deliveryDate: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
      setIsAddDialogOpen(false);
      toast.success('Delivery added successfully');
    } catch (error: any) {
      console.error('Error adding delivery:', error);
      toast.error(error.message || 'Failed to add delivery');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Deliveries</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Delivery
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Delivery</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Select
                  onValueChange={(value) => setFormData({ ...formData, productId: Number(value) })}
                  value={formData.productId ? formData.productId.toString() : ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  onValueChange={(value) => setFormData({ ...formData, supplierId: Number(value) })}
                  value={formData.supplierId ? formData.supplierId.toString() : ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantityReceived">Quantity Received</Label>
                <Input
                  id="quantityReceived"
                  name="quantityReceived"
                  type="number"
                  min="0"
                  value={formData.quantityReceived || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  name="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDelivery}>
                Add Delivery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Received By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryLogs.length > 0 ? (
                  deliveryLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(
                          new Date(log.delivery_date ?? log.deliveryDate),
                          'MMM d, yyyy'
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.product?.name ?? ""}
                      </TableCell>
                      <TableCell>
                        {(log.quantity_received ?? log.quantityReceived) + " " + (log.product?.unit?.abbreviation ?? "")}
                      </TableCell>
                      <TableCell>
                        {log.supplier?.name ?? ""}
                      </TableCell>
                      <TableCell>
                        {(log.received_by?.username ?? log.receivedBy?.username ?? "")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      <div className="flex flex-col items-center py-4">
                        <PackageOpen className="h-12 w-12 text-muted-foreground mb-2" />
                        <p>No delivery records found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Deliveries;