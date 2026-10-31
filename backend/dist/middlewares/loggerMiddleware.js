import crypto from 'crypto';
const SENSITIVE_KEYS = new Set([
    'password',
    'token',
    'credential',
    'idtoken',
    'accesstoken',
    'signature',
    'razorpay_signature',
    'razorpay_payment_id',
    'secret',
    'key_secret',
    'jwt_secret',
    'authorization'
]);
function redactObject(obj) {
    if (!obj || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj))
        return obj.map(redactObject);
    const cleaned = {};
    for (const [key, val] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            cleaned[key] = '[REDACTED]';
        }
        else if (val && typeof val === 'object') {
            cleaned[key] = redactObject(val);
        }
        else {
            cleaned[key] = val;
        }
    }
    return cleaned;
}
export const requestLogger = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    const startTime = Date.now();
    res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        const logEntry = {
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            durationMs,
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        // Only log non-health endpoints in standard operational logs
        if (!req.path.startsWith('/health')) {
            if (res.statusCode >= 500) {
                console.error('[HTTP ERROR]', JSON.stringify(logEntry));
            }
            else if (res.statusCode >= 400) {
                console.warn('[HTTP WARN]', JSON.stringify(logEntry));
            }
            else {
                console.log('[HTTP INFO]', JSON.stringify(logEntry));
            }
        }
    });
    next();
};
