import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
} from '@/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { PlusCircle, UserPlus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useApiService } from '@/hooks/useApiService';

const Users = () => {
  const { api } = useApiService();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role_id: '',
  });
  const [editUser, setEditUser] = useState({
    id: '',
    username: '',
    email: '',
    password: '',
    role_id: '',
    is_active: true,
  });

  // Fetch users and roles
  const fetchUsersAndRoles = async () => {
    setIsLoading(true);
    try {
      const usersData = await api.getUsers();
      const rolesData = await api.getRoles();
      setUsers(Array.isArray(usersData.results) ? usersData.results : usersData);
      setRoles(Array.isArray(rolesData.results) ? rolesData.results : Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      toast.error('Failed to load users or roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
    // eslint-disable-next-line
  }, []);

  // Add User
  const handleAddUser = async () => {
    try {
      await api.addUser(newUser);
      await fetchUsersAndRoles();
      setIsAddDialogOpen(false);
      setNewUser({ username: '', email: '', password: '', role_id: '' });
      toast.success('User added successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add user');
    }
  };

  // Update User (including is_active status)
  const handleEditUser = async () => {
    if (!editUser.id) return;
    try {
      const payload: any = {
        username: editUser.username,
        email: editUser.email,
        role_id: editUser.role_id,
        is_active: editUser.is_active,
      };
      if (editUser.password) payload.password = editUser.password;
      await api.updateUser(editUser.id, payload);
      await fetchUsersAndRoles();
      setIsEditDialogOpen(false);
      setEditUser({ id: '', username: '', email: '', password: '', role_id: '', is_active: true });
      toast.success('User updated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update user');
    }
  };

  // Delete User (now works because api.deleteUser exists)
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(id);
      await fetchUsersAndRoles();
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete user');
    }
  };

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const { name, value } = e.target;
    if (isEdit) setEditUser(prev => ({ ...prev, [name]: value }));
    else setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string, isEdit = false) => {
    if (isEdit) setEditUser(prev => ({ ...prev, role_id: value }));
    else setNewUser(prev => ({ ...prev, role_id: value }));
  };

  // Populate edit dialog
  const openEditDialog = (user: any) => {
    setEditUser({
      id: user.id,
      username: user.username || '',
      email: user.email || '',
      password: '',
      role_id: user.display_role_id?.toString() || '',
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Users</h1>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "outline" : "secondary"}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role-based permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter username"
                value={newUser.username}
                onChange={e => handleInputChange(e, false)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="Enter email"
                type="email"
                value={newUser.email}
                onChange={e => handleInputChange(e, false)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                placeholder="Enter password"
                type="password"
                value={newUser.password}
                onChange={e => handleInputChange(e, false)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={value => handleRoleChange(value, false)} value={newUser.role_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                name="username"
                placeholder="Enter username"
                value={editUser.username}
                onChange={e => handleInputChange(e, true)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                placeholder="Enter email"
                type="email"
                value={editUser.email}
                onChange={e => handleInputChange(e, true)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password (leave blank to keep unchanged)</Label>
              <Input
                id="edit-password"
                name="password"
                placeholder="Enter new password"
                type="password"
                value={editUser.password}
                onChange={e => handleInputChange(e, true)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select onValueChange={value => handleRoleChange(value, true)} value={editUser.role_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select
                value={editUser.is_active ? 'active' : 'inactive'}
                onValueChange={val => setEditUser(prev => ({ ...prev, is_active: val === 'active' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;