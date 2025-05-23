
import React, { useState } from "react";
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

const Settings = () => {
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('apiBaseUrl') || '');
  const { updateApiBaseUrl } = useApiService();

  const handleSaveSettings = () => {
    updateApiBaseUrl(apiUrl);
    toast.success("API URL updated successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure the connection to your Django backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-url">API Base URL</Label>
              <Input
                id="api-url"
                placeholder="http://localhost:8000"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Example: http://localhost:8000 or https://your-api-domain.com
              </p>
            </div>

            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;