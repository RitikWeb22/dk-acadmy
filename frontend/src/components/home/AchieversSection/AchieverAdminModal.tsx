import React, { useState, useEffect } from 'react';
import { X, Trophy, Save, Image, User, Check, AlertCircle } from 'lucide-react';
import type { AchieverData } from '../../../services/achieverService';
import styles from './AchieverAdminModal.module.scss';

interface AchieverAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  achieverToEdit: AchieverData | null;
  onSave: (data: Omit<AchieverData, 'id'>, id?: string) => void;
}

const PRESET_IMAGES = [
  { label: 'Rishabh Anand', url: '/img/RISHABH%20ANAND.png' },
  { label: 'Shaurya Singh', url: '/img/shaurya-singh.jpg' },
  { label: 'Panache Thakar', url: '/img/PANACHE%20THAKAR.png' },
  { label: 'Chirayu Sethia', url: '/img/Chirayu%20Sethia.jpeg' },
  { label: 'Ashutosh Shukla', url: '/img/Ashutosh%20Shukla.jpeg' },
  { label: 'Harsh Kumar', url: '/img/Harsh%20Kumar.jpeg' },
  { label: 'Tejas Itankar', url: '/img/TEJAS%20ITANKAR.jpeg' },
  { label: 'Tanishq Gupta', url: '/img/Tanishq%20Gupta.jpeg' },
  { label: 'DK Sir Portrait', url: '/img/dk-sir-real.jpg' }
];

export const AchieverAdminModal: React.FC<AchieverAdminModalProps> = ({
  isOpen,
  onClose,
  achieverToEdit,
  onSave
}) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [year, setYear] = useState('2026');
  const [batch, setBatch] = useState('BATCH- 2 Year Classroom Program');
  const [jeeMainsScore, setJeeMainsScore] = useState('');
  const [advRank, setAdvRank] = useState('');
  const [bitsatRank, setBitsatRank] = useState('');
  const [examTag, setExamTag] = useState<'JEE Advanced' | 'JEE Main' | 'Foundation' | 'Boards & JEE'>('JEE Advanced');
  const [isTopPerformer, setIsTopPerformer] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (achieverToEdit) {
      setName(achieverToEdit.name || '');
      setImage(achieverToEdit.image || '');
      setYear(achieverToEdit.year || '2023');
      setBatch(achieverToEdit.highlightTopic || 'BATCH- 2 Year Classroom Program');
      setJeeMainsScore(achieverToEdit.jeeMainsScore || '');
      setAdvRank(achieverToEdit.advRank || '');
      setBitsatRank(achieverToEdit.bitsatRank || '');
      setExamTag(achieverToEdit.examTag || 'JEE Advanced');
      setIsTopPerformer(achieverToEdit.isTopPerformer ?? true);
    } else {
      setName('');
      setImage('/img/RISHABH%20ANAND.png');
      setYear('2026');
      setBatch('BATCH- 2 Year Classroom Program');
      setJeeMainsScore('');
      setAdvRank('');
      setBitsatRank('');
      setExamTag('JEE Advanced');
      setIsTopPerformer(true);
    }
    setError(null);
  }, [achieverToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter student name.');
      return;
    }
    if (!jeeMainsScore.trim()) {
      setError('Please enter JEE Mains score (e.g. 99.814% or 99.5%ILE).');
      return;
    }

    const payload: Omit<AchieverData, 'id'> = {
      name: name.trim().toUpperCase(),
      image: image.trim() || '/img/RISHABH%20ANAND.png',
      score: `JEE MAINS: ${jeeMainsScore.trim()}`,
      jeeMainsScore: jeeMainsScore.trim(),
      advRank: advRank.trim() || undefined,
      bitsatRank: bitsatRank.trim() || undefined,
      rankOrCollege: advRank.trim()
        ? `ADV RANK: ${advRank.trim()}`
        : bitsatRank.trim()
        ? `BITSAT: ${bitsatRank.trim()}`
        : 'TOP 0.1% CLUB',
      examTag: advRank.trim() ? 'JEE Advanced' : examTag,
      highlightTopic: batch.trim(),
      year: year.trim(),
      verified: true,
      isTopPerformer
    };

    onSave(payload, achieverToEdit?.id);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.iconBox}>
              <Trophy size={18} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>
                {achieverToEdit ? 'Edit Student Record' : 'Add New Student Achiever'}
              </h2>
              <p className={styles.modalSub}>
                Update official scorecard, photograph, rank and batch details.
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Row 1: Student Name & Year */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="student-name">
                Student Full Name <span className={styles.req}>*</span>
              </label>
              <input
                id="student-name"
                type="text"
                placeholder="e.g. RISHABH ANAND"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="student-year">
                Achievement Year <span className={styles.req}>*</span>
              </label>
              <select id="student-year" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            </div>
          </div>

          {/* Row 2: Batch Information */}
          <div className={styles.inputGroup}>
            <label htmlFor="student-batch">
              Course / Batch Information <span className={styles.req}>*</span>
            </label>
            <input
              id="student-batch"
              type="text"
              placeholder="e.g. BATCH- 2 Year Classroom Program"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              required
            />
          </div>

          {/* Row 3: JEE Mains & Advanced Ranks */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="student-mains">
                JEE Mains Score / %ile <span className={styles.req}>*</span>
              </label>
              <input
                id="student-mains"
                type="text"
                placeholder="e.g. 99.814% or 99.5%ILE"
                value={jeeMainsScore}
                onChange={(e) => setJeeMainsScore(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="student-adv">
                JEE Advanced Rank <span className={styles.opt}>(Optional)</span>
              </label>
              <input
                id="student-adv"
                type="text"
                placeholder="e.g. 2146 or 6781"
                value={advRank}
                onChange={(e) => setAdvRank(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: BITSAT Rank & Exam Tag */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="student-bitsat">
                BITSAT Rank / Score <span className={styles.opt}>(Optional)</span>
              </label>
              <input
                id="student-bitsat"
                type="text"
                placeholder="e.g. 292 (2022)"
                value={bitsatRank}
                onChange={(e) => setBitsatRank(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="student-tag">Primary Exam Tag</label>
              <select
                id="student-tag"
                value={examTag}
                onChange={(e) => setExamTag(e.target.value as any)}
              >
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="JEE Main">JEE Main</option>
                <option value="Foundation">Foundation</option>
                <option value="Boards & JEE">Boards &amp; JEE</option>
              </select>
            </div>
          </div>

          {/* Row 5: Photograph URL & Quick Presets */}
          <div className={styles.inputGroup}>
            <label htmlFor="student-photo">
              Student Portrait Photo URL <span className={styles.req}>*</span>
            </label>
            <div className={styles.photoInputRow}>
              <input
                id="student-photo"
                type="text"
                placeholder="/img/RISHABH ANAND.png or HTTPS URL"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                required
              />
              {image && (
                <div className={styles.photoPreviewBox}>
                  <img src={image} alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>

            {/* Quick Presets Chips */}
            <div className={styles.presetsList}>
              <span className={styles.presetsLabel}>Quick Local Presets:</span>
              <div className={styles.presetsChips}>
                {PRESET_IMAGES.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={`${styles.presetChip} ${image === p.url ? styles.presetChipActive : ''}`}
                    onClick={() => setImage(p.url)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Checkbox: Top Performer */}
          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isTopPerformer}
                onChange={(e) => setIsTopPerformer(e.target.checked)}
              />
              <span>Display "TOP PERFORMER" Trophy Corner Ribbon</span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              <Save size={16} />
              <span>{achieverToEdit ? 'Save Changes' : 'Create Achiever Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AchieverAdminModal;

