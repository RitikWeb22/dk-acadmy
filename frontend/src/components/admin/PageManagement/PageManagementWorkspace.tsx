import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Plus,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  Video,
  FileText,
  Layout,
  Grid,
  Download,
  HelpCircle,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { cmsService } from '../../../services/cmsService';
import type {
  PageContentConfig,
  PageSectionItem,
  PageCardItem,
  PageAssetItem,
  PageFaqItem
} from '../../../types/admin';
import styles from './PageManagementWorkspace.module.scss';

export const PageManagementWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'builder'>('directory');
  const [pagesList, setPagesList] = useState<Array<{ id: string; name: string; slug: string; inNavbar?: boolean; inFooter?: boolean }>>([]);
  const [allPageConfigs, setAllPageConfigs] = useState<Record<string, PageContentConfig>>({});
  const [selectedPageId, setSelectedPageId] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals state
  const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false);
  const [newPageForm, setNewPageForm] = useState<{
    id: string;
    name: string;
    slug: string;
    layoutTemplate: 'cards-grid' | 'video-showcase' | 'academic-syllabus' | 'standard';
    heroHeading: string;
    heroSubheading: string;
    linkWithNavbar: boolean;
    navbarLabel: string;
    navbarBadge: string;
    linkWithFooter: boolean;
    footerColumn: string;
    metaTitle: string;
    metaDescription: string;
  }>({
    id: '',
    name: '',
    slug: '',
    layoutTemplate: 'cards-grid',
    heroHeading: '',
    heroSubheading: '',
    linkWithNavbar: true,
    navbarLabel: '',
    navbarBadge: 'New',
    linkWithFooter: true,
    footerColumn: 'learningLinks',
    metaTitle: '',
    metaDescription: ''
  });

  // Section Add / Edit Modal
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Partial<PageSectionItem> | null>(null);

  // Sub-card inside cards section modal
  const [editingCard, setEditingCard] = useState<{
    index: number;
    card: PageCardItem;
  } | null>(null);

  // Sub-asset inside assets section modal
  const [editingAsset, setEditingAsset] = useState<{
    index: number;
    asset: PageAssetItem;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = () => {
    setPagesList(cmsService.getPagesList());
    setAllPageConfigs(cmsService.getAllPageConfigs());
  };

  useEffect(() => {
    loadData();
    cmsService.fetchPagesFromAPI().then((configs) => {
      if (configs) setAllPageConfigs(configs);
    }).catch(() => {});

    const handleUpdate = () => loadData();
    window.addEventListener('dk_cms_updated', handleUpdate);

    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'dk_academy_cms_pages_v1' || e.key === 'dk_academy_cms_pages_list_v1') && e.newValue) {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('dk_cms_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Guarantee that selected page always returns fully-populated sections
  const currentPageConfig: PageContentConfig =
    allPageConfigs[selectedPageId] || cmsService.getPageConfig(selectedPageId);

  // Real-time Hero field updater
  const handleUpdateHeroField = (field: keyof PageContentConfig, value: any) => {
    const updated = { ...currentPageConfig, [field]: value };
    setAllPageConfigs((prev) => ({ ...prev, [selectedPageId]: updated }));
    cmsService.savePageConfig(selectedPageId, { [field]: value });
  };

  // ─── Save Current Page Sections & Content ───
  const handleSavePageConfig = async () => {
    setIsSaving(true);
    try {
      cmsService.savePageConfig(selectedPageId, currentPageConfig);
      loadData();
      showToast(`Page "${currentPageConfig.pageTitle || selectedPageId}" published successfully!`);
    } catch {
      showToast('Failed to save page configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCurrentPage = () => {
    if (window.confirm(`Reset "${currentPageConfig.pageTitle}" to system Kota Pedagogy defaults?`)) {
      cmsService.resetPageToDefault(selectedPageId);
      loadData();
      showToast('Page reset to default.');
    }
  };

  const handleFetchAllHomeSections = () => {
    cmsService.resetPageToDefault('home');
    loadData();
    showToast('Fetched all 8 core Home Page sections successfully!');
  };

  const handleFetchAllAboutSections = () => {
    cmsService.resetPageToDefault('about');
    loadData();
    showToast('Fetched all 5 core About Page sections successfully!');
  };

  // ─── Create New Page Handler ───
  const handleCreateNewPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageForm.name) return;

    const autoId = newPageForm.id.trim() || newPageForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const autoSlug = newPageForm.slug.trim()
      ? (newPageForm.slug.startsWith('/') ? newPageForm.slug : `/${newPageForm.slug}`)
      : `/p/${autoId}`;

    cmsService.addNewPage({
      id: autoId,
      name: newPageForm.name,
      slug: autoSlug,
      layoutTemplate: newPageForm.layoutTemplate,
      heroHeading: newPageForm.heroHeading || newPageForm.name,
      heroSubheading: newPageForm.heroSubheading || 'Official educational program by DK Academy JEE',
      linkWithNavbar: newPageForm.linkWithNavbar,
      navbarLabel: newPageForm.navbarLabel || newPageForm.name,
      navbarBadge: newPageForm.navbarBadge,
      linkWithFooter: newPageForm.linkWithFooter,
      footerColumn: newPageForm.footerColumn,
      metaTitle: newPageForm.metaTitle || `${newPageForm.name} | DK Academy JEE`,
      metaDescription: newPageForm.metaDescription || `Explore ${newPageForm.name} at DK Academy JEE`
    });

    loadData();
    setSelectedPageId(autoId);
    setActiveTab('builder');
    setIsCreatePageModalOpen(false);
    showToast(`New page "${newPageForm.name}" created with ${newPageForm.layoutTemplate} layout!`);
  };

  // ─── Section Reordering & Management ───
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...(currentPageConfig.customSections || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const [moved] = sections.splice(index, 1);
    sections.splice(targetIdx, 0, moved);
    sections.forEach((sec, idx) => (sec.order = idx + 1));

    const updated = { ...currentPageConfig, customSections: sections };
    setAllPageConfigs({ ...allPageConfigs, [selectedPageId]: updated });
    cmsService.savePageConfig(selectedPageId, { customSections: sections });
    loadData();
  };

  const handleToggleSectionVisibility = (secId: string) => {
    const sections = (currentPageConfig.customSections || []).map((sec) =>
      sec.id === secId ? { ...sec, isVisible: !sec.isVisible } : sec
    );
    const updated = { ...currentPageConfig, customSections: sections };
    setAllPageConfigs({ ...allPageConfigs, [selectedPageId]: updated });
    cmsService.savePageConfig(selectedPageId, { customSections: sections });
    loadData();
  };

  const handleDeleteSection = (secId: string) => {
    if (window.confirm('Are you sure you want to delete this section from the page?')) {
      const sections = (currentPageConfig.customSections || []).filter((sec) => sec.id !== secId);
      const updated = { ...currentPageConfig, customSections: sections };
      setAllPageConfigs({ ...allPageConfigs, [selectedPageId]: updated });
      cmsService.savePageConfig(selectedPageId, { customSections: sections });
      loadData();
      showToast('Section deleted from page!');
    }
  };

  // ─── Save Add / Edit Section Modal ───
  const handleSaveSectionModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editingSection.title) return;

    const sections = [...(currentPageConfig.customSections || [])];
    if (editingSection.id) {
      // Update
      const idx = sections.findIndex((s) => s.id === editingSection.id);
      if (idx !== -1) {
        sections[idx] = { ...sections[idx], ...editingSection } as PageSectionItem;
      }
    } else {
      // Add new
      const newSec: PageSectionItem = {
        id: `sec_${Date.now()}`,
        type: editingSection.type || 'banner',
        title: editingSection.title,
        subtitle: editingSection.subtitle,
        content: editingSection.content || '',
        badge: editingSection.badge,
        buttonText: editingSection.buttonText,
        buttonUrl: editingSection.buttonUrl,
        imageUrl: editingSection.imageUrl,
        videoUrl: editingSection.videoUrl,
        videoThumbnail: editingSection.videoThumbnail,
        videoCaption: editingSection.videoCaption,
        columns: editingSection.columns || 3,
        cards: editingSection.cards || [],
        assets: editingSection.assets || [],
        order: sections.length + 1,
        isVisible: editingSection.isVisible ?? true
      };
      sections.push(newSec);
    }

    const updated = { ...currentPageConfig, customSections: sections };
    setAllPageConfigs({ ...allPageConfigs, [selectedPageId]: updated });
    cmsService.savePageConfig(selectedPageId, { customSections: sections });
    setIsSectionModalOpen(false);
    setEditingSection(null);
    loadData();
    showToast('Section saved to page!');
  };

  const filteredPages = pagesList.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Strip */}
      <div className={styles.headerStrip}>
        <div className={styles.titleArea}>
          <div className={styles.iconCircle}>
            <Monitor size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Page Management &amp; Visual Section Builder</h1>
            <p className={styles.subtitle}>
              Design custom educational landing pages, configure layouts, and compose dynamic visual sections (Banners, Videos, Cards &amp; Downloadable Assets).
            </p>
          </div>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setNewPageForm({
                id: '',
                name: '',
                slug: '',
                layoutTemplate: 'cards-grid',
                heroHeading: '',
                heroSubheading: '',
                linkWithNavbar: true,
                navbarLabel: '',
                navbarBadge: 'New',
                linkWithFooter: true,
                footerColumn: 'learningLinks',
                metaTitle: '',
                metaDescription: ''
              });
              setIsCreatePageModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Create New Page</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'directory' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Layers size={16} />
          <span>All Pages Directory</span>
          <span className={styles.tabBadge}>{pagesList.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'builder' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          <Layout size={16} />
          <span>Visual Section Customizer</span>
          <span className={styles.tabBadge} style={{ background: '#fef3c7', color: '#d97706' }}>
            {currentPageConfig.customSections?.length || 0} Sections
          </span>
        </button>
      </div>

      {/* TAB 1: ALL PAGES DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          <div className={styles.searchFilterBar}>
            <div className={styles.searchBox}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search page by name or slug (/courses, /classroom, /super-30)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
              Showing {filteredPages.length} registered pages
            </span>
          </div>

          <div className={styles.pagesGrid}>
            {filteredPages.map((page) => {
              const cfg = allPageConfigs[page.id] || cmsService.getPageConfig(page.id);
              const template = cfg.layoutTemplate || 'standard';
              const sectionCount = cfg.customSections?.length || 0;
              const isBuiltIn = ['home', 'about'].includes(page.id);

              return (
                <div key={page.id} className={styles.pageCard}>
                  <div className={styles.pageCardTop}>
                    <div className={styles.pageHeaderRow}>
                      <h3 className={styles.pageTitle}>{page.name}</h3>
                      <span className={styles.pageSlug}>{page.slug}</span>
                    </div>

                    <div className={styles.pagePillsRow}>
                      <span className={`${styles.templatePill} ${
                        template === 'video-showcase'
                          ? styles.templateVideo
                          : template === 'cards-grid'
                          ? styles.templateCards
                          : template === 'academic-syllabus'
                          ? styles.templateAssets
                          : ''
                      }`}>
                        {template.replace('-', ' ')}
                      </span>

                      {page.inNavbar && <span className={styles.navLinkPill}>In Navbar</span>}
                      {page.inFooter && <span className={styles.navLinkPill}>In Footer</span>}
                    </div>
                  </div>

                  <div className={styles.pageCardBottom}>
                    <span className={styles.sectionCountText}>
                      {sectionCount} {sectionCount === 1 ? 'Section' : 'Sections'}
                    </span>

                    <div className={styles.pageActionsGroup}>
                      <button
                        type="button"
                        className={styles.smallActionBtn}
                        onClick={() => {
                          setSelectedPageId(page.id);
                          setActiveTab('builder');
                        }}
                        title="Customize Sections"
                      >
                        <Layout size={14} />
                        <span>Customize</span>
                      </button>

                      <a
                        href={page.slug.startsWith('/p/') || page.slug.startsWith('/') ? page.slug : `/p/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.iconBtn}
                        title="Preview Public Page"
                      >
                        <ExternalLink size={14} />
                      </a>

                      {!isBuiltIn && (
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          onClick={() => {
                            if (window.confirm(`Delete custom page "${page.name}"?`)) {
                              cmsService.deleteCustomPage(page.id);
                              loadData();
                              showToast(`Page "${page.name}" removed.`);
                            }
                          }}
                          title="Delete Page"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 2: VISUAL SECTION BUILDER */}
      {activeTab === 'builder' && (
        <div className={styles.builderContainer}>
          {/* Page Selector Strip */}
          <div className={styles.pageSelectorStrip}>
            <div className={styles.pageSelectorLeft}>
              <div>
                <label className={styles.label} style={{ display: 'block', marginBottom: '4px' }}>
                  Select Page to Customize:
                </label>
                <select
                  className={styles.pageDropdownSelect}
                  value={selectedPageId}
                  onChange={(e) => setSelectedPageId(e.target.value)}
                >
                  {pagesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Target Public Path: <strong style={{ color: '#0f172a' }}>{pagesList.find(p => p.id === selectedPageId)?.slug || `/${selectedPageId}`}</strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Layout: {currentPageConfig.layoutTemplate || 'standard'}
                </span>
              </div>
            </div>

            <div className={styles.actionsGroup}>
              {selectedPageId === 'home' && (
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={handleFetchAllHomeSections}
                  title="Fetch and restore all 8 core Home Page sections"
                  style={{ borderColor: '#bfdbfe', background: '#eff6ff', color: '#2563eb', fontWeight: 700 }}
                >
                  <RotateCcw size={14} />
                  <span>Fetch All Home Sections ({currentPageConfig.customSections?.length || 8})</span>
                </button>
              )}

              {selectedPageId === 'about' && (
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={handleFetchAllAboutSections}
                  title="Fetch and restore all 5 core About Page sections"
                  style={{ borderColor: '#a7f3d0', background: '#ecfdf5', color: '#059669', fontWeight: 700 }}
                >
                  <RotateCcw size={14} />
                  <span>Fetch All About Sections ({currentPageConfig.customSections?.length || 5})</span>
                </button>
              )}

              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => {
                  setEditingSection({
                    type: 'banner',
                    title: '',
                    subtitle: '',
                    content: '',
                    badge: '',
                    buttonText: '',
                    buttonUrl: '',
                    imageUrl: '/img/dk-results-banner.jpeg',
                    columns: 3,
                    cards: [],
                    assets: [],
                    isVisible: true
                  });
                  setIsSectionModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Add Section to Page</span>
              </button>

              <button
                type="button"
                className={styles.dangerOutlineBtn}
                onClick={handleResetCurrentPage}
                title="Reset this page to default"
              >
                <RotateCcw size={14} />
                <span>Reset Page</span>
              </button>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSavePageConfig}
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Publishing...' : 'Publish'}</span>
              </button>
            </div>
          </div>

          {/* Hero Configuration Card */}
          <div className={styles.heroConfigCard}>
            <div className={styles.sectionHeaderRow}>
              <h3 className={styles.sectionHeaderTitle}>
                <Sparkles size={18} color="#2563eb" />
                <span>Top Hero Banner &amp; Headline Settings</span>
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Above the fold introduction</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Hero Badge Pill</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. FOUNDED BY DK SIR • 15+ YEARS OF EXCELLENCE"
                  value={currentPageConfig.heroBadge || ''}
                  onChange={(e) => handleUpdateHeroField('heroBadge', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Primary CTA Button Text &amp; URL</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Enroll Now"
                    value={currentPageConfig.primaryCtaText || ''}
                    onChange={(e) => handleUpdateHeroField('primaryCtaText', e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="/courses"
                    value={currentPageConfig.primaryCtaUrl || ''}
                    onChange={(e) => handleUpdateHeroField('primaryCtaUrl', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Hero Main Heading</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Concept-First Pedagogy Designed to Master IIT JEE Mathematics."
                value={currentPageConfig.heroHeading || ''}
                onChange={(e) => handleUpdateHeroField('heroHeading', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Hero Subtitle / Description</label>
              <textarea
                className={styles.textarea}
                placeholder="Explanatory paragraph outlining the value proposition..."
                value={currentPageConfig.heroSubheading || ''}
                onChange={(e) => handleUpdateHeroField('heroSubheading', e.target.value)}
              />
            </div>
          </div>

          {/* List of Sections */}
          <div className={styles.sectionsList}>
            <div className={styles.sectionHeaderRow}>
              <h3 className={styles.sectionHeaderTitle}>
                <Grid size={18} color="#2563eb" />
                <span>Page Sections ({currentPageConfig.customSections?.length || 0})</span>
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Reorder, configure banners, videos, cards, or asset downloads
              </span>
            </div>

            {(!currentPageConfig.customSections || currentPageConfig.customSections.length === 0) ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                background: '#ffffff',
                border: '1px dashed #cbd5e1',
                borderRadius: '16px'
              }}>
                <Layout size={36} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
                  No Custom Sections Yet
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem' }}>
                  Add your first visual section like a promotional banner, video masterclass, cards grid, or downloadable assets.
                </p>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => {
                    setEditingSection({
                      type: 'banner',
                      title: '',
                      subtitle: '',
                      content: '',
                      imageUrl: '/img/dk-results-banner.jpeg',
                      columns: 3,
                      cards: [],
                      assets: [],
                      isVisible: true
                    });
                    setIsSectionModalOpen(true);
                  }}
                >
                  <Plus size={16} />
                  <span>Add First Section</span>
                </button>
              </div>
            ) : (
              currentPageConfig.customSections.map((sec, idx) => {
                const secType = sec.type || 'banner';

                return (
                  <div
                    key={sec.id}
                    className={`${styles.sectionCard} ${!sec.isVisible ? styles.hiddenSection : ''}`}
                  >
                    <div className={styles.sectionCardHeader}>
                      <div className={styles.sectionCardHeaderLeft}>
                        {/* Order controls */}
                        <div className={styles.orderControls}>
                          <button
                            type="button"
                            className={styles.orderBtn}
                            onClick={() => handleMoveSection(idx, 'up')}
                            disabled={idx === 0}
                            title="Move section up"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            className={styles.orderBtn}
                            onClick={() => handleMoveSection(idx, 'down')}
                            disabled={idx === (currentPageConfig.customSections?.length || 1) - 1}
                            title="Move section down"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>

                        {/* Section Number Index Badge */}
                        <div className={styles.sectionIndexBadge}>
                          <span className={styles.indexNumber}>#{idx + 1}</span>
                          <span className={styles.indexIcon}>
                            {secType === 'banner' ? (
                              <Layers size={13} />
                            ) : secType === 'video' ? (
                              <Video size={13} />
                            ) : secType === 'cards' ? (
                              <Grid size={13} />
                            ) : (
                              <Download size={13} />
                            )}
                          </span>
                        </div>

                        <div className={styles.sectionMetaGroup}>
                          <div className={styles.sectionCardTitle}>
                            <span>{sec.title}</span>
                            <span className={`${styles.sectionTypePill} ${
                              secType === 'banner'
                                ? styles.typeBanner
                                : secType === 'video'
                                ? styles.typeVideo
                                : secType === 'cards'
                                ? styles.typeCards
                                : styles.typeAssets
                            }`}>
                              {secType}
                            </span>
                            {sec.badge && (
                              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontWeight: 700 }}>
                                {sec.badge}
                              </span>
                            )}
                            {sec.isVisible ? (
                              <span className={styles.statusPillActive}>Active on Page</span>
                            ) : (
                              <span className={styles.statusPillHidden}>Hidden</span>
                            )}
                          </div>
                          {sec.subtitle && (
                            <span className={styles.sectionSubtitleText}>{sec.subtitle}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.pageActionsGroup}>
                        <button
                          type="button"
                          className={styles.smallActionBtn}
                          onClick={() => handleToggleSectionVisibility(sec.id)}
                          title={sec.isVisible ? 'Hide Section from Page' : 'Show Section on Page'}
                          style={{
                            background: sec.isVisible ? '#f8fafc' : '#eff6ff',
                            color: sec.isVisible ? '#64748b' : '#2563eb',
                            borderColor: sec.isVisible ? '#e2e8f0' : '#bfdbfe'
                          }}
                        >
                          {sec.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          <span>{sec.isVisible ? 'Hide' : 'Show'}</span>
                        </button>

                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => {
                            setEditingSection({
                              ...sec,
                              cards: sec.cards ? sec.cards.map((c) => ({ ...c })) : [],
                              assets: sec.assets ? sec.assets.map((a) => ({ ...a })) : []
                            });
                            setIsSectionModalOpen(true);
                          }}
                          title="Edit Section"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteSection(sec.id)}
                          title="Delete Section"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Visual Section Preview Card */}
                    <div className={styles.sectionPreviewBox}>
                      {secType === 'banner' && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {sec.imageUrl && (
                            <img
                              src={sec.imageUrl}
                              alt={sec.title}
                              style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                              {sec.content || 'Promotional banner with action CTA'}
                            </p>
                            {sec.buttonText && (
                              <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                                CTA: {sec.buttonText} ({sec.buttonUrl || '#'})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {secType === 'video' && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ width: '120px', height: '70px', background: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                            <Video size={24} color="#ef4444" />
                          </div>
                          <div>
                            <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                              {sec.videoCaption || 'Video Masterclass Showcase'}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                              URL: {sec.videoUrl || 'Not configured'}
                            </span>
                          </div>
                        </div>
                      )}

                      {secType === 'cards' && (
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                            Cards Grid ({sec.columns || 3} Columns — {sec.cards?.length || 0} Cards)
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: '0.75rem' }}>
                            {sec.cards?.map((c) => (
                              <div key={c.id} style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>{c.title}</strong>
                                  {c.badge && <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#2563eb', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>{c.badge}</span>}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.5rem', lineHeight: '1.3' }}>
                                  {c.description}
                                </p>
                                {c.linkText && <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>{c.linkText} →</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {secType === 'assets' && (
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                            Downloadable Assets &amp; Prospectus ({sec.assets?.length || 0} Files)
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sec.assets?.map((a) => (
                              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Download size={15} color="#2563eb" />
                                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{a.title}</span>
                                  {a.fileSize && <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>{a.fileSize}</span>}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>{a.buttonText || 'Download'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: CREATE NEW PAGE ─── */}
      {isCreatePageModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreatePageModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateNewPage}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Create New Academic Page</h3>
                <button
                  type="button"
                  className={styles.closeModalBtn}
                  onClick={() => setIsCreatePageModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Page Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. Super-30 Intensive Dropper Sprint"
                    value={newPageForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = `/p/${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                      setNewPageForm({
                        ...newPageForm,
                        name,
                        slug: newPageForm.slug ? newPageForm.slug : slug,
                        navbarLabel: newPageForm.navbarLabel ? newPageForm.navbarLabel : name
                      });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Public URL Slug (e.g. /super-30 or /p/super-30) *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={newPageForm.slug}
                    onChange={(e) => setNewPageForm({ ...newPageForm, slug: e.target.value })}
                  />
                </div>

                {/* Page Layout Selector */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Page Design &amp; Layout Template *</label>
                  <div className={styles.layoutSelectorGrid}>
                    <div
                      className={`${styles.layoutCardOption} ${newPageForm.layoutTemplate === 'cards-grid' ? styles.selectedLayout : ''}`}
                      onClick={() => setNewPageForm({ ...newPageForm, layoutTemplate: 'cards-grid' })}
                    >
                      <div className={styles.layoutIconTile}>
                        <Grid size={20} />
                      </div>
                      <h4 className={styles.layoutOptionTitle}>Cards Grid Layout</h4>
                      <p className={styles.layoutOptionDesc}>
                        Hero + 3-column interactive program track cards with badges and links.
                      </p>
                    </div>

                    <div
                      className={`${styles.layoutCardOption} ${newPageForm.layoutTemplate === 'video-showcase' ? styles.selectedLayout : ''}`}
                      onClick={() => setNewPageForm({ ...newPageForm, layoutTemplate: 'video-showcase' })}
                    >
                      <div className={styles.layoutIconTile}>
                        <Video size={20} />
                      </div>
                      <h4 className={styles.layoutOptionTitle}>Video Masterclass</h4>
                      <p className={styles.layoutOptionDesc}>
                        Hero + featured 16:9 video player embed, lecture notes, and chapter breakdown.
                      </p>
                    </div>

                    <div
                      className={`${styles.layoutCardOption} ${newPageForm.layoutTemplate === 'academic-syllabus' ? styles.selectedLayout : ''}`}
                      onClick={() => setNewPageForm({ ...newPageForm, layoutTemplate: 'academic-syllabus' })}
                    >
                      <div className={styles.layoutIconTile}>
                        <Download size={20} />
                      </div>
                      <h4 className={styles.layoutOptionTitle}>Syllabus &amp; Assets</h4>
                      <p className={styles.layoutOptionDesc}>
                        Hero + downloadable formula pocketbooks, PDF prospectuses, and study sheets.
                      </p>
                    </div>

                    <div
                      className={`${styles.layoutCardOption} ${newPageForm.layoutTemplate === 'standard' ? styles.selectedLayout : ''}`}
                      onClick={() => setNewPageForm({ ...newPageForm, layoutTemplate: 'standard' })}
                    >
                      <div className={styles.layoutIconTile}>
                        <Layout size={20} />
                      </div>
                      <h4 className={styles.layoutOptionTitle}>Standard Multi-Section</h4>
                      <p className={styles.layoutOptionDesc}>
                        Promotional hero banner + feature cards + informational pedagogy text.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auto Linking Checkboxes */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={newPageForm.linkWithNavbar}
                      onChange={(e) => setNewPageForm({ ...newPageForm, linkWithNavbar: e.target.checked })}
                    />
                    <span>Automatically add this page to Header Navbar</span>
                  </label>

                  {newPageForm.linkWithNavbar && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingLeft: '1.5rem' }}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Navbar Label"
                        value={newPageForm.navbarLabel}
                        onChange={(e) => setNewPageForm({ ...newPageForm, navbarLabel: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Badge (e.g. New)"
                        value={newPageForm.navbarBadge}
                        onChange={(e) => setNewPageForm({ ...newPageForm, navbarBadge: e.target.value })}
                      />
                    </div>
                  )}

                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={newPageForm.linkWithFooter}
                      onChange={(e) => setNewPageForm({ ...newPageForm, linkWithFooter: e.target.checked })}
                    />
                    <span>Automatically add this page to Footer Links</span>
                  </label>

                  {newPageForm.linkWithFooter && (
                    <div style={{ paddingLeft: '1.5rem' }}>
                      <select
                        className={styles.select}
                        value={newPageForm.footerColumn}
                        onChange={(e) => setNewPageForm({ ...newPageForm, footerColumn: e.target.value })}
                      >
                        <option value="learningLinks">Under &quot;Learning Programs&quot; Column</option>
                        <option value="policyLinks">Under &quot;Policies &amp; Legal&quot; Column</option>
                        <option value="subjectLinks">Under &quot;Subject Modules&quot; Column</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* SEO Meta Tags */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>SEO Meta Title</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Kota Super-30 Sprint | DK Academy JEE"
                    value={newPageForm.metaTitle}
                    onChange={(e) => setNewPageForm({ ...newPageForm, metaTitle: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>SEO Meta Description</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Brief description for Google search rankings and social shares..."
                    value={newPageForm.metaDescription}
                    onChange={(e) => setNewPageForm({ ...newPageForm, metaDescription: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => setIsCreatePageModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Create Page &amp; Seed Sections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD / EDIT SECTION ─── */}
      {isSectionModalOpen && editingSection && (
        <div className={styles.modalOverlay} onClick={() => setIsSectionModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveSectionModal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingSection.id ? 'Edit Page Section' : 'Add Section to Page'}
                </h3>
                <button
                  type="button"
                  className={styles.closeModalBtn}
                  onClick={() => setIsSectionModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Section Type Selector */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Section Component Type *</label>
                  <select
                    className={styles.select}
                    value={editingSection.type || 'banner'}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        type: e.target.value as any
                      })
                    }
                  >
                    <option value="banner">Promotional Banner Section</option>
                    <option value="video">Video Masterclass Section</option>
                    <option value="cards">Interactive Cards Grid Section</option>
                    <option value="assets">Downloadable Assets &amp; Prospectus Section</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Section Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. Why Aspirants Choose DK Academy"
                    value={editingSection.title || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Section Subtitle</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Kota Pedagogy • 20s Inspection Method"
                    value={editingSection.subtitle || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                  />
                </div>

                {/* TYPE-SPECIFIC FIELDS */}

                {/* A. BANNER FIELDS */}
                {editingSection.type === 'banner' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Badge Text</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. ADMISSIONS OPEN"
                        value={editingSection.badge || ''}
                        onChange={(e) => setEditingSection({ ...editingSection, badge: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Banner Image URL</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="/img/dk-results-banner.jpeg"
                        value={editingSection.imageUrl || ''}
                        onChange={(e) => setEditingSection({ ...editingSection, imageUrl: e.target.value })}
                      />
                      <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                          <Upload size={13} />
                          <span>Upload Banner Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  if (evt.target?.result) {
                                    setEditingSection({ ...editingSection, imageUrl: evt.target.result as string });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Or enter image path/URL</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Button Text</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g. Apply Now"
                          value={editingSection.buttonText || ''}
                          onChange={(e) => setEditingSection({ ...editingSection, buttonText: e.target.value })}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Button URL</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g. /contact"
                          value={editingSection.buttonUrl || ''}
                          onChange={(e) => setEditingSection({ ...editingSection, buttonUrl: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Paragraph Content</label>
                      <textarea
                        className={styles.textarea}
                        placeholder="Detailed banner text..."
                        value={editingSection.content || ''}
                        onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* B. VIDEO FIELDS */}
                {editingSection.type === 'video' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Video Embed URL (YouTube or MP4) *</label>
                      <input
                        type="text"
                        required
                        className={styles.input}
                        placeholder="e.g. https://www.youtube.com/embed/... or local video"
                        value={editingSection.videoUrl || ''}
                        onChange={(e) => setEditingSection({ ...editingSection, videoUrl: e.target.value })}
                      />
                      <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                          <Upload size={13} />
                          <span>Upload Video File (MP4/WebM)</span>
                          <input
                            type="file"
                            accept="video/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  if (evt.target?.result) {
                                    setEditingSection({ ...editingSection, videoUrl: evt.target.result as string });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Or paste YouTube/MP4 URL above</span>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Video Thumbnail Poster URL</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="/img/dk-results-banner.jpeg"
                        value={editingSection.videoThumbnail || ''}
                        onChange={(e) => setEditingSection({ ...editingSection, videoThumbnail: e.target.value })}
                      />
                      <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                          <Upload size={13} />
                          <span>Upload Poster Thumbnail</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  if (evt.target?.result) {
                                    setEditingSection({ ...editingSection, videoThumbnail: evt.target.result as string });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Or enter image path</span>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Video Caption / Title</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. 20-30s Calculus Elimination Tactics with DK Sir"
                        value={editingSection.videoCaption || ''}
                        onChange={(e) => setEditingSection({ ...editingSection, videoCaption: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* C. CARDS GRID FIELDS */}
                {editingSection.type === 'cards' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Grid Columns</label>
                      <select
                        className={styles.select}
                        value={editingSection.columns || 3}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            columns: Number(e.target.value) as any
                          })
                        }
                      >
                        <option value="2">2 Columns Grid</option>
                        <option value="3">3 Columns Grid</option>
                        <option value="4">4 Columns Grid</option>
                      </select>
                    </div>

                    {/* Manage Sub-Cards */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
                          Cards Inside Section ({editingSection.cards?.length || 0})
                        </span>
                        <button
                          type="button"
                          className={styles.primaryBtn}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            const newCards = [...(editingSection.cards || [])];
                            newCards.push({
                              id: `c_${Date.now()}`,
                              title: 'New Track Card',
                              description: 'Description of this program or feature track.',
                              badge: 'Feature',
                              linkText: 'Explore',
                              linkUrl: '/courses'
                            });
                            setEditingSection({ ...editingSection, cards: newCards });
                          }}
                        >
                          <Plus size={14} />
                          <span>Add Card</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {editingSection.cards?.map((card, cIdx) => (
                          <div key={card.id || cIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="text"
                                className={styles.input}
                                placeholder="Card Title"
                                value={card.title}
                                onChange={(e) => {
                                  const updated = [...(editingSection.cards || [])];
                                  updated[cIdx].title = e.target.value;
                                  setEditingSection({ ...editingSection, cards: updated });
                                }}
                              />
                              <input
                                type="text"
                                className={styles.input}
                                placeholder="Badge (e.g. Flagship)"
                                style={{ maxWidth: '140px' }}
                                value={card.badge || ''}
                                onChange={(e) => {
                                  const updated = [...(editingSection.cards || [])];
                                  updated[cIdx].badge = e.target.value;
                                  setEditingSection({ ...editingSection, cards: updated });
                                }}
                              />
                              <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                onClick={() => {
                                  const updated = (editingSection.cards || []).filter((_, i) => i !== cIdx);
                                  setEditingSection({ ...editingSection, cards: updated });
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <input
                              type="text"
                              className={styles.input}
                              placeholder="Short description..."
                              value={card.description}
                              onChange={(e) => {
                                const updated = [...(editingSection.cards || [])];
                                updated[cIdx].description = e.target.value;
                                setEditingSection({ ...editingSection, cards: updated });
                              }}
                            />

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="text"
                                className={styles.input}
                                placeholder="Link Text (e.g. View Details)"
                                value={card.linkText || ''}
                                onChange={(e) => {
                                  const updated = [...(editingSection.cards || [])];
                                  updated[cIdx].linkText = e.target.value;
                                  setEditingSection({ ...editingSection, cards: updated });
                                }}
                              />
                              <input
                                type="text"
                                className={styles.input}
                                placeholder="Link URL (/courses)"
                                value={card.linkUrl || ''}
                                onChange={(e) => {
                                  const updated = [...(editingSection.cards || [])];
                                  updated[cIdx].linkUrl = e.target.value;
                                  setEditingSection({ ...editingSection, cards: updated });
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* D. ASSETS FIELDS */}
                {editingSection.type === 'assets' && (
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
                        Downloadable Resources ({editingSection.assets?.length || 0})
                      </span>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          const newAssets = [...(editingSection.assets || [])];
                          newAssets.push({
                            id: `a_${Date.now()}`,
                            title: 'New Study Material PDF',
                            fileType: 'pdf',
                            fileUrl: '/docs/formula-handbook.pdf',
                            fileSize: '3.5 MB',
                            buttonText: 'Download PDF'
                          });
                          setEditingSection({ ...editingSection, assets: newAssets });
                        }}
                      >
                        <Plus size={14} />
                        <span>Add Asset</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {editingSection.assets?.map((asset, aIdx) => (
                        <div key={asset.id || aIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type="text"
                              className={styles.input}
                              placeholder="Asset Title (e.g. Formula Pocketbook)"
                              value={asset.title}
                              onChange={(e) => {
                                const updated = [...(editingSection.assets || [])];
                                updated[aIdx].title = e.target.value;
                                setEditingSection({ ...editingSection, assets: updated });
                              }}
                            />
                            <input
                              type="text"
                              className={styles.input}
                              placeholder="File Size (e.g. 4.2 MB)"
                              style={{ maxWidth: '120px' }}
                              value={asset.fileSize || ''}
                              onChange={(e) => {
                                const updated = [...(editingSection.assets || [])];
                                updated[aIdx].fileSize = e.target.value;
                                setEditingSection({ ...editingSection, assets: updated });
                              }}
                            />
                            <button
                              type="button"
                              className={`${styles.iconBtn} ${styles.deleteBtn}`}
                              onClick={() => {
                                const updated = (editingSection.assets || []).filter((_, i) => i !== aIdx);
                                setEditingSection({ ...editingSection, assets: updated });
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type="text"
                              className={styles.input}
                              placeholder="File URL (e.g. /docs/prospectus.pdf)"
                              value={asset.fileUrl}
                              onChange={(e) => {
                                const updated = [...(editingSection.assets || [])];
                                updated[aIdx].fileUrl = e.target.value;
                                setEditingSection({ ...editingSection, assets: updated });
                              }}
                            />
                            <input
                              type="text"
                              className={styles.input}
                              placeholder="Button Text (e.g. Download PDF)"
                              style={{ maxWidth: '160px' }}
                              value={asset.buttonText || ''}
                              onChange={(e) => {
                                const updated = [...(editingSection.assets || [])];
                                updated[aIdx].buttonText = e.target.value;
                                setEditingSection({ ...editingSection, assets: updated });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={editingSection.isVisible ?? true}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, isVisible: e.target.checked })
                    }
                  />
                  <span>Section is visible to students on live page</span>
                </label>
              </div>

              <div className={styles.modalFooter}>
                {editingSection.id && (
                  <button
                    type="button"
                    className={styles.dangerOutlineBtn}
                    onClick={() => {
                      if (editingSection.id) {
                        handleDeleteSection(editingSection.id);
                        setIsSectionModalOpen(false);
                      }
                    }}
                    style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Section</span>
                  </button>
                )}
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => setIsSectionModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

