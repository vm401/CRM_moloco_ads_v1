import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MultiCSVUpload from "@/components/MultiCSVUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Upload() {
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [pending, setPending] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    report: null,
    inventory_daily: null,
    inventory_overall: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMultiUploadComplete = (results: any[]) => {
    setUploadResults(results);
    setMessage(`Successfully uploaded ${results.length} files!`);
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [key]: file }));
    setMessage(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!files.report && !files.inventory_daily && !files.inventory_overall) {
      setError("Please select at least one file to upload");
      return;
    }

    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const uploadPromises = [];
      
      if (files.report) {
        const formData = new FormData();
        formData.append('file', files.report);
        formData.append('account', 'Default');
        formData.append('fileType', 'reports');
        
        uploadPromises.push(
          fetch(`${import.meta.env.PROD ? 'https://moloco-crm-backend.onrender.com' : 'http://localhost:8000'}/upload`, {
            method: 'POST',
            body: formData,
          })
        );
      }
      
      if (files.inventory_daily) {
        const formData = new FormData();
        formData.append('file', files.inventory_daily);
        formData.append('account', 'Default');
        formData.append('fileType', 'inventory_daily');
        
        uploadPromises.push(
          fetch(`${import.meta.env.PROD ? 'https://moloco-crm-backend.onrender.com' : 'http://localhost:8000'}/upload`, {
            method: 'POST',
            body: formData,
          })
        );
      }
      
      if (files.inventory_overall) {
        const formData = new FormData();
        formData.append('file', files.inventory_overall);
        formData.append('account', 'Default');
        formData.append('fileType', 'inventory_overall');
        
        uploadPromises.push(
          fetch(`${import.meta.env.PROD ? 'https://moloco-crm-backend.onrender.com' : 'http://localhost:8000'}/upload`, {
            method: 'POST',
            body: formData,
          })
        );
      }

      const responses = await Promise.all(uploadPromises);
      
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Upload failed: ${errorData}`);
        }
      }

      setMessage("Files uploaded successfully!");
      setFiles({ report: null, inventory_daily: null, inventory_overall: null });
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPending(false);
    }
  };

  const SingleUpload = () => (
    <div className="space-y-6">
      <Card className="revenue-card">
        <CardHeader>
          <CardTitle>Single File Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Campaign Report CSV
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileChange('report', e.target.files?.[0] || null)}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {files.report && (
                <span className="text-green-600 text-sm">✓ {files.report.name}</span>
              )}
            </div>
          </div>

          {/* Inventory Daily Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Inventory Daily CSV
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileChange('inventory_daily', e.target.files?.[0] || null)}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {files.inventory_daily && (
                <span className="text-green-600 text-sm">✓ {files.inventory_daily.name}</span>
              )}
            </div>
          </div>

          {/* Inventory Overall Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Inventory Overall CSV
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileChange('inventory_overall', e.target.files?.[0] || null)}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {files.inventory_overall && (
                <span className="text-green-600 text-sm">✓ {files.inventory_overall.name}</span>
              )}
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={pending || (!files.report && !files.inventory_daily && !files.inventory_overall)}
            className="w-full revenue-button revenue-button-primary"
          >
            {pending ? 'Uploading...' : 'Upload Files'}
          </Button>

          {message && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upload CSV Files
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Upload your Moloco campaign data for analysis
          </p>
        </div>
        
        <Tabs defaultValue="multi" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="multi">Multi-File Upload</TabsTrigger>
            <TabsTrigger value="single">Single File Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="multi" className="space-y-6">
            <MultiCSVUpload 
              onUploadComplete={handleMultiUploadComplete}
              maxFiles={10}
            />
            
            {uploadResults.length > 0 && (
              <Card className="revenue-card">
                <CardHeader>
                  <CardTitle>Upload Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {uploadResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <span>File {index + 1}: {result.filename || 'Processed'}</span>
                        <span className="text-green-600">✓ Success</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="single">
            <SingleUpload />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
