import React, { useState, useEffect } from 'react';
import {
  Compass,
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
  Link as LinkIcon,
  CheckCircle2,
  X,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Globe
} from 'lucide-react';
import { cmsService } from '../../../services/cmsService';
import type {
  NavbarMenuItem,
  NavbarDropdownItem,
  FooterConfig,
  FooterLinkItem
} from '../../../types/admin';
import styles from './NavbarFooterManagementWorkspace.module.scss';

export const NavbarFooterManagementWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'navbar' | 'footer'>('navbar');
  const [navbarItems, setNavbarItems] = useState<NavbarMenuItem[]>([]);
  const [footerConfig, setFooterConfig] = useState<FooterConfig | null>(null);
  const [expandedDropdownId, setExpandedDropdownId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Available pages for quick-pick
  const availablePages = cmsService.getPagesList();

  // Modals state
  const [editingNavItem, setEditingNavItem] = useState<Partial<NavbarMenuItem> | null>(null);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);

  const [editingSubItem, setEditingSubItem] = useState<{
    parentId: string;
    subItem: Partial<NavbarDropdownItem>;
  } | null>(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  const [editingFooterLink, setEditingFooterLink] = useState<{
    category: 'learningLinks' | 'policyLinks' | 'subjectLinks';
    link: Partial<FooterLinkItem>;
  } | null>(null);
  const [isFooterLinkModalOpen, setIsFooterLinkModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load from CMS service / MongoDB
  const loadData = () => {
    setNavbarItems(cmsService.getNavbarItems());
    setFooterConfig(cmsService.getFooterConfig());
  };

  useEffect(() => {
    loadData();
    // Try fetching live from MongoDB Atlas in background
    cmsService.fetchNavbarFromAPI().then((items) => {
      if (items && items.length > 0) setNavbarItems(items);
    }).catch(() => {});

    cmsService.fetchFooterFromAPI().then((footer) => {
      if (footer) setFooterConfig(footer);
    }).catch(() => {});

    const handleUpdate = () => loadData();
    window.addEventListener('dk_cms_updated', handleUpdate);
    return () => window.removeEventListener('dk_cms_updated', handleUpdate);
  }, []);

  // ─── Navbar Operations ───
  const handleSaveNavbar = async () => {
    setIsSaving(true);
    try {
      cmsService.saveNavbarItems(navbarItems);
      showToast('Navbar configuration saved & published successfully!');
    } catch {
      showToast('Failed to save navbar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetNavbar = () => {
    if (window.confirm('Reset Navbar navigation to system default Kota Pedagogy layout?')) {
      cmsService.resetNavbarToDefault();
      loadData();
      showToast('Navbar reset to defaults.');
    }
  };

  const handleMoveNavItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navbarItems.length) return;
    const newItems = [...navbarItems];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    newItems.forEach((item, idx) => (item.order = idx + 1));
    setNavbarItems(newItems);
    cmsService.saveNavbarItems(newItems);
  };

  const handleToggleNavVisibility = (id: string) => {
    const updated = navbarItems.map((item) =>
      item.id === id ? { ...item, isVisible: !item.isVisible } : item
    );
    setNavbarItems(updated);
    cmsService.saveNavbarItems(updated);
  };

  const handleDeleteNavItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this navbar item?')) {
      const updated = navbarItems.filter((i) => i.id !== id);
      setNavbarItems(updated);
      cmsService.saveNavbarItems(updated);
    }
  };

  const handleSaveNavItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNavItem || !editingNavItem.label || !editingNavItem.path) return;

    let updated: NavbarMenuItem[];
    if (editingNavItem.id) {
      // Editing existing
      updated = navbarItems.map((i) =>
        i.id === editingNavItem.id ? ({ ...i, ...editingNavItem } as NavbarMenuItem) : i
      );
    } else {
      // Adding new
      const newItem: NavbarMenuItem = {
        id: `nav_${Date.now()}`,
        label: editingNavItem.label,
        path: editingNavItem.path,
        isDropdown: !!editingNavItem.isDropdown,
        dropdownItems: editingNavItem.isDropdown ? [] : undefined,
        badge: editingNavItem.badge,
        isButton: !!editingNavItem.isButton,
        buttonVariant: editingNavItem.buttonVariant || 'primary',
        isVisible: editingNavItem.isVisible ?? true,
        order: navbarItems.length + 1
      };
      updated = [...navbarItems, newItem];
    }
    setNavbarItems(updated);
    cmsService.saveNavbarItems(updated);
    setIsNavModalOpen(false);
    setEditingNavItem(null);
  };

  // ─── Sub-Item Operations ───
  const handleSaveSubItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubItem || !editingSubItem.subItem.label || !editingSubItem.subItem.path) return;

    const { parentId, subItem } = editingSubItem;
    const parent = navbarItems.find((p) => p.id === parentId);
    if (!parent) return;

    const dropdownList = parent.dropdownItems ? [...parent.dropdownItems] : [];
    let updatedNav: NavbarMenuItem[];

    if (subItem.id) {
      // Edit
      const updatedSubs = dropdownList.map((s) =>
        s.id === subItem.id ? ({ ...s, ...subItem } as NavbarDropdownItem) : s
      );
      updatedNav = navbarItems.map((n) =>
        n.id === parentId ? { ...n, isDropdown: true, dropdownItems: updatedSubs } : n
      );
    } else {
      // Add
      const newSub: NavbarDropdownItem = {
        id: `sub_${Date.now()}`,
        label: subItem.label || '',
        subtitle: subItem.subtitle,
        icon: subItem.icon || 'BookOpen',
        path: subItem.path || '/',
        badge: subItem.badge,
        isVisible: subItem.isVisible ?? true,
        order: dropdownList.length + 1
      };
      dropdownList.push(newSub);
      updatedNav = navbarItems.map((n) =>
        n.id === parentId ? { ...n, isDropdown: true, dropdownItems: dropdownList } : n
      );
    }
    setNavbarItems(updatedNav);
    cmsService.saveNavbarItems(updatedNav);
    setIsSubModalOpen(false);
    setEditingSubItem(null);
  };

  const handleDeleteSubItem = (parentId: string, subId: string) => {
    const parent = navbarItems.find((p) => p.id === parentId);
    if (!parent || !parent.dropdownItems) return;
    const updatedSubs = parent.dropdownItems.filter((s) => s.id !== subId);
    const updatedNav = navbarItems.map((n) =>
      n.id === parentId ? { ...n, dropdownItems: updatedSubs, isDropdown: updatedSubs.length > 0 } : n
    );
    setNavbarItems(updatedNav);
    cmsService.saveNavbarItems(updatedNav);
  };

  const handleMoveSubItem = (parentId: string, index: number, direction: 'up' | 'down') => {
    const parent = navbarItems.find((p) => p.id === parentId);
    if (!parent || !parent.dropdownItems) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= parent.dropdownItems.length) return;

    const newSubs = [...parent.dropdownItems];
    const [moved] = newSubs.splice(index, 1);
    newSubs.splice(targetIndex, 0, moved);
    newSubs.forEach((item, idx) => (item.order = idx + 1));

    const updatedNav = navbarItems.map((n) =>
      n.id === parentId ? { ...n, dropdownItems: newSubs } : n
    );
    setNavbarItems(updatedNav);
    cmsService.saveNavbarItems(updatedNav);
  };

  // ─── Footer Operations ───
  const handleSaveFooter = async () => {
    if (!footerConfig) return;
    setIsSaving(true);
    try {
      cmsService.saveFooterConfig(footerConfig);
      showToast('Footer configuration saved & published successfully!');
    } catch {
      showToast('Failed to save footer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetFooter = () => {
    if (window.confirm('Reset Footer details to system default?')) {
      cmsService.resetFooterToDefault();
      loadData();
      showToast('Footer reset to defaults.');
    }
  };

  const handleSaveFooterLinkModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerConfig || !editingFooterLink || !editingFooterLink.link.label || !editingFooterLink.link.path) return;

    const { category, link } = editingFooterLink;
    const list = [...(footerConfig[category] || [])];

    let updatedConfig: FooterConfig;
    if (link.id) {
      const updated = list.map((l) => (l.id === link.id ? ({ ...l, ...link } as FooterLinkItem) : l));
      updatedConfig = { ...footerConfig, [category]: updated };
    } else {
      const newLink: FooterLinkItem = {
        id: `fl_${Date.now()}`,
        label: link.label || '',
        path: link.path || '/',
        isVisible: link.isVisible ?? true,
        badge: link.badge
      };
      list.push(newLink);
      updatedConfig = { ...footerConfig, [category]: list };
    }
    setFooterConfig(updatedConfig);
    cmsService.saveFooterConfig(updatedConfig);
    setIsFooterLinkModalOpen(false);
    setEditingFooterLink(null);
  };

  const handleDeleteFooterLink = (category: 'learningLinks' | 'policyLinks' | 'subjectLinks', linkId: string) => {
    if (!footerConfig) return;
    const list = (footerConfig[category] || []).filter((l) => l.id !== linkId);
    const updatedConfig = { ...footerConfig, [category]: list };
    setFooterConfig(updatedConfig);
    cmsService.saveFooterConfig(updatedConfig);
  };

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
            <Compass size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Navbar &amp; Footer Management</h1>
            <p className={styles.subtitle}>
              Configure global header menu links, dropdown navigation hierarchies, Delhi center addresses, and footer links.
            </p>
          </div>
        </div>

        <div className={styles.actionsGroup}>
          {activeTab === 'navbar' ? (
            <>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => {
                  setEditingNavItem({
                    label: '',
                    path: '/',
                    isDropdown: false,
                    isVisible: true,
                    badge: '',
                    isButton: false
                  });
                  setIsNavModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Add Nav Item</span>
              </button>
              <button
                type="button"
                className={styles.dangerOutlineBtn}
                onClick={handleResetNavbar}
                title="Reset Navbar to default links"
              >
                <RotateCcw size={14} />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSaveNavbar}
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save & Publish Navbar'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.dangerOutlineBtn}
                onClick={handleResetFooter}
                title="Reset Footer to default brand info"
              >
                <RotateCcw size={14} />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSaveFooter}
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save & Publish Footer'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'navbar' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('navbar')}
        >
          <Layers size={16} />
          <span>Header Navbar Navigation</span>
          <span className={styles.tabBadge}>{navbarItems.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'footer' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('footer')}
        >
          <Globe size={16} />
          <span>Footer Information &amp; Links</span>
        </button>
      </div>

      {/* TAB 1: HEADER NAVBAR */}
      {activeTab === 'navbar' && (
        <>
          {/* Live Navbar Preview Strip */}
          <div className={styles.previewStrip}>
            <div className={styles.previewLabelRow}>
              <span>Live Public Header Preview</span>
              <span className={styles.liveIndicator}>Synced Real-Time</span>
            </div>
            <div className={styles.previewNavList}>
              {navbarItems
                .filter((item) => item.isVisible)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.previewNavItem} ${item.isButton ? styles.isBtn : ''}`}
                  >
                    <span>{item.label}</span>
                    {item.isDropdown && <ChevronDown size={13} />}
                    {item.badge && <span className={styles.previewBadge}>{item.badge}</span>}
                  </div>
                ))}
            </div>
          </div>

          {/* Items Table Card */}
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Navbar Menu Items Hierarchy</h2>
                <p className={styles.cardSub}>
                  Reorder items, toggle visibility, customize button styling, or manage dropdown sub-menus.
                </p>
              </div>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => {
                  setEditingNavItem({
                    label: '',
                    path: '/',
                    isDropdown: false,
                    isVisible: true,
                    badge: '',
                    isButton: false
                  });
                  setIsNavModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>New Navbar Item</span>
              </button>
            </div>

            <div className={styles.itemsList}>
              {navbarItems.map((item, index) => {
                const isExpanded = expandedDropdownId === item.id;
                const dropdownCount = item.dropdownItems?.length || 0;

                return (
                  <div
                    key={item.id}
                    className={`${styles.itemRowCard} ${!item.isVisible ? styles.hiddenItem : ''}`}
                  >
                    <div className={styles.itemMainBar}>
                      <div className={styles.itemLeft}>
                        {/* Order controls */}
                        <div className={styles.orderControls}>
                          <button
                            type="button"
                            className={styles.orderBtn}
                            onClick={() => handleMoveNavItem(index, 'up')}
                            disabled={index === 0}
                            title="Move Up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.orderBtn}
                            onClick={() => handleMoveNavItem(index, 'down')}
                            disabled={index === navbarItems.length - 1}
                            title="Move Down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        {/* Label & Meta */}
                        <div className={styles.itemLabelMeta}>
                          <div className={styles.itemLabelText}>
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className={`${styles.badgePill} ${item.badge === 'Live' ? styles.badgeRed : styles.badgeAmber}`}>
                                {item.badge}
                              </span>
                            )}
                            {item.isButton && (
                              <span className={`${styles.badgePill} ${styles.badgePurple}`}>
                                CTA Button
                              </span>
                            )}
                          </div>
                          <span className={styles.itemPathText}>{item.path}</span>
                        </div>
                      </div>

                      {/* Dropdown status & Actions */}
                      <div className={styles.itemActions}>
                        {item.isDropdown && (
                          <button
                            type="button"
                            className={styles.expandSubBtn}
                            onClick={() => setExpandedDropdownId(isExpanded ? null : item.id)}
                          >
                            <Layers size={14} />
                            <span>{dropdownCount} Sub-items</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}

                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => handleToggleNavVisibility(item.id)}
                          title={item.isVisible ? 'Hide from Navbar' : 'Show in Navbar'}
                        >
                          {item.isVisible ? <Eye size={16} /> : <EyeOff size={16} color="#94a3b8" />}
                        </button>

                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => {
                            setEditingNavItem(item);
                            setIsNavModalOpen(true);
                          }}
                          title="Edit Item"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          type="button"
                          className={`${styles.iconActionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteNavItem(item.id)}
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Dropdown Sub-Items List */}
                    {item.isDropdown && isExpanded && (
                      <div className={styles.subItemsWrapper}>
                        <div className={styles.subItemsHeader}>
                          <span className={styles.subItemsTitle}>
                            Dropdown Sub-Items for &quot;{item.label}&quot;
                          </span>
                          <button
                            type="button"
                            className={styles.primaryBtn}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                            onClick={() => {
                              setEditingSubItem({
                                parentId: item.id,
                                subItem: {
                                  label: '',
                                  subtitle: '',
                                  path: '/',
                                  icon: 'BookOpen',
                                  isVisible: true
                                }
                              });
                              setIsSubModalOpen(true);
                            }}
                          >
                            <Plus size={14} />
                            <span>Add Sub-Item</span>
                          </button>
                        </div>

                        {dropdownCount === 0 ? (
                          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.5rem 0' }}>
                            No sub-items added yet. Click &quot;Add Sub-Item&quot; above to create dropdown links.
                          </p>
                        ) : (
                          <div className={styles.subItemsList}>
                            {item.dropdownItems?.map((sub, sIdx) => (
                              <div key={sub.id} className={styles.subItemRow}>
                                <div className={styles.subItemLeft}>
                                  <div className={styles.orderControls}>
                                    <button
                                      type="button"
                                      className={styles.orderBtn}
                                      onClick={() => handleMoveSubItem(item.id, sIdx, 'up')}
                                      disabled={sIdx === 0}
                                    >
                                      <ChevronUp size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.orderBtn}
                                      onClick={() => handleMoveSubItem(item.id, sIdx, 'down')}
                                      disabled={sIdx === (item.dropdownItems?.length || 1) - 1}
                                    >
                                      <ChevronDown size={12} />
                                    </button>
                                  </div>

                                  <div className={styles.subItemInfo}>
                                    <div className={styles.subItemLabel}>
                                      <span>{sub.label}</span>
                                      {sub.badge && <span className={styles.badgePill}>{sub.badge}</span>}
                                    </div>
                                    {sub.subtitle && (
                                      <span className={styles.subItemSubtitle}>{sub.subtitle}</span>
                                    )}
                                    <span className={styles.subItemPath}>{sub.path}</span>
                                  </div>
                                </div>

                                <div className={styles.itemActions}>
                                  <button
                                    type="button"
                                    className={styles.iconActionBtn}
                                    onClick={() => {
                                      setEditingSubItem({
                                        parentId: item.id,
                                        subItem: sub
                                      });
                                      setIsSubModalOpen(true);
                                    }}
                                    title="Edit Sub-Item"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.iconActionBtn} ${styles.deleteBtn}`}
                                    onClick={() => handleDeleteSubItem(item.id, sub.id)}
                                    title="Delete Sub-Item"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* TAB 2: FOOTER MANAGEMENT */}
      {activeTab === 'footer' && footerConfig && (
        <div className={styles.footerGrid}>
          {/* Section 1: Brand & Centers Info */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>
              <Sparkles size={16} color="#2563eb" />
              <span>Brand Identity &amp; Mission</span>
            </h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Institute Brand Name</label>
              <input
                type="text"
                className={styles.input}
                value={footerConfig.brandName}
                onChange={(e) => setFooterConfig({ ...footerConfig, brandName: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Pedagogy Tagline</label>
              <input
                type="text"
                className={styles.input}
                value={footerConfig.brandTag}
                onChange={(e) => setFooterConfig({ ...footerConfig, brandTag: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Brand Description</label>
              <textarea
                className={styles.textarea}
                value={footerConfig.description}
                onChange={(e) => setFooterConfig({ ...footerConfig, description: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Copyright Notice</label>
              <input
                type="text"
                className={styles.input}
                value={footerConfig.copyrightText}
                onChange={(e) => setFooterConfig({ ...footerConfig, copyrightText: e.target.value })}
              />
            </div>
          </div>

          {/* Section 2: Delhi Offline Campuses & Contact Numbers */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>
              <MapPin size={16} color="#dc2626" />
              <span>Delhi Offline Centers &amp; Support</span>
            </h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Janakpuri Center Address</label>
              <textarea
                className={styles.textarea}
                style={{ minHeight: '60px' }}
                value={footerConfig.janakpuriAddress}
                onChange={(e) => setFooterConfig({ ...footerConfig, janakpuriAddress: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Dwarka Center Address</label>
              <textarea
                className={styles.textarea}
                style={{ minHeight: '60px' }}
                value={footerConfig.dwarkaAddress}
                onChange={(e) => setFooterConfig({ ...footerConfig, dwarkaAddress: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Primary Phone</label>
                <input
                  type="text"
                  className={styles.input}
                  value={footerConfig.phone1}
                  onChange={(e) => setFooterConfig({ ...footerConfig, phone1: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Alternate Phone</label>
                <input
                  type="text"
                  className={styles.input}
                  value={footerConfig.phone2}
                  onChange={(e) => setFooterConfig({ ...footerConfig, phone2: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Official WhatsApp Hotline</label>
              <input
                type="text"
                className={styles.input}
                value={footerConfig.whatsappNumber}
                onChange={(e) => setFooterConfig({ ...footerConfig, whatsappNumber: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Admissions Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={footerConfig.emailAdmissions}
                  onChange={(e) => setFooterConfig({ ...footerConfig, emailAdmissions: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Director Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={footerConfig.emailDirector}
                  onChange={(e) => setFooterConfig({ ...footerConfig, emailDirector: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Social Media Channels */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>
              <Globe size={16} color="#0284c7" />
              <span>Official Social Media Communities</span>
            </h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>YouTube Channel URL</label>
              <input
                type="text"
                className={styles.input}
                value={footerConfig.socialLinks.youtube || ''}
                placeholder="https://youtube.com/@..."
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    socialLinks: { ...footerConfig.socialLinks, youtube: e.target.value }
                  })
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Telegram Channel / Discussion</label>
              <input
                type="text"
                className={styles.input}
                value={footerConfig.socialLinks.telegram || ''}
                placeholder="https://t.me/..."
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    socialLinks: { ...footerConfig.socialLinks, telegram: e.target.value }
                  })
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>WhatsApp Channel Link</label>
              <input
                type="text"
                className={styles.input}
                value={footerConfig.socialLinks.whatsapp || ''}
                placeholder="https://chat.whatsapp.com/..."
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    socialLinks: { ...footerConfig.socialLinks, whatsapp: e.target.value }
                  })
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Instagram Handle URL</label>
              <input
                type="text"
                className={styles.input}
                value={footerConfig.socialLinks.instagram || ''}
                placeholder="https://instagram.com/..."
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    socialLinks: { ...footerConfig.socialLinks, instagram: e.target.value }
                  })
                }
              />
            </div>
          </div>

          {/* Section 4: Link Columns (Learning Links, Policy Links, Subject Links) */}
          <div className={styles.formSection} style={{ gridColumn: '1 / -1' }}>
            <h3 className={styles.formSectionTitle}>
              <LinkIcon size={16} color="#10b981" />
              <span>Footer Navigation Link Columns</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Column A: Learning Links */}
              <div className={styles.linksColumnCard}>
                <div className={styles.linkColumnHeader}>
                  <h4 className={styles.linkColumnTitle}>Learning Programs ({footerConfig.learningLinks.length})</h4>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                    onClick={() => {
                      setEditingFooterLink({
                        category: 'learningLinks',
                        link: { label: '', path: '/', isVisible: true }
                      });
                      setIsFooterLinkModalOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className={styles.columnLinksList}>
                  {footerConfig.learningLinks.map((link) => (
                    <div key={link.id} className={styles.columnLinkRow}>
                      <div className={styles.linkInfo}>
                        <span className={styles.linkTitle}>{link.label}</span>
                        <span className={styles.linkUrl}>{link.path}</span>
                      </div>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => {
                            setEditingFooterLink({ category: 'learningLinks', link });
                            setIsFooterLinkModalOpen(true);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconActionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteFooterLink('learningLinks', link.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column B: Policy & Student Protection Links */}
              <div className={styles.linksColumnCard}>
                <div className={styles.linkColumnHeader}>
                  <h4 className={styles.linkColumnTitle}>Policies &amp; Legal ({footerConfig.policyLinks.length})</h4>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                    onClick={() => {
                      setEditingFooterLink({
                        category: 'policyLinks',
                        link: { label: '', path: '/', isVisible: true }
                      });
                      setIsFooterLinkModalOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className={styles.columnLinksList}>
                  {footerConfig.policyLinks.map((link) => (
                    <div key={link.id} className={styles.columnLinkRow}>
                      <div className={styles.linkInfo}>
                        <span className={styles.linkTitle}>{link.label}</span>
                        <span className={styles.linkUrl}>{link.path}</span>
                      </div>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => {
                            setEditingFooterLink({ category: 'policyLinks', link });
                            setIsFooterLinkModalOpen(true);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconActionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteFooterLink('policyLinks', link.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column C: Subject Modules & Speed Drills */}
              <div className={styles.linksColumnCard}>
                <div className={styles.linkColumnHeader}>
                  <h4 className={styles.linkColumnTitle}>Subject Modules ({footerConfig.subjectLinks.length})</h4>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                    onClick={() => {
                      setEditingFooterLink({
                        category: 'subjectLinks',
                        link: { label: '', path: '/', isVisible: true }
                      });
                      setIsFooterLinkModalOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className={styles.columnLinksList}>
                  {footerConfig.subjectLinks.map((link) => (
                    <div key={link.id} className={styles.columnLinkRow}>
                      <div className={styles.linkInfo}>
                        <span className={styles.linkTitle}>{link.label}</span>
                        <span className={styles.linkUrl}>{link.path}</span>
                      </div>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => {
                            setEditingFooterLink({ category: 'subjectLinks', link });
                            setIsFooterLinkModalOpen(true);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconActionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteFooterLink('subjectLinks', link.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: ADD / EDIT NAVBAR ITEM ─── */}
      {isNavModalOpen && editingNavItem && (
        <div className={styles.modalOverlay} onClick={() => setIsNavModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveNavItemModal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingNavItem.id ? 'Edit Navbar Item' : 'Add New Navbar Item'}
                </h3>
                <button
                  type="button"
                  className={styles.closeModalBtn}
                  onClick={() => setIsNavModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Item Label *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. Free Lectures, Courses, Super-30"
                    value={editingNavItem.label || ''}
                    onChange={(e) => setEditingNavItem({ ...editingNavItem, label: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Select Page or Enter Target Path *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <select
                      className={styles.select}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEditingNavItem({ ...editingNavItem, path: e.target.value });
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        -- Quick select from created pages --
                      </option>
                      {availablePages.map((p) => (
                        <option key={p.id} value={p.slug}>
                          {p.name} ({p.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. /courses or /super-30 or https://..."
                    value={editingNavItem.path || ''}
                    onChange={(e) => setEditingNavItem({ ...editingNavItem, path: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Pill Badge (Optional)</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Live, New, Free, 50% Off"
                    value={editingNavItem.badge || ''}
                    onChange={(e) => setEditingNavItem({ ...editingNavItem, badge: e.target.value })}
                  />
                </div>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={editingNavItem.isDropdown || false}
                    onChange={(e) =>
                      setEditingNavItem({ ...editingNavItem, isDropdown: e.target.checked })
                    }
                  />
                  <span>Enable Dropdown Sub-Menu for this item</span>
                </label>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={editingNavItem.isButton || false}
                    onChange={(e) =>
                      setEditingNavItem({ ...editingNavItem, isButton: e.target.checked })
                    }
                  />
                  <span>Render as Highlighted CTA Button (e.g. &quot;Enroll Now&quot;)</span>
                </label>

                {editingNavItem.isButton && (
                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
                    <label className={styles.label} style={{ marginBottom: '0.35rem', fontSize: '0.75rem' }}>Button Style Variant</label>
                    <select
                      className={styles.select}
                      value={editingNavItem.buttonVariant || 'primary'}
                      onChange={(e) => setEditingNavItem({ ...editingNavItem, buttonVariant: e.target.value as any })}
                    >
                      <option value="primary">Primary Filled (Blue Solid)</option>
                      <option value="outline">Outline (Transparent Blue)</option>
                    </select>
                    <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                      ✓ Button size is styled with 12px 28px padding for optimal navbar alignment.
                    </span>
                  </div>
                )}

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={editingNavItem.isVisible ?? true}
                    onChange={(e) =>
                      setEditingNavItem({ ...editingNavItem, isVisible: e.target.checked })
                    }
                  />
                  <span>Visible to public students</span>
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => setIsNavModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD / EDIT DROPDOWN SUB-ITEM ─── */}
      {isSubModalOpen && editingSubItem && (
        <div className={styles.modalOverlay} onClick={() => setIsSubModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveSubItemModal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingSubItem.subItem.id ? 'Edit Dropdown Item' : 'Add Dropdown Sub-Item'}
                </h3>
                <button
                  type="button"
                  className={styles.closeModalBtn}
                  onClick={() => setIsSubModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Sub-Item Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. JEE Main & Advanced Batches"
                    value={editingSubItem.subItem.label || ''}
                    onChange={(e) =>
                      setEditingSubItem({
                        ...editingSubItem,
                        subItem: { ...editingSubItem.subItem, label: e.target.value }
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Subtitle / Explanatory Note</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 20-30s speed methods & core calculus"
                    value={editingSubItem.subItem.subtitle || ''}
                    onChange={(e) =>
                      setEditingSubItem({
                        ...editingSubItem,
                        subItem: { ...editingSubItem.subItem, subtitle: e.target.value }
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Target Destination Path *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <select
                      className={styles.select}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEditingSubItem({
                            ...editingSubItem,
                            subItem: { ...editingSubItem.subItem, path: e.target.value }
                          });
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        -- Quick select from created pages --
                      </option>
                      {availablePages.map((p) => (
                        <option key={p.id} value={p.slug}>
                          {p.name} ({p.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. /courses?category=JEE%20Main"
                    value={editingSubItem.subItem.path || ''}
                    onChange={(e) =>
                      setEditingSubItem({
                        ...editingSubItem,
                        subItem: { ...editingSubItem.subItem, path: e.target.value }
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Pill Tag / Badge</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Popular, New, Free, Kota Special"
                    value={editingSubItem.subItem.badge || ''}
                    onChange={(e) =>
                      setEditingSubItem({
                        ...editingSubItem,
                        subItem: { ...editingSubItem.subItem, badge: e.target.value }
                      })
                    }
                  />
                </div>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={editingSubItem.subItem.isVisible ?? true}
                    onChange={(e) =>
                      setEditingSubItem({
                        ...editingSubItem,
                        subItem: { ...editingSubItem.subItem, isVisible: e.target.checked }
                      })
                    }
                  />
                  <span>Show this sub-item in dropdown</span>
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => setIsSubModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Save Sub-Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADD / EDIT FOOTER LINK ─── */}
      {isFooterLinkModalOpen && editingFooterLink && (
        <div className={styles.modalOverlay} onClick={() => setIsFooterLinkModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveFooterLinkModal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingFooterLink.link.id ? 'Edit Footer Link' : 'Add Footer Link'}
                </h3>
                <button
                  type="button"
                  className={styles.closeModalBtn}
                  onClick={() => setIsFooterLinkModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Link Label *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. Refund Policy, Super-30 Batch, Janakpuri Center"
                    value={editingFooterLink.link.label || ''}
                    onChange={(e) =>
                      setEditingFooterLink({
                        ...editingFooterLink,
                        link: { ...editingFooterLink.link, label: e.target.value }
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Target Destination Path *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <select
                      className={styles.select}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEditingFooterLink({
                            ...editingFooterLink,
                            link: { ...editingFooterLink.link, path: e.target.value }
                          });
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        -- Quick select from created pages --
                      </option>
                      {availablePages.map((p) => (
                        <option key={p.id} value={p.slug}>
                          {p.name} ({p.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. /terms or /courses or /p/super-30"
                    value={editingFooterLink.link.path || ''}
                    onChange={(e) =>
                      setEditingFooterLink({
                        ...editingFooterLink,
                        link: { ...editingFooterLink.link, path: e.target.value }
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Badge (Optional)</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. New, Updated"
                    value={editingFooterLink.link.badge || ''}
                    onChange={(e) =>
                      setEditingFooterLink({
                        ...editingFooterLink,
                        link: { ...editingFooterLink.link, badge: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => setIsFooterLinkModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
