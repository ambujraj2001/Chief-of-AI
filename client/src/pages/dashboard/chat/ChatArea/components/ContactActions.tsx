import React from 'react';
import { Button, Tooltip } from 'antd';
import { PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { extractPhone, extractEmail } from '@/shared/utils/contactUtils';

interface ContactActionsProps {
  text: string;
}

export const ContactActions: React.FC<ContactActionsProps> = ({ text }) => {
  const phone = extractPhone(text);
  const email = extractEmail(text);

  if (!phone && !email) return null;

  return (
    <div className="flex gap-2 mt-2">
      {phone && (
        <Tooltip title={`Call ${phone}`}>
          <Button 
            type="primary" 
            size="small" 
            icon={<PhoneOutlined />} 
            href={`tel:${phone}`}
            className="flex items-center gap-1 text-[10px] font-bold uppercase rounded-full bg-emerald-500 border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600 shadow-sm"
          >
            Call
          </Button>
        </Tooltip>
      )}
      {email && (
        <Tooltip title={`Email ${email}`}>
          <Button 
            type="primary" 
            size="small" 
            icon={<MailOutlined />} 
            href={`mailto:${email}`}
            className="flex items-center gap-1 text-[10px] font-bold uppercase rounded-full bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600 shadow-sm"
          >
            Email
          </Button>
        </Tooltip>
      )}
    </div>
  );
};
