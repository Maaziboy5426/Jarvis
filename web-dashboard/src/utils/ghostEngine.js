const MONTH_TOKENS = new Set([
  'jan','january','feb','february','mar','march','apr','april','may','jun','june','jul','july','aug','august','sep','sept','september',
  'oct','october','nov','november','dec','december',
]);

const STOP_TOKENS = new Set(['v', 'ver', 'version', 'final', 'copy', 'new', 'draft']);

export function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

export function tokenizeFileName(fileName) {
  if (!fileName) return [];
  const base = String(fileName).toLowerCase().replace(/\.[^/.]+$/, '');
  return base
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !MONTH_TOKENS.has(t))
    .filter((t) => !STOP_TOKENS.has(t))
    .filter((t) => !/^\d+$/.test(t));
}

function commonPrefix(a, b) {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i += 1;
  return a.slice(0, i);
}

function commonSuffix(a, b) {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i += 1;
  return a.slice(a.length - i);
}

function commonPrefixAll(values) {
  if (!values.length) return '';
  return values.reduce((p, v) => commonPrefix(p, v), values[0]);
}

function commonSuffixAll(values) {
  if (!values.length) return '';
  return values.reduce((s, v) => commonSuffix(s, v), values[0]);
}

function cleanPrefix(prefix) {
  if (!prefix) return '';
  const lastDelim = Math.max(prefix.lastIndexOf('_'), prefix.lastIndexOf('-'), prefix.lastIndexOf(' '));
  if (lastDelim >= 2) return prefix.slice(0, lastDelim + 1);
  return prefix;
}

export function buildWildcardFileNamePattern(fileNames) {
  const names = (fileNames || []).filter(Boolean).map(String);
  if (names.length === 0) return '*';
  if (names.length === 1) return names[0];

  const lower = names.map((n) => n.toLowerCase());
  let prefix = commonPrefixAll(lower);
  let suffix = commonSuffixAll(lower);

  prefix = cleanPrefix(prefix);
  if (!suffix.startsWith('.')) {
    // Ensure extension is captured as suffix if possible
    const ext = lower[0].includes('.') ? lower[0].slice(lower[0].lastIndexOf('.')) : '';
    if (ext && lower.every((n) => n.endsWith(ext))) suffix = ext;
  }

  if (!prefix && !suffix) return '*';
  if (!suffix) return `${prefix}*`;
  if (!prefix) return `*${suffix}`;
  if (prefix.endsWith('*') || suffix.startsWith('*')) return `${prefix}${suffix}`;
  return `${prefix}*${suffix}`;
}

export function wildcardPatternToRegex(pattern) {
  const p = String(pattern || '*');
  const escaped = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

export function fileNameSimilarityScore(a, b) {
  const A = String(a || '').toLowerCase();
  const B = String(b || '').toLowerCase();
  if (!A || !B) return 0;
  if (A === B) return 100;

  const extA = A.includes('.') ? A.slice(A.lastIndexOf('.')) : '';
  const extB = B.includes('.') ? B.slice(B.lastIndexOf('.')) : '';
  const extScore = extA && extB && extA === extB ? 20 : 0;

  const prefix = commonPrefix(A, B);
  const prefixRatio = prefix.length / Math.max(A.length, B.length);
  const prefixScore = clamp(0, Math.round(prefixRatio * 60), 60);

  const tA = new Set(tokenizeFileName(A));
  const tB = new Set(tokenizeFileName(B));
  const union = new Set([...tA, ...tB]);
  let inter = 0;
  for (const t of tA) if (tB.has(t)) inter += 1;
  const jaccard = union.size ? inter / union.size : 0;
  const tokenScore = clamp(0, Math.round(jaccard * 20), 20);

  return clamp(0, extScore + prefixScore + tokenScore, 100);
}

export function calculateConfidenceScore({
  repetitionCount,
  lastSeenAt,
  patternSimilarityScore,
  now = Date.now(),
}) {
  const repScore = clamp(0, repetitionCount * 25, 100); // 2→50, 3→75, 4+→100
  const daysSince = lastSeenAt ? (now - lastSeenAt) / (1000 * 60 * 60 * 24) : 365;
  const recencyWeight = clamp(0, Math.round(100 * Math.exp(-daysSince / 7)), 100);
  const patternScore = clamp(0, Math.round(patternSimilarityScore || 0), 100);

  const confidence =
    repScore * 0.6 +
    recencyWeight * 0.2 +
    patternScore * 0.2;

  return clamp(0, Math.round(confidence), 100);
}

function actionTypesKey(actions) {
  return (actions || []).map((a) => a?.type).filter(Boolean).join('>');
}

function anchorTokensFromNames(fileNames) {
  const tokenLists = (fileNames || []).map(tokenizeFileName).filter((t) => t.length > 0);
  if (tokenLists.length === 0) return [];
  const counts = new Map();
  for (const list of tokenLists) {
    for (const t of new Set(list)) counts.set(t, (counts.get(t) || 0) + 1);
  }
  const minCount = tokenLists.length;
  return [...counts.entries()]
    .filter(([, c]) => c === minCount)
    .map(([t]) => t)
    .slice(0, 4);
}

export function detectRepeatedSequences(sessions, { minRepeats = 2 } = {}) {
  const normalized = (sessions || [])
    .filter((s) => s && Array.isArray(s.actions) && s.actions.length > 0)
    .map((s) => ({
      sessionId: s.sessionId,
      fileName: s.fileName || '',
      fileType: s.fileType || '',
      actions: s.actions,
      timestamp: s.timestamp || s.endedAt || 0,
      endedAt: s.endedAt || s.timestamp || 0,
    }));

  const groups = new Map();
  for (const s of normalized) {
    const key = `${s.fileType || '*'}::${actionTypesKey(s.actions)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  const candidates = [];
  const now = Date.now();

  for (const [, groupSessions] of groups.entries()) {
    if (groupSessions.length < minRepeats) continue;

    const clusters = [];
    const sorted = [...groupSessions].sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));

    for (const s of sorted) {
      const name = s.fileName || '';
      if (!name) continue;

      let placed = false;
      for (const c of clusters) {
        const score = fileNameSimilarityScore(name, c.representative);
        if (score >= 60) {
          c.items.push(s);
          c.fileNames.push(name);
          c.simScores.push(score);
          placed = true;
          break;
        }
      }
      if (!placed) {
        clusters.push({
          representative: name,
          items: [s],
          fileNames: [name],
          simScores: [],
        });
      }
    }

    for (const c of clusters) {
      if (c.items.length < minRepeats) continue;
      const fileNames = c.fileNames;
      const pattern = buildWildcardFileNamePattern(fileNames);
      const anchorTokens = anchorTokensFromNames(fileNames);
      const patternSimilarityScore =
        c.simScores.length > 0
          ? Math.round(c.simScores.reduce((sum, v) => sum + v, 0) / c.simScores.length)
          : 100;

      const lastSeenAt = Math.max(...c.items.map((i) => i.endedAt || i.timestamp || 0));
      const repetitionCount = c.items.length;

      const confidenceScore = calculateConfidenceScore({
        repetitionCount,
        lastSeenAt,
        patternSimilarityScore,
        now,
      });

      const sample = c.items[0];
      const actionSequence = (sample.actions || []).map((a) => ({ ...a }));
      const actionTypes = actionSequence.map((a) => a.type).filter(Boolean);
      const fileType = sample.fileType || '';

      const fingerprint = `${fileType || '*'}::${actionTypes.join('>')}::${anchorTokens.join('_')}`;

      candidates.push({
        fingerprint,
        fileTypePattern: fileType || '*',
        fileNamePattern: pattern,
        fileNameRegex: wildcardPatternToRegex(pattern).source,
        actionSequence,
        repetitionCount,
        confidenceScore,
        patternSimilarityScore,
        lastSeenAt,
      });
    }
  }

  return candidates.sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));
}

export function macroMatchesFile(macro, file) {
  const fileName = file?.name || '';
  const fileType = file?.type || '';
  if (!macro) return { matches: false, reason: 'no_macro' };

  const typePattern = macro.fileTypePattern || '*';
  const typeOk = typePattern === '*' || !typePattern || !fileType || typePattern === fileType;
  if (!typeOk) return { matches: false, reason: 'file_type_mismatch' };

  const fileNamePattern = macro.fileNamePattern || '*';
  try {
    const rx = macro.fileNameRegex ? new RegExp(macro.fileNameRegex, 'i') : wildcardPatternToRegex(fileNamePattern);
    const ok = !fileName || rx.test(fileName);
    return { matches: ok, reason: ok ? 'ok' : 'file_name_mismatch' };
  } catch {
    const ok = !fileName || String(fileName).toLowerCase().includes(String(fileNamePattern).toLowerCase().replace(/\*/g, ''));
    return { matches: ok, reason: ok ? 'ok_fallback' : 'file_name_mismatch' };
  }
}

export function getMatchingMacrosForFile(learnedMacros, file, { minConfidence = 0 } = {}) {
  const matches = (learnedMacros || [])
    .map((m) => ({ macro: m, match: macroMatchesFile(m, file) }))
    .filter((x) => x.match.matches)
    .filter((x) => (x.macro.confidenceScore || 0) >= minConfidence)
    .map((x) => x.macro)
    .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));

  return matches;
}

