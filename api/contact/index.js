/**
 * Maven Technosoft contact form - Azure Function
 * --------------------------------------------------------
 * Receives JSON POSTs from the website contact form and sends an email
 * through your own Office 365 tenant via Microsoft Graph.
 *
 * Required environment variables (Static Web App -> Settings -> Environment variables):
 *   AZURE_TENANT_ID       - Microsoft Entra tenant ID
 *   AZURE_CLIENT_ID       - Entra app-registration client ID
 *   AZURE_CLIENT_SECRET   - Entra app-registration client secret value
 *   FROM_MAILBOX          - mailbox to send FROM (e.g. contact@maventechno.com)
 *   TO_EMAIL              - mailbox to send TO    (e.g. info@maventechno.com)
 *
 * Optional environment variables (abuse protection):
 *   ALLOWED_ORIGINS       - comma-separated list of allowed Origin headers.
 *                           Requests from any other origin are rejected.
 *                           e.g. "https://www.maventechno.com,https://maventechno.com,
 *                                 https://victorious-river-08449db00.7.azurestaticapps.net"
 *                           Leave unset to allow all origins (NOT recommended).
 *   RATE_LIMIT_PER_HOUR   - max submissions allowed per IP per hour (default 5)
 *   TURNSTILE_SECRET      - Cloudflare Turnstile secret. If set, the function
 *                           will verify the "cf-turnstile-response" token sent
 *                           in the request body. Leave unset to disable.
 */

// In-memory per-IP rate-limit buckets. Resets whenever the Function "cold-starts"
// (fine for low-volume contact forms; the worst case is a few extra requests).
const RATE_BUCKETS = new Map();

module.exports = async function (context, req) {
    const allowOriginHdr = (process.env.ALLOWED_ORIGINS || '*').split(',')[0].trim() || '*';
    const baseHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOriginHdr,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // ---- CORS preflight ----
    if (req.method === 'OPTIONS') {
        context.res = { status: 204, headers: baseHeaders };
        return;
    }
    if (req.method !== 'POST') {
        return reject(context, baseHeaders, 405, 'Method not allowed.');
    }

    // ---- 1. ORIGIN CHECK ----
    // Reject submissions that don't come from one of our allowed origins.
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',').map(s => s.trim()).filter(Boolean);
    const origin = (req.headers && (req.headers['origin'] || req.headers['Origin'])) || '';
    if (allowedOrigins.length > 0) {
        const ok = allowedOrigins.some(a => origin === a);
        if (!ok) {
            context.log.warn('Rejected origin:', origin);
            return reject(context, baseHeaders, 403, 'Origin not allowed.');
        }
    }

    // ---- 2. RATE LIMIT per client IP ----
    const ip = getClientIp(req);
    const limit = parseInt(process.env.RATE_LIMIT_PER_HOUR || '5', 10);
    if (!rateLimitOk(ip, limit, 60 * 60 * 1000)) {
        context.log.warn('Rate-limited IP:', ip);
        return reject(context, baseHeaders, 429,
            'Too many submissions from your network. Please try again later.');
    }

    // ---- 3. Body & honeypot ----
    const body = req.body || {};
    if (body.botcheck) {
        // Bots fill this hidden field. Pretend success.
        context.res = { status: 200, headers: baseHeaders, body: { success: true } };
        return;
    }

    const get = (k) => (body[k] == null ? '' : String(body[k])).trim();
    const name    = get('name');
    const email   = get('email');
    const company = get('company');
    const phone   = get('phone');
    const subject = get('user_subject') || get('subject');
    const message = (body.message == null ? '' : String(body.message));

    // ---- 4. Required-field validation ----
    const errors = [];
    if (!name)                                                          errors.push('Name is required.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))             errors.push('A valid email is required.');
    if (!subject)                                                       errors.push('Subject is required.');
    if (!message.trim())                                                errors.push('Message is required.');
    if (errors.length) return reject(context, baseHeaders, 400, errors.join(' '));

    // ---- 5. CONTENT HEURISTICS (lightweight anti-spam) ----
    const spamReason = looksLikeSpam(name, subject, message);
    if (spamReason) {
        context.log.warn('Spam-heuristic rejected:', spamReason, '| IP:', ip);
        // Return success to bots so they don't tune their payload
        context.res = { status: 200, headers: baseHeaders, body: { success: true } };
        return;
    }

    // ---- 6. CLOUDFLARE TURNSTILE (optional) ----
    if (process.env.TURNSTILE_SECRET) {
        const token = get('cf-turnstile-response') || get('turnstileToken');
        const verified = await verifyTurnstile(token, ip, process.env.TURNSTILE_SECRET);
        if (!verified) {
            context.log.warn('Turnstile verification failed for IP:', ip);
            return reject(context, baseHeaders, 403, 'Bot check failed. Please refresh and try again.');
        }
    }

    // ---- 7. Env config check ----
    const TENANT_ID     = process.env.AZURE_TENANT_ID;
    const CLIENT_ID     = process.env.AZURE_CLIENT_ID;
    const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
    const FROM_MAILBOX  = process.env.FROM_MAILBOX;
    const TO_EMAIL      = process.env.TO_EMAIL || FROM_MAILBOX;
    if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !FROM_MAILBOX) {
        context.log.error('Missing required environment variables.');
        return reject(context, baseHeaders, 500,
            'The contact form is not configured on the server. Please email us at info@maventechno.com.');
    }

    // ---- 8. Get Graph access token ----
    try {
        const tokenRes = await fetch(
            `https://login.microsoftonline.com/${encodeURIComponent(TENANT_ID)}/oauth2/v2.0/token`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id:     CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    scope:         'https://graph.microsoft.com/.default',
                    grant_type:    'client_credentials'
                })
            }
        );
        if (!tokenRes.ok) {
            const t = await tokenRes.text();
            context.log.error('Token error', tokenRes.status, t);
            throw new Error('Token endpoint failed.');
        }
        const tokenJson = await tokenRes.json();
        const accessToken = tokenJson.access_token;
        if (!accessToken) throw new Error('No access_token in token response.');

        // ---- 9. Send via Microsoft Graph ----
        const html = renderEmail({ name, email, company, phone, subject, message });
        const sendRes = await fetch(
            `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(FROM_MAILBOX)}/sendMail`,
            {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        subject: '[Maven Website] ' + subject,
                        body: { contentType: 'HTML', content: html },
                        toRecipients: [{ emailAddress: { address: TO_EMAIL } }],
                        replyTo:     [{ emailAddress: { address: email, name: name } }]
                    },
                    saveToSentItems: 'true'
                })
            }
        );
        if (!sendRes.ok) {
            const t = await sendRes.text();
            context.log.error('Graph sendMail error', sendRes.status, t);
            throw new Error('Graph sendMail failed.');
        }

        context.res = { status: 200, headers: baseHeaders, body: { success: true, message: 'Email sent.' } };
    } catch (err) {
        context.log.error('Contact form error:', err && err.message ? err.message : err);
        return reject(context, baseHeaders, 500,
            'Sorry, the message could not be sent right now. Please email us at info@maventechno.com.');
    }
};

// ---------- Helpers ----------

function reject(context, headers, status, message) {
    context.res = {
        status: status,
        headers: headers,
        body: { success: false, message: message }
    };
}

function getClientIp(req) {
    const h = (req && req.headers) || {};
    const xff = h['x-forwarded-for'] || h['X-Forwarded-For'];
    if (xff) return String(xff).split(',')[0].trim();
    return h['x-client-ip'] || h['X-Client-IP'] || 'unknown';
}

function rateLimitOk(ip, maxPerHour, windowMs) {
    const now = Date.now();
    let arr = RATE_BUCKETS.get(ip) || [];
    arr = arr.filter(t => now - t < windowMs);
    if (arr.length >= maxPerHour) {
        RATE_BUCKETS.set(ip, arr);
        return false;
    }
    arr.push(now);
    RATE_BUCKETS.set(ip, arr);

    // Light GC so the map can't grow forever
    if (RATE_BUCKETS.size > 5000) {
        for (const [k, v] of RATE_BUCKETS) {
            const live = v.filter(t => now - t < windowMs);
            if (live.length === 0) RATE_BUCKETS.delete(k);
            else RATE_BUCKETS.set(k, live);
        }
    }
    return true;
}

function looksLikeSpam(name, subject, message) {
    if (!message) return null;
    if (message.length > 8000) return 'message too long';

    const urls = (message.match(/https?:\/\//gi) || []).length;
    if (urls > 5) return 'too many urls';

    if (subject && subject.length > 50 && subject === subject.toUpperCase()) {
        return 'all-caps subject';
    }

    const text = (name + ' ' + subject + ' ' + message).toLowerCase();
    const spamWords = [
        'viagra', 'cialis', 'casino', 'crypto investment', 'forex trading',
        'guaranteed seo', 'guaranteed ranking', 'bitcoin doubled', 'loan offer',
        'click here to claim', 'kindly i need your help'
    ];
    for (const w of spamWords) {
        if (text.includes(w)) return 'spam keyword: ' + w;
    }
    return null;
}

async function verifyTurnstile(token, ip, secret) {
    if (!token) return false;
    try {
        const params = new URLSearchParams();
        params.append('secret', secret);
        params.append('response', token);
        if (ip && ip !== 'unknown') params.append('remoteip', ip);

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
        const data = await res.json();
        return !!data.success;
    } catch (e) {
        return false;
    }
}

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
    });
}

function renderEmail(d) {
    const row = (label, val) => val
        ? '<tr><td style="padding:8px 14px;background:#f7f4f2;font-weight:600;color:#3d3633;width:140px">' +
          escapeHtml(label) +
          '</td><td style="padding:8px 14px;color:#2c2522">' +
          escapeHtml(val) +
          '</td></tr>'
        : '';
    const messageHtml = escapeHtml(d.message).replace(/\r?\n/g, '<br>');
    return `
<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#2c2522;background:#fff;margin:0;padding:24px">
  <h2 style="color:#ff5821;margin:0 0 12px">New enquiry from maventechno.com</h2>
  <p style="margin:0 0 18px;color:#635551">Submitted via the website contact form.</p>
  <table style="border-collapse:collapse;border:1px solid #f0e7e1;width:100%;max-width:640px">
    ${row('Name',    d.name)}
    ${row('Email',   d.email)}
    ${row('Company', d.company)}
    ${row('Phone',   d.phone)}
    ${row('Subject', d.subject)}
  </table>
  <h3 style="margin:24px 0 8px;color:#3d3633">Message</h3>
  <div style="white-space:normal;line-height:1.55;color:#2c2522;padding:14px;background:#fff7f3;border-left:3px solid #ff5821;max-width:640px">
    ${messageHtml}
  </div>
  <hr style="border:0;border-top:1px solid #eee;margin:28px 0">
  <p style="font-size:12px;color:#8a7e7a">Sent via the contact form at maventechno.com. Reply directly to respond to the sender.</p>
</body></html>`;
}
