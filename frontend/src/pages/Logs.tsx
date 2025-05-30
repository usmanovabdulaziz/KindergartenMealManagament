import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useApiService } from '@/hooks/useApiService';

const Logs = () => {
  const { api } = useApiService();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsData = await api.getLogs();
        // Support both paginated and non-paginated responses
        let logsArray = [];
        if (Array.isArray(logsData)) {
          logsArray = logsData;
        } else if (logsData && Array.isArray(logsData.results)) {
          logsArray = logsData.results;
        }
        setLogs(logsArray);
      } catch (error) {
        console.error('Error fetching logs:', error);
        toast.error('Failed to load logs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">System Logs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading logs...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(logs) ? logs : []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>{log.user?.username || '—'}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
                {(Array.isArray(logs) && logs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;