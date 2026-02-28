import { getApiConfig } from './aiClient.js';

export const INTENT_ACTIONS = {
  SUMMARIZE: 'summarize',
  REWRITE: 'rewrite',
  AUTO_FORMAT: 'format',
  CLEANUP: 'cleanup',
  EXPORT: 'export',
};

function basicRuleBasedParse(commandText) {
  const text = (commandText || '').toLowerCase();
  let action = null;
  let fileType = null;
  let outputFormat = null;

  if (text.includes('summarize') || text.includes('summary')) action = INTENT_ACTIONS.SUMMARIZE;
  if (text.includes('rewrite') || text.includes('re-write')) action = INTENT_ACTIONS.REWRITE;
  if (text.includes('format') || text.includes('auto format')) action = INTENT_ACTIONS.AUTO_FORMAT;
  if (text.includes('clean up') || text.includes('cleanup') || text.includes('clean')) action = INTENT_ACTIONS.CLEANUP;
  if (text.includes('export')) action = INTENT_ACTIONS.EXPORT;

  if (text.includes('pdf')) fileType = 'application/pdf';
  if (text.includes('excel') || text.includes('xlsx') || text.includes('spreadsheet')) fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (text.includes('powerpoint') || text.includes('ppt') || text.includes('slide')) fileType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (text.includes('doc') || text.includes('word')) fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (text.includes('slide') || text.includes('slides') || text.includes('deck')) outputFormat = 'ppt';
  if (text.includes('report')) outputFormat = 'doc';

  const confidence =
    (action ? 40 : 0) +
    (fileType ? 20 : 0) +
    (outputFormat ? 10 : 0) +
    Math.min(30, Math.max(0, Math.round(text.length / 50) * 5));

  return {
    source: 'rule',
    intent: {
      action,
      fileType,
      outputFormat,
    },
    confidence: Math.min(100, confidence),
  };
}

async function llmParseIntent(commandText, { storageKeys, abortSignal } = {}) {
  const text = (commandText || '').trim();
  if (!text) {
    return { source: 'llm', intent: null, confidence: 0 };
  }

  const { apiKey, endpoint } = getApiConfig(storageKeys);
  if (!apiKey || !endpoint) {
    return { source: 'llm', intent: null, confidence: 0 };
  }

  const prompt = [
    'You are an automation engine that controls document macros.',
    'You MUST respond with a single JSON object and nothing else.',
    'Extract the user intent with these fields:',
    '- action: one of [SUMMARIZE, REWRITE, AUTO_FORMAT, CLEANUP, EXPORT, OTHER]',
    '- fileType: best-guess MIME type or generic like "pdf", "excel", "docx", "pptx", or null',
    '- outputFormat: optional, e.g. "ppt", "doc", "markdown", null if not relevant',
    '- confidence: integer between 0 and 100 indicating how sure you are',
    '',
    'If intent is unclear, set action to "OTHER" and confidence below 50.',
    '',
    `User command: "${text}"`,
  ].join('\n');

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0,
    },
  };

  const controller = abortSignal ? null : new AbortController();
  const signal = abortSignal || controller.signal;

  const url = `${endpoint}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  const json = await res.json();
  const rawText =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ||
    json?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('\n') ||
    '';

  let parsed = null;
  try {
    const match = rawText.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : JSON.parse(rawText);
  } catch {
    return { source: 'llm', intent: null, confidence: 0 };
  }

  const action = parsed.action || parsed.intent?.action || null;
  const fileType = parsed.fileType || parsed.intent?.fileType || null;
  const outputFormat = parsed.outputFormat || parsed.intent?.outputFormat || null;
  const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;

  return {
    source: 'llm',
    intent: {
      action,
      fileType,
      outputFormat,
    },
    confidence: Math.max(0, Math.min(100, confidence)),
  };
}

export async function parseIntent(commandText, { localOnly, storageKeys } = {}) {
  const rule = basicRuleBasedParse(commandText);
  if (localOnly) return rule;

  try {
    const llm = await llmParseIntent(commandText, { storageKeys });
    if (!llm.intent || llm.confidence <= rule.confidence) {
      return rule;
    }
    return llm;
  } catch {
    return rule;
  }
}

