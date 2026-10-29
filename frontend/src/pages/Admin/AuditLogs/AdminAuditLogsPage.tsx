import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import type { AdminAuditLog } from '../../../types/admin';
import styles from './AdminAuditLogsPage.module.scss';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'WARNING' | 'FAILED'>('ALL');

  const refreshLogs = () => {
    setLogs(adminService.getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      log.adminName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportAuditCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Admin Name', 'Role', 'Action', 'Module', 'Details', 'IP Address', 'Status'];
    const rows = filtered.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      `"${l.adminName.replace(/"/g, '""')}"`,
      l.adminRole,
      l.action,
      `"${l.module.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ipAddress || '127.0.0.1',
      l.status
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dk_academy_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Administrative Activity &amp; Audit Trail</h1>
          <p className={styles.pageSubtitle}>
            Immutable audit record of administrative authentications, lead modifications, banner releases, and sensitive platform operations.
          </p>
        </div>
        <button
          type="button"
          className={styles.exportBtn}
          onClick={exportAuditCSV}
        >
          <Download size={15} />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search audit trail by administrator, module, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.statusChips}>
          {(['ALL', 'SUCCESS', 'WARNING', 'FAILED'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
                <th>IP / Origin</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className={styles.timeCell}>
                    <time>
                      {new Date(log.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}{' '}
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </td>
                  <td>
                    <div className={styles.adminCell}>
                      <strong>{log.adminName}</strong>
                      <span className={`${styles.roleTag} ${styles[log.adminRole.toLowerCase()]}`}>
                        {log.adminRole.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <code className={styles.actionCode}>{log.action}</code>
                  </td>
                  <td className={styles.moduleCell}>{log.module}</td>
                  <td className={styles.detailsCell}>{log.details}</td>
                  <td className={styles.ipCell}>{log.ipAddress || '127.0.0.1'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[log.status.toLowerCase()]}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    No audit records match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
