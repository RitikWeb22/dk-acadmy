# Security Rotation & Secret Remediation Playbook

> **CRITICAL ACTION REQUIRED**: A full git history audit discovered hardcoded secrets committed in previous git revisions. Even though these secrets were removed from the active working tree in commit `92dc5ac`, they remain viewable in Git commit history until the repository history is rewritten. Follow this step-by-step procedure to rotate all credentials immediately.

---

## 1. Summary of Leaked Secrets Found in Git History

| Secret Type | First 4 Characters | Commits Present | File(s) in History |
|---|---|---|---|
| **MongoDB Atlas User Password** | `LcIQ...` | `6a568ac` | `backend/src/config/db.ts` |
| **Razorpay Key Secret** | `L4xp...` | `c3ac82f`, `6a568ac`, `d95a6f4` | `backend/src/config/razorpay.ts` |
| **Razorpay Key ID (Test)** | `rzp_...` (`rzp_test_TsU7...`) | `c3ac82f`, `6a568ac`, `d95a6f4` | `backend/src/config/razorpay.ts`, `backend/.env.example` |
| **Razorpay Key ID (Secondary)**| `rzp_...` (`rzp_test_TmqM...`) | `c3ac82f`, `6a568ac`, `d95a6f4` | `backend/src/controllers/paymentController.ts` |
| **JWT Static Fallback Secret** | `dk_a...` & `F7x6...` | `c3ac82f`, `92dc5ac` | `backend/src/middlewares/authMiddleware.ts`, `backend/tests/security_and_api.test.ts` |

---

## 2. Step-by-Step Secret Rotation Procedures

### A. MongoDB Atlas Database User Password
1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Select your Project and navigate to **Security** &rarr; **Database Access**.
3. Locate the database user (`ritikweb30_db_user`).
4. Click **Edit** &rarr; **Edit Password** &rarr; **Autogenerate a Secure Password** (or supply a strong 32+ character random string).
5. Copy the new password and save it in a secure password manager.
6. Click **Update User**.
7. In your hosting provider (Render / Vercel / Railway / AWS ECS) and local `backend/.env`:
   Update `MONGO_URI` with the new password:
   ```env
   MONGO_URI=mongodb+srv://<username>:<NEW_PASSWORD>@<cluster-host>/dk_academy_jee?retryWrites=true&w=majority
   ```
8. **IP Allowlist & Access Log Review**:
   - Go to **Security** &rarr; **Network Access**.
   - Ensure the IP allowlist **DOES NOT** contain `0.0.0.0/0` (Allow Access from Anywhere) unless strictly bound to transient container IP ranges with strong TLS/x509 certs. Instead, whitelist specific static IP addresses of your backend deployment.
   - Go to **Activity Feed** / **Security Logs** and review authentication attempts for `ritikweb30_db_user` over the last 30 days to ensure no unauthorized IP addresses connected.

---

### B. Razorpay Key ID & Key Secret
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** &rarr; **API Keys**.
3. If using **Test Mode**, click **Regenerate Test Key**.
4. If using **Live Mode**, click **Regenerate Live Key**. Razorpay will offer to keep the old key active for 24 hours while you deploy the new key.
5. Copy the new **Key ID** (`rzp_...`) and **Key Secret**.
6. Navigate to **Settings** &rarr; **Webhooks**.
7. Create or update your Webhook Secret with a high-entropy string (32+ bytes hex).
8. Update your production environment variables and `backend/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_live_NEW_KEY_ID
   RAZORPAY_KEY_SECRET=NEW_RAZORPAY_KEY_SECRET
   RAZORPAY_WEBHOOK_SECRET=NEW_RAZORPAY_WEBHOOK_SECRET
   ```
9. Verify that test payments and production payments succeed with the new keys.

---

### C. JWT Authentication Secret (`JWT_SECRET`)
1. Generate a brand-new cryptographically secure 48-byte (96 hex characters) secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
2. Update `JWT_SECRET` in `backend/.env` and your production deployment platform:
   ```env
   JWT_SECRET=paste_new_hex_string_here
   ```
3. *Note*: Rotating the JWT secret will invalidate all currently active sessions, requiring administrators and students to log in again. This is intentional and necessary after a secret leak.

---

### D. Google OAuth Client Secret
1. Log in to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Project and navigate to **APIs & Services** &rarr; **Credentials**.
3. Under **OAuth 2.0 Client IDs**, select your web client (`Client_ID`).
4. Click **Reset Secret** to generate a new `Client_SECRET`.
5. Update `Client_SECRET` in `backend/.env` and your production hosting dashboard.

---

## 3. Git History Cleansing (Git Filter-Repo)

Because Git commits are immutable, committing fixes does not delete secrets from past commits.
To permanently purge secrets from Git commit history:

### Prerequisites:
Install `git-filter-repo` (Python 3 required):
```bash
pip install git-filter-repo
```

### Cleansing Instructions:
1. Clone a fresh mirror of the repository to avoid working on an active copy:
   ```bash
   git clone --mirror https://github.com/RitikWeb22/dk-acadmy.git dk-acadmy-cleanse
   cd dk-acadmy-cleanse
   ```
2. Create a replacement expressions file `expressions.txt`:
   ```text
   LcIQJeKuxVDp0Q8g==>REDACTED_MONGO_PASSWORD
   L4xpEHidBAKnVDktYkPG4I5p==>REDACTED_RAZORPAY_SECRET
   F7x6LaFFrx1V4PSoHdi4iP5pSta4h7Ay2M6fu5R8r0k==>REDACTED_JWT_SECRET
   dt-udOW9CmIhn3H2k6gwkXjJJ6k==>REDACTED_CLOUDINARY_SECRET
   bPFwOPf7x9cu97kzezGKAYYGed2yHn9PkMepZRegPtRH==>REDACTED_LIVEKIT_SECRET
   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==>REDACTED_GOOGLE_SECRET
   ```
3. Run `git-filter-repo` to sanitize all commits across all branches and tags:
   ```bash
   git-filter-repo --replace-text expressions.txt
   ```
4. Verify history is clean:
   ```bash
   git log --all -S "LcIQJeKuxVDp0Q8g"
   ```
5. Force push the sanitized repository back to GitHub:
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```
> **Warning**: Force-pushing rewritten history alters commit hashes. Coordinate with your development team to re-clone or rebase their local copies after this operation.
