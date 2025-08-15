import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: any;
}

interface MultiCSVUploadProps {
  onUploadComplete?: (results: any[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

const MultiCSVUpload: React.FC<MultiCSVUploadProps> = ({
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = ['.csv', '.xlsx', '.xls']
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles)
      .slice(0, maxFiles - files.length)
      .map(file => ({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
        progress: 0
      }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<any> => {
    const formData = new FormData();
    formData.append('file', uploadFile.file);

    const apiUrl = import.meta.env.PROD 
      ? 'https://moloco-crm-backend.onrender.com'
      : 'http://localhost:8000';

    const response = await fetch(`${apiUrl}/upload-csv`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  };

  const processAllFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const results: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Обновляем статус на "uploading"
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        // Симуляция прогресса загрузки
        for (let progress = 0; progress <= 50; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, progress }
              : f
          ));
        }

        // Загрузка файла
        const result = await uploadFile(file);

        // Обновляем статус на "processing"
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing', progress: 75 }
            : f
        ));

        // Симуляция обработки
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Завершено
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'completed', progress: 100, result }
            : f
        ));

        results.push(result);

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              }
            : f
        ));
      }
    }

    setIsUploading(false);
    
    if (onUploadComplete && results.length > 0) {
      onUploadComplete(results);
    }
  };

  const retryFile = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;

    setFiles(prev => prev.map(f => 
      f.id === id 
        ? { ...f, status: 'pending', progress: 0, error: undefined }
        : f
    ));
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return 'Ready to upload';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="revenue-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Multi-CSV Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Drop CSV files here
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              or click to select files ({files.length}/{maxFiles})
            </p>
            
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
              disabled={files.length >= maxFiles}
            />
            
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={files.length >= maxFiles}
              className="revenue-button revenue-button-primary"
            >
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="revenue-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Files ({files.length}) 
                {completedCount > 0 && (
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    {completedCount} completed
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800">
                    {errorCount} failed
                  </Badge>
                )}
              </CardTitle>
              
              <div className="flex gap-2">
                <Button
                  onClick={processAllFiles}
                  disabled={isUploading || files.every(f => f.status === 'completed')}
                  className="revenue-button revenue-button-primary"
                >
                  {isUploading ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Process All
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={clearAll}
                  variant="outline"
                  disabled={isUploading}
                  className="revenue-button"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  {getStatusIcon(file.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <span className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={
                        file.status === 'completed' ? 'default' :
                        file.status === 'error' ? 'destructive' :
                        'secondary'
                      }>
                        {getStatusText(file.status)}
                      </Badge>
                      
                      {file.error && (
                        <span className="text-sm text-red-500 truncate">
                          {file.error}
                        </span>
                      )}
                    </div>
                    
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <Progress value={file.progress} className="h-2" />
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    {file.status === 'error' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => retryFile(file.id)}
                        className="p-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      disabled={isUploading}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultiCSVUpload;
