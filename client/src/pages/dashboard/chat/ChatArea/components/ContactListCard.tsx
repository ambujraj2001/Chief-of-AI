import React from 'react';
import { Card, List, Button, Avatar } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';

interface Contact {
  name: string;
  phone?: string;
  email?: string;
  role?: string;
}

interface ContactListCardProps {
  data: Contact[];
}

const ContactListCard: React.FC<ContactListCardProps> = ({ data }) => {
  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <UserOutlined className="text-blue-500" />
          <span>Contacts</span>
        </div>
      }
      className="w-full shadow-sm border-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
      styles={{ body: { padding: '0 12px 12px 12px' } }}
    >
      <List
        dataSource={data}
        renderItem={(item) => (
          <List.Item className="border-b border-slate-50 dark:border-slate-800/50 py-3 last:border-0">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-3">
                <Avatar icon={<UserOutlined />} className="bg-slate-100 dark:bg-slate-800 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {item.name}
                  </span>
                  {item.role && (
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {item.role}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {item.phone && (
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<PhoneOutlined />} 
                    size="small"
                    href={`tel:${item.phone}`}
                    className="bg-emerald-500 border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600 shadow-sm"
                  />
                )}
                {item.email && (
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<MailOutlined />} 
                    size="small"
                    href={`mailto:${item.email}`}
                    className="bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600 shadow-sm"
                  />
                )}
              </div>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: <span className="text-slate-400 italic text-xs py-4 block">No contacts found</span> }}
      />
    </Card>
  );
};

export default ContactListCard;
