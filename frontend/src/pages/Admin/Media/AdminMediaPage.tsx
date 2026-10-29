import React, { useState } from 'react';
import {
  Image as ImageIcon,
  FileText,
  Video,
  Upload,
  Search,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import styles from './AdminMediaPage.module.scss';

interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'video';
  url: string;
  size: string;
  dimensions?: string;
  usage: string;
}

const MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'med_01',
    name: 'DK Sir - Founder & Faculty Portrait',
    type: 'image',
    url: '/images/faculty/dk-sir.jpg',
    size: '142 KB',
    dimensions: '600x600',
    usage: 'Homepage Hero & Faculty Cards'
  },
  {
    id: 'med_02',
    name: 'Course Orientation Video Thumbnail',
    type: 'image',
    url: '/images/course-orientation-banner.jpg',
    size: '280 KB',
    dimensions: '1280x720',
    usage: 'Course Detail Preview Player'
  },
  {
    id: 'med_03',
    name: 'Janakpuri Classroom & Hybrid Center',
    type: 'image',
    url: '/images/classroom/janakpuri-center.jpg',
    size: '310 KB',
    dimensions: '1024x768',
    usage: 'Offline Classroom Showcase'
  },
  {
    id: 'med_04',
    name: 'JEE 2026-27 Master Syllabus Brochure',
    type: 'pdf',
    url: '/downloads/jee-2026-master-syllabus.pdf',
    size: '2.4 MB',
    usage: 'Student Curriculum Download'
  },
  {
    id: 'med_05',
    name: 'Calculus 20s Speed Techniques DPP #1',
    type: 'pdf',
    url: '/downloads/calculus-dpp-01.pdf',
    size: '890 KB',
    usage: 'Classroom DPP Library'
  },
  {
    id: 'med_06',
    name: 'DK Sir 20s Method Orientation Lecture',
    type: 'video',
    url: 'https://youtube.com/watch?v=demo',
    size: 'Stream',
    usage: 'Free Lectures Gallery'
  }
];

export const AdminMediaPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'pdf' | 'video'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = MEDIA_ASSETS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.usage.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Media Library &amp; Asset Management</h1>
          <p className={styles.pageSubtitle}>
            Central repository of faculty photos, syllabus downloads, course trailers, and offline classroom media assets.
          </p>
        </div>
        <button
          type="button"
          className={styles.uploadBtn}
          onClick={() => alert('Media upload simulation: File dropped into public/ assets directory.')}
        >
          <Upload size={16} />
          <span>Upload Asset</span>
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search media files by name or usage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.typeChips}>
          {(['all', 'image', 'pdf', 'video'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.chip} ${typeFilter === t ? styles.chipActive : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.map((item) => (
          <div key={item.id} className={styles.assetCard}>
            <div className={styles.assetPreviewBox}>
              {item.type === 'image' && <ImageIcon size={32} color="#2563eb" />}
              {item.type === 'pdf' && <FileText size={32} color="#dc2626" />}
              {item.type === 'video' && <Video size={32} color="#7c3aed" />}
              <span className={styles.typeTag}>{item.type.toUpperCase()}</span>
            </div>

            <div className={styles.assetDetails}>
              <h3 className={styles.assetName}>{item.name}</h3>
              <p className={styles.assetUsage}>
                Used on: <strong>{item.usage}</strong>
              </p>
              <div className={styles.metaRow}>
                <span>{item.size}</span>
                {item.dimensions && <span>• {item.dimensions}</span>}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.pathText}>{item.url}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => handleCopy(item.id, item.url)}
                title="Copy relative URL"
              >
                {copiedId === item.id ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMediaPage;
