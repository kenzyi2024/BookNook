# BookNook — Finish Setup & Deploy

Status as of this session: the update zip is **applied and verified**.
- Frontend `npm run build` ✅ and `npx eslint .` ✅ (0 errors)
- Backend `npm install` ✅ (added `google-auth-library`) and `node --check` on all changed files ✅
- Current backend health `/api/health` → `{"status":"ok"}` (baseline, before this deploy)

Everything below needs your GitHub credentials, Google account, and hosting consoles, so it runs on **your Mac / in your browser**. Do the steps in order.

---

## 1. Create the Google OAuth Web client

1. Go to **Google Cloud Console → APIs & Services → Credentials**: https://console.cloud.google.com/apis/credentials
2. Pick the project tied to your Cloud Run backend (`backend-booknook`, project number `1061260723062`).
3. **OAuth consent screen** first (if you've never configured one): APIs & Services → OAuth consent screen → User Type **External** → fill App name (e.g. "BookNook"), your support email, developer email → Save. If it stays in **Testing**, add your own Google account under **Test users** (or click **Publish app** for public access).
4. Back in **Credentials** → **+ Create Credentials → OAuth client ID**.
5. **Application type: Web application**. Name it e.g. `BookNook Web`.
6. Under **Authorized JavaScript origins**, add exactly these two (no trailing slash, no path):
   - `https://book-tracker-ivory.vercel.app`
   - `http://localhost:5173`
7. Leave **Authorized redirect URIs empty** — the "Continue with Google" button uses ID tokens (Google Identity Services), which only needs JavaScript origins.
8. **Create**, then copy the **Client ID** (ends in `.apps.googleusercontent.com`). You don't need the client secret for this flow.

---

## 2. Set the env vars (same client ID everywhere)

Let `CID` = the Client ID from step 1.

**Local — already stubbed for you this session:**
- Backend `/Users/kenzyibrahim/booktracker-backend/.env` → set `GOOGLE_CLIENT_ID=CID`
- Frontend `/Users/kenzyibrahim/book-tracker/.env` → set `VITE_GOOGLE_CLIENT_ID=CID`

(Both files are gitignored, so they won't be pushed.)

**Vercel (frontend):** Project → Settings → Environment Variables → add
`VITE_GOOGLE_CLIENT_ID = CID` for Production (and Preview/Development if you use them).
While there, confirm `VITE_API_URL = https://backend-booknook-1061260723062.us-east4.run.app` exists.
Vite bakes env vars at build time, so **redeploy the frontend** after adding (Deployments → ⋯ → Redeploy, or just push in step 3).

**Cloud Run (backend):** you'll add `GOOGLE_CLIENT_ID = CID` during the redeploy in step 4.

---

## 3. Commit & push both repos (on your Mac)

There's a leftover `.git/index.lock` in each repo from the file copy that must be removed first (harmless — no git process is actually running).

**Frontend** (`Book-Tracker`):
```bash
cd /Users/kenzyibrahim/book-tracker
rm -f .git/index.lock
git add -A
git commit -m "Add themes, Google Sign-In, profile pictures, Notes journal, shelf gadgets, For You recs"
git push origin main
```

**Backend** (`backend-booknook`):
```bash
cd /Users/kenzyibrahim/booktracker-backend
rm -f .git/index.lock
git add -A
git commit -m "Add Google Sign-In (google-auth-library), profile fields; update auth routes/controller"
git push origin main
```

The push to the frontend repo triggers a Vercel deploy automatically. The push to the backend repo triggers your Cloud Build image build — but **not** a deploy (per your setup), so continue to step 4.

---

## 4. Redeploy the backend on Cloud Run + add the env var

Wait for the Cloud Build trigger to finish building the new image (Cloud Build → History shows green).

Then in **Cloud Run → `backend-booknook`** (region `us-east4`) → **Edit & Deploy New Revision**:
1. **Container image**: select the newest image (the tag/digest from the build you just pushed).
2. **Variables & Secrets** tab → **+ Add variable** → `GOOGLE_CLIENT_ID` = `CID`.
3. **Deploy**. Wait for the new revision to receive 100% traffic.

---

## 5. Confirm

```bash
curl https://backend-booknook-1061260723062.us-east4.run.app/api/health
# → {"status":"ok"}
```

Then open https://book-tracker-ivory.vercel.app and confirm the **Continue with Google** button appears and signs you in. (If the button doesn't render, `VITE_GOOGLE_CLIENT_ID` didn't make it into the frontend build — recheck Vercel env + redeploy.)

---

## Optional: continuous backend deploys (so you skip step 4 next time)

Add a deploy step to your Cloud Build config, or switch the service to **Cloud Run → Continuously deploy from a repository**. Say the word and I'll write the `cloudbuild.yaml` deploy step for your existing trigger.

---

## Gotchas
- Origins must match **scheme + host + port** exactly — `http://localhost:5173` ≠ `http://localhost:5174`.
- Same Client ID must be in both the frontend (`VITE_GOOGLE_CLIENT_ID`) and backend (`GOOGLE_CLIENT_ID`) — the backend verifies the token's `audience` against it.
- Vite env vars are build-time: changing them in Vercel requires a redeploy to take effect.
