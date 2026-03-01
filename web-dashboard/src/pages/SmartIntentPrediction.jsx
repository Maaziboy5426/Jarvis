import React, { useState } from 'react';
import { Sparkles, Mic, SendHorizonal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { useGhostMacro } from '../state/GhostMacroContext.jsx';
import { INTENT_ACTIONS, parseIntent } from '../utils/intentParser.js';

const SmartIntentPrediction = () => {
  const navigate = useNavigate();
  const { storageKeys } = useApp();
  const { logAction } = useGhostMacro();

  const [commandText, setCommandText] = useState('');
  const [intentResult, setIntentResult] = useState(null);
  const [intentStatus, setIntentStatus] = useState('idle'); // idle | parsing | ready | error

  const handleParseAndExecute = async () => {
    const text = commandText.trim();
    if (!text) return;
    setIntentStatus('parsing');
    setIntentResult(null);

    try {
      const result = await parseIntent(text, { localOnly: intentLocalOnly, storageKeys });
      setIntentResult(result);
      setIntentStatus('ready');

      const confidence = result.confidence || 0;
      const action = result.intent?.action || null;

      if (!action) return;

      const autoExecute =
        confidence >= 60 &&
        [INTENT_ACTIONS.SUMMARIZE, INTENT_ACTIONS.REWRITE, INTENT_ACTIONS.AUTO_FORMAT, INTENT_ACTIONS.CLEANUP].includes(
          action.toLowerCase ? action.toLowerCase() : action,
        );

      logAction({
        type: 'AI_INTENT',
        metadata: {
          rawCommand: text,
          parserSource: result.source,
          action: result.intent?.action || null,
          fileType: result.intent?.fileType || null,
          outputFormat: result.intent?.outputFormat || null,
          confidence,
        },
      });

      if (!autoExecute) return;

      let macroCode = null;
      switch (result.intent.action) {
        case 'SUMMARIZE':
          macroCode = 'summarize';
          break;
        case 'REWRITE':
          macroCode = 'rewrite';
          break;
        case 'AUTO_FORMAT':
          macroCode = 'format';
          break;
        case 'CLEANUP':
        case 'CLEAN_UP':
          macroCode = 'cleanup';
          break;
        default:
          break;
      }

      if (!macroCode) return;

      navigate('/run-macro', {
        state: {
          action: macroCode,
          fromIntent: true,
          rawCommand: text,
        },
      });
    } catch (err) {
      console.error('Intent parsing failed:', err);
      setIntentStatus('error');
    }
  };

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Smart Intent Prediction</h1>
        </div>
        <span className="badge accent">
          <Sparkles size={14} /> Intent Console
        </span>
      </div>

      <div className="glass-panel" style={{ padding: '1.6rem' }}>
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <h3>Intent Console</h3>
          <span className="badge subtle">Intent prediction</span>
        </div>
        <div className="flex-col" style={{ gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder='e.g. "Summarize this PDF and highlight action items"'
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleParseAndExecute();
                  }
                }}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => { }}
                style={{
                  position: 'absolute',
                  right: '2.3rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'default',
                  opacity: 0.55,
                }}
                aria-label="Voice input (coming soon)"
              >
                <Mic size={16} />
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleParseAndExecute}
                style={{
                  position: 'absolute',
                  right: '0.35rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.2rem 0.35rem',
                  minWidth: 'auto',
                }}
                disabled={!commandText.trim() || intentStatus === 'parsing'}
              >
                <SendHorizonal size={16} />
              </button>
            </div>
          </div>

        </div>

        <div className="mono-box" style={{ minHeight: 52 }}>
          {!intentResult && intentStatus === 'idle' && (
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Parsed intent and confidence will appear here before execution.
            </p>
          )}
          {intentStatus === 'parsing' && (
            <p style={{ fontSize: '0.85rem' }}>Analyzing command…</p>
          )}
          {intentStatus === 'error' && (
            <p style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
              Could not parse intent. Please refine your command.
            </p>
          )}
          {intentResult && (
            <p style={{ fontSize: '0.85rem' }}>
              Source: {intentResult.source.toUpperCase()} • Action:{' '}
              <strong>{intentResult.intent?.action || 'unknown'}</strong> • Confidence:{' '}
              <strong>{intentResult.confidence}%</strong>
              {intentResult.intent?.fileType && <> • File type: {intentResult.intent.fileType}</>}
              {intentResult.intent?.outputFormat && <> • Output: {intentResult.intent.outputFormat}</>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartIntentPrediction;

