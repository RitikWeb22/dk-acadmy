import React from 'react';
import { DppPyqManagementWorkspace } from '../../../components/admin/DppPyq/DppPyqManagementWorkspace';

export const AdminPYQPage: React.FC = () => {
  return <DppPyqManagementWorkspace initialFilter="PYQ" />;
};

export default AdminPYQPage;
