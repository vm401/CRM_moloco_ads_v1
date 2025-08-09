import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Upload() {
  const [pending, setPending] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    report: null,
    inventory_daily: null,
    inventory_overall: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      
      // Upload each file separately using the /upload endpoint
      if (files.report) {
        const formData = new FormData();
        formData.append('file', files.report);
        formData.append('account', 'Default');
        formData.append('fileType', 'reports');
        
        uploadPromises.push(
          fetch('http://localhost:8000/upload', {
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
          fetch('http://localhost:8000/upload', {
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
          fetch('http://localhost:8000/upload', {
            method: 'POST',
            body: formData,
          })
        );
      }

      const responses = await Promise.all(uploadPromises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      const failedUploads = results.filter((result, index) => !responses[index].ok);
      
      if (failedUploads.length === 0) {
        const reportIds = results.map(r => r.report_id).filter(Boolean);
        setMessage(`Successfully uploaded ${results.length} file(s)! Report IDs: ${reportIds.join(', ')}`);
        setFiles({ report: null, inventory_daily: null, inventory_overall: null });
        // Reset file inputs
        const inputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        inputs.forEach(input => input.value = '');
      } else {
        setError(`Failed to upload ${failedUploads.length} file(s). Check console for details.`);
        console.error('Upload errors:', failedUploads);
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.');
      console.error('Upload error:', err);
    } finally {
      setPending(false);
    }
  };

  const fileSlots = [
    { key: "report", label: "📊 Main Report", description: "Campaign performance data" },
    { key: "inventory_daily", label: "📅 Inventory Daily", description: "Daily inventory breakdown" },
    { key: "inventory_overall", label: "📦 Inventory Overall", description: "Overall inventory summary" },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400/5 to-purple-400/5 animate-pulse" />
        <div className="absolute top-1/2 -left-20 w-32 h-32 rounded-full bg-gradient-to-br from-purple-400/5 to-pink-400/5 animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10">
        <h1 className="text-3xl font-bold lz-brand tracking-tight">Upload Data</h1>
        <p className="text-muted-foreground mt-1">Upload your CSV files to generate analytics</p>
      </div>

      <Card className="lz-card lz-card-hover anim-enter relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            Upload CSV Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fileSlots.map((slot) => (
              <div key={slot.key} className="space-y-2">
                <label className="block">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{slot.label}</span>
                    {files[slot.key] && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{slot.description}</p>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={(e) => handleFileChange(slot.key, e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center hover:border-cyan-400/60 hover:bg-cyan-50/50 transition-colors">
                      <svg className="w-8 h-8 mx-auto text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-sm text-muted-foreground">
                        {files[slot.key] ? files[slot.key]!.name : 'Click to select CSV'}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {Object.values(files).filter(f => f).length} of {fileSlots.length} files selected
            </div>
            <Button 
              disabled={pending || Object.values(files).every(f => !f)} 
              onClick={handleUpload}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white px-6"
            >
              {pending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                "🚀 Upload Files"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
