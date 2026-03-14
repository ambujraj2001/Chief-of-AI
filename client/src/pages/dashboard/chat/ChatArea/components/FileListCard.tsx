import React from 'react';
import { Card, List } from 'antd';
import { FileOutlined, FilePdfOutlined, FileImageOutlined, FileTextOutlined } from '@ant-design/icons';

interface FileItem {
  file_name: string;
  file_type?: string;
  file_url?: string;
}

interface FileListCardProps {
  data: FileItem[];
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return <FilePdfOutlined className="text-red-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return <FileImageOutlined className="text-amber-500" />;
    case 'txt':
    case 'md': return <FileTextOutlined className="text-blue-500" />;
    default: return <FileOutlined className="text-slate-400" />;
  }
};

const FileListCard: React.FC<FileListCardProps> = ({ data }) => {
  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <FileOutlined className="text-emerald-500" />
          <span>Files</span>
        </div>
      }
      className="w-full shadow-sm border-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
      styles={{ body: { padding: '0 12px 12px 12px' } }}
    >
      <List
        dataSource={data}
        renderItem={(item) => (
          <List.Item className="border-b border-slate-50 dark:border-slate-800/50 py-3 last:border-0">
            <div className="flex items-center gap-3 w-full">
              <div className="size-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {getFileIcon(item.file_name)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {item.file_name}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  {item.file_name.split('.').pop() || 'File'}
                </span>
              </div>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: <span className="text-slate-400 italic text-xs py-4 block">No files found</span> }}
      />
    </Card>
  );
};

export default FileListCard;
