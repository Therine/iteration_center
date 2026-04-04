import React, { useState, useEffect } from 'react';
import { FileText, HardDrive, ExternalLink } from 'lucide-react';

const GoogleDriveLink = ({ url }) => {
  const [fileMeta, setFileMeta] = useState({ name: 'Loading...', type: '' });

  useEffect(() => {
    // In a real app, this would call your backend which 
    // uses the Google Drive API to fetch the real metadata.
    const fetchMetadata = async () => {
      // Mocking the API response
      const mockMeta = {
        name: "Q1_Project_Final_v2.pdf",
        type: "application/pdf"
      };
      setFileMeta(mockMeta);
    };

    if (url) fetchMetadata();
  }, [url]);

  return (
    <a 
      href={url} 
      target="_blank" 
      className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all group"
    >
      <div className="p-2 bg-white rounded border border-slate-100 shadow-sm">
        <FileText size={18} className="text-blue-600" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {fileMeta.name}
        </p>
        <p className="text-[10px] text-slate-400 uppercase tracking-tight">
          Google Drive Asset
        </p>
      </div>

      <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500 mr-2" />
    </a>
  );
};