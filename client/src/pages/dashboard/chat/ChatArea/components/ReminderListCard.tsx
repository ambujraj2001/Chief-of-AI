import React from 'react';
import { Card, List, Tag } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { ContactActions } from './ContactActions';

interface Reminder {
  title: string;
  reminder_at?: string;
  status?: string;
}

interface ReminderListCardProps {
  data: Reminder[];
}

const ReminderListCard: React.FC<ReminderListCardProps> = ({ data }) => {
  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <BellOutlined className="text-primary" />
          <span>Reminders</span>
        </div>
      }
      className="w-full shadow-sm border-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
      styles={{ body: { padding: '0 12px 12px 12px' } }}
    >
      <List
        dataSource={data}
        renderItem={(item) => (
          <List.Item className="border-b border-slate-50 dark:border-slate-800/50 py-3 last:border-0">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-200">{item.title}</span>
                {item.status && (
                  <Tag color={item.status === 'completed' ? 'success' : 'processing'} className="rounded-full text-[10px] uppercase font-bold">
                    {item.status}
                  </Tag>
                )}
              </div>
              <ContactActions text={item.title} />
              {item.reminder_at && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(item.reminder_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>
          </List.Item>
        )}
        locale={{ emptyText: <span className="text-slate-400 italic text-xs py-4 block">No reminders found</span> }}
      />
    </Card>
  );
};

export default ReminderListCard;
