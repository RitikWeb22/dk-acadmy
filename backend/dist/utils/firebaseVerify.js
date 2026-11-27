import jwt from 'jsonwebtoken';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cachedCerts = null;
const fetchGooglePublicCerts = async () => {
    const now = Date.now();
    if (cachedCerts && now < cachedCerts.expiresAt) {
        return cachedCerts.certs;
    }
    const res = await fetch(GOOGLE_CERTS_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch Firebase public certificates (${res.status})`);
    }
    const certs = (await res.json());
    const cacheControl = res.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const ttlMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 3600 * 1000;
    cachedCerts = { certs, expiresAt: now + ttlMs };
    return certs;
};
export const verifyFirebaseIdToken = async (idToken) => {
    const decodedComplete = jwt.decode(idToken, { complete: true });
    if (!decodedComplete?.header?.kid || !decodedComplete?.payload?.aud) {
        throw new Error('Invalid Firebase verification token.');
    }
    const configuredProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const projectId = configuredProjectId || String(decodedComplete.payload.aud).trim();
    if (!projectId) {
        throw new Error('Firebase project ID is missing.');
    }
    let certs = await fetchGooglePublicCerts();
    let cert = certs[decodedComplete.header.kid];
    if (!cert) {
        cachedCerts = null;
        certs = await fetchGooglePublicCerts();
        cert = certs[decodedComplete.header.kid];
    }
    if (!cert) {
        throw new Error('Unable to match Firebase signing certificate.');
    }
    const verified = jwt.verify(idToken, cert, {
        algorithms: ['RS256'],
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`
    });
    if (!verified?.sub) {
        throw new Error('Firebase token missing subject.');
    }
    return verified;
};
