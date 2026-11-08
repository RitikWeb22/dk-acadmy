import React, { useState, useEffect } from 'react';
import { Sparkles, Key, Check, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import styles from './GeminiApiKeyModal.module.scss';

export interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured?: (key: string) => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  onConfigured
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [model, setModel] = useState('gemini-3.8-flash');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const localKey =
        localStorage.getItem('dk_gemini_api_key') ||
        localStorage.getItem('gemini_api_key') ||
        '';
      setApiKey(localKey);

      apiClient
        .getGeminiConfig()
        .then((res) => {
          if (res?.configured) {
            setIsConfigured(true);
            if (res.model) setModel(res.model);
            if (!localKey && res.previewKey) {
              setApiKey(res.previewKey);
            }
          } else {
            setIsConfigured(Boolean(localKey && localKey.length > 5));
          }
        })
        .catch(() => {
          setIsConfigured(Boolean(localKey && localKey.length > 5));
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    setIsSaving(true);
    setFeedback(null);

    try {
      localStorage.setItem('dk_gemini_api_key', trimmed);
      localStorage.setItem('gemini_api_key', trimmed);

      await apiClient.updateGeminiConfig({
        apiKey: trimmed,
        model: 'gemini-3.8-flash'
      });

      setIsConfigured(Boolean(trimmed.length > 5));
      setFeedback('✓ Gemini API Key saved successfully! AI Mathematical Formatting is ready.');
      if (onConfigured) onConfigured(trimmed);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch {
      // Even if backend .env update fails (e.g. read-only container), localStorage is updated!
      setIsConfigured(Boolean(trimmed.length > 5));
      setFeedback('✓ Saved to client session successfully!');
      if (onConfigured) onConfigured(trimmed);
      setTimeout(() => {
        onClose();
      }, 900);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Sparkles size={18} color="#4F46E5" />
            <h3>Google Gemini AI Mathematical Typesetting</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={`${styles.statusCard} ${isConfigured ? styles.active : styles.offline}`}>
            <div className={styles.statusIndicator}>
              <span className={`${styles.statusDot} ${isConfigured ? styles.green : styles.amber}`} />
              <span>
                {isConfigured
                  ? 'Gemini AI Formatting Active'
                  : 'API Key Not Set (Using Deterministic Math Engine)'}
              </span>
            </div>
            <span className={styles.modelBadge}>{model}</span>
          </div>

          <div className={styles.formGroup}>
            <label>
              <Key size={14} color="#4F46E5" />
              Google Gemini API Key:
            </label>
            <div className={styles.keyInputWrapper}>
              <input
                type={showKey ? 'text' : 'password'}
                className={styles.keyInput}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your AIzaSy... API key here"
                autoFocus
              />
              <button
                type="button"
                className={styles.toggleEyeBtn}
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className={styles.helperText}>
              Get a free Google Gemini API key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
              >
                Google AI Studio
              </a>
              . This key powers real-time mathematical OCR reconstruction for Test Series, DPP, BITSAT, and PYQ.
            </p>
          </div>

          {feedback && (
            <div style={{ color: '#059669', fontSize: '13px', fontWeight: 600 }}>
              {feedback}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save &amp; Connect Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiApiKeyModal;

