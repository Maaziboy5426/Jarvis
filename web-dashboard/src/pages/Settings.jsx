import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Moon, Save, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp } from '../state/AppContext.jsx';

const Toast = ({ type, message, onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div
      style={{
        position: 'fixed',
        right: '1.75rem',
        bottom: '1.75rem',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1rem',
        borderRadius: '999px',
        background: isSuccess ? 'rgba(21, 128, 61, 0.18)' : 'rgba(185, 28, 28, 0.18)',
        border: isSuccess ? '1px solid rgba(74, 222, 128, 0.6)' : '1px solid rgba(248, 113, 113, 0.7)',
        color: '#e5e7eb',
        boxShadow: '0 18px 45px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(18px)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.25rem',
          borderRadius: '999px',
          background: 'rgba(15,23,42,0.85)',
        }}
      >
        {isSuccess ? (
          <CheckCircle2 size={16} color="#4ade80" />
        ) : (
          <AlertTriangle size={16} color="#fca5a5" />
        )}
      </span>
      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          marginLeft: '0.5rem',
          fontSize: '0.75rem',
          color: '#9ca3af',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Dismiss
      </button>
    </div>
  );
};

const getInitials = (value) => {
  if (!value) return '?';
  const text = String(value).trim();
  if (!text) return '?';

  const base = text.includes('@') ? text.split('@')[0] : text;
  const parts = base.split(' ').filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return `${first}${last}`.toUpperCase();
};

const Settings = () => {
    const { authUser, theme, setTheme, fontSize, setFontSize, updateProfile } = useApp();

    const [username, setUsername] = useState(authUser?.fullName || '');
    const [usernameError, setUsernameError] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [toast, setToast] = useState({ type: null, message: '' });
    const [avatarPreview, setAvatarPreview] = useState(authUser?.avatarUrl || '');
    const [avatarError, setAvatarError] = useState('');
    const [showAvatarEditor, setShowAvatarEditor] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
      if (authUser) {
        setUsername(authUser.fullName || '');
        setAvatarPreview(authUser.avatarUrl || '');
      }
    }, [authUser]);

    useEffect(() => {
      if (!toast.message) return;
      const timeout = setTimeout(() => setToast({ type: null, message: '' }), 3000);
      return () => clearTimeout(timeout);
    }, [toast]);

    const hasProfileChanges = useMemo(() => {
      if (!authUser) return false;
      const nameChanged = username.trim() !== (authUser.fullName || '');
      const avatarChanged = (avatarPreview || '') !== (authUser.avatarUrl || '');
      return nameChanged || avatarChanged;
    }, [authUser, username, avatarPreview]);

    const handleAvatarClick = () => {
      setShowAvatarEditor((open) => !open);
    };

    const handleAvatarButtonClick = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    const handleAvatarChange = (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setAvatarError('Please select an image file.');
        return;
      }

      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxBytes) {
        setAvatarError('Image is too large. Please use a file under 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAvatarError('');
        setAvatarPreview(reader.result || '');
      };
      reader.onerror = () => {
        setAvatarError('Unable to read image. Please try a different file.');
      };
      reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
      if (!authUser) return;

      const trimmed = username.trim();
      if (!trimmed) {
        setUsernameError('Username is required.');
        return;
      }

      setUsernameError('');
      setSavingProfile(true);

      try {
        await updateProfile({ fullName: trimmed, avatarUrl: avatarPreview || null });
        setToast({ type: 'success', message: 'Profile updated successfully.' });
      } catch (error) {
        setToast({
          type: 'error',
          message: error?.message || 'Failed to update profile. Please try again.',
        });
      } finally {
        setSavingProfile(false);
      }
    };

    return (
        <div className="page-container">
            <header style={{ marginBottom: '2rem' }}>
                <h1>Settings</h1>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Profile Section */}
                <section
                  className="glass-panel"
                  style={{
                    padding: '2rem',
                    borderRadius: '1rem',
                  }}
                >
                  <h3
                    style={{
                      marginBottom: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(108, 110, 255, 0.1)',
                          borderRadius: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <User size={18} color="var(--accent-primary)" />
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>Profile</span>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 400,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Account identity for this device
                        </span>
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                      }}
                    >
                      {authUser && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '0.1rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            Signed in as
                          </span>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: '#e5e7eb',
                              maxWidth: '180px',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                            }}
                          >
                            {authUser.email}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          border: '1px solid rgba(148,163,184,0.6)',
                          background:
                            'radial-gradient(circle at 0% 0%, rgba(129,140,248,0.75), rgba(15,23,42,1))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                      >
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt={authUser.fullName || authUser.email || 'User avatar'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: '#e5e7eb',
                            }}
                          >
                            {getInitials(authUser?.fullName || authUser?.email || '')}
                          </span>
                        )}
                      </button>
                    </div>
                  </h3>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  {showAvatarEditor && (
                    <div
                      style={{
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          border: '1px solid rgba(148,163,184,0.7)',
                          background:
                            'radial-gradient(circle at 0% 0%, rgba(129,140,248,0.85), rgba(15,23,42,1))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt={authUser?.fullName || authUser?.email || 'User avatar'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: 600,
                              color: '#e5e7eb',
                            }}
                          >
                            {getInitials(authUser?.fullName || authUser?.email || '')}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          minWidth: 0,
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleAvatarButtonClick}
                          style={{
                            padding: '0.4rem 0.9rem',
                            fontSize: '0.85rem',
                            width: 'fit-content',
                          }}
                        >
                          {avatarPreview ? 'Change image' : 'Add new image'}
                        </button>
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          PNG or JPG, up to 2MB.
                        </p>
                        {avatarError && (
                          <p
                            style={{
                              fontSize: '0.8rem',
                              color: '#fca5a5',
                            }}
                          >
                            {avatarError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                      }}
                    >
                      <span>Username</span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          opacity: 0.9,
                        }}
                      >
                        Required
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Enter your display name"
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-input)',
                        borderColor: usernameError
                          ? 'rgba(248, 113, 113, 0.8)'
                          : 'var(--border-color)',
                        boxShadow: usernameError
                          ? '0 0 0 1px rgba(248, 113, 113, 0.65)'
                          : 'none',
                      }}
                    />
                    <p
                      style={{
                        marginTop: '0.35rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      This name will be visible in your workspace.
                    </p>
                    {usernameError && (
                      <p
                        style={{
                          marginTop: '0.25rem',
                          fontSize: '0.8rem',
                          color: '#fca5a5',
                        }}
                      >
                        {usernameError}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                      }}
                    >
                      <span>Email Address</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          background: 'rgba(22, 163, 74, 0.14)',
                          border: '1px solid rgba(34, 197, 94, 0.7)',
                          color: '#bbf7d0',
                        }}
                      >
                        Verified
                      </span>
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      value={authUser?.email || ''}
                      readOnly
                      aria-readonly="true"
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)',
                        cursor: 'not-allowed',
                        opacity: 0.9,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveProfile}
                      disabled={!hasProfileChanges || savingProfile}
                      style={{
                        padding: '0.65rem 1.3rem',
                        fontSize: '0.9rem',
                        opacity: !hasProfileChanges || savingProfile ? 0.6 : 1,
                        cursor:
                          !hasProfileChanges || savingProfile ? 'not-allowed' : 'pointer',
                        width: '100%',
                        maxWidth: '240px',
                      }}
                    >
                      {savingProfile ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '999px',
                              borderWidth: '2px',
                              borderStyle: 'solid',
                              borderColor: 'rgba(191, 219, 254, 0.2)',
                              borderTopColor: 'rgba(129,140,248,1)',
                              animation: 'spin 0.7s linear infinite',
                            }}
                          />
                          <span>Saving...</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Save size={16} /> <span>Save Profile Changes</span>
                        </span>
                      )}
                    </button>
                  </div>
                </section>

                {/* Appearance Section */}
                <section className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ padding: '0.5rem', background: 'rgba(108, 110, 255, 0.1)', borderRadius: '8px' }}>
                            <Moon size={18} color="var(--accent-primary)" />
                        </span>
                        Appearance
                    </h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Theme</label>
                        <select
                          className="input-field"
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                        >
                            <option value="dark">Dark (Default)</option>
                            <option value="light">Light</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Font Size</label>
                        <select
                          className="input-field"
                          value={fontSize}
                          onChange={(e) => setFontSize(e.target.value)}
                        >
                            <option value="small">Small</option>
                            <option value="medium">Medium (Default)</option>
                            <option value="large">Large</option>
                        </select>
                    </div>

                    <button
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                        onClick={() => alert('Appearance settings saved locally for this device.')}
                    >
                        <Save size={16} /> Save Appearance
                    </button>
                </section>

            </div>
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={() => setToast({ type: null, message: '' })}
            />
        </div>
    );
};
export default Settings;
