import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Play, ToggleLeft, ToggleRight, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';

const AVAILABLE_STEPS = [
  { code: 'summarize', label: 'Summarize', description: 'Generate a concise summary.' },
  { code: 'rewrite', label: 'Rewrite', description: 'Improve tone and clarity.' },
  { code: 'format', label: 'Auto Format', description: 'Clean layout and structure.' },
  { code: 'cleanup', label: 'Clean Up', description: 'Remove noise and artifacts.' },
];

const MyMacros = () => {
  const navigate = useNavigate();
  const { macros, setMacros } = useApp();

  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftSteps, setDraftSteps] = useState([]);
  const [draftAutoRun, setDraftAutoRun] = useState(false);

  const hasMacros = Array.isArray(macros) && macros.length > 0;

  const sortedMacros = useMemo(
    () =>
      (macros || []).slice().sort((a, b) => {
        const aTs = a.updatedAt || a.createdAt || '';
        const bTs = b.updatedAt || b.createdAt || '';
        return aTs < bTs ? 1 : -1;
      }),
    [macros],
  );

  const resetDraft = () => {
    setEditingId(null);
    setDraftName('');
    setDraftSteps([]);
    setDraftAutoRun(false);
  };

  const openCreate = () => {
    resetDraft();
    setEditingId('new');
  };

  const openEdit = (macro) => {
    setEditingId(macro.id);
    setDraftName(macro.name || '');
    setDraftSteps(macro.steps || []);
    setDraftAutoRun(!!macro.autoRun);
  };

  const toggleStep = (code) => {
    setDraftSteps((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleSave = () => {
    const name = draftName.trim();
    if (!name || draftSteps.length === 0) return;

    const now = new Date().toISOString();
    if (editingId && editingId !== 'new') {
      setMacros(
        (prev) =>
          (prev || []).map((m) =>
            m.id === editingId
              ? { ...m, name, steps: draftSteps, autoRun: draftAutoRun, updatedAt: now }
              : m,
          ),
      );
    } else {
      const id = crypto.randomUUID();
      const newMacro = {
        id,
        name,
        steps: draftSteps,
        autoRun: draftAutoRun,
        createdAt: now,
        updatedAt: now,
        lastRunAt: null,
        runCount: 0,
      };
      setMacros((prev) => [...(prev || []), newMacro]);
    }

    resetDraft();
  };

  const handleDelete = (id) => {
    setMacros((prev) => (prev || []).filter((m) => m.id !== id));
    if (editingId === id) resetDraft();
  };

  const handleToggleAutoRun = (id) => {
    setMacros((prev) =>
      (prev || []).map((m) =>
        m.id === id ? { ...m, autoRun: !m.autoRun, updatedAt: new Date().toISOString() } : m,
      ),
    );
  };

  const handleRunMacro = (macro) => {
    const now = new Date().toISOString();
    setMacros((prev) =>
      (prev || []).map((m) =>
        m.id === macro.id
          ? {
              ...m,
              lastRunAt: now,
              runCount: (m.runCount || 0) + 1,
              updatedAt: now,
            }
          : m,
      ),
    );

    const primaryStep = macro.steps?.[0] || 'summarize';
    navigate('/run-macro', {
      state: {
        action: primaryStep,
        fromUserMacro: true,
        userMacroId: macro.id,
        userMacroName: macro.name,
        userMacroSteps: macro.steps,
      },
    });
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <h1>My Macros</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> New Macro
        </button>
      </div>

      {!hasMacros && !editingId && (
        <div className="glass-panel flex-center" style={{ minHeight: '320px', flexDirection: 'column' }}>
          <ListChecks size={32} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.35rem' }}>No macros created yet</h3>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Combine existing Jarvis actions into reusable workflows.
          </p>
          <button className="btn btn-primary" onClick={openCreate}>
            Create Your First Macro
          </button>
        </div>
      )}

      {editingId && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            {editingId === 'new' ? 'Create Macro' : 'Edit Macro'}
          </h3>
          <div className="flex-col" style={{ gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Weekly Report Packager"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                Steps (sequence of actions)
              </label>
              <div className="flex-col" style={{ gap: '0.5rem' }}>
                {AVAILABLE_STEPS.map((step) => {
                  const selected = draftSteps.includes(step.code);
                  return (
                    <button
                      key={step.code}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => toggleStep(step.code)}
                      style={{
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        borderColor: selected ? 'rgba(108,110,255,0.6)' : 'var(--border-color)',
                        background: selected ? 'rgba(108,110,255,0.12)' : 'transparent',
                      }}
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span>{step.label}</span>
                        <span className="muted" style={{ fontSize: '0.8rem' }}>
                          {step.description}
                        </span>
                      </span>
                      <span className="badge subtle" style={{ fontSize: '0.75rem' }}>
                        {selected ? 'Included' : 'Tap to add'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Auto-run</div>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  Store preference for Ghost or future triggers.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDraftAutoRun((v) => !v)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {draftAutoRun ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                <span>{draftAutoRun ? 'On' : 'Off'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={resetDraft}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!draftName.trim() || draftSteps.length === 0}
              >
                Save Macro
              </button>
            </div>
          </div>
        </div>
      )}

      {hasMacros && (
        <div className="flex-col" style={{ gap: '0.9rem' }}>
          {sortedMacros.map((macro) => (
            <div
              key={macro.id}
              className="glass-panel floating"
              style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <div style={{ fontWeight: 700 }}>{macro.name}</div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleToggleAutoRun(macro.id)}
                    style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                  >
                    {macro.autoRun ? 'Auto-run: On' : 'Auto-run: Off'}
                  </button>
                </div>
                <div className="muted" style={{ fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Steps: {(macro.steps || []).map((code) => AVAILABLE_STEPS.find((s) => s.code === code)?.label || code).join(' → ')}
                </div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  {macro.runCount ? `${macro.runCount} runs` : 'Not run yet'}
                  {macro.lastRunAt && ` • Last run: ${new Date(macro.lastRunAt).toLocaleString()}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleRunMacro(macro)}
                  style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
                >
                  <Play size={16} /> Run
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => openEdit(macro)}
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleDelete(macro.id)}
                  style={{ padding: '0.4rem', color: '#fca5a5' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMacros;
