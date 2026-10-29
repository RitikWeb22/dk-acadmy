import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Building2,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import type { BatchItem, ModeType } from '../types';
import { Badge } from './Badge';
import styles from './BatchesTable.module.scss';

interface BatchesTableProps {
  batches: BatchItem[];
  onManageBatch: (batch: BatchItem) => void;
  onViewAll?: () => void;
}

export const BatchesTable: React.FC<BatchesTableProps> = ({
  batches,
  onManageBatch,
  onViewAll
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'All' | ModeType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Near Full' | 'Classroom Full'>('All');
  const [sortField, setSortField] = useState<'name' | 'capacity' | 'target'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeKebabId, setActiveKebabId] = useState<string | null>(null);

  // Filter & Sort
  const filteredBatches = useMemo(() => {
    let result = [...batches];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.faculty.toLowerCase().includes(q) ||
          b.targetExam.toLowerCase().includes(q)
      );
    }

    if (modeFilter !== 'All') {
      result = result.filter((b) => b.mode === modeFilter);
    }

    if (statusFilter !== 'All') {
      result = result.filter((b) => b.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortField === 'name') {
        return sortAsc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortField === 'capacity') {
        const pctA = a.enrolled / a.capacity;
        const pctB = b.enrolled / b.capacity;
        return sortAsc ? pctA - pctB : pctB - pctA;
      }
      if (sortField === 'target') {
        return sortAsc
          ? a.targetExam.localeCompare(b.targetExam)
          : b.targetExam.localeCompare(a.targetExam);
      }
      return 0;
    });

    return result;
  }, [batches, searchQuery, modeFilter, statusFilter, sortField, sortAsc]);

  const handleSort = (field: 'name' | 'capacity' | 'target') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getCapacityColorClass = (enrolled: number, capacity: number) => {
    const pct = (enrolled / capacity) * 100;
    if (pct > 95) return styles.progressRed;
    if (pct >= 80) return styles.progressAmber;
    return styles.progressGreen;
  };

  return (
    <div className={styles.tableCard}>
      {/* Table Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search batch name or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search batches"
          />
        </div>

        <div className={styles.filtersRow}>
          {/* Mode Filter */}
          <div className={styles.filterWrap}>
            <Filter size={12} className={styles.filterIcon} />
            <select
              className={styles.selectFilter}
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as any)}
              aria-label="Filter by Mode"
            >
              <option value="All">All Modes</option>
              <option value="Offline · Janakpuri">Offline · Janakpuri</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className={styles.filterWrap}>
            <select
              className={styles.selectFilter}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter by Status"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Near Full">Near Full</option>
              <option value="Classroom Full">Classroom Full</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop & Tablet Table */}
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className={styles.sortableTh}>
                <div className={styles.thContent}>
                  <span>BATCH &amp; TARGET</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th onClick={() => handleSort('capacity')} className={styles.sortableTh}>
                <div className={styles.thContent}>
                  <span>CAPACITY UTILISATION</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th>MODE</th>
              <th>FACULTY</th>
              <th>STATUS</th>
              <th className={styles.thAction}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyTd}>
                  No batches matched the filter &ldquo;{searchQuery}&rdquo;.
                </td>
              </tr>
            ) : (
              filteredBatches.map((batch) => {
                const pct = Math.min(
                  100,
                  Math.round((batch.enrolled / batch.capacity) * 100)
                );
                const progressClass = getCapacityColorClass(batch.enrolled, batch.capacity);

                return (
                  <tr key={batch.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.batchMetaCol}>
                        <span className={styles.batchName}>{batch.name}</span>
                        <div className={styles.targetRow}>
                          <Badge variant="neutral">{batch.targetExam}</Badge>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.capacityProgressBox}>
                        <div className={styles.progressLabelRow}>
                          <span className={styles.ratioNumbers}>
                            <strong>{batch.enrolled}</strong> / {batch.capacity} seats
                          </span>
                          <span className={styles.percentText}>{pct}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                          <div
                            className={`${styles.progressBar} ${progressClass}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      {batch.mode === 'Offline · Janakpuri' ? (
                        <Badge variant="neutral" icon={<Building2 size={11} />}>
                          Offline · Janakpuri
                        </Badge>
                      ) : (
                        <Badge variant="info" icon={<Monitor size={11} />}>
                          Online
                        </Badge>
                      )}
                    </td>

                    <td>
                      <span className={styles.facultyText}>{batch.faculty}</span>
                    </td>

                    <td>
                      <Badge
                        variant={batch.statusVariant}
                        icon={
                          batch.status === 'Active' ? (
                            <CheckCircle2 size={11} />
                          ) : batch.status === 'Near Full' ? (
                            <AlertCircle size={11} />
                          ) : (
                            <Clock size={11} />
                          )
                        }
                      >
                        {batch.status}
                      </Badge>
                    </td>

                    <td className={styles.actionTd}>
                      <div className={styles.actionBtnGroup}>
                        <button
                          type="button"
                          className={styles.manageBtn}
                          onClick={() => onManageBatch(batch)}
                          aria-label={`Manage ${batch.name}`}
                        >
                          Manage
                        </button>

                        <button
                          type="button"
                          className={styles.kebabBtn}
                          onClick={() =>
                            setActiveKebabId(activeKebabId === batch.id ? null : batch.id)
                          }
                          aria-label="More actions"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeKebabId === batch.id && (
                          <div className={styles.kebabDropdown}>
                            <button
                              type="button"
                              className={styles.kebabItem}
                              onClick={() => {
                                setActiveKebabId(null);
                                onManageBatch(batch);
                              }}
                            >
                              View Student Roster
                            </button>
                            <button
                              type="button"
                              className={styles.kebabItem}
                              onClick={() => {
                                setActiveKebabId(null);
                                onManageBatch(batch);
                              }}
                            >
                              Update Schedule
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary and View All */}
      <div className={styles.tableFooter}>
        <span className={styles.footerSummary}>
          Showing <strong>{filteredBatches.length}</strong> of <strong>{batches.length}</strong> live batches
          (113 Classroom / 376 Online seats filled)
        </span>

        <button
          type="button"
          className={styles.viewAllBtn}
          onClick={onViewAll}
        >
          <span>Open Full Batches Desk</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
