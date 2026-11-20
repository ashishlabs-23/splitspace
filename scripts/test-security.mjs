import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation matching frontend/src/lib/security.ts
function isValidInviteToken(token) {
  if (typeof token !== 'string') return false;
  const trimmed = token.trim();
  return /^[a-zA-Z0-9_-]{6,64}$/.test(trimmed);
}

function isValidSpaceId(spaceId) {
  if (typeof spaceId !== 'string') return false;
  const trimmed = spaceId.trim();
  return /^[a-zA-Z0-9_\-]{3,64}$/.test(trimmed);
}

function getSafeInternalRedirect(target, fallback = '/') {
  if (!target || typeof target !== 'string') return fallback;
  const trimmed = target.trim();
  if (/^\/[a-zA-Z0-9_?&=#-][a-zA-Z0-9_\-\/?&=#.]*$/.test(trimmed) || trimmed === '/') {
    return trimmed;
  }
  return fallback;
}

function sanitizePlainText(input, maxLength = 200) {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

function isValidAvatarUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.googleusercontent.com') ||
        parsed.hostname.endsWith('.githubusercontent.com') ||
        parsed.hostname.endsWith('.firebaseapp.com') ||
        parsed.hostname === 'splitspace-9d28f.web.app')
    );
  } catch {
    return false;
  }
}

test('Security Suite: Invite Token Validation', () => {
  // Valid tokens
  assert.equal(isValidInviteToken('763ce6854f544a41'), true);
  assert.equal(isValidInviteToken('token-with_dashes_123'), true);
  assert.equal(isValidInviteToken('abcdef'), true);

  // Invalid tokens (injection, traversal, XSS, malformed)
  assert.equal(isValidInviteToken('../../../etc/passwd'), false);
  assert.equal(isValidInviteToken('<script>alert(1)</script>'), false);
  assert.equal(isValidInviteToken('javascript:void(0)'), false);
  assert.equal(isValidInviteToken(''), false);
  assert.equal(isValidInviteToken(null), false);
  assert.equal(isValidInviteToken(undefined), false);
  assert.equal(isValidInviteToken(12345), false);
  assert.equal(isValidInviteToken('a'.repeat(65)), false); // exceeds max length
});

test('Security Suite: Space ID Validation', () => {
  // Valid Space IDs
  assert.equal(isValidSpaceId('demo-space-goa'), true);
  assert.equal(isValidSpaceId('space_12345'), true);
  assert.equal(isValidSpaceId('b1c3c2b0-a001-4ca2-992c-eb4c4b39455c'), true);

  // Malicious / Invalid Space IDs
  assert.equal(isValidSpaceId('../../secrets'), false);
  assert.equal(isValidSpaceId("'; DROP TABLE spaces; --"), false);
  assert.equal(isValidSpaceId('<svg onload=alert(1)>'), false);
  assert.equal(isValidSpaceId('ab'), false); // too short
  assert.equal(isValidSpaceId(''), false);
});

test('Security Suite: Open Redirect Prevention', () => {
  // Safe relative paths
  assert.equal(getSafeInternalRedirect('/?view=dashboard'), '/?view=dashboard');
  assert.equal(getSafeInternalRedirect('/?space=demo-space-goa'), '/?space=demo-space-goa');
  assert.equal(getSafeInternalRedirect('/'), '/');

  // Open redirect attempts (protocol-relative, external, pseudo-protocols)
  assert.equal(getSafeInternalRedirect('//evil.com/phish'), '/');
  assert.equal(getSafeInternalRedirect('https://evil.com'), '/');
  assert.equal(getSafeInternalRedirect('/\\evil.com'), '/');
  assert.equal(getSafeInternalRedirect('javascript:alert(document.cookie)'), '/');
  assert.equal(getSafeInternalRedirect('data:text/html,<script>alert(1)</script>'), '/');
});

test('Security Suite: Plain Text Input Sanitization (XSS Neutralization)', () => {
  const xssPayload = '<script>alert("XSS")</script>Dinner with friends';
  const sanitized = sanitizePlainText(xssPayload);
  assert.equal(sanitized.includes('<script>'), false);
  assert.equal(sanitized.includes('</script>'), false);
  assert.equal(sanitized, 'scriptalert("XSS")/scriptDinner with friends');

  const eventPayload = '<img src=x onerror=alert(1)>';
  assert.equal(sanitizePlainText(eventPayload).includes('<img'), false);
  assert.equal(sanitizePlainText(eventPayload).includes('onerror='), false);

  const cleanText = 'Goa trip villa rent';
  assert.equal(sanitizePlainText(cleanText), 'Goa trip villa rent');
});

test('Security Suite: Avatar URL Origin Validation', () => {
  // Allowed trusted origins
  assert.equal(isValidAvatarUrl('https://lh3.googleusercontent.com/a/ACg8ocK...'), true);
  assert.equal(isValidAvatarUrl('https://avatars.githubusercontent.com/u/12345'), true);
  assert.equal(isValidAvatarUrl('https://splitspace-9d28f.web.app/logo.png'), true);

  // Untrusted / Attack URLs
  assert.equal(isValidAvatarUrl('http://insecure-domain.com/avatar.jpg'), false); // HTTP not allowed
  assert.equal(isValidAvatarUrl('javascript:alert(1)'), false);
  assert.equal(isValidAvatarUrl('data:image/svg+xml;utf8,<svg onload=alert(1)/>'), false);
  assert.equal(isValidAvatarUrl('https://evil-attacker.com/cookie-stealer.png'), false);
});
