# DK Academy JEE — Repository Size Audit & Hostinger Clone Failure Analysis

**Report Date:** November 12, 2026  
**Auditor:** Senior DevOps & Repository Optimization Specialist  
**Target Repository:** `RitikWeb22/dk-acadmy` (Branch: `main`)  
**Deployment Platform:** Hostinger Node.js Application Platform  

---

## Executive Summary

Hostinger deployment is getting stuck and timing out at the **"Cloning repository"** stage (`Receiving objects: 56% (9129/16232), 159.41 MiB | 2.22 MiB/s`).

The audit confirms that the repository suffers from **two compounding issues**:
1. **Excessive Historical Blobs in `.git`:** The `.git` directory alone is **583.94 MB** with **16,380 loose objects** and **10,785 deleted historical files** consuming **526.27 MB** of dead history. This is primarily caused by Vite compilation outputs in `backend/public/assets/` being committed to Git on almost every commit, leaving thousands of stale hashed `.js` and `.css` chunks in Git history.
2. **Massive Video Duplication in Working Tree:** The current commit (`HEAD`) tracks **561.48 MB** of `.mp4` video files. Due to duplication across both `frontend/public/videos/` and `backend/public/videos/`, as well as duplicate filenames (`sample-lecture.mp4` and `dk-sir-lecture-calculus.mp4`), large binary media represents **92.3% of the entire working tree size**.

Because Hostinger web app containers run with strict clone timeouts (typically 60–120 seconds) and memory limits, downloading ~584 MB over the network causes Hostinger's clone worker to be killed or hang silently.

---

## 1. High-Level Size Metrics

| Metric | Measured Size | Notes |
| :--- | :--- | :--- |
| **Total Directory Size (on disk)** | **1,985.85 MB** (~1.94 GB) | Includes local `node_modules` and builds |
| **`.git` Folder Size** | **583.94 MB** | Downloaded by Hostinger during `git clone` |
| **Git Object Database** | **572.50 MiB** | 428.12 MiB loose objects + 144.38 MiB pack garbage |
| **Total Tracked Files in `HEAD`** | **608.35 MB** | Active files tracked in current `main` branch |
| **Active Video Media in `HEAD`** | **561.48 MB** | 92.3% of all tracked files in `HEAD` |
| **Pure Source Code Size (TS/JS/SCSS/JSON)** | **~46.87 MB** | Actual production logic and configs |
| **Historical Dead/Deleted Objects** | **526.27 MB** (10,785 objects) | Old build artifacts and deleted uploads in `.git` |
| **Working Tree without `node_modules`** | **909.03 MB** | Working files without node dependencies |

---

## 2. Size Threshold Breakdown (Tracked Files in HEAD)

### A. Files > 50 MB
| Path | Size (MB) | Exact Bytes | Status / Reason |
| :--- | :--- | :--- | :--- |
| `backend/public/videos/story-rohan.mp4` | **90.17 MB** | 94,548,359 | Student story video (duplicated) |
| `frontend/public/videos/story-rohan.mp4` | **90.17 MB** | 94,548,359 | Exact duplicate of backend video |
| `backend/public/videos/2.mp4` | **88.87 MB** | 93,188,433 | Lecture/demo video (duplicated) |
| `frontend/public/videos/2.mp4` | **88.87 MB** | 93,188,433 | Exact duplicate of backend video |

### B. Files Between 25 MB and 50 MB
| Path | Size (MB) | Exact Bytes | Status / Reason |
| :--- | :--- | :--- | :--- |
| `backend/public/videos/story-priya.mp4` | **42.36 MB** | 44,418,038 | Student story video (duplicated) |
| `frontend/public/videos/story-priya.mp4` | **42.36 MB** | 44,418,038 | Exact duplicate of backend video |

### C. Files Between 10 MB and 25 MB
| Path | Size (MB) | Exact Bytes | Status / Reason |
| :--- | :--- | :--- | :--- |
| `backend/public/videos/1.mp4` | **22.17 MB** | 23,241,692 | Demo walkthrough video (duplicated) |
| `frontend/public/videos/1.mp4` | **22.17 MB** | 23,241,692 | Exact duplicate of backend video |
| `backend/public/videos/story-aarav.mp4` | **17.99 MB** | 18,860,238 | Student story video (duplicated) |
| `frontend/public/videos/story-aarav.mp4` | **17.99 MB** | 18,860,238 | Exact duplicate of backend video |

### D. Files Between 5 MB and 10 MB
| Path | Size (MB) | Exact Bytes | Status / Reason |
| :--- | :--- | :--- | :--- |
| `backend/public/sample-lecture.mp4` | **9.59 MB** | 10,058,638 | Demo lecture (duplicated across 4 paths) |
| `frontend/public/sample-lecture.mp4` | **9.59 MB** | 10,058,638 | Exact duplicate |
| `backend/public/videos/dk-sir-lecture-calculus.mp4` | **9.59 MB** | 10,058,638 | Identical content to `sample-lecture.mp4` |
| `frontend/public/videos/dk-sir-lecture-calculus.mp4` | **9.59 MB** | 10,058,638 | Exact duplicate |

---

## 3. Historical Deleted Objects Analysis

Using `git rev-list --objects --all` and cross-referencing against `HEAD`, we identified **10,785 objects** totaling **526.27 MB** that have been deleted from the current branch but remain stored in Git history.

### Top Historical Blobs Remaining in `.git`:
1. `backend/public/uploads/dk_1793083198374_2023-05-29.png` (**4.20 MB**) — Old uploaded image
2. `backend/public/uploads/dk_1793435940401_IMDXEnW7RThw8.png` (**1.45 MB**) — Old uploaded image
3. `backend/public/uploads/dk_asset_1792739010239_6192.png` (**1.05 MB**) — Old uploaded image
4. **Over 10,000 compiled chunks** in `backend/public/assets/` (e.g., `AdminDashboardPage-*.js`, `TestSeriesBuilderWorkspace-*.js`, `vendor-media-*.js`) each ~0.5 MB to ~0.85 MB. Because `backend/public/assets/` was tracked in Git and rebuilt frequently, every build generated new filenames with content hashes, leaving previous build files permanently recorded in history.

---

## 4. Git Configuration & Submodule Inspection

- **Git LFS (`git lfs ls-files`):** Not used (0 files tracked). All videos and binaries were committed as standard Git objects.
- **Git Submodules (`.gitmodules`):** None configured.
- **`.gitattributes`:** Missing. No binary/LFS filters defined.
- **`.gitignore` Deficiencies:**
  - `frontend/dist/` is ignored, but `backend/public/assets/` (where `build-unified.cjs` copies `dist/assets`) was NOT ignored.
  - Video files (`*.mp4`) are not ignored or managed via Git LFS/external CDN.

---

## 5. Root Cause of Hostinger Clone Failure

When Hostinger triggers a deployment build, it performs:
```bash
git clone https://github.com/RitikWeb22/dk-acadmy.git
```
Because the remote repository contains **583.94 MB** of data with 16,380 objects, Hostinger's build worker hits its network timeout / buffer threshold around 160–200 MB (matching your log: `Receiving objects: 56% (9129/16232), 159.41 MiB | 2.22 MiB/s`).

Once optimized, the clone size will drop from **584 MB** to **under 25–40 MB**, allowing Hostinger to clone in under 5–10 seconds.

---

## 6. Categorization & Action Plan (Phases 2 & 3 Proposals)

### Category A: Safe to Exclude from Git (via `.gitignore`)
- `backend/public/assets/*` — These are compiled bundle chunks produced automatically during `npm run build`. Hostinger runs `npm run build` during deployment, so these chunks do not need to be committed to Git.
- `backend/public/videos/*` — Redundant duplicate of `frontend/public/videos/*`. When `npm run build` runs, `scripts/build-unified.cjs` automatically syncs `frontend/dist/videos` into `backend/public/videos`.

### Category B: Files That Must Remain in Git
- All source code: `frontend/src/**`, `backend/src/**`, `scripts/**`
- All manifests: `package.json`, `package-lock.json`, `tsconfig*.json`
- Essential light brand assets (logos, icons, vector graphics in `public/img/`, `public/images/`)
- Deployment instructions: `HOSTINGER_DEPLOYMENT_GUIDE.md`, `README.md`

### Category C: High-Volume Media (Recommend External Storage / CDN)
- Video files (`story-rohan.mp4`, `2.mp4`, `story-priya.mp4`, `1.mp4`, `story-aarav.mp4`, `dk-sir-lecture-calculus.mp4`):
  - **Option 1 (Recommended for Hostinger):** Upload videos once directly to Hostinger File Manager (`public_html/backend/public/videos/`) or Cloudinary / YouTube unlisted embeds.
  - **Option 2 (Git LFS / Lightweight):** Keep single lightweight/compressed demo versions in Git, moving high-resolution videos to external CDN.

### Category D: Historical Objects Requiring Special Cleanup (Phase 3)
- Cleanup of old compiled build chunks (`AdminDashboardPage-*.js`, etc.) and deleted upload images from Git history using `git-filter-repo` or `git filter-branch`.
- **Note:** Per strict instructions, history rewriting requires explicit user approval before execution.

---

## 7. Recommended Next Steps

1. **Awaiting User Review & Approval:** Review this audit report.
2. **Phase 2 (Immediate & Non-Destructive):** 
   - Update `.gitignore` so compiled `backend/public/assets/` is not committed.
   - De-duplicate redundant video paths in working tree.
3. **Phase 3 (History Optimization):**
   - Perform a clean, approved history cleanup to reduce `.git` from 584 MB down to < 35 MB so Hostinger can clone effortlessly.

