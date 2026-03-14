import React from 'react';
import { Card, List, Checkbox } from 'antd';
import { CheckSquareOutlined } from '@ant-design/icons';
import { ContactActions } from './ContactActions';

interface Task {
  title: string;
  is_completed: boolean;
  status?: string;
}

interface TaskListCardProps {
  data: Task[];
}

const TaskListCard: React.FC<TaskListCardProps> = ({ data }) => {
  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <CheckSquareOutlined className="text-emerald-500" />
          <span>Tasks</span>
        </div>
      }
      className="w-full shadow-sm border-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
      styles={{ body: { padding: '0 12px 12px 12px' } }}
    >
      <List
        dataSource={data}
        renderItem={(item) => (
          <List.Item className="border-b border-slate-50 dark:border-slate-800/50 py-3 last:border-0">
            <div className="flex flex-col w-full gap-1">
              <div className="flex items-center gap-3">
                <Checkbox checked={item.is_completed || item.status === 'completed'} disabled />
                <span className={`text-sm ${item.is_completed || item.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {item.title}
                </span>
              </div>
              <div className="ml-8">
                <ContactActions text={item.title} />
              </div>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: <span className="text-slate-400 italic text-xs py-4 block">No tasks found</span> }}
      />
    </Card>
  );
};

export default TaskListCard;
