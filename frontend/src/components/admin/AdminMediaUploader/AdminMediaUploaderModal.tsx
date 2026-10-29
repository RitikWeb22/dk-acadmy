import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import { useToast } from '../../../context/ToastContext';
import styles from './AdminMediaUploaderModal.module.scss';

export interface UploadedMediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'raw';
  size: string;
  storage?: string;
  createdAt: string;
}

interface AdminMediaUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowedTypes?: 'all' | 'image' | 'video';
  targetFolder?: string;
  onSuccess?: (url: string, item: UploadedMediaItem) => void;
  title?: string;
  description?: string;
}

export const AdminMediaUploaderModal: React.FC<AdminMediaUploaderModalProps> = ({
  isOpen,
  onClose,
  allowedTypes = 'all',
  targetFolder = 'dk-academy',
  onSuccess,
  title = 'Upload Image or Video File',
  description = 'Directly upload high-resolution banners, student photos, course trailers, and offline classroom media.'
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadedMediaItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileType(null);
      setUploadResult(null);
      setErrorMessage(null);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const acceptMime =
    allowedTypes === 'image'
      ? 'image/*'
      : allowedTypes === 'video'
      ? 'video/mp4,video/webm,video/quicktime,video/x-matroska'
      : 'image/*,video/mp4,video/webm,video/quicktime,video/x-matroska';

  const validateAndStageFile = (file: File) => {
    setErrorMessage(null);
    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);

    if (allowedTypes === 'image' && !isImg) {
      setErrorMessage('Please select an image file (JPG, PNG, WebP, SVG, GIF).');
      return;
    }
    if (allowedTypes === 'video' && !isVid) {
      setErrorMessage('Please select a video file (MP4, WEBM, MOV, MKV).');
      return;
    }
    if (!isImg && !isVid) {
      setErrorMessage('Invalid file format. Please upload an image or video file.');
      return;
    }

    // Size limit: 200MB for video, 20MB for image
    const maxBytes = isVid ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`File exceeds size limit of ${isVid ? '200MB' : '20MB'}.`);
      return;
    }

    setSelectedFile(file);
    setFileType(isVid ? 'video' : 'image');

    // Create local preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndStageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndStageFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(5);
    setErrorMessage(null);

    try {
      const res = await apiClient.uploadFile(selectedFile, targetFolder, (percent) => {
        setUploadProgress(percent);
      });

      if (res.success && res.url) {
        setUploadProgress(100);
        const item: UploadedMediaItem = {
          id: `med_${Date.now()}`,
          name: res.originalName || selectedFile.name,
          url: res.url,
          type: res.resourceType === 'video' || fileType === 'video' ? 'video' : 'image',
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
          storage: res.storage || 'Cloudinary / Local Vault',
          createdAt: new Date().toISOString()
        };

        setUploadResult(item);
        showToast(
          `${item.type === 'video' ? 'Video' : 'Image'} uploaded successfully!`,
          'success'
        );

        // Update local storage media catalog so it appears immediately across all media tabs
        try {
          const stored = localStorage.getItem('dk_admin_media_list');
          const list = stored ? JSON.parse(stored) : [];
          list.unshift(item);
          localStorage.setItem('dk_admin_media_list', JSON.stringify(list));
        } catch {
          // pass
        }

        if (onSuccess) {
          onSuccess(res.url, item);
        }
      } else {
        setErrorMessage(res.message || 'Upload failed. Please check network connection.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('File URL copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setUploadResult(null);
    setErrorMessage(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <div className={styles.iconBadge}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>{title}</h2>
              <p className={styles.modalSubtitle}>{description}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptMime}
            style={{ display: 'none' }}
          />

          {/* Error Notice */}
          {errorMessage && (
            <div className={styles.errorAlert} role="alert">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success State */}
          {uploadResult ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={48} />
              </div>
              <h3 className={styles.successHeading}>File Upload Complete!</h3>
              <p className={styles.successSubtext}>
                Your {uploadResult.type} has been securely stored in the DK Academy Media Vault.
              </p>

              {/* Uploaded Asset Preview */}
              <div className={styles.resultCard}>
                <div className={styles.resultMedia}>
                  {uploadResult.type === 'image' ? (
                    <img src={uploadResult.url} alt={uploadResult.name} className={styles.resultImg} />
                  ) : (
                    <video src={uploadResult.url} controls className={styles.resultVideo} />
                  )}
                </div>
                <div className={styles.resultMeta}>
                  <div className={styles.resultMetaName}>{uploadResult.name}</div>
                  <div className={styles.resultMetaDetails}>
                    <span>Type: <strong>{uploadResult.type.toUpperCase()}</strong></span>
                    <span>Size: <strong>{uploadResult.size}</strong></span>
                    <span>Storage: <strong>{uploadResult.storage}</strong></span>
                  </div>
                  <div className={styles.urlCopyRow}>
                    <input
                      type="text"
                      readOnly
                      value={uploadResult.url}
                      className={styles.urlInput}
                    />
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => handleCopyUrl(uploadResult.url)}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? 'Copied' : 'Copy URL'}</span>
                    </button>
                    <a
                      href={uploadResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openLinkBtn}
                      title="Open file in new tab"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>

              <div className={styles.successActions}>
                <button
                  type="button"
                  className={styles.uploadMoreBtn}
                  onClick={handleReset}
                >
                  <UploadCloud size={16} />
                  <span>Upload Another Asset</span>
                </button>
                <button
                  type="button"
                  className={styles.doneBtn}
                  onClick={onClose}
                >
                  <span>Done</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : selectedFile ? (
            /* Selected File Preview & Upload Confirmation */
            <div className={styles.stageState}>
              <div className={styles.previewContainer}>
                {fileType === 'image' && previewUrl ? (
                  <div className={styles.imagePreviewWrap}>
                    <img src={previewUrl} alt="Preview" className={styles.previewImg} />
                  </div>
                ) : fileType === 'video' && previewUrl ? (
                  <div className={styles.videoPreviewWrap}>
                    <video src={previewUrl} controls className={styles.previewVideo} />
                  </div>
                ) : null}
              </div>

              <div className={styles.fileDetailRow}>
                <div className={styles.fileInfo}>
                  {fileType === 'video' ? <Film size={22} className={styles.typeIconVid} /> : <ImageIcon size={22} className={styles.typeIconImg} />}
                  <div>
                    <h4 className={styles.fileName}>{selectedFile.name}</h4>
                    <span className={styles.fileSize}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {fileType?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    className={styles.removeFileBtn}
                    onClick={handleReset}
                    title="Remove selected file"
                  >
                    <Trash2 size={16} />
                    <span>Change</span>
                  </button>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressLabel}>
                    <span className={styles.progressStatusText}>
                      <Loader2 size={14} className={styles.spinIcon} />
                      Uploading &amp; Processing ({uploadProgress}%)...
                    </span>
                    <span className={styles.progressPercent}>{uploadProgress}%</span>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.stageActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={onClose}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.uploadSubmitBtn}
                  onClick={handleStartUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className={styles.spinIcon} />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={18} />
                      <span>Upload to Media Vault</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Dropzone Empty State */
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dragOver : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.dropzoneIconBox}>
                <UploadCloud size={36} />
              </div>

              <div className={styles.dropzoneText}>
                <h3>Drag &amp; drop your file here, or <span className={styles.browseLink}>browse</span></h3>
                <p>
                  Supports {allowedTypes === 'video' ? 'videos (MP4, WEBM, MOV)' : allowedTypes === 'image' ? 'images (JPG, PNG, WebP, SVG)' : 'images (JPG, PNG, WebP) and videos (MP4, WEBM, MOV)'}
                </p>
              </div>

              <div className={styles.supportedPills}>
                <span className={styles.pill}><ImageIcon size={13} /> Images up to 20MB</span>
                <span className={styles.pill}><Film size={13} /> Videos up to 200MB</span>
                <span className={styles.pill}><Sparkles size={13} /> Auto-CDN Optimized</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
