import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "@/components/ui/sonner";
import { Settings as SettingsIcon } from "lucide-react";
import { useApiService } from "@/hooks/useApiService";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  const { api } = useApiService();
  const { user, refreshUserProfile } = useAuth();

  // Profile settings
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    try {
      // Update username and email
      if (profileData.username !== user?.username || profileData.email !== user?.email) {
        await api.updateCurrentUser({
          username: profileData.username,
          email: profileData.email
        });
        toast.success("Profile updated successfully");
        refreshUserProfile(); // Refresh user info in context
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const handleUpdatePassword = async () => {
    if (!profileData.newPassword || !profileData.confirmPassword) {
      toast.error("Please enter new password and confirm it.");
      return;
    }
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    try {
      await api.updatePassword({
        new_password: profileData.newPassword,
        confirm_password: profileData.confirmPassword,
      });

      setProfileData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));

      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(
        typeof error?.message === "string"
          ? error.message
          : "Failed to update password"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Update your account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center mb-6">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-xl">
                      {profileData.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user?.role?.name || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your role cannot be changed. Contact an administrator if you need a different role.
                  </p>
                </div>

                <Button onClick={handleUpdateProfile}>Update Profile</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    value={profileData.newPassword}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={handleProfileChange}
                  />
                </div>

                <Button onClick={handleUpdatePassword}>Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;