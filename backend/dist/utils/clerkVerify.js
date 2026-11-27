import crypto from 'crypto';
import jwt from 'jsonwebtoken';
const DEFAULT_CLERK_PUBLISHABLE_KEY = 'pk_test_d29ya2luZy10YWhyLTg2NDEuY2xlcmsuYWNjb3VudHMuZGV2JA';
export const resolveClerkIssuer = () => {
    if (process.env.CLERK_ISSUER?.trim()) {
        return process.env.CLERK_ISSUER.trim().replace(/\/+$/, '');
    }
    const pubKey = process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
        process.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ||
        DEFAULT_CLERK_PUBLISHABLE_KEY;
    const encoded = pubKey.replace(/^pk_(test|live)_/, '');
    try {
        const decoded = Buffer.from(encoded, 'base64')
            .toString('utf8')
            .replace(/\$$/, '')
            .trim();
        if (decoded.includes('.')) {
            return `https://${decoded}`;
        }
    }
    catch {
        // Fallback below
    }
    return 'https://working-tahr-8641.clerk.accounts.dev';
};
let cachedJwks = null;
const JWKS_CACHE_TTL_MS = 10 * 60 * 1000;
const fetchClerkJwks = async (issuer) => {
    const now = Date.now();
    if (cachedJwks &&
        cachedJwks.issuer === issuer &&
        now - cachedJwks.fetchedAt < JWKS_CACHE_TTL_MS &&
        cachedJwks.keys.length > 0) {
        return cachedJwks.keys;
    }
    const res = await fetch(`${issuer}/.well-known/jwks.json`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch Clerk JWKS (${res.status})`);
    }
    const json = (await res.json());
    const keys = Array.isArray(json?.keys) ? json.keys : [];
    if (keys.length === 0) {
        throw new Error('Clerk JWKS endpoint returned no keys');
    }
    cachedJwks = { keys, fetchedAt: now, issuer };
    return keys;
};
export const verifyClerkSessionToken = async (token) => {
    const decodedComplete = jwt.decode(token, { complete: true });
    if (!decodedComplete?.header?.kid) {
        throw new Error('Invalid Clerk verification token.');
    }
    const issuer = resolveClerkIssuer();
    let keys = await fetchClerkJwks(issuer);
    let jwk = keys.find((k) => k.kid === decodedComplete.header?.kid);
    if (!jwk) {
        // Force refresh JWKS once in case Clerk rotated keys
        cachedJwks = null;
        keys = await fetchClerkJwks(issuer);
        jwk = keys.find((k) => k.kid === decodedComplete.header?.kid);
    }
    if (!jwk) {
        throw new Error('Unable to match Clerk signing key.');
    }
    const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    const verified = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer
    });
    if (!verified?.sub) {
        throw new Error('Clerk token missing subject.');
    }
    // If CLERK_SECRET_KEY is configured, also cross-check phone number via Clerk Backend API
    const secretKey = process.env.CLERK_SECRET_KEY?.trim();
    if (secretKey) {
        const userRes = await fetch(`https://api.clerk.com/v1/users/${verified.sub}`, {
            headers: { Authorization: `Bearer ${secretKey}` }
        });
        if (userRes.ok) {
            const clerkUser = (await userRes.json());
            const primaryPhone = clerkUser?.phone_numbers?.find((p) => p.id === clerkUser.primary_phone_number_id) || clerkUser?.phone_numbers?.[0];
            if (primaryPhone?.phone_number) {
                verified.phone_number = primaryPhone.phone_number;
            }
        }
    }
    return verified;
};
