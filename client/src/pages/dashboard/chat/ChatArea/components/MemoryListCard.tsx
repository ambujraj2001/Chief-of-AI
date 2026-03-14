import React from 'react';
import { Card, List } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { ContactActions } from './ContactActions';

interface Memory {
  title: string;
  content: string;
  similarity?: number;
}

interface MemoryListCardProps {
  data: Memory[];
}

const MemoryListCard: React.FC<MemoryListCardProps> = ({ data }) => {
  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <SearchOutlined className="text-indigo-500" />
          <span>Relevant Memories</span>
        </div>
      }
      className="w-full shadow-sm border-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
      styles={{ body: { padding: '0 12px 12px 12px' } }}
    >
      <List
        dataSource={data}
        renderItem={(item) => (
          <List.Item className="border-b border-slate-50 dark:border-slate-800/50 py-3 last:border-0 flex-col items-start gap-1">
            <span className="font-bold text-xs text-indigo-500 uppercase tracking-tighter">
              {item.title || 'Untitled Memory'}
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed m-0">
              {item.content}
            </p>
            <ContactActions text={`${item.title} ${item.content}`} />
          </List.Item>
        )}
        locale={{ emptyText: <span className="text-slate-400 italic text-xs py-4 block">No similar memories found</span> }}
      />
    </Card>
  );
};

export default MemoryListCard;
