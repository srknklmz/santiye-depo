import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Package,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Trash2,
    Edit3,
    X,
    CheckCircle2,
    AlertTriangle,
    History,
    Download,
    Upload,
    FileSpreadsheet,
    Settings,
    Filter,
    Tag,
    LayoutDashboard,
    BarChart2,
    TrendingUp,
    Users,
    LogOut,
    UserCheck,
    UserX,
    Shield,
    Eye,
    Clock,
    Menu,
    ClipboardList,
    ShoppingCart,
    CheckCheck,
    XCircle,
    Send,
    Truck,
    RotateCcw,
    Check,
    UserPlus,
    Sun,
    Moon,
    ChevronLeft,
    ChevronDown,
    ChevronRight,
    FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db, auth, secondaryAuth } from './firebase';
import { ref, onValue, set, remove, get, update, onDisconnect } from 'firebase/database';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

// ─── Auth Error Helper ───────────────────────────────────────────────────────
const getAuthErrorMessage = (code) => {
    const map = {
        'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
        'auth/wrong-password': 'Şifre hatalı.',
        'auth/invalid-credential': 'E-posta veya şifre hatalı.',
        'auth/email-already-in-use': 'Bu e-posta zaten kullanılıyor.',
        'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
        'auth/invalid-email': 'Geçersiz e-posta adresi.',
        'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekleyin.',
    };
    return map[code] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
};

const ROLE_LABELS = {
    admin: 'Admin',
    yonetici: 'Yönetici',
    izleyici: 'İzleyici',
    viewer: 'İzleyici',
};

const ROLE_COLORS = {
    admin: { bg: '#ede9fe', color: '#6d28d9' },
    yonetici: { bg: '#dcfce7', color: '#166534' },
    izleyici: { bg: '#f1f5f9', color: '#475569' },
    viewer: { bg: '#f1f5f9', color: '#475569' },
};

// Sayfa tanımları — sayfa izin sistemi için
const PAGE_DEFS = [
    { key: 'dashboard', label: 'Panel', icon: '🏠' },
    { key: 'summary', label: 'Stok Özeti', icon: '📦' },
    { key: 'price', label: 'Fiyat Analizi', icon: '📈' },
    { key: 'movements', label: 'Tüm Hareketler', icon: '🔄' },
    { key: 'irsaliyeler', label: 'İrsaliyeler', icon: '📄' },
    { key: 'zimmet', label: 'Zimmet', icon: '🔑' },
    { key: 'action_giris', label: 'Giriş Ekle', icon: '⬆️', isAction: true },
    { key: 'action_cikis', label: 'Çıkış Ekle', icon: '⬇️', isAction: true },
    { key: 'action_zimmet', label: 'Zimmet Ekle', icon: '📋', isAction: true },
];

const normalizeRole = (role) => {
    if (role === 'viewer') return 'izleyici';
    if (role === 'manager') return 'yonetici';
    return role || 'izleyici';
};

const normalizeUserProfile = (user, uidFallback = '') => {
    if (!user || typeof user !== 'object') return null;
    return {
        ...user,
        uid: user.uid || uidFallback,
        name: user.name || user.fullName || user.email?.split('@')[0] || 'Kullanıcı',
        role: normalizeRole(user.role),
        status: user.status || 'approved',
    };
};

// ─── Auth Screens ─────────────────────────────────────────────────────────────

const LoadingScreen = () => (
    <div className="auth-screen">
        <div style={{ textAlign: 'center' }}>
            <div className="auth-logo-icon" style={{ margin: '0 auto 16px' }}>S</div>
            <div style={{ fontSize: '1.7rem', color: 'white', fontWeight: '800', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.5px' }}>Shintea</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '8px', fontSize: '13px' }}>Yükleniyor...</div>
        </div>
    </div>
);

const LoginScreen = ({ onLogin, onSwitchToRegister, error, loading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">S</div>
                    <div className="auth-logo-text">Shintea</div>
                </div>
                <div className="auth-section-title">Giriş Yap</div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-2">
                        <label className="label">E-posta</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" required />
                    </div>
                    <div className="mb-2">
                        <label className="label">Şifre</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Şifreniz" required />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>

                <div className="auth-switch">
                    Hesabın yok mu?{' '}
                    <button className="auth-switch-btn" onClick={onSwitchToRegister}>Kayıt Ol</button>
                </div>
            </div>
        </div>
    );
};

const RegisterScreen = ({ onRegister, onSwitchToLogin, error, loading }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onRegister(name, email, password);
    };

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">S</div>
                    <div className="auth-logo-text">Shintea</div>
                </div>
                <div className="auth-section-title">Kayıt Ol</div>

                <div className="auth-info-box">
                    ℹ️ Sisteme ilk kaydolan kullanıcı otomatik olarak <strong>Admin</strong> olur. Sonraki kayıtlar admin onayı gerektirir.
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-2">
                        <label className="label">Ad Soyad</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Adınız Soyadınız" required />
                    </div>
                    <div className="mb-2">
                        <label className="label">E-posta</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" required />
                    </div>
                    <div className="mb-2">
                        <label className="label">Şifre</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter" required minLength="6" />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                        {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <div className="auth-switch">
                    Zaten hesabın var mı?{' '}
                    <button className="auth-switch-btn" onClick={onSwitchToLogin}>Giriş Yap</button>
                </div>
            </div>
        </div>
    );
};

const PendingScreen = ({ userName, userStatus, onSignOut }) => (
    <div className="auth-screen">
        <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="auth-logo">
                <div className="auth-logo-icon" style={{ background: userStatus === 'rejected' ? 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }}>
                    {userStatus === 'rejected' ? '✕' : '⏳'}
                </div>
                <div className="auth-logo-text">Shintea</div>
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '17px', fontWeight: '700', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {userStatus === 'rejected' ? 'Erişim Reddedildi' : 'Onay Bekleniyor'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', lineHeight: '1.65' }}>
                {userStatus === 'rejected'
                    ? <>Hesabınız (<strong>{userName}</strong>) bir admin tarafından reddedildi. Daha fazla bilgi için yöneticinizle iletişime geçin.</>
                    : <>Merhaba <strong>{userName}</strong>, hesabınız admin onayı bekliyor. Onaylandığında uygulamaya erişebileceksiniz.</>
                }
            </p>
            <button
                className="btn-ghost"
                onClick={onSignOut}
                style={{ color: '#f43f5e', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
            >
                <LogOut size={16} /> Çıkış Yap
            </button>
        </div>
    </div>
);

// ─── Admin Context Menu ────────────────────────────────────────────────────────

const EDIT_CONFIGS = {
    movements: {
        label: 'Stok Hareketi',
        path: (r) => `movements/${r.id}`,
        fields: [
            { key: 'date', label: 'Tarih', type: 'text' },
            { key: 'itemName', label: 'Malzeme', type: 'text' },
            { key: 'amount', label: 'Miktar', type: 'number' },
            { key: 'unit', label: 'Birim', type: 'text' },
            { key: 'firmaAdi', label: 'Firma', type: 'text' },
            { key: 'irsaliyeNo', label: 'İrsaliye No', type: 'text' },
            { key: 'recipient', label: 'Kişi', type: 'text' },
            { key: 'note', label: 'Not', type: 'text' },
        ],
    },
    zimmet: {
        label: 'Zimmet',
        path: (r) => `zimmet/${r.id}`,
        fields: [
            { key: 'date', label: 'Tarih', type: 'text' },
            { key: 'itemName', label: 'Malzeme', type: 'text' },
            { key: 'amount', label: 'Miktar', type: 'number' },
            { key: 'unit', label: 'Birim', type: 'text' },
            { key: 'person', label: 'Kişi/Ekip', type: 'text' },
        ],
    },
    requests: {
        label: 'Malzeme Talebi',
        path: (r) => `requests/${r.id}`,
        fields: [
            { key: 'date', label: 'Tarih', type: 'text' },
            { key: 'itemName', label: 'Malzeme', type: 'text' },
            { key: 'amount', label: 'Miktar', type: 'number' },
            { key: 'unit', label: 'Birim', type: 'text' },
            { key: 'requestedBy', label: 'Talep Eden', type: 'text' },
            { key: 'note', label: 'Not', type: 'text' },
        ],
    },
    items: {
        label: 'Malzeme',
        path: (r) => `items/${r.id}`,
        fields: [
            { key: 'name', label: 'Malzeme Adı', type: 'text' },
            { key: 'unit', label: 'Birim', type: 'text' },
            { key: 'category', label: 'Kategori', type: 'text' },
        ],
    },
    sevkiyat: {
        label: 'Sevkiyat',
        path: (r) => `sevkiyat/${r.id}`,
        fields: [
            { key: 'date', label: 'Tarih', type: 'text' },
            { key: 'firmaAdi', label: 'Firma', type: 'text' },
            { key: 'irsaliyeNo', label: 'İrsaliye No', type: 'text' },
        ],
    },
    personel: {
        label: 'Personel',
        path: (r) => `personel/${r.id}`,
        fields: [
            { key: 'adSoyad', label: 'Ad Soyad', type: 'text' },
            { key: 'tc', label: 'TC', type: 'text' },
            { key: 'pozisyon', label: 'Pozisyon', type: 'text' },
            { key: 'taseron', label: 'Taşeron', type: 'text' },
            { key: 'girisTarihi', label: 'Giriş Tarihi', type: 'text' },
            { key: 'cikisTarihi', label: 'Çıkış Tarihi', type: 'text' },
        ],
    },
    users: {
        label: 'Kullanıcı',
        path: (r) => `users/${r.uid}`,
        fields: [
            { key: 'name', label: 'Ad Soyad', type: 'text' },
            { key: 'role', label: 'Rol', type: 'select', options: ['admin', 'yonetici', 'izleyici'] },
            { key: 'status', label: 'Durum', type: 'select', options: ['approved', 'pending', 'rejected'] },
        ],
    },
    irsaliyeler: {
        label: 'İrsaliye',
        path: (r) => `irsaliyeMeta/${r.irsaliyeNo.replace(/[./\s]/g, '_')}`,
        fields: [
            { key: 'plaka', label: 'Plaka', type: 'text' },
            { key: 'sofor', label: 'Şoför', type: 'text' },
        ],
    },
};

const AdminContextMenu = ({ ctx, onEdit, onDelete, onClose }) => {
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    if (!ctx) return null;
    return createPortal(
        <div ref={ref} style={{
            position: 'fixed', top: ctx.y, left: ctx.x, zIndex: 99999,
            background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            border: '1px solid #e2e8f0', minWidth: '150px', overflow: 'hidden', userSelect: 'none',
        }}>
            <div onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer', color: '#1e293b' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Düzenle
            </div>
            <div style={{ height: '1px', background: '#f1f5f9' }} />
            <div onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer', color: '#dc2626' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                Sil
            </div>
        </div>,
        document.body
    );
};

const EditRowModal = ({ ctx, onSave, onClose }) => {
    const [form, setForm] = useState({});
    useEffect(() => {
        if (ctx) {
            const cfg = EDIT_CONFIGS[ctx.collection];
            const initial = {};
            cfg.fields.forEach(f => { initial[f.key] = ctx.row[f.key] ?? ''; });
            setForm(initial);
        }
    }, [ctx]);

    if (!ctx) return null;
    const cfg = EDIT_CONFIGS[ctx.collection];
    const inputStyle = { width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '420px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827' }}>{cfg.label} Düzenle</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cfg.fields.map(f => (
                        <div key={f.key}>
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                            {f.type === 'select' ? (
                                <select value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle}>
                                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <input type={f.type} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} style={inputStyle} />
                            )}
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                    <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#6b7280', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
                    <button onClick={() => onSave(form)} style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: '#4A90D9', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Kaydet</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Table Action Bar ─────────────────────────────────────────────────────────
const HIGHLIGHT_COLORS = [
    { key: 'yellow', label: 'Sarı', bg: '#fef9c3', border: '#fde047', text: '#713f12' },
    { key: 'blue',   label: 'Mavi', bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
    { key: 'red',    label: 'Kırmızı', bg: '#fee2e2', border: '#fca5a5', text: '#7f1d1d' },
    { key: null,     label: 'Temizle', bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' },
];

const TableActionBar = ({ count, totalCount, onSelectAll, allSelected, onDelete, onEdit, onHighlight, showDelete = true, showEdit = true }) => {
    if (count === 0) return null;
    const btn = (style) => ({
        padding: '5px 12px', borderRadius: '6px', border: '1px solid transparent',
        fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: '5px', lineHeight: 1.4,
        ...style,
    });
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d7ff', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#4338ca', minWidth: '80px' }}>{count} satır seçili</span>
            <button onClick={onSelectAll} style={btn({ background: allSelected ? '#e0e7ff' : '#6366f1', color: allSelected ? '#4338ca' : '#fff', border: allSelected ? '1px solid #a5b4fc' : '1px solid #4f46e5' })}>
                {allSelected ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </button>
            {showDelete && <button onClick={onDelete} style={btn({ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' })}>🗑 Sil</button>}
            {showEdit && <button onClick={onEdit} disabled={count !== 1} style={btn({ background: count === 1 ? '#e0f2fe' : '#f1f5f9', color: count === 1 ? '#0369a1' : '#94a3b8', border: count === 1 ? '1px solid #7dd3fc' : '1px solid #e2e8f0', cursor: count === 1 ? 'pointer' : 'not-allowed' })} title={count === 1 ? 'Seçili satırı düzenle' : 'Düzenlemek için tek satır seçin'}>✏️ Düzenle</button>}
            <button onClick={onHighlight} style={btn({ background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' })}>🎨 Vurgula</button>
        </div>
    );
};

const HighlightColorPicker = ({ onSelect, onClose }) => {
    const pickerRef = React.useRef(null);
    React.useEffect(() => {
        const h = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);
    return createPortal(
        <div ref={pickerRef} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 99999, background: 'white', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vurgulama Rengi</div>
            <div style={{ display: 'flex', gap: '8px' }}>
                {HIGHLIGHT_COLORS.map(c => (
                    <button key={String(c.key)} onClick={() => { onSelect(c.key); onClose(); }}
                        style={{ width: '70px', height: '34px', borderRadius: '6px', border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {c.label}
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );
};

const BulkDeleteModal = ({ data, onConfirm, onCancel }) => {
    if (!data) return null;
    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onCancel}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '340px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#dc2626', marginBottom: '10px' }}>⚠️ Silme Onayı</div>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                    <strong>{data.count}</strong> kayıt kalıcı olarak silinecek. Bu işlem geri alınamaz.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#6b7280', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
                    <button onClick={onConfirm} style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: '#dc2626', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Sil</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── MultiSelectDropdown ─────────────────────────────────────────────────────
const MultiSelectDropdown = ({ label, options, selected, onChange }) => {
    const [open, setOpen] = React.useState(false);
    const [dropPos, setDropPos] = React.useState({ top: 0, left: 0, width: 0 });
    const btnRef = React.useRef(null);
    const dropRef = React.useRef(null);
    React.useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (btnRef.current?.contains(e.target) || dropRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);
    const handleToggle = () => {
        if (!open && btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            // transform uygulanmış ancestor, fixed için yeni containing block oluşturur
            let containerRect = { left: 0, top: 0 };
            let el = btnRef.current.parentElement;
            while (el && el !== document.body) {
                const t = window.getComputedStyle(el).transform;
                if (t && t !== 'none') { containerRect = el.getBoundingClientRect(); break; }
                el = el.parentElement;
            }
            setDropPos({ top: r.bottom - containerRect.top + 4, left: r.left - containerRect.left, width: r.width });
        }
        setOpen(o => !o);
    };
    return (
        <div style={{ flex: 1 }}>
            <button ref={btnRef} onClick={handleToggle} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 8px', fontSize: '11px', fontWeight: 500, borderRadius: '7px',
                border: '1px solid var(--border)', background: selected.size > 0 ? 'var(--accent)' : 'var(--bg-card)',
                color: selected.size > 0 ? '#fff' : 'var(--text-muted)', cursor: 'pointer', gap: '4px',
            }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.size > 0 ? `${selected.size} seçili` : label}
                </span>
                <ChevronDown size={11} style={{ flexShrink: 0 }} />
            </button>
            {open && (
                <div ref={dropRef} style={{
                    position: 'fixed', top: dropPos.top, left: dropPos.left, width: Math.max(dropPos.width, 200),
                    zIndex: 9999, background: '#ffffff', border: '1px solid #e2e8f0',
                    borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    maxHeight: '260px', overflowY: 'auto', padding: '4px 0',
                }}>
                    {selected.size > 0 && (
                        <button onClick={() => { onChange(new Set()); setOpen(false); }} style={{
                            width: '100%', textAlign: 'left', padding: '5px 10px', fontSize: '11px',
                            color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer',
                            borderBottom: '1px solid #e2e8f0', fontWeight: 600,
                        }}>Temizle</button>
                    )}
                    {options.map(opt => (
                        <label key={opt} style={{
                            display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '8px',
                            padding: '6px 10px', cursor: 'pointer', fontSize: '12px', color: '#1e293b',
                        }}>
                            <input type="checkbox" checked={selected.has(opt)} onChange={() => {
                                const next = new Set(selected);
                                if (next.has(opt)) next.delete(opt); else next.add(opt);
                                onChange(next);
                            }} style={{ accentColor: '#2563eb', cursor: 'pointer' }} />
                            <span style={{ color: '#1e293b', fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{opt}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── DateRangePicker ──────────────────────────────────────────────────────────

const DateRangePicker = ({ startDate, endDate, onChange }) => {
    const [open, setOpen] = useState(false);
    const [tempStart, setTempStart] = useState(startDate || '');
    const [tempEnd, setTempEnd] = useState(endDate || '');
    const [viewDate, setViewDate] = useState(() => startDate ? new Date(startDate + 'T00:00:00') : new Date());
    const [selectingEnd, setSelectingEnd] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { setTempStart(startDate || ''); }, [startDate]);
    useEffect(() => { setTempEnd(endDate || ''); }, [endDate]);

    const handleOpen = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
        }
        setOpen(o => !o);
    };

    const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; })();
    const toISO = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const handleDayClick = (day) => {
        const iso = toISO(year, month, day);
        if (!tempStart || !selectingEnd) {
            setTempStart(iso); setTempEnd(''); setSelectingEnd(true);
        } else {
            if (iso < tempStart) { setTempEnd(tempStart); setTempStart(iso); }
            else { setTempEnd(iso); }
            setSelectingEnd(false);
        }
    };

    const handlePreset = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days + 1);
        const fmt = (d) => d.toISOString().split('T')[0];
        setTempStart(fmt(start)); setTempEnd(fmt(end)); setViewDate(start); setSelectingEnd(false);
    };

    const handleApply = () => { onChange(tempStart, tempEnd); setOpen(false); };

    const formatDate = (iso) => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    const displayText = tempStart
        ? (tempEnd ? `${formatDate(tempStart)}  —  ${formatDate(tempEnd)}` : `${formatDate(tempStart)}  —  ...`)
        : 'Tarih aralığı seçiniz';

    const isStart = (day) => toISO(year, month, day) === tempStart;
    const isEnd = (day) => toISO(year, month, day) === tempEnd;
    const isInRange = (day) => {
        if (!tempStart || !tempEnd) return false;
        const iso = toISO(year, month, day);
        return iso > tempStart && iso < tempEnd;
    };

    const triggerStyle = {
        display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px',
        height: '32px', borderRadius: '6px', border: `1px solid ${open ? '#4A90D9' : 'var(--border)'}`,
        background: 'var(--bg-main)', cursor: 'pointer', fontSize: '12px',
        color: 'var(--text-main)', flex: 1, userSelect: 'none',
    };

    const calIcon = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;

    const dropdown = open && createPortal(
        <div ref={dropdownRef} style={{ position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '16px', zIndex: 99999, width: '276px', border: '1px solid #e2e8f0' }}>
            {/* Hızlı seçimler */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {[['7 Gün', 7], ['30 Gün', 30], ['90 Gün', 90]].map(([label, days]) => (
                    <button key={label} onClick={() => handlePreset(days)} style={{ flex: 1, padding: '5px 0', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: '11px', cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' }}>{label}</button>
                ))}
                <button style={{ flex: 1, padding: '5px 0', borderRadius: '6px', border: '1px solid #4A90D9', background: '#EBF3FC', color: '#4A90D9', fontSize: '11px', cursor: 'default', fontWeight: '600', fontFamily: 'inherit' }}>Özel</button>
            </div>

            {/* Ay navigasyonu */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px', fontSize: '18px', color: '#6b7280', lineHeight: 1 }}>‹</button>
                <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>{MONTHS[month]} {year}</span>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px', fontSize: '18px', color: '#6b7280', lineHeight: 1 }}>›</button>
            </div>

            {/* Gün başlıkları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: '4px' }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '600', color: '#9ca3af', padding: '3px 0' }}>{d}</div>)}
            </div>

            {/* Günler */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const start = isStart(day);
                    const end = isEnd(day);
                    const inRange = isInRange(day);
                    return (
                        <div key={day} onClick={() => handleDayClick(day)} style={{
                            textAlign: 'center', padding: '5px 0', fontSize: '12px', cursor: 'pointer', borderRadius: '6px',
                            background: (start || end) ? '#4A90D9' : inRange ? 'rgba(74,144,217,0.13)' : 'transparent',
                            color: (start || end) ? 'white' : '#111827',
                            fontWeight: (start || end) ? '700' : '400',
                        }}>
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <button onClick={() => { setTempStart(''); setTempEnd(''); setSelectingEnd(false); onChange('', ''); setOpen(false); }} style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#6b7280', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Temizle</button>
                <button onClick={handleApply} style={{ padding: '5px 16px', borderRadius: '6px', border: 'none', background: '#4A90D9', color: 'white', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Seç</button>
            </div>
        </div>,
        document.body
    );

    return (
        <div ref={triggerRef} style={{ display: 'flex', alignItems: 'center' }}>
            <div onClick={handleOpen} style={{ ...triggerStyle, width: '100%' }}>
                {calIcon}
                <span style={{ color: tempStart ? 'var(--text-main)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayText}</span>
            </div>
            {dropdown}
        </div>
    );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

const App = () => {
    // ── Data State ──
    const [items, setItems] = useState([]);
    const [movements, setMovements] = useState([]);
    const [requests, setRequests] = useState([]);
    const [categories, setCategories] = useState(['Genel', 'Elektrik', 'Tesisat', 'Kaba İnşaat', 'Hırdavat']);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // ── Theme State ──
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // ── UI State ──
    const [showModal, setShowModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [movementType, setMovementType] = useState('in');
    const [selectedItemForMove, setSelectedItemForMove] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [summaryFilters, setSummaryFilters] = useState({ unit: 'all', status: 'all', sortBy: 'name', sortOrder: 'asc' });
    const [summarySelected, setSummarySelected] = useState(null);
    const [summaryFilterNames, setSummaryFilterNames] = useState(new Set());
    const [summaryFilterCategories, setSummaryFilterCategories] = useState(new Set());
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [visibleCols, setVisibleCols] = useState(['Malzeme', 'Giris', 'Cikis', 'Depo', 'Zimmet', 'Toplam', 'Birim']);
    const [categoryFilter, setCategoryFilter] = useState('Tümü');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [detailModal, setDetailModal] = useState({ show: false, item: null, type: null });
    const [dashModal, setDashModal] = useState({ show: false, title: '', data: [], type: '' });
    const [dashboardFilters, setDashboardFilters] = useState(new Set(['in', 'out', 'zimmet']));
    const [movFilter, setMovFilter] = useState({ malzeme: '', tarihBas: '', tarihBitis: '', firma: '', irsaliye: '' });
    const [priceFilter, setPriceFilter] = useState({ malzeme: '', kategori: '' });
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncingNotion, setIsSyncingNotion] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState('stock');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [selectedItemsForExport, setSelectedItemsForExport] = useState([]);
    const [movementViewType, setMovementViewType] = useState('all');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestFilter, setRequestFilter] = useState('pending');
    // ── Personel State ──
    const [personel, setPersonel] = useState([]);
    const [showPersonelModal, setShowPersonelModal] = useState(false);
    const [editingPersonel, setEditingPersonel] = useState(null);
    const [personelForm, setPersonelForm] = useState({ tc: '', adSoyad: '', girisTarihi: '', cikisTarihi: '', taseron: '' });
    // ── Zimmet State ──
    const [zimmet, setZimmet] = useState([]);
    const [showZimmetModal, setShowZimmetModal] = useState(false);
    const [zimmetType, setZimmetType] = useState('verildi');
    const [selectedItemForZimmet, setSelectedItemForZimmet] = useState(null);
    const [zimmetView, setZimmetView] = useState('active'); // 'active' or 'history'
    // ── Sevkiyat State ──
    const [sevkiyat, setSevkiyat] = useState([]);
    const [sevkiyatLoading, setSevkiyatLoading] = useState(false);
    const [sevkiyatModal, setSevkiyatModal] = useState({ show: false, data: null });
    const [sevkiyatToast, setSevkiyatToast] = useState({ show: false, message: '', type: 'success' });
    const [eksikSelectionMode, setEksikSelectionMode] = useState(false);
    const [eksikSelectedIndices, setEksikSelectedIndices] = useState([]);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [purchaseFormId, setPurchaseFormId] = useState(String(Date.now()));
    const [isQuickAdd, setIsQuickAdd] = useState(false);
    const [isNewRecipient, setIsNewRecipient] = useState(false);
    // ── Giriş Form State ──
    const [inMalzemeAdi, setInMalzemeAdi] = useState('');
    const [inFirmaAdi, setInFirmaAdi] = useState('');
    const [teslimAlanlar, setTeslimAlanlar] = useState([]);
    const [showAddTeslimAlan, setShowAddTeslimAlan] = useState(false);
    const [newTeslimAlanAdi, setNewTeslimAlanAdi] = useState('');
    // ── Giriş Form Add Buttons State ──
    const [showAddMalzemeAdi, setShowAddMalzemeAdi] = useState(false);
    const [newMalzemeAdiInput, setNewMalzemeAdiInput] = useState('');
    const [malzemeTurleri, setMalzemeTurleri] = useState(['Yapı Malzemesi', 'Elektrik Malzemesi', 'Tesisat Malzemesi', 'İSG Malzemesi', 'Sarf Malzeme', 'Diğer']);
    const [showAddMalzemeTuru, setShowAddMalzemeTuru] = useState(false);
    const [newMalzemeTuruInput, setNewMalzemeTuruInput] = useState('');
    const [birimlerList, setBirimlerList] = useState(['Adet', 'Kg', 'M', 'M2', 'M3', 'Ton', 'Palet', 'Torba', 'Paket']);
    const [showAddBirim, setShowAddBirim] = useState(false);
    const [newBirimInput, setNewBirimInput] = useState('');
    const [firmalar, setFirmalar] = useState([]);
    const [showAddFirma, setShowAddFirma] = useState(false);
    const [newFirmaInput, setNewFirmaInput] = useState('');
    const [irsaliyeListesi, setIrsaliyeListesi] = useState([]);
    const [irsaliyeMeta, setIrsaliyeMeta] = useState({});
    const [showAddIrsaliye, setShowAddIrsaliye] = useState(false);
    const [newIrsaliyeInput, setNewIrsaliyeInput] = useState('');
    const [inIrsaliyeNo, setInIrsaliyeNo] = useState('');
    const [showIrsaliyeDetailModal, setShowIrsaliyeDetailModal] = useState(false);
    const [selectedIrsaliye, setSelectedIrsaliye] = useState(null);
    // ── Çıkış Form State ──
    const [verilenBirimler, setVerilenBirimler] = useState([]);
    const [showAddVerilenBirim, setShowAddVerilenBirim] = useState(false);
    const [newVerilenBirimInput, setNewVerilenBirimInput] = useState('');
    const [kullanimAlanlari, setKullanimAlanlari] = useState([]);
    const [showAddKullanimAlani, setShowAddKullanimAlani] = useState(false);
    const [newKullanimAlaniInput, setNewKullanimAlaniInput] = useState('');
    const [showAddRecipient, setShowAddRecipient] = useState(false);
    const [newRecipientInput, setNewRecipientInput] = useState('');
    // ── Pending Actions State (geçmiş tarihli onay) ──
    const [pendingActions, setPendingActions] = useState([]);
    // ── User Management Modal ──
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [pagePermissionsEdit, setPagePermissionsEdit] = useState({});

    const fileInputRef = useRef(null);
    const satinAlimRef = useRef(null);
    const sevkiyatNavItemRef = useRef(null);

    // ── Auth State ──
    const [authUser, setAuthUser] = useState(null);
    const [userProfile, setUserProfile] = useState({ name: 'Admin', role: 'YÖNETİCİ', status: 'approved', uid: 'local' });
    const [authLoading, setAuthLoading] = useState(true);
    const [authView, setAuthView] = useState('login');
    const [authError, setAuthError] = useState('');
    const [authSubmitting, setAuthSubmitting] = useState(false);
    const unsubProfileRef = useRef(null);

    // ── User Management State (admin only) ──
    const [allUsers, setAllUsers] = useState([]);
    const [showUserMgmt, setShowUserMgmt] = useState(false);
    const [approvingUid, setApprovingUid] = useState(null);
    const [pendingRoleMap, setPendingRoleMap] = useState({});

    // ── Computed Permissions ──
    const roleNorm = (userProfile?.role || '').toLowerCase()
        .replace(/İ/g, 'i').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c')
        .replace(/[^a-z]/g, '');
    const canEdit = roleNorm === 'yonetici';
    const isAdmin = canEdit; // yönetici = tam yetki

    // ── Per-Page Permission Helper ──
    // Döndürür: 'edit' | 'view' | 'none'
    const ACTION_KEYS = ['action_giris', 'action_cikis', 'action_zimmet'];
    const pagePerm = (tab) => {
        if (isAdmin) return 'edit';
        const saved = userProfile?.pagePermissions?.[tab];
        if (saved !== undefined) return saved;
        // Aksiyon izinleri: yönetici 'edit', izleyici 'none' (varsayılan)
        if (ACTION_KEYS.includes(tab)) return canEdit ? 'edit' : 'none';
        // Sayfa izinleri: yönetici 'edit', izleyici 'view' (varsayılan)
        return canEdit ? 'edit' : 'view';
    };

    // ── Admin Right-Click ──
    const [ctxMenu, setCtxMenu] = useState(null);   // { x, y, row, collection }
    const [editRow, setEditRow] = useState(null);   // { row, collection }

    // ── Table Selection & Highlight State ──
    const [selectedRows, setSelectedRows] = useState({});   // { tableId: { rowKey: true } }
    const [rowHighlights, setRowHighlights] = useState({});  // { 'tableId:rowKey': 'yellow'|'blue'|'red' }
    const [hlPickerState, setHlPickerState] = useState(null); // { tableId, rowKeys: string[] } when picker open
    const [bulkDelState, setBulkDelState] = useState(null);  // { tableId, rows: object[], count: number }

    const handleCtxMenu = (e, row, collection) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY, row, collection });
    };

    const handleCtxDelete = () => {
        if (!ctxMenu) return;
        const cfg = EDIT_CONFIGS[ctxMenu.collection];
        if (!window.confirm('Bu satırı silmek istediğinize emin misiniz?')) { setCtxMenu(null); return; }
        remove(ref(db, cfg.path(ctxMenu.row)));
        setCtxMenu(null);
    };

    const handleCtxEdit = () => {
        if (!ctxMenu) return;
        setEditRow({ row: ctxMenu.row, collection: ctxMenu.collection });
        setCtxMenu(null);
    };

    const handleEditSave = (formData) => {
        if (!editRow) return;
        const cfg = EDIT_CONFIGS[editRow.collection];
        update(ref(db, cfg.path(editRow.row)), formData);
        setEditRow(null);
    };

    // ── Selection / Highlight Helpers ──
    const tblSel = (tableId) => selectedRows[tableId] || {};
    const tblSelCount = (tableId) => Object.keys(selectedRows[tableId] || {}).length;
    const tblSelKeys = (tableId) => Object.keys(selectedRows[tableId] || {});
    const isRowSel = (tableId, key) => !!(selectedRows[tableId] || {})[String(key)];
    const toggleSel = (tableId, key) => {
        setSelectedRows(prev => {
            const t = { ...(prev[tableId] || {}) };
            if (t[String(key)]) delete t[String(key)]; else t[String(key)] = true;
            return { ...prev, [tableId]: t };
        });
    };
    const selectAllTbl = (tableId, keys) => {
        setSelectedRows(prev => {
            const t = prev[tableId] || {};
            const strKeys = keys.map(String);
            const allSel = strKeys.length > 0 && strKeys.every(k => t[k]);
            const newT = {};
            if (!allSel) strKeys.forEach(k => newT[k] = true);
            return { ...prev, [tableId]: newT };
        });
    };
    const clearSel = (tableId) => setSelectedRows(prev => ({ ...prev, [tableId]: {} }));

    const getHL = (tableId, key) => rowHighlights[`${tableId}:${key}`] || null;
    const hlRowStyle = (tableId, key) => {
        const hl = getHL(tableId, String(key));
        if (hl === 'yellow') return { background: '#fef9c3' };
        if (hl === 'blue')   return { background: '#dbeafe' };
        if (hl === 'red')    return { background: '#fee2e2' };
        return {};
    };
    const applyHL = (tableId, keys, color) => {
        setRowHighlights(prev => {
            const next = { ...prev };
            keys.forEach(k => { if (color) next[`${tableId}:${k}`] = color; else delete next[`${tableId}:${k}`]; });
            return next;
        });
    };

    const openHLPicker = (tableId, keys) => setHlPickerState({ tableId, rowKeys: keys.map(String) });

    const handleBulkDelete = async (tableId, rows) => {
        const cfg = EDIT_CONFIGS[tableId];
        if (!cfg) return;
        for (const row of rows) {
            try { await remove(ref(db, cfg.path(row))); } catch(e) { console.error('Delete error', e); }
        }
        clearSel(tableId);
    };

    const openBulkDel = (tableId, rows) => setBulkDelState({ tableId, rows, count: rows.length });

    const CB_STYLE = { width: '15px', height: '15px', cursor: 'pointer', accentColor: '#6366f1', flexShrink: 0 };
    const CB_TH = { width: '36px', padding: '6px 8px' };
    const CB_TD = { width: '36px', padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' };

    const formatNumber = (num) => Number(num || 0).toLocaleString('tr-TR');

    const parseTrDate = (str) => {
        if (!str) return null;
        const s = String(str).trim();
        const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
        const d = new Date(s);
        return isNaN(d) ? null : d;
    };

    const parseMovementTime = (movement) => {
        const rawDate = String(movement?.date || '').trim();
        const match = rawDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (match) {
            const day = Number(match[1]);
            const month = Number(match[2]) - 1;
            const year = Number(match[3]);
            const hour = Number(match[4] || 0);
            const minute = Number(match[5] || 0);
            const second = Number(match[6] || 0);
            const parsed = new Date(year, month, day, hour, minute, second).getTime();
            if (!Number.isNaN(parsed)) return parsed;
        }
        return Number(movement?.id) || 0;
    };

    const allMovementsSorted = useMemo(() => {
        const combined = [
            ...movements.map(m => ({
                ...m,
                category: 'movement',
                normalizedType: m.type
            })),
            ...zimmet.map(z => ({
                ...z,
                category: 'zimmet',
                recipient: z.person,
                normalizedType: z.type === 'verildi' ? 'out' : 'in'
            }))
        ];
        return combined.sort((a, b) => {
            const dateDiff = parseMovementTime(b) - parseMovementTime(a);
            if (dateDiff !== 0) return dateDiff;
            return (Number(b.id) || 0) - (Number(a.id) || 0);
        });
    }, [movements, zimmet]);

    const filteredMovementsForPage = useMemo(() => {
        // Zimmet hareketleri sadece zimmet sekmesinde görünür; stok hareketleri tablosunda gösterilmez
        const onlyStockMovements = allMovementsSorted.filter(m => m.category !== 'zimmet');
        if (movementViewType === 'in') return onlyStockMovements.filter(m => m.normalizedType === 'in');
        if (movementViewType === 'out') return onlyStockMovements.filter(m => m.normalizedType === 'out');
        return onlyStockMovements;
    }, [allMovementsSorted, movementViewType]);

    // ── Auth Effect ──
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (unsubProfileRef.current) {
                unsubProfileRef.current();
                unsubProfileRef.current = null;
            }
            if (user) {
                setAuthUser(user);
                setAuthLoading(true);
                const userRef = ref(db, `users/${user.uid}`);
                unsubProfileRef.current = onValue(userRef, (snap) => {
                    setUserProfile(snap.exists() ? normalizeUserProfile(snap.val(), user.uid) : { name: 'Admin', role: 'YÖNETİCİ', status: 'approved', uid: user.uid });
                    setAuthLoading(false);
                }, (error) => {
                    console.error('Profil okuma hatası:', error);
                    setAuthLoading(false);
                });
            } else {
                setAuthUser(null);
                setUserProfile(null);
                setAuthLoading(false);
            }
        });

        return () => {
            unsubAuth();
            if (unsubProfileRef.current) unsubProfileRef.current();
        };
    }, []);

    // ── Firebase Data Effect ──
    useEffect(() => {
        const connectedRef = ref(db, '.info/connected');
        onValue(connectedRef, (snap) => setIsConnected(snap.val() === true));

        const itemsRef = ref(db, 'items');
        const movementsRef = ref(db, 'movements');
        const categoriesRef = ref(db, 'categories');

        const unsubItems = onValue(itemsRef, (snapshot) => {
            const data = snapshot.val();
            setItems(data ? Object.values(data) : []);
            setIsInitialLoad(false);
        });

        const unsubMovements = onValue(movementsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.values(data).sort((a, b) => b.id - a.id);
                setMovements(list);
            } else {
                setMovements([]);
            }
        });

        const unsubCategories = onValue(categoriesRef, (snapshot) => {
            const data = snapshot.val();
            if (Array.isArray(data)) setCategories(data);
            else if (data && typeof data === 'object') setCategories(Object.values(data));
        });

        const today = new Date().toISOString().split('T')[0];
        const backupRef = ref(db, `backups/${today}`);
        onValue(backupRef, (snapshot) => {
            if (!snapshot.exists()) console.log("Bugün için henüz bulut yedeği alınmamış.");
        }, { onlyOnce: true });

        return () => {
            unsubItems();
            unsubMovements();
            unsubCategories();
        };
    }, []);

    // ── Requests Effect ──
    useEffect(() => {
        const requestsRef = ref(db, 'requests');
        const unsub = onValue(requestsRef, (snap) => {
            const data = snap.val();
            setRequests(data ? Object.values(data).sort((a, b) => b.id - a.id) : []);
        });
        return () => unsub();
    }, []);

    // ── Zimmet Effect ──
    useEffect(() => {
        const zimmetRef = ref(db, 'zimmet');
        const unsub = onValue(zimmetRef, (snap) => {
            const data = snap.val();
            setZimmet(data ? Object.values(data).sort((a, b) => (b.updated_at || b.created_at || b.id || 0) - (a.updated_at || a.created_at || a.id || 0)) : []);
        });
        return () => unsub();
    }, []);

    // ── Sevkiyat Effect ──
    useEffect(() => {
        const sevkiyatRef = ref(db, 'sevkiyat');
        const unsub = onValue(sevkiyatRef, (snap) => {
            const data = snap.val();
            setSevkiyat(data ? Object.values(data).sort((a, b) => b.created_at - a.created_at) : []);
        });
        return () => unsub();
    }, []);

    // ── Teslim Alanlar Effect ──
    useEffect(() => {
        const teslimRef = ref(db, 'teslimAlanlar');
        const unsub = onValue(teslimRef, (snap) => {
            const data = snap.val();
            setTeslimAlanlar(data ? Object.values(data).sort((a, b) => a.name.localeCompare(b.name, 'tr')) : []);
        });
        return () => unsub();
    }, []);

    // ── Malzeme Türleri Effect ──
    useEffect(() => {
        const turleriRef = ref(db, 'malzemeTurleri');
        const unsub = onValue(turleriRef, (snap) => {
            const data = snap.val();
            const defaults = ['Yapı Malzemesi', 'Elektrik Malzemesi', 'Tesisat Malzemesi', 'İSG Malzemesi', 'Sarf Malzeme', 'Diğer'];
            const custom = data ? Object.values(data).map(v => v.name || v) : [];
            setMalzemeTurleri([...defaults, ...custom.filter(v => !defaults.includes(v))]);
        });
        return () => unsub();
    }, []);

    // ── Birimler Effect ──
    useEffect(() => {
        const birimlerRef = ref(db, 'birimler');
        const unsub = onValue(birimlerRef, (snap) => {
            const data = snap.val();
            const defaults = ['Adet', 'Kg', 'M', 'M2', 'M3', 'Ton', 'Palet', 'Torba', 'Paket'];
            const custom = data ? Object.values(data).map(v => v.name || v) : [];
            setBirimlerList([...defaults, ...custom.filter(v => !defaults.includes(v))]);
        });
        return () => unsub();
    }, []);

    // ── Firmalar Effect ──
    useEffect(() => {
        const firmalarRef = ref(db, 'firmalar');
        const unsub = onValue(firmalarRef, (snap) => {
            const data = snap.val();
            setFirmalar(data ? Object.values(data).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr')) : []);
        });
        return () => unsub();
    }, []);

    // ── İrsaliye Listesi Effect ──
    useEffect(() => {
        const irsaliyeRef = ref(db, 'irsaliyeListesi');
        const unsub = onValue(irsaliyeRef, (snap) => {
            const data = snap.val();
            setIrsaliyeListesi(data ? Object.values(data).sort((a, b) => b.id - a.id) : []);
        });
        return () => unsub();
    }, []);

    // ── İrsaliye Meta (Plaka / Şoför) Effect ──
    useEffect(() => {
        const metaRef = ref(db, 'irsaliyeMeta');
        const unsub = onValue(metaRef, (snap) => {
            setIrsaliyeMeta(snap.val() || {});
        });
        return () => unsub();
    }, []);

    // ── Personnel Sync (Firebase) ──
    useEffect(() => {
        const personelRef = ref(db, 'personel');
        const unsub = onValue(personelRef, (snap) => {
            const data = snap.val();
            setPersonel(data ? Object.values(data).sort((a, b) => (a.adSoyad || '').localeCompare(b.adSoyad || '', 'tr')) : []);
        });
        return () => unsub();
    }, []);

    // ── Verilen Birimler Effect ──
    useEffect(() => {
        const refV = ref(db, 'verilenBirimler');
        const unsub = onValue(refV, (snap) => {
            const data = snap.val();
            setVerilenBirimler(data ? Object.values(data) : []);
        });
        return () => unsub();
    }, []);

    // ── Kullanım Alanları Effect ──
    useEffect(() => {
        const refK = ref(db, 'kullanimAlanlari');
        const unsub = onValue(refK, (snap) => {
            const data = snap.val();
            setKullanimAlanlari(data ? Object.values(data) : []);
        });
        return () => unsub();
    }, []);

    // ── Pending Actions Effect (geçmiş tarihli onay bekleyenler) ──
    useEffect(() => {
        const pendingRef = ref(db, 'pendingActions');
        const unsub = onValue(pendingRef, (snap) => {
            const data = snap.val();
            setPendingActions(data ? Object.values(data).sort((a, b) => b.id - a.id) : []);
        });
        return () => unsub();
    }, []);

    // ── Admin: All Users Effect ──
    useEffect(() => {
        if (!canEdit) return;
        const usersRef = ref(db, 'users');
        const unsub = onValue(usersRef, (snap) => {
            const data = snap.val();
            setAllUsers(data ? Object.entries(data).map(([uid, user]) => normalizeUserProfile(user, uid)).filter(Boolean) : []);
        });
        return () => unsub();
    }, [canEdit]);

    // ── Presence (online/offline) ──
    const [presence, setPresence] = useState({});

    useEffect(() => {
        if (!authUser?.uid || authUser.uid === 'guest') return;
        const uid = authUser.uid;
        const presenceRef = ref(db, `presence/${uid}`);
        const connectedRef = ref(db, '.info/connected');
        const unsub = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                onDisconnect(presenceRef).set({ online: false, lastSeen: Date.now() });
                set(presenceRef, { online: true, lastSeen: Date.now() });
            }
        });
        return () => { unsub(); set(presenceRef, { online: false, lastSeen: Date.now() }); };
    }, [authUser?.uid]);

    useEffect(() => {
        if (!canEdit) return;
        const presenceAllRef = ref(db, 'presence');
        const unsub = onValue(presenceAllRef, (snap) => {
            setPresence(snap.val() || {});
        });
        return () => unsub();
    }, [canEdit]);

    // ── Auth Handlers ──
    const handleLogin = async (email, password) => {
        setAuthSubmitting(true);
        setAuthError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setAuthError(getAuthErrorMessage(err.code));
        } finally {
            setAuthSubmitting(false);
        }
    };

    const handleRegister = async (name, email, password) => {
        setAuthSubmitting(true);
        setAuthError('');
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const uid = cred.user.uid;

            const usersSnap = await get(ref(db, 'users'));
            const isFirstUser = !usersSnap.exists();

            await set(ref(db, `users/${uid}`), {
                uid,
                name,
                email,
                role: isFirstUser ? 'YÖNETİCİ' : 'izleyici',
                status: isFirstUser ? 'approved' : 'pending',
                createdAt: Date.now()
            });
        } catch (err) {
            setAuthError(getAuthErrorMessage(err.code));
        } finally {
            setAuthSubmitting(false);
        }
    };

    const handleSignOut = () => signOut(auth);

    // ── Admin: User Management Handlers ──
    const handleApproveUser = (uid) => {
        const role = pendingRoleMap[uid] || 'izleyici';
        set(ref(db, `users/${uid}/status`), 'approved');
        set(ref(db, `users/${uid}/role`), role);
    };

    const handleRejectUser = (uid) => {
        if (confirm('Bu kullanıcıyı reddetmek istiyor musunuz?')) {
            set(ref(db, `users/${uid}/status`), 'rejected');
        }
    };

    const handleChangeRole = (uid, role) => {
        set(ref(db, `users/${uid}/role`), role);
    };

    // ── Admin: Kullanıcı Ekle / Düzenle / Sil ──
    const handleSaveUser = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.target);
        const name = formData.get('name')?.trim();
        const role = formData.get('role');

        if (editingUser) {
            // Düzenleme modu
            const status = formData.get('status');
            const updates = {};
            updates[`users/${editingUser.uid}/name`] = name;
            updates[`users/${editingUser.uid}/role`] = role;
            updates[`users/${editingUser.uid}/status`] = status;
            updates[`users/${editingUser.uid}/pagePermissions`] = pagePermissionsEdit;
            update(ref(db), updates)
                .then(() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    showToast('Kullanıcı bilgileri güncellendi.');
                })
                .catch(err => alert('Hata: ' + err.message))
                .finally(() => setIsSaving(false));
        } else {
            // Yeni kullanıcı ekleme
            const email = formData.get('email')?.trim();
            const password = formData.get('password');
            try {
                const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                await signOut(secondaryAuth);
                const uid = cred.user.uid;
                await set(ref(db, `users/${uid}`), {
                    uid,
                    name,
                    email,
                    role,
                    status: 'approved',
                    createdAt: Date.now()
                });
                setShowUserModal(false);
                setEditingUser(null);
                showToast('Kullanıcı başarıyla eklendi.');
            } catch (err) {
                alert('Hata: ' + getAuthErrorMessage(err.code));
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleDeleteUser = (uid, userName) => {
        if (uid === authUser.uid) { alert('Kendinizi silemezsiniz.'); return; }
        if (!confirm(`"${userName}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
        remove(ref(db, `users/${uid}`))
            .then(() => showToast('Kullanıcı silindi.', 'error'))
            .catch(err => alert('Hata: ' + err.message));
    };

    // ── Cloud Backup ──
    const triggerCloudBackup = () => {
        const today = new Date().toISOString().split('T')[0];
        set(ref(db, `backups/${today}`), {
            items,
            movements: movements.slice(0, 200),
            timestamp: Date.now(),
            date: new Date().toLocaleString()
        }).catch(err => console.error("Cloud Backup failed:", err));
    };

    // ── Stats ──
    const stats = useMemo(() => {
        const today = new Date().toLocaleDateString();
        return {
            totalItems: items.length,
            lowStock: items.filter(item => item.quantity <= item.minStock).length,
            todayIn: movements.filter(m => m.type === 'in' && String(m.date || '').includes(today)).length,
            todayOut: movements.filter(m => m.type === 'out' && String(m.date || '').includes(today)).length,
            todayZimmet: zimmet.filter(z => String(z.date || z.created_at || '').includes(today)).length
        };
    }, [items, movements, zimmet]);

    const pendingRequestsCount = useMemo(() =>
        requests.filter(r => r.status === 'pending').length,
        [requests]);

    // Tedarikçi / Kaynak / Alan listesi (hareketlerden türetilir)
    const uniqueRecipients = useMemo(() => {
        const set = new Set();
        movements.forEach(m => { if (m.recipient && m.recipient.trim()) set.add(m.recipient.trim()); });
        return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
    }, [movements]);

    const uniqueVerilenBirimler = useMemo(() => {
        const set = new Set();
        movements.forEach(m => { if (m.verilenBirim && m.verilenBirim.trim()) set.add(m.verilenBirim.trim()); });
        verilenBirimler.forEach(v => { if (v.name) set.add(v.name.trim()); });
        return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
    }, [movements, verilenBirimler]);

    const uniqueKullanimAlanlari = useMemo(() => {
        const set = new Set();
        movements.forEach(m => { if (m.kullanimAlani && m.kullanimAlani.trim()) set.add(m.kullanimAlani.trim()); });
        kullanimAlanlari.forEach(k => { if (k.name) set.add(k.name.trim()); });
        return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
    }, [movements, kullanimAlanlari]);

    // Firma adları — geçmiş girişlerden otomatik türetilir
    const uniqueFirmaAdlari = useMemo(() => {
        const set = new Set();
        movements.forEach(m => { if (m.type === 'in' && m.firmaAdi && m.firmaAdi.trim()) set.add(m.firmaAdi.trim()); });
        return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
    }, [movements]);

    // Firma adları — Firebase firmalar + hareketlerden birleşik liste
    const allFirmaAdlari = useMemo(() => {
        const all = new Set([...firmalar.map(f => f.name), ...uniqueFirmaAdlari]);
        return [...all].sort((a, b) => a.localeCompare(b, 'tr'));
    }, [firmalar, uniqueFirmaAdlari]);

    // Malzeme listesi — alfabetik (Türkçe)
    const sortedItems = useMemo(() =>
        [...items].sort((a, b) => a.name.localeCompare(b.name, 'tr')),
        [items]);

    const siparislerData = useMemo(() => {
        const satinAlinan = [];
        const eksikler = [];
        sevkiyat.forEach(s => {
            if (s.satin_alim_durumu === 'SATIN_ALINDI') {
                (s.items || []).forEach((item) => {
                    satinAlinan.push({
                        ...item,
                        formNo: s.satin_alim_form_no,
                        sevkiyatId: s.id,
                        tarihTR: s.sevkiyata_gonderilme_tarihi_tr,
                        created_at: s.created_at,
                    });
                });
            }
            if (s.satin_alim_durumu === 'EKSIK_MALZEME' && Array.isArray(s.eksik_items)) {
                (s.items || []).forEach((item, idx) => {
                    if (s.eksik_items.includes(idx)) {
                        eksikler.push({
                            ...item,
                            formNo: s.satin_alim_form_no,
                            sevkiyatId: s.id,
                            tarihTR: s.sevkiyata_gonderilme_tarihi_tr,
                            created_at: s.created_at,
                        });
                    } else {
                        satinAlinan.push({
                            ...item,
                            formNo: s.satin_alim_form_no,
                            sevkiyatId: s.id,
                            tarihTR: s.sevkiyata_gonderilme_tarihi_tr,
                            created_at: s.created_at,
                        });
                    }
                });
            }
        });
        satinAlinan.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        eksikler.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        return { satinAlinan, eksikler };
    }, [sevkiyat]);

    const filteredRequests = useMemo(() => {
        if (requestFilter === 'all') return requests;
        return requests.filter(r => r.status === requestFilter);
    }, [requests, requestFilter]);

    const stockSummary = useMemo(() => {
        let list = items.map(item => {
            const itemMovements = movements.filter(m => Number(m.itemId) === Number(item.id));
            const totalReceived = itemMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
            const totalUsed = itemMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
            const zimmetteCount = zimmet
                .filter(z => Number(z.itemId) === Number(item.id) && z.status === 'zimmette')
                .reduce((sum, z) => sum + (Number(z.amount) || 0), 0);
            
            // Status Logic
            let status = 'healthy';
            const qty = item.quantity || 0;
            const min = item.minStock || 0;
            if (min > 0 && qty <= min) status = 'critical';
            else if (min > 0 && qty <= min * 1.3) status = 'warning';
            else if (qty > (min > 0 ? min * 5 : 500)) status = 'surplus'; // Extra stock logic
            
            // Inactivity Logic (no movements in last 45 days)
            const lastMove = itemMovements.length > 0 ? new Date(Math.max(...itemMovements.map(m => { const d = parseTrDate(m.date); return d ? d.getTime() : 0; }))) : null;
            const isInactive = lastMove && (Date.now() - lastMove.getTime()) > (45 * 24 * 60 * 60 * 1000);
            if (isInactive) status = 'inactive';

            return { 
                ...item, 
                totalReceived, 
                totalUsed, 
                zimmetteCount, 
                movements: itemMovements,
                status,
                lastMove
            };
        });

        // Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => s.name.toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q));
        }

        // Malzeme multi-select filter
        if (summaryFilterNames.size > 0) {
            list = list.filter(s => summaryFilterNames.has(s.name));
        }

        // Kategori multi-select filter
        if (summaryFilterCategories.size > 0) {
            list = list.filter(s => summaryFilterCategories.has(s.category || ''));
        }

        // Sorting A-Z
        list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

        return list;
    }, [items, movements, zimmet, searchQuery, summaryFilterNames, summaryFilterCategories]);

    const summaryStats = useMemo(() => {
        const totalProducts = items.length;
        const criticalItems = items.filter(i => i.minStock > 0 && i.quantity <= i.minStock).length;
        
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const thisMonthMovements = movements.filter(m => new Date(m.date) >= firstDayOfMonth);
        const monthlyIns = thisMonthMovements.filter(m => m.type === 'in').length;
        const monthlyOuts = thisMonthMovements.filter(m => m.type === 'out').length;

        return { totalProducts, criticalItems, monthlyIns, monthlyOuts };
    }, [items, movements]);

    const priceAnalysis = useMemo(() => {
        return items.map(item => {
            const itemInMovements = movements.filter(m => Number(m.itemId) === Number(item.id) && m.type === 'in');
            const totalQtyReceived = itemInMovements.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
            const totalSpent = itemInMovements.reduce((sum, m) => sum + (Number(m.amount) * (Number(m.birimFiyat) || 0)), 0);
            const avgPrice = totalQtyReceived > 0 ? (totalSpent / totalQtyReceived) : 0;
            const kategori = itemInMovements.length > 0 ? (itemInMovements[0].malzemeTuru || item.category || '') : (item.category || '');
            return { ...item, totalQtyReceived, totalSpent, avgPrice, kategori };
        }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
    }, [items, movements]);

    // ── Data Handlers ──
    const handleAddItem = (e) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const unit = formData.get('unit');
        const category = formData.get('category');
        const minStock = Number(formData.get('minStock'));

        const id = editingItem ? String(editingItem.id) : String(Date.now());
        const quantity = editingItem ? editingItem.quantity : Number(formData.get('quantity'));

        const saveData = { id: Number(id), name, unit, category, quantity, minStock };

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Sunucu yanıt vermiyor. İnternet bağlantınızı kontrol edin.")), 10000)
        );

        Promise.race([set(ref(db, `items/${id}`), saveData), timeout])
            .then(() => {
                setShowModal(false);
                setEditingItem(null);
                triggerCloudBackup();
            })
            .catch(err => {
                console.error("Save Error:", err);
                alert("Hata: " + err.message);
            })
            .finally(() => setIsSaving(false));
    };

    const handleMoveStock = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.target);
        const actionDate = formData.get('actionDate');
        const unit = formData.get('unit') || 'Adet';
        const irsaliyeNo = formData.get('irsaliyeNo') || '';

        // Tarih — DD.MM.YYYY (saat yok)
        const [year, month, day] = actionDate.split('-');
        const displayDate = `${day}.${month}.${year}`;
        const today = new Date().toISOString().split('T')[0];
        const isBackdated = actionDate < today;

        try {
            if (movementType === 'in') {
                const malzemeAdi = inMalzemeAdi.trim();
                const malzemeTuru = formData.get('malzemeTuru') || 'Genel';
                const firmaAdi = inFirmaAdi.trim();
                const teslimAlan = formData.get('teslimAlan') || '';
                const amount = parseFloat(formData.get('amount') || 0);
                if (!malzemeAdi) { setIsSaving(false); return; }

                // Malzeme bul ya da yeni oluştur
                let item = items.find(i => i.name.toLowerCase() === malzemeAdi.toLowerCase());
                if (!item) {
                    const newId = Date.now();
                    item = { id: newId, name: malzemeAdi, unit, category: malzemeTuru, quantity: 0, minStock: 0 };
                    await set(ref(db, `items/${newId}`), item);
                }
                const itemId = String(item.id);

                const price = Number(formData.get('price')) || 0;
                const moveBaseData = {
                    itemId: Number(item.id),
                    itemName: item.name,
                    malzemeTuru,
                    firmaAdi,
                    teslimAlan,
                    amount,
                    unit,
                    irsaliyeNo,
                    price,
                    type: 'in',
                    date: displayDate,
                };

                if (isBackdated) {
                    const pendingId = String(Date.now() + 1);
                    await set(ref(db, `pendingActions/${pendingId}`), {
                        id: Number(pendingId), actionType: 'movement', movementType: 'in',
                        data: moveBaseData,
                        requestedBy: userProfile.name, requestedByUid: authUser.uid,
                        requestedAt: new Date().toLocaleString('tr-TR'), status: 'pending'
                    });
                    showToast('Geçmiş tarihli işlem yönetici onayına gönderildi.', 'success');
                } else {
                    const moveId = String(Date.now() + 1);
                    await set(ref(db, `items/${itemId}/quantity`), Math.max(0, (item.quantity || 0) + amount));
                    await set(ref(db, `movements/${moveId}`), { id: Number(moveId), ...moveBaseData });
                    triggerCloudBackup();
                }
                setShowMoveModal(false);
                setInMalzemeAdi('');
                setInFirmaAdi('');
                setInIrsaliyeNo('');
                setShowAddMalzemeAdi(false); setShowAddMalzemeTuru(false);
                setShowAddBirim(false); setShowAddFirma(false); setShowAddIrsaliye(false);

            } else {
                // ── Çıkış ──
                const amount = Number(formData.get('amount'));
                const verilenBirim = formData.get('verilenBirim') || '';
                const kullanimAlani = formData.get('kullanimAlani') || '';
                const rawRecipient = formData.get('recipient');
                const recipient = rawRecipient === '__NEW__' ? '' : (rawRecipient || '');
                const itemId = String(selectedItemForMove.id);
                const displayDateOut = isBackdated
                    ? new Date(actionDate + 'T12:00:00').toLocaleString('tr-TR')
                    : new Date().toLocaleString();

                const moveBaseData = {
                    itemId: Number(itemId), itemName: selectedItemForMove.name,
                    amount, unit, verilenBirim, recipient, kullanimAlani,
                    note: kullanimAlani, type: 'out', date: displayDateOut,
                };

                if (isBackdated) {
                    const pendingId = String(Date.now());
                    await set(ref(db, `pendingActions/${pendingId}`), {
                        id: Number(pendingId), actionType: 'movement', movementType: 'out',
                        data: moveBaseData,
                        requestedBy: userProfile.name, requestedByUid: authUser.uid,
                        requestedAt: new Date().toLocaleString('tr-TR'), status: 'pending'
                    });
                    showToast('Geçmiş tarihli işlem yönetici onayına gönderildi.', 'success');
                } else {
                    const newQty = selectedItemForMove.quantity - amount;
                    const moveId = String(Date.now());
                    const timeout = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Zaman aşımı.")), 10000)
                    );
                    await Promise.race([
                        set(ref(db, `items/${itemId}/quantity`), Math.max(0, newQty))
                            .then(() => set(ref(db, `movements/${moveId}`), { id: Number(moveId), ...moveBaseData })),
                        timeout
                    ]);
                    triggerCloudBackup();
                }
                setShowMoveModal(false);
                setSelectedItemForMove(null);
                setIsNewRecipient(false);
                setShowAddMalzemeAdi(false); setShowAddMalzemeTuru(false);
                setShowAddBirim(false); setShowAddFirma(false); setShowAddIrsaliye(false);
            }
        } catch (err) {
            alert("İşlem Başarısız: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleQuickAdd = (name) => {
        if (!name.trim()) return;
        setIsSaving(true);
        const id = Date.now();
        const newItem = {
            id: Number(id),
            name: name.trim(),
            unit: 'Adet',
            category: 'Genel',
            quantity: 0,
            minStock: 10
        };
        set(ref(db, `items/${id}`), newItem)
            .then(() => {
                setSelectedItemForMove(newItem);
                setIsQuickAdd(false);
            })
            .catch(err => alert("Hata: " + err.message))
            .finally(() => setIsSaving(false));
    };

    const deleteItem = (id) => {
        if (confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) {
            remove(ref(db, `items/${id}`));
        }
    };

    // ── Request Handlers ──
    const handleCreateRequest = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const reqId = String(Date.now());
        const selectedItem = items.find(i => String(i.id) === formData.get('itemId'));
        const requestData = {
            id: Number(reqId),
            itemId: selectedItem?.id || null,
            itemName: selectedItem?.name || '',
            amount: Number(formData.get('amount')),
            adet: Number(formData.get('adet') || 0),
            unit: formData.get('unit') || selectedItem?.unit || 'Adet',
            note: formData.get('note') || '',
            requestedBy: userProfile.name,
            requestedByUid: authUser.uid,
            status: 'pending',
            date: new Date().toLocaleString(),
        };
        set(ref(db, `requests/${reqId}`), requestData)
            .then(() => setShowRequestModal(false))
            .catch(err => alert('Talep oluşturulamadı: ' + err.message));
    };

    const handleApproveRequest = (req) => {
        set(ref(db, `requests/${req.id}/status`), 'approved');
        set(ref(db, `requests/${req.id}/approvedBy`), userProfile.name);
        set(ref(db, `requests/${req.id}/approvedAt`), new Date().toLocaleString());
    };

    const handleRejectRequest = (req) => {
        if (confirm('Bu talebi reddetmek istiyor musunuz?')) {
            set(ref(db, `requests/${req.id}/status`), 'rejected');
            set(ref(db, `requests/${req.id}/rejectedBy`), userProfile.name);
        }
    };

    const handleDeleteRequest = (req) => {
        if (confirm('Bu talebi silmek istiyor musunuz?')) {
            remove(ref(db, `requests/${req.id}`));
        }
    };

    const handleZimmet = (e) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.target);
        const person = formData.get('person');
        const note = formData.get('note');
        const amount = Number(formData.get('amount') || 1);
        const unit = formData.get('unit') || 'Adet';
        const itemId = String(selectedItemForZimmet.id);
        const actionDate = formData.get('actionDate');
        const timestamp = Date.now();

        // Tarih kontrolü
        const today = new Date().toISOString().split('T')[0];
        const isBackdated = actionDate < today;
        const dateStr = isBackdated
            ? new Date(actionDate + 'T12:00:00').toLocaleString('tr-TR')
            : new Date().toLocaleString('tr-TR');

        if (isBackdated) {
            // Geçmiş tarihli → onaya gönder
            const pendingId = String(timestamp);
            const pendingData = {
                id: Number(pendingId),
                actionType: 'zimmet',
                data: {
                    itemId: Number(itemId),
                    itemName: selectedItemForZimmet.name,
                    person,
                    note,
                    amount,
                    unit,
                    date: dateStr,
                },
                requestedBy: userProfile.name,
                requestedByUid: authUser.uid,
                requestedAt: new Date().toLocaleString('tr-TR'),
                status: 'pending'
            };
            set(ref(db, `pendingActions/${pendingId}`), pendingData)
                .then(() => {
                    setShowZimmetModal(false);
                    setSelectedItemForZimmet(null);
                    showToast('Geçmiş tarihli zimmet yönetici onayına gönderildi.', 'success');
                })
                .catch(err => alert("Hata: " + err.message))
                .finally(() => setIsSaving(false));
            return;
        }

        // Bugünün tarihi → doğrudan kaydet
        const zimmetId = String(timestamp);
        const zimmetData = {
            id: Number(zimmetId),
            itemId: Number(itemId),
            itemName: selectedItemForZimmet.name,
            person,
            note,
            amount,
            unit,
            type: 'verildi',
            status: 'zimmette',
            date: dateStr,
            created_at: timestamp,
            updated_at: timestamp
        };
        set(ref(db, `zimmet/${zimmetId}`), zimmetData)
            .then(() => {
                setShowZimmetModal(false);
                setSelectedItemForZimmet(null);
            })
            .catch(err => alert("Hata: " + err.message))
            .finally(() => setIsSaving(false));
    };

    const handleReturnZimmet = (z) => {
        setIsSaving(true);
        const dateStr = new Date().toLocaleString('tr-TR');
        const timestamp = Date.now();

        const updates = {};
        // 1. Mevcut kaydı kapat (aktif listesinden düşmesi için)
        updates[`zimmet/${z.id}/status`] = 'closed';
        updates[`zimmet/${z.id}/returned_at`] = dateStr;
        updates[`zimmet/${z.id}/updated_at`] = timestamp;

        // 2. Yeni bir "iade" hareket satırı oluştur
        const returnId = timestamp + 1; // Çakışma olmaması için +1
        updates[`zimmet/${returnId}`] = {
            id: returnId,
            itemId: z.itemId,
            itemName: z.itemName,
            person: z.person,
            amount: z.amount,
            type: 'geri_alindi',
            status: 'completed',
            date: dateStr,
            created_at: timestamp,
            updated_at: timestamp
        };

        update(ref(db), updates)
            .catch(err => alert("Hata: " + err.message))
            .finally(() => setIsSaving(false));
    };

    // ── Personel Handlers ──
    const handleSavePersonel = () => {
        if (!personelForm.adSoyad.trim()) return;
        setIsSaving(true);
        const id = editingPersonel ? editingPersonel.id : String(Date.now());
        const data = { id, ...personelForm };
        set(ref(db, `personel/${id}`), data)
            .then(() => {
                setShowPersonelModal(false);
                setEditingPersonel(null);
                setPersonelForm({ tc: '', adSoyad: '', girisTarihi: '', cikisTarihi: '', taseron: '' });
            })
            .finally(() => setIsSaving(false));
    };

    const handleDeletePersonel = (id) => {
        if (!window.confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;
        remove(ref(db, `personel/${id}`));
    };

    const handleNotionSync = async () => {
        setIsSyncingNotion(true);
        try {
            const SPACE_ID = 'ed77c2dd-8d71-811e-9726-000345f99d25';
            const VIEW_ID = '2cd7c2dd-8d71-818b-94b2-000c6c41c3bf';
            const PROXY = 'https://corsproxy.io/?url=';
            const SYNC_URL = PROXY + encodeURIComponent('https://www.notion.so/api/v3/syncRecordValues');

            const postSync = async (requests) => {
                const res = await fetch(SYNC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requests })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            };

            // Step 1: collection_view'dan page_sort listesini al
            const cvData = await postSync([{
                pointer: { table: 'collection_view', id: VIEW_ID, spaceId: SPACE_ID },
                version: -1
            }]);
            const pageIds = cvData.recordMap?.collection_view?.[VIEW_ID]?.value?.page_sort || [];
            if (pageIds.length === 0) throw new Error('Notion sayfasından kayıt listesi alınamadı');

            // Step 2: Sayfaları 50'şer batch ile çek
            const allBlocks = {};
            const BATCH = 50;
            for (let i = 0; i < pageIds.length; i += BATCH) {
                const batch = pageIds.slice(i, i + BATCH);
                const batchData = await postSync(
                    batch.map(pid => ({ pointer: { table: 'block', id: pid, spaceId: SPACE_ID }, version: -1 }))
                );
                Object.assign(allBlocks, batchData.recordMap?.block || {});
            }

            // Step 3: Blokları parse et (bilinen property ID'leri)
            const getVal = (props, key) => {
                if (!props?.[key]) return '';
                const inner = props[key][0];
                if (!inner) return '';
                if (inner[1]?.[0]?.[0] === 'd') return inner[1][0][1]?.start_date || '';
                return inner[0] || '';
            };

            const personelData = {};
            Object.entries(allBlocks).forEach(([bid, bval]) => {
                const b = bval?.value;
                if (b?.type !== 'page') return;
                const props = b.properties || {};
                const adSoyad = props.title?.[0]?.[0]?.trim() || '';
                if (!adSoyad) return;
                personelData[bid] = {
                    id: bid,
                    adSoyad,
                    tc: getVal(props, 'ccs<'),
                    girisTarihi: getVal(props, '?|jG'),
                    cikisTarihi: getVal(props, 'EmCs'),
                    taseron: getVal(props, 'ccf;'),
                };
            });

            if (Object.keys(personelData).length === 0) throw new Error('Notion\'dan hiç kayıt gelmedi');

            await set(ref(db, 'personel'), personelData);
            alert(`✓ ${Object.keys(personelData).length} personel Notion'dan güncellendi.`);
        } catch (err) {
            console.error('Notion sync error:', err);
            alert('Notion\'dan veri alınamadı: ' + err.message);
        } finally {
            setIsSyncingNotion(false);
        }
    };

    const exportPuantajToExcel = () => {
        const aktifPersonel = personel.filter(p => !p.cikisTarihi);
        if (aktifPersonel.length === 0) { alert('Aktif çalışan personel bulunmamaktadır.'); return; }
        const rows = aktifPersonel.map(p => ({
            'TC': p.tc,
            'Ad Soyad': p.adSoyad,
            'Giriş Tarihi': p.girisTarihi,
            'Çıkış Tarihi': p.cikisTarihi || '',
            'Taşeron': p.taseron,
            'Durum': 'Çalışıyor',
            'İmza': ''
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 16 }];
        // Taşeron özeti
        const taseronMap = {};
        aktifPersonel.forEach(p => { taseronMap[p.taseron] = (taseronMap[p.taseron] || 0) + 1; });
        const summaryRows = [[], ['Taşeron Özeti', ''], ...Object.entries(taseronMap).map(([t, c]) => [t + ':', c + ' kişi'])];
        XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: -1 });
        XLSX.utils.book_append_sheet(wb, ws, 'Puantaj');
        const today = new Date().toLocaleDateString('tr-TR').replace(/\//g, '.');
        XLSX.writeFile(wb, `Gunluk_Puantaj_${today}.xlsx`);
    };

    // ── Pending Action Handlers (geçmiş tarihli onay) ──
    const handleApprovePendingAction = (action) => {
        setIsSaving(true);
        const d = action.data;
        const timestamp = Date.now();

        if (action.actionType === 'movement') {
            // Stok miktarı güncelle + hareket kaydı oluştur
            const currentItem = items.find(i => Number(i.id) === Number(d.itemId));
            if (!currentItem) { alert('Malzeme bulunamadı.'); setIsSaving(false); return; }

            const mType = action.movementType || 'in';
            const newQty = mType === 'in'
                ? currentItem.quantity + d.amount
                : currentItem.quantity - d.amount;

            const moveId = String(timestamp);
            const moveData = {
                id: Number(moveId),
                itemId: Number(d.itemId),
                itemName: d.itemName,
                amount: d.amount,
                price: d.price || 0,
                type: mType,
                note: d.note,
                recipient: d.recipient,
                unit: d.unit || 'Adet',
                irsaliyeNo: d.irsaliyeNo || '',
                date: d.date,
            };

            const updates = {};
            updates[`items/${d.itemId}/quantity`] = Math.max(0, newQty);
            updates[`movements/${moveId}`] = moveData;
            updates[`pendingActions/${action.id}/status`] = 'approved';
            updates[`pendingActions/${action.id}/approvedBy`] = userProfile.name;
            updates[`pendingActions/${action.id}/approvedAt`] = new Date().toLocaleString('tr-TR');

            update(ref(db), updates)
                .then(() => showToast('İşlem onaylandı ve sisteme eklendi.'))
                .catch(err => alert("Hata: " + err.message))
                .finally(() => setIsSaving(false));

        } else if (action.actionType === 'zimmet') {
            const zimmetId = String(timestamp);
            const zimmetData = {
                id: Number(zimmetId),
                itemId: Number(d.itemId),
                itemName: d.itemName,
                person: d.person,
                note: d.note,
                amount: d.amount,
                unit: d.unit || 'Adet',
                type: 'verildi',
                status: 'zimmette',
                date: d.date,
                created_at: timestamp,
                updated_at: timestamp
            };

            const updates = {};
            updates[`zimmet/${zimmetId}`] = zimmetData;
            updates[`pendingActions/${action.id}/status`] = 'approved';
            updates[`pendingActions/${action.id}/approvedBy`] = userProfile.name;
            updates[`pendingActions/${action.id}/approvedAt`] = new Date().toLocaleString('tr-TR');

            update(ref(db), updates)
                .then(() => showToast('Zimmet onaylandı ve sisteme eklendi.'))
                .catch(err => alert("Hata: " + err.message))
                .finally(() => setIsSaving(false));
        }
    };

    const handleRejectPendingAction = (action) => {
        if (!confirm('Bu işlemi reddetmek istiyor musunuz?')) return;
        const updates = {};
        updates[`pendingActions/${action.id}/status`] = 'rejected';
        updates[`pendingActions/${action.id}/rejectedBy`] = userProfile.name;
        update(ref(db), updates)
            .then(() => showToast('İşlem reddedildi.', 'error'))
            .catch(err => alert("Hata: " + err.message));
    };

    // ── Sevkiyat Handlers ──
    const showToast = (message, type = 'success') => {
        setSevkiyatToast({ show: true, message, type });
        setTimeout(() => setSevkiyatToast({ show: false, message: '', type: 'success' }), 3500);
    };

    const handleSatisaGonder = async () => {
        const unsent = requests.filter(r => r.status === 'approved' && !r.sevkiyatId);
        if (unsent.length === 0) {
            showToast('Gönderilecek onaylı malzeme yok.', 'error');
            return;
        }

        // ── Shrink to Center Animation ──
        if (satinAlimRef.current && !sevkiyatLoading) {
            satinAlimRef.current.classList.add('shrink-animating');
            // Wait for animation to finish
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        setSevkiyatLoading(true);
        try {
            const sevkId = purchaseFormId;
            const formNo = `AFAD.MT.${new Date().getFullYear()}-${sevkId.slice(-4)}`;
            const talepEdenler = [...new Set(unsent.map(r => r.requestedBy).filter(Boolean))].join(', ');
            const sevkData = {
                id: sevkId,
                satin_alim_form_no: formNo,
                items: unsent,
                talep_eden: talepEdenler,
                sevkiyata_gonderilme_tarihi: new Date().toISOString(),
                sevkiyata_gonderilme_tarihi_tr: new Date().toLocaleDateString('tr-TR'),
                satin_alim_durumu: 'BEKLEMEDE',
                gonderen: userProfile.name,
                created_at: Date.now(),
            };
            await set(ref(db, `sevkiyat/${sevkId}`), sevkData);
            // Her onaylı talebi sevkiyatId ile işaretle
            const updatePromises = unsent.map(req =>
                set(ref(db, `requests/${req.id}/sevkiyatId`), sevkId)
            );
            await Promise.all(updatePromises);

            // Generate NEW ID for the next form
            const newFormId = String(Date.now());
            setPurchaseFormId(newFormId);

            // Show Success Overlay
            setShowSuccessOverlay(true);

            // Wait for 3 seconds, then clear animation and overlay
            setTimeout(() => {
                setShowSuccessOverlay(false);
                if (satinAlimRef.current) {
                    satinAlimRef.current.classList.remove('shrink-animating');
                }
            }, 3000);

        } catch (err) {
            showToast('Hata: ' + err.message, 'error');
            if (satinAlimRef.current) {
                satinAlimRef.current.classList.remove('shrink-animating');
            }
        } finally {
            setSevkiyatLoading(false);
        }
    };

    const handleUpdateItemStatus = async (sevkiyatId, itemIdx, newStatus) => {
        const record = sevkiyat.find(s => s.id === sevkiyatId);
        if (!record) return;

        const newItemStatuses = { ...(record.itemStatuses || {}) };
        newItemStatuses[itemIdx] = newStatus;

        // Calculate new form status
        const items = record.items || [];
        const itemArray = items.map((_, idx) => newItemStatuses[idx] || 'pending');

        let newFormStatus = 'BEKLEMEDE';
        if (itemArray.every(s => s === 'purchased')) {
            newFormStatus = 'SATIN_ALINDI';
        } else if (itemArray.every(s => s === 'purchased' || s === 'cancelled') && itemArray.some(s => s === 'cancelled')) {
            newFormStatus = 'EKSIK_MALZEME';
        }

        try {
            await update(ref(db, `sevkiyat/${sevkiyatId}`), {
                itemStatuses: newItemStatuses,
                satin_alim_durumu: newFormStatus,
                last_updated: Date.now()
            });
            showToast('Malzeme durumu güncellendi.', 'success');
        } catch (err) {
            showToast('Güncelleme hatası: ' + err.message, 'error');
        }
    };

    const handleSevkiyatDurumUpdate = (id, durum) => {
        // Keeping for compatibility with other triggers if any, but now handleUpdateItemStatus is primary
        update(ref(db, `sevkiyat/${id}`), { satin_alim_durumu: durum })
            .catch(err => showToast('Durum güncellenemedi: ' + err.message, 'error'));
    };

    const toggleEksikItem = (index) => {
        setEksikSelectedIndices(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleEksikSave = (sevkiyatId) => {
        if (eksikSelectedIndices.length === 0) {
            showToast('Lütfen en az bir eksik malzeme seçin.', 'error');
            return;
        }
        const record = sevkiyat.find(s => s.id === sevkiyatId);
        const totalItems = (record?.items || []).length;
        const satinAlinanIndices = [];
        for (let i = 0; i < totalItems; i++) {
            if (!eksikSelectedIndices.includes(i)) satinAlinanIndices.push(i);
        }
        update(ref(db, `sevkiyat/${sevkiyatId}`), {
            satin_alim_durumu: 'EKSIK_MALZEME',
            eksik_items: eksikSelectedIndices,
            satin_alinan_items: satinAlinanIndices,
            eksik_isaretlenme_tarihi: new Date().toISOString(),
            satin_alinma_tarihi: satinAlinanIndices.length > 0 ? new Date().toISOString() : null,
        }).then(() => {
            const eksikCount = eksikSelectedIndices.length;
            const alinanCount = satinAlinanIndices.length;
            showToast(`${eksikCount} kalem eksik, ${alinanCount} kalem satın alındı olarak işaretlendi.`, 'success');
            setEksikSelectionMode(false);
            setEksikSelectedIndices([]);
            setSevkiyatModal(prev => prev.data ? ({
                ...prev,
                data: { ...prev.data, satin_alim_durumu: 'EKSIK_MALZEME', eksik_items: eksikSelectedIndices, satin_alinan_items: satinAlinanIndices }
            }) : prev);
        }).catch(err => showToast('Eksik malzeme kaydedilemedi: ' + err.message, 'error'));
    };

    const exportSevkiyatToPDF = (data) => {
        if (!data || data.length === 0) { showToast('Dışa aktarılacak veri yok.', 'error'); return; }
        try {
            const trMap = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U' };
            const fixTR = (t) => t == null ? '' : String(t).replace(/[çÇğĞıİöÖşŞüÜ]/g, m => trMap[m]);
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('Sevkiyat Listesi', 14, 15);
            doc.setFontSize(9);
            doc.text(fixTR(`Olusturulma: ${new Date().toLocaleString('tr-TR')}`), 14, 22);

            const mainRows = data.map(s => [
                fixTR(s.satin_alim_form_no || ''),
                fixTR(s.talep_eden || (s.items || []).map(it => it.requestedBy).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') || ''),
                fixTR(s.sevkiyata_gonderilme_tarihi_tr?.split(' ')[0] || ''),
                fixTR(s.satin_alim_durumu || ''),
                fixTR(s.gonderen || ''),
            ]);
            autoTable(doc, {
                head: [['Form No', 'Talep Eden', 'Gonderilme Tarihi', 'Siparis', 'Satisi Onaylayan']],
                body: mainRows,
                startY: 28,
                styles: { fontSize: 8, font: 'courier', cellPadding: 2 },
                headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [255, 237, 213] },
            });

            // Her sevkiyat için malzeme alt tablosu
            let y = doc.lastAutoTable.finalY + 10;
            data.forEach(s => {
                if (!s.items || s.items.length === 0) return;
                if (y > 240) { doc.addPage(); y = 15; }
                doc.setFontSize(10);
                doc.text(fixTR(`Form: ${s.satin_alim_form_no} — Kalemler`), 14, y);
                y += 3;
                const itemRows = s.items.map(it => [
                    fixTR(it.itemName || ''),
                    it.amount || '',
                    fixTR(it.unit || ''),
                    it.adet || '-',
                    fixTR(it.requestedBy || ''),
                    fixTR(it.note || ''),
                ]);
                autoTable(doc, {
                    head: [['Malzeme', 'Miktar', 'Birim', 'Adet', 'Talep Eden', 'Not']],
                    body: itemRows,
                    startY: y,
                    styles: { fontSize: 7, font: 'courier', cellPadding: 2 },
                    headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255] },
                    margin: { left: 14 },
                });
                y = doc.lastAutoTable.finalY + 8;
            });
            doc.save('Sevkiyat_Listesi.pdf');
        } catch (e) { showToast('PDF hatası: ' + e.message, 'error'); }
    };

    const exportSevkiyatToExcel = (data) => {
        if (!data || data.length === 0) { showToast('Dışa aktarılacak veri yok.', 'error'); return; }
        const wb = XLSX.utils.book_new();
        // Ana liste sheet
        const mainRows = data.map(s => ({
            'Form No': s.satin_alim_form_no || '',
            'Talep Eden': s.talep_eden || (s.items || []).map(it => it.requestedBy).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '',
            'Gönderilme Tarihi': s.sevkiyata_gonderilme_tarihi_tr?.split(' ')[0] || '',
            'Sipariş': s.satin_alim_durumu || '',
            'Satışı Onaylayan': s.gonderen || '',
            'Malzeme Çeşit Sayısı': (s.items || []).length,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mainRows), 'Sevkiyat Listesi');
        // Kalemler sheet
        const itemRows = [];
        data.forEach(s => {
            (s.items || []).forEach(it => {
                itemRows.push({
                    'Form No': s.satin_alim_form_no || '',
                    'Malzeme': it.itemName || '',
                    'Miktar': it.amount || '',
                    'Birim': it.unit || '',
                    'Adet': it.adet || '',
                    'Talep Eden': it.requestedBy || '',
                    'Not': it.note || '',
                });
            });
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemRows), 'Malzeme Kalemleri');
        XLSX.writeFile(wb, 'Sevkiyat_Listesi.xlsx');
    };

    // ── Export Helpers ──
    const exportMovementsToPDF = (movements, filename) => {
        if (!movements || movements.length === 0) { alert("Dışa aktarılacak veri bulunamadı."); return; }
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const trMap = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U' };
            const fixTR = (t) => String(t ?? '').replace(/[çÇğĞıİöÖşŞüÜ]/g, m => trMap[m] || m);
            const now = new Date();
            const ciktTarihi = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

            // Üst bilgi
            doc.setFontSize(13); doc.setTextColor(30, 30, 30);
            doc.text('TUM STOK HAREKETLERI', 14, 14);
            doc.setFontSize(9); doc.setTextColor(60, 60, 60);
            doc.text('FIRMA        : CIZEL INSAAT', 14, 22);
            doc.text('PROJE        : AFADEM', 14, 27);
            doc.text(`CIKTI TARIHI : ${ciktTarihi.toUpperCase()}`, 14, 32);

            // [tarih, malzeme, miktar, birim, kisi, irsaliye]
            const rows = movements.map(m => {
                const isIn = m.normalizedType === 'in';
                const tarih = String(m.date || '').split(',')[0].split(' ')[0];
                const miktar = isIn ? `+${(m.amount || 0).toLocaleString('tr-TR')}` : `-${(m.amount || 0).toLocaleString('tr-TR')}`;
                const kisi = isIn ? (m.firmaAdi || m.recipient || '-') : (m.recipient || m.firmaAdi || '-');
                const irsaliye = isIn ? (m.irsaliyeNo || '-') : (m.kullanimAlani || m.note || '-');
                return [fixTR(tarih), fixTR(m.itemName || '-'), miktar, fixTR(m.unit || '-'), fixTR(kisi), fixTR(irsaliye)];
            });

            autoTable(doc, {
                head: [['Tarih', 'Malzeme', 'Miktar', 'Birim', 'Kisi / Firma', 'Irsaliye No']],
                body: rows,
                startY: 38,
                tableWidth: 182,
                columnStyles: {
                    0: { cellWidth: 22, halign: 'center' },
                    1: { cellWidth: 62, halign: 'center', overflow: 'ellipsize' },
                    2: { cellWidth: 20, halign: 'right' },
                    3: { cellWidth: 16, halign: 'center' },
                    4: { cellWidth: 30, halign: 'center', overflow: 'ellipsize' },
                    5: { cellWidth: 32, halign: 'center', overflow: 'ellipsize' }
                },
                styles: { fontSize: 9, cellPadding: { top: 1.8, bottom: 1.8, left: 3, right: 3 }, textColor: [30, 30, 30], lineColor: [210, 210, 210], lineWidth: 0.2, overflow: 'ellipsize' },
                headStyles: { fillColor: [248, 250, 252], textColor: [80, 80, 80], fontStyle: 'bold', fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, lineWidth: 0.3, lineColor: [190, 190, 190] },
                alternateRowStyles: { fillColor: [255, 255, 255] },
                bodyStyles: { fillColor: [255, 255, 255] },
                margin: { left: 14, right: 14 }
            });

            // Tek malzeme filtreliyse toplam satırı
            const uniqueMaterials = [...new Set(movements.map(m => m.itemName).filter(Boolean))];
            if (uniqueMaterials.length === 1) {
                const total = movements.reduce((sum, m) => {
                    const isIn = m.normalizedType === 'in';
                    return sum + (isIn ? (m.amount || 0) : -(m.amount || 0));
                }, 0);
                const unit = fixTR(movements[0]?.unit || '');
                const finalY = doc.lastAutoTable.finalY + 5;
                const miktarRightX = 118;
                doc.setPage(doc.getNumberOfPages());
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 30, 30);
                doc.text(`Toplam: ${total.toLocaleString('tr-TR')} ${unit}`, miktarRightX, finalY, { align: 'right' });
                doc.setFont(undefined, 'normal');
            }

            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.text(`${i}/${pageCount}`, 196, 290, { align: 'right' });
            }
            doc.save(`${filename || 'Hareket_Kayitlari'}.pdf`);
        } catch (err) {
            console.error(err);
            alert('PDF Olusturma Hatasi: ' + err.message);
        }
    };

    const exportToPDF = (data, title, columns, filename) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            alert("Dışa aktarılacak veri bulunamadı.");
            return;
        }
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const trMap = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U' };
            const fixTR = (t) => String(t ?? '').replace(/[çÇğĞıİöÖşŞüÜ]/g, m => trMap[m] || m);
            
            const now = new Date();
            const ciktTarihi = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

            // Üst bilgi (Matching exportMovementsToPDF)
            doc.setFontSize(13); doc.setTextColor(30, 30, 30);
            doc.text(fixTR(title || 'STOK RAPORU').toUpperCase(), 14, 14);
            doc.setFontSize(9); doc.setTextColor(60, 60, 60);
            doc.text('FIRMA        : CIZEL INSAAT', 14, 22);
            doc.text('PROJE        : AFADEM', 14, 27);
            doc.text(`CIKTI TARIHI : ${ciktTarihi.toUpperCase()}`, 14, 32);

            const tableHeaders = columns.map(col => fixTR(col.label));
            const tableRows = data.map(item =>
                columns.map(col => {
                    const val = item[col.key];
                    if (typeof val === 'number') return val.toLocaleString('tr-TR');
                    return fixTR(val);
                })
            );

            autoTable(doc, {
                head: [tableHeaders],
                body: tableRows,
                startY: 38,
                styles: { 
                    fontSize: 8, 
                    cellPadding: { top: 1.8, bottom: 1.8, left: 3, right: 3 }, 
                    textColor: [30, 30, 30], 
                    lineColor: [210, 210, 210], 
                    lineWidth: 0.2, 
                    overflow: 'ellipsize' 
                },
                headStyles: { 
                    fillColor: [248, 250, 252], 
                    textColor: [80, 80, 80], 
                    fontStyle: 'bold', 
                    fontSize: 8, 
                    cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, 
                    lineWidth: 0.3, 
                    lineColor: [190, 190, 190] 
                },
                alternateRowStyles: { fillColor: [255, 255, 255] },
                margin: { left: 14, right: 14 }
            });

            // Alt bilgi & Sayfa numaraları
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.text(`${i}/${pageCount}`, 196, 290, { align: 'right' });
            }

            doc.save(`${filename || 'rapor'}.pdf`);
        } catch (error) {
            console.error("PDF Generate Exception:", error);
            alert("PDF Oluşturma Hatası: " + error.message);
        }
    };

    const exportToExcelGeneral = async (data, columns, filename) => {
        if (!data || !data.length) { alert('Veri bulunamadı.'); return; }
        
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Rapor');

            const trMap = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U' };
            const fixTR = (t) => String(t ?? '').replace(/[çÇğĞıİöÖşŞüÜ]/g, m => trMap[m] || m);
            const now = new Date();
            const ciktTarihi = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

            // ─── 1. HEADER AREA ───
            worksheet.insertRow(1, [fixTR(filename.replace(/_/g, ' ')).toUpperCase()]);
            worksheet.getRow(1).height = 25;
            worksheet.getRow(1).getCell(1).font = { size: 13, bold: true, color: { argb: 'FF1E293B' } };
            worksheet.mergeCells('A1:F1');

            worksheet.addRow([`FIRMA        : CIZEL INSAAT`]);
            worksheet.addRow([`PROJE        : AFADEM`]);
            worksheet.addRow([`CIKTI TARIHI : ${ciktTarihi.toUpperCase()}`]);
            
            [2, 3, 4].forEach(r => {
                const row = worksheet.getRow(r);
                row.getCell(1).font = { size: 9, color: { argb: 'FF475569' } };
            });
            worksheet.addRow([]); 

            // ─── 2. COLUMN DEFINITIONS ────────────
            worksheet.columns = columns.map(c => {
                let width = 15;
                if (c.key === 'name') width = 45;
                else if (c.key === 'category' || c.key.includes('firma')) width = 25;
                else if (c.key === 'unit') width = 10;
                return { header: c.label, key: c.key, width };
            });

            // ─── 3. TABLE HEADER ────
            const tableStartRow = 6;
            const headerRow = worksheet.getRow(tableStartRow);
            headerRow.values = columns.map(c => c.label);
            headerRow.height = 20;
            headerRow.eachCell(cell => {
                cell.font = { bold: true, size: 9, color: { argb: 'FF505050' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = { 
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };
            });

            // ─── 4. DATA ROWS ───────────────────
            data.forEach((item, idx) => {
                const rowData = columns.map(col => item[col.key]);
                const row = worksheet.addRow(rowData);
                row.height = 18;
                row.eachCell((cell, i) => {
                    const colKey = (columns[i-1]?.key || '').toLowerCase();
                    const isNum = typeof cell.value === 'number';
                    
                    cell.font = { size: 9, color: { argb: 'FF1F1F1F' } };
                    cell.alignment = { 
                        horizontal: colKey.includes('unit') || colKey.includes('birim') ? 'center' : (isNum ? 'right' : 'left'),
                        vertical: 'middle'
                    };
                    
                    if (isNum) cell.numFmt = '#,##0.00';
                    
                    cell.border = { 
                        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                    };
                });
            });

            worksheet.autoFilter = { from: { row: tableStartRow, column: 1 }, to: { row: tableStartRow, column: columns.length } };
            worksheet.views = [{ state: 'frozen', ySplit: tableStartRow, activePane: 'bottomLeft' }];

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `${filename}.xlsx`;
            document.body.appendChild(link); link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(error);
            alert("Excel Olusturma Hatasi.");
        }
    };

    const ExportButtons = ({ data, title, columns, filename, options = {} }) => (
        <div className="export-container">
            <button className="btn-export-sm" onClick={() => exportToExcelGeneral(data, columns, filename, options)}>
                <FileSpreadsheet size={14} className="icon-excel" /> Excel
            </button>
            <button className="btn-export-sm" onClick={() => exportToPDF(data, title, columns, filename)}>
                <Download size={14} className="icon-pdf" /> PDF
            </button>
        </div>
    );

    const backupData = () => {
        const data = JSON.stringify({ items, movements, categories });
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Santiye_Depo_Yedek_${new Date().toLocaleDateString()}.json`;
        link.click();
    };

    const restoreData = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                if (json.items && json.movements) {
                    const itemsObj = {};
                    json.items.forEach(i => itemsObj[i.id] = i);
                    set(ref(db, 'items'), itemsObj);
                    const movesObj = {};
                    json.movements.forEach(m => movesObj[m.id] = m);
                    set(ref(db, 'movements'), movesObj);
                    if (json.categories) set(ref(db, 'categories'), json.categories);
                    alert('Veriler başarıyla buluta yüklendi!');
                }
            } catch (err) {
                alert('Hata: Geçersiz yedek dosyası.');
            }
        };
        reader.readAsText(file);
    };

    const exportMovementsToExcel = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const combined = [
            ...movements.map(m => ({ ...m, category: 'movement', recipient: m.recipient })),
            ...zimmet.map(z => ({ ...z, category: 'zimmet', recipient: z.person }))
        ];

        const filtered = combined.filter(m => {
            const movementTime = m.id;
            return movementTime >= start.getTime() && movementTime <= end.getTime();
        }).sort((a, b) => b.id - a.id);

        const data = filtered.map(m => ({
            'Tarih': m.date,
            'Malzeme': m.itemName,
            'İşlem': m.category === 'zimmet'
                ? (m.type === 'verildi' ? 'Zimmet Verildi' : 'Zimmet İade')
                : (m.type === 'in' ? 'Giriş' : 'Çıkış'),
            'Miktar': m.amount,
            'Alan/Veren': m.recipient || '-',
            'Not': m.note || '-'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Stok Hareketleri");
        XLSX.writeFile(wb, `Hareket_Raporu_${startDate}_${endDate}.xlsx`);
    };

    const exportFilteredStockToExcel = (selectedIds) => {
        const filtered = items.filter(i => selectedIds.includes(i.id));
        const data = filtered.map(i => ({
            'Malzeme Adı': i.name,
            'Kategori': i.category,
            'Birim': i.unit,
            'Mevcut Stok': i.quantity,
            'Kritik Stok': i.minStock,
            'Durum': i.quantity <= i.minStock ? 'Kritik' : 'Normal'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Stok Listesi");
        XLSX.writeFile(wb, "Secili_Stok_Raporu.xlsx");
    };

    const isFirebaseConfigured = Boolean(db?.app?.options?.apiKey) && !String(db.app.options.apiKey).includes("YOUR_API_KEY");

    // ── Auth Guard Renders ──
    if (authLoading) return <LoadingScreen />;
    if (!authUser) {
        if (authView === 'register') {
            return <RegisterScreen onRegister={handleRegister} onSwitchToLogin={() => { setAuthView('login'); setAuthError(''); }} error={authError} loading={authSubmitting} />;
        }
        return <LoginScreen onLogin={handleLogin} onSwitchToRegister={() => { setAuthView('register'); setAuthError(''); }} error={authError} loading={authSubmitting} />;
    }
    if (userProfile && (userProfile.status === 'pending' || userProfile.status === 'rejected')) {
        return <PendingScreen userName={userProfile.name} userStatus={userProfile.status} onSignOut={() => signOut(auth)} />;
    }

    // ── User Management Modal (Admin) ──
    const pendingUsers = allUsers.filter(u => u.status === 'pending');
    const approvedUsers = allUsers.filter(u => u.status === 'approved');
    const rejectedUsers = allUsers.filter(u => u.status === 'rejected');

    // ── Main Render ──
    return (
        <div className="app-shell">

            {/* ── SIDEBAR ── */}
            <aside className={`sidebar${mobileSidebarOpen ? ' mobile-open' : ''}`}>
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="sidebar-logo-icon">S</div>
                    <div>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div className="sidebar-logo-text">Shintea</div>
                            <span style={{ position: 'absolute', bottom: '-2px', right: '-28px', fontSize: '8px', fontWeight: '500', color: 'var(--text-muted)', letterSpacing: '0.2px', opacity: 0.7 }}>v0.051</span>
                        </div>
                    </div>
                </div>

                {/* Connection Status */}
                <div className="sidebar-status-bar">
                    <div className={`status-dot ${isConnected ? 'status-online' : 'status-offline'}`} />
                    <span>{isConnected ? 'Bulut bağlı' : 'Bağlantı yok'}</span>
                </div>

                {/* Quick Actions — Panel'in üstünde */}
                {(pagePerm('action_giris') === 'edit' || pagePerm('action_cikis') === 'edit' || pagePerm('action_zimmet') === 'edit') && (
                    <div className="sidebar-actions">
                        {pagePerm('action_giris') === 'edit' && (
                            <button className="sidebar-action-btn sidebar-action-success"
                                onClick={() => { setMovementType('in'); setSelectedItemForMove(null); setShowMoveModal(true); }}>
                                <ArrowUpRight size={15} /> <span>Giriş Ekle</span>
                                <span className="sidebar-action-badge">{stats.todayIn}</span>
                            </button>
                        )}
                        {pagePerm('action_cikis') === 'edit' && (
                            <button className="sidebar-action-btn sidebar-action-danger"
                                onClick={() => { setMovementType('out'); setSelectedItemForMove(null); setShowMoveModal(true); }}>
                                <ArrowDownLeft size={15} /> <span>Çıkış Ekle</span>
                                <span className="sidebar-action-badge">{stats.todayOut}</span>
                            </button>
                        )}
                        {pagePerm('action_zimmet') === 'edit' && (
                            <button className="sidebar-action-btn sidebar-action-purple"
                                onClick={() => { setShowZimmetModal(true); setSelectedItemForZimmet(null); }}>
                                <UserCheck size={15} /> <span>Zimmet Ekle</span>
                                <span className="sidebar-action-badge">{stats.todayZimmet}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <button
                        className={`nav-item${activeTab === 'dashboard' ? ' active' : ''}`}
                        onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
                    >
                        <LayoutDashboard size={17} /> Panel
                        {canEdit && pendingActions.filter(a => a.status === 'pending').length > 0 && (
                            <span className="nav-badge" style={{ background: 'var(--warning)' }}>{pendingActions.filter(a => a.status === 'pending').length}</span>
                        )}
                    </button>
                    {pagePerm('summary') !== 'none' && (
                        <button
                            className={`nav-item${activeTab === 'summary' ? ' active' : ''}`}
                            onClick={() => { setActiveTab('summary'); setMobileSidebarOpen(false); }}
                        >
                            <BarChart2 size={17} /> Stok Özeti
                            {pagePerm('summary') === 'view' && <Eye size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                        </button>
                    )}
                    {pagePerm('price') !== 'none' && (
                        <button
                            className={`nav-item${activeTab === 'price' ? ' active' : ''}`}
                            onClick={() => { setActiveTab('price'); setMobileSidebarOpen(false); }}
                        >
                            <TrendingUp size={17} /> Fiyat Analizi
                            {pagePerm('price') === 'view' && <Eye size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                        </button>
                    )}
                    {pagePerm('movements') !== 'none' && (
                        <button
                            className={`nav-item${activeTab === 'movements' ? ' active' : ''}`}
                            onClick={() => { setMovementViewType('all'); setActiveTab('movements'); setMobileSidebarOpen(false); }}
                        >
                            <History size={17} /> Tüm Hareketler
                            {pagePerm('movements') === 'view' && <Eye size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                        </button>
                    )}
                    {pagePerm('irsaliyeler') !== 'none' && (
                        <button
                            className={`nav-item${activeTab === 'irsaliyeler' ? ' active' : ''}`}
                            onClick={() => { setActiveTab('irsaliyeler'); setMobileSidebarOpen(false); }}
                        >
                            <FileText size={17} /> İrsaliyeler
                            {pagePerm('irsaliyeler') === 'view' && <Eye size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                        </button>
                    )}
                    {/* PASIF: Malzeme Talep - aktif etmek için bu yorum bloğunu kaldır
                    <button
                        className={`nav-item${activeTab === 'requests' ? ' active' : ''}`}
                        onClick={() => { setActiveTab('requests'); setMobileSidebarOpen(false); }}
                    >
                        <ClipboardList size={17} /> Malzeme Talep
                        {pendingRequestsCount > 0 && (
                            <span className="nav-badge">{pendingRequestsCount}</span>
                        )}
                    </button>
                    */}

                    {/* PASIF: Puantaj - aktif etmek için bu yorum bloğunu kaldır
                    <button
                        className={`nav-item${activeTab === 'puantaj' ? ' active' : ''}`}
                        onClick={() => { setActiveTab('puantaj'); setMobileSidebarOpen(false); }}
                    >
                        <Users size={17} /> Puantaj
                        {personel.filter(p => !p.cikisTarihi).length > 0 && (
                            <span className="nav-badge" style={{ background: '#0891b2' }}>
                                {personel.filter(p => !p.cikisTarihi).length}
                            </span>
                        )}
                    </button>
                    */}

                    {pagePerm('zimmet') !== 'none' && (
                        <button
                            className={`nav-item${activeTab === 'zimmet' ? ' active' : ''}`}
                            onClick={() => { setActiveTab('zimmet'); setMobileSidebarOpen(false); setZimmetView('active'); }}
                        >
                            <UserCheck size={17} /> Zimmet
                            {zimmet.filter(z => z.status === 'zimmette').length > 0 && (
                                <span className="nav-badge" style={{ background: '#4f46e5' }}>
                                    {zimmet.filter(z => z.status === 'zimmette').length}
                                </span>
                            )}
                            {pagePerm('zimmet') === 'view' && <Eye size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                        </button>
                    )}

                    {/* PASIF: Satın Alım - aktif etmek için bu yorum bloğunu kaldır
                    <button
                        ref={sevkiyatNavItemRef}
                        className={`nav-item${activeTab === 'sevkiyat' ? ' active' : ''}`}
                        onClick={() => { setActiveTab('sevkiyat'); setMobileSidebarOpen(false); }}
                    >
                        <Truck size={17} /> Satın Alım
                        {sevkiyat.length > 0 && (
                            <span className="nav-badge" style={{ background: '#64748b' }}>
                                {sevkiyat.length}
                            </span>
                        )}
                    </button>
                    */}
                    {/* PASIF: Siparişler - aktif etmek için bu yorum bloğunu kaldır
                    <button
                        className={`nav-item${activeTab === 'siparisler' ? ' active' : ''}`}
                        onClick={() => { setActiveTab('siparisler'); setMobileSidebarOpen(false); }}
                    >
                        <Package size={17} /> Siparişler
                        {(siparislerData.satinAlinan.length + siparislerData.eksikler.length) > 0 && (
                            <span className="nav-badge" style={{ background: '#64748b' }}>
                                {siparislerData.satinAlinan.length + siparislerData.eksikler.length}
                            </span>
                        )}
                    </button>
                    */}

                    {canEdit && (
                        <button
                            className={`nav-item${activeTab === 'users' ? ' active' : ''}`}
                            onClick={() => { setActiveTab('users'); setMobileSidebarOpen(false); }}
                        >
                            <Users size={17} /> Kullanıcılar
                            {pendingUsers.length > 0 && (
                                <span className="nav-badge">{pendingUsers.length}</span>
                            )}
                        </button>
                    )}

                    <div className="sidebar-divider" />

                    {canEdit && (
                        <button
                            className={`nav-item${activeTab === 'settings' ? ' active' : ''}`}
                            onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false); }}
                        >
                            <Settings size={17} /> Ayarlar
                        </button>
                    )}
                </nav>

                {/* User Section */}
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {userProfile.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{userProfile.name}</div>
                        <div className="sidebar-user-role">{ROLE_LABELS[userProfile.role] || userProfile.role}</div>
                    </div>
                    <button className="sidebar-logout-btn" onClick={handleSignOut} title="Çıkış Yap">
                        <LogOut size={15} />
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileSidebarOpen && (
                <div className="sidebar-overlay active" onClick={() => setMobileSidebarOpen(false)} />
            )}

            {/* ── MAIN CONTENT ── */}
            <div className="main-content">

                {/* Mobile top bar */}
                <header className="mobile-header">
                    <div className="mobile-header-brand">
                        <div className="sidebar-logo-icon" style={{ width: 28, height: 28, fontSize: 14, borderRadius: 8 }}>S</div>
                        <span className="mobile-header-logo-text">Shintea</span>
                    </div>
                    <button
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6 }}
                        onClick={() => setMobileSidebarOpen(true)}
                    >
                        <Menu size={22} />
                    </button>
                </header>

                <div className="page-content animate-fade">

                    {!isFirebaseConfigured && (
                        <div className="firebase-warning">
                            <strong>Dikkat:</strong> Firebase bağlantısı henüz kurulmadı.
                        </div>
                    )}

                    {/* ── BACK BUTTON (tüm sayfalarda dashboard hariç) ── */}
                    {activeTab !== 'dashboard' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '7px 14px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-muted)',
                                    fontSize: '13px', fontWeight: '500',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'border-color 0.15s, color 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            >
                                <ChevronLeft size={15} /> Geri Dön
                            </button>
                        </div>
                    )}

                    {/* ── DASHBOARD TAB ── */}
                    {activeTab === 'dashboard' && (
                        <>


                            {/* Pending Actions — Onay Bekleyen Geçmiş Tarihli İşlemler */}
                            {canEdit && pendingActions.filter(a => a.status === 'pending').length > 0 && (
                                <div className="table-card animate-fade mb-4">
                                    <div className="table-toolbar">
                                        <span className="section-title"><Clock size={17} /> Onay Bekleyen İşlemler</span>
                                        <div className="flex align-center gap-2">
                                            <span className="movement-type-pill out">{pendingActions.filter(a => a.status === 'pending').length} bekleyen</span>
                                            <ExportButtons
                                                data={pendingActions.filter(a => a.status === 'pending').map(a => ({
                                                    tarih: String(a.data?.date || '').split(',')[0].split(' ')[0],
                                                    tur: a.actionType === 'zimmet' ? 'Zimmet' : (a.movementType === 'in' ? 'Giriş' : 'Çıkış'),
                                                    malzeme: a.data?.itemName || '',
                                                    miktar: a.data?.amount || 0,
                                                    talep: a.data?.person || a.data?.recipient || '-'
                                                }))}
                                                title="Onay Bekleyen İşlemler"
                                                columns={[
                                                    { key: 'tarih', label: 'Tarih' },
                                                    { key: 'tur', label: 'İşlem Türü' },
                                                    { key: 'malzeme', label: 'Malzeme' },
                                                    { key: 'miktar', label: 'Miktar' },
                                                    { key: 'talep', label: 'Talep Eden' }
                                                ]}
                                                filename="Onay_Bekleyen_Islemler"
                                            />
                                        </div>
                                    </div>
                                    <div className="table-responsive-wrapper">
                                        <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                            <colgroup>
                                                <col className="col-tarih" />
                                                <col className="col-kategori" />
                                                <col className="col-malzeme" />
                                                <col className="col-miktar" />
                                                <col className="col-firma" />
                                                <col className="col-islem" />
                                            </colgroup>
                                            <thead>
                                                <tr>
                                                    <th style={{ border: '1px solid var(--border)' }}>TARİH</th>
                                                    <th style={{ border: '1px solid var(--border)' }}>TÜR</th>
                                                    <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>MİKTAR</th>
                                                    <th style={{ border: '1px solid var(--border)' }}>TALEP EDEN</th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>İŞLEMLER</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingActions.filter(a => a.status === 'pending').map(action => {
                                                    const typeLabel = action.actionType === 'zimmet' ? 'Zimmet'
                                                        : action.movementType === 'in' ? 'Giriş' : 'Çıkış';
                                                    const pillClass = action.actionType === 'zimmet' ? 'out'
                                                        : action.movementType === 'in' ? 'in' : 'out';
                                                    return (
                                                        <tr key={action.id}>
                                                            <td data-label="Tarih" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{String(action.data?.date || '').split(',')[0].split(' ')[0]}</td>
                                                            <td data-label="Tür" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                                <span className={`movement-type-pill ${pillClass}`}>{typeLabel}</span>
                                                            </td>
                                                            <td data-label="Malzeme" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>{action.data?.itemName}</td>
                                                            <td data-label="Miktar" style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                                <strong>{action.data?.amount}</strong>
                                                            </td>
                                                            <td data-label="Talep Eden" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{action.requestedBy}</td>
                                                            <td data-label="İşlemler" style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                                <div className="flex gap-2 justify-center">
                                                                    <button
                                                                        className="btn-primary"
                                                                        onClick={() => handleApprovePendingAction(action)}
                                                                        style={{ background: 'var(--success)', fontSize: '11px', padding: '5px 12px' }}
                                                                        disabled={isSaving}
                                                                    >
                                                                        <Check size={14} /> Onayla
                                                                    </button>
                                                                    <button
                                                                        className="btn-primary"
                                                                        onClick={() => handleRejectPendingAction(action)}
                                                                        style={{ background: 'var(--danger)', fontSize: '11px', padding: '5px 12px' }}
                                                                    >
                                                                        <X size={14} /> Reddet
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Birleşik Hareketler Listesi */}
                            {(() => {
                                const filterBg = { all: 'var(--accent)', in: 'var(--success)', out: 'var(--danger)', zimmet: '#4f46e5' };
                                const filterShadow = { all: '0 4px 0 #1d4ed8,0 5px 8px rgba(0,0,0,0.15)', in: '0 4px 0 #0f7634,0 5px 8px rgba(0,0,0,0.15)', out: '0 4px 0 #991b1b,0 5px 8px rgba(0,0,0,0.15)', zimmet: '0 4px 0 #3730a3,0 5px 8px rgba(0,0,0,0.15)' };
                                const inactiveShadow = '0 3px 0 rgba(0,0,0,0.12),0 4px 5px rgba(0,0,0,0.07)';
                                const allActive = dashboardFilters.has('in') && dashboardFilters.has('out') && dashboardFilters.has('zimmet');
                                const toggleFilter = (val) => {
                                    if (val === 'all') {
                                        setDashboardFilters(allActive ? new Set() : new Set(['in', 'out', 'zimmet']));
                                    } else {
                                        setDashboardFilters(prev => {
                                            const next = new Set(prev);
                                            if (next.has(val)) next.delete(val); else next.add(val);
                                            return next;
                                        });
                                    }
                                };
                                const combined = allMovementsSorted.filter(m => {
                                    if (m.category === 'movement' && m.normalizedType === 'in') return dashboardFilters.has('in');
                                    if (m.category === 'movement' && m.normalizedType === 'out') return dashboardFilters.has('out');
                                    if (m.category === 'zimmet') return dashboardFilters.has('zimmet');
                                    return false;
                                }).slice(0, 20);
                                return (
                                    <div className="table-card">
                                        {/* SON HAREKETLER Başlık */}
                                        <div style={{ padding: '10px 16px 6px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Son Hareketler</span>
                                        </div>
                                        {/* Dashboard Action Bar */}
                                        {(() => {
                                            const dashSelKeys = tblSelKeys('dash');
                                            const dashSelRows = combined.filter(m => dashSelKeys.includes(`${m.category}-${m.id}`));
                                            const dashAllSelected = combined.length > 0 && combined.every(m => isRowSel('dash', `${m.category}-${m.id}`));
                                            return isAdmin && tblSelCount('dash') > 0 ? (
                                                <div style={{ padding: '0 12px 6px' }}>
                                                    <TableActionBar
                                                        count={tblSelCount('dash')}
                                                        totalCount={combined.length}
                                                        allSelected={dashAllSelected}
                                                        onSelectAll={() => selectAllTbl('dash', combined.map(m => `${m.category}-${m.id}`))}
                                                        onDelete={() => openBulkDel('dash_mixed', dashSelRows)}
                                                        onEdit={() => { if (dashSelRows.length === 1) { const m = dashSelRows[0]; setEditRow({ row: m, collection: m.category === 'zimmet' ? 'zimmet' : 'movements' }); } }}
                                                        onHighlight={() => openHLPicker('dash', dashSelKeys)}
                                                    />
                                                </div>
                                            ) : null;
                                        })()}
                                        {/* Tablo */}
                                        <div className="table-responsive-wrapper dash-unified-wrap">
                                            <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                                <colgroup>
                                                    <col style={{ width: '36px' }} />
                                                    <col className="col-tarih" />
                                                    <col className="col-firma" />
                                                    <col className="col-detay" />
                                                    <col className="col-malzeme" />
                                                    <col className="col-miktar" />
                                                    <col className="col-birim" />
                                                    <col style={{ width: '110px' }} />
                                                </colgroup>
                                                <thead>
                                                    <tr>
                                                        <th style={{ ...CB_TH, border: '1px solid var(--border)' }}></th>
                                                        <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>TARİH</th>
                                                        <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>FİRMA ADI</th>
                                                        <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>İRSALİYE NO</th>
                                                        <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>MALZEME</th>
                                                        <th style={{ textAlign: 'right',  border: '1px solid var(--border)' }}>MİKTAR</th>
                                                        <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>BİRİM</th>
                                                        <th style={{ textAlign: 'right',  border: '1px solid var(--border)' }}>BİRİM FİYAT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {combined.length === 0 ? (
                                                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Kayıt bulunamadı.</td></tr>
                                                    ) : combined.map(m => {
                                                        const isIn = m.category === 'movement' && m.normalizedType === 'in';
                                                        const isOut = m.category === 'movement' && m.normalizedType === 'out';
                                                        const tipColor = isIn ? 'var(--success)' : isOut ? 'var(--danger)' : (m.type === 'geri_alindi' ? 'var(--success)' : '#4f46e5');
                                                        const miktar = isIn ? `+${formatNumber(m.amount)}` : isOut ? `−${formatNumber(m.amount)}` : (m.type === 'geri_alindi' ? `+${formatNumber(m.amount)}` : `−${formatNumber(m.amount)}`);
                                                        const firmaAdi = isIn ? (m.firmaAdi || '—') : isOut ? (m.recipient || '—') : (m.person || '—');
                                                        const irsaliyeNo = isIn ? (m.irsaliyeNo || '—') : (m.kullanimAlani || m.note || '—');
                                                        const birimFiyat = (isIn && m.birimFiyat) ? `${formatNumber(m.birimFiyat)} ₺` : '—';
                                                        const tarih = String(m.date || '').split(',')[0].split(' ')[0];
                                                        const cellStyle = { textAlign: 'center', verticalAlign: 'middle', border: '1px solid var(--border)' };
                                                        const rowKey = `${m.category}-${m.id}`;
                                                        return (
                                                            <tr key={rowKey} style={{ borderLeft: `4px solid ${tipColor}`, ...hlRowStyle('dash', rowKey) }} onContextMenu={isAdmin ? (e) => handleCtxMenu(e, m, m.category === 'zimmet' ? 'zimmet' : 'movements') : undefined}>
                                                                <td style={{ ...CB_TD, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                                    <input type="checkbox" style={CB_STYLE} checked={isRowSel('dash', rowKey)} onChange={() => toggleSel('dash', rowKey)} />
                                                                </td>
                                                                <td data-label="Tarih" style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{tarih}</td>
                                                                <td data-label="Firma Adı" style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{firmaAdi}</td>
                                                                <td data-label="İrsaliye No" style={{ ...cellStyle, fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{irsaliyeNo}</td>
                                                                <td data-label="Malzeme" style={{ ...cellStyle, fontWeight: '600' }}>{m.itemName}</td>
                                                                <td data-label="Miktar" style={{ color: tipColor, fontWeight: '700', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{miktar}</td>
                                                                <td data-label="Birim" style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{m.unit || '—'}</td>
                                                                <td data-label="Birim Fiyat" style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap', fontSize: '12px' }}>{birimFiyat}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    )}

                    {/* ── SUMMARY TAB ── */}
                    {activeTab === 'summary' && pagePerm('summary') === 'none' && (
                        <div className="table-card animate-fade" style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <Shield size={36} style={{ color: '#cbd5e1', marginBottom: '14px' }} />
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Erişim Yetkiniz Yok</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Bu sayfayı görüntüleme yetkiniz bulunmuyor. Yöneticinizle iletişime geçin.</div>
                        </div>
                    )}
                    {activeTab === 'summary' && pagePerm('summary') !== 'none' && (
                        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

                            {/* ── MASTER / DETAIL ── */}
                            {(() => {
                                const allItemNames = [...new Set(items.map(i => i.name))].sort((a, b) => a.localeCompare(b, 'tr'));
                                const allCategories = [...new Set(items.map(i => i.category || '').filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));

                                const selRow = summarySelected && stockSummary.find(r => r.id === summarySelected.id)
                                    ? stockSummary.find(r => r.id === summarySelected.id)
                                    : stockSummary[0] || null;

                                const statusMeta = (status) => ({
                                    critical: { label: 'KRİTİK',  color: '#ef4444', bg: '#fef2f2', barColor: '#ef4444' },
                                    warning:  { label: 'AZALIYOR', color: '#f59e0b', bg: '#fffbeb', barColor: '#f59e0b' },
                                    healthy:  { label: 'NORMAL',   color: '#10b981', bg: '#ecfdf5', barColor: '#10b981' },
                                    surplus:  { label: 'FAZLA',    color: '#10b981', bg: '#ecfdf5', barColor: '#10b981' },
                                    inactive: { label: 'ATIL',     color: '#94a3b8', bg: '#f8fafc', barColor: '#94a3b8' },
                                }[status] || { label: 'BELİRSİZ', color: '#94a3b8', bg: '#f8fafc', barColor: '#94a3b8' });

                                return (
                                    <>
                                    {/* ── HEADER ROW: başlık (sol) + filtreler + chips (sağ) ── */}
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 0', flexShrink: 0 }}>
                                        {/* Sol: başlık — 300px, sol panel ile hizalı */}
                                        <div style={{ width: '300px', flexShrink: 0 }}>
                                            <h1 className="summary-title" style={{ fontSize: '18px', margin: 0 }}>Stok Özeti</h1>
                                        </div>
                                        {/* Sağ: filtreler + chips + export — sağ panelle hizalı */}
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                                            {/* Filtreler: sabit genişlikte container */}
                                            <div style={{ display: 'flex', gap: '6px', width: '240px', flexShrink: 0 }}>
                                                <MultiSelectDropdown
                                                    label="Malzeme"
                                                    options={allItemNames}
                                                    selected={summaryFilterNames}
                                                    onChange={setSummaryFilterNames}
                                                />
                                                <MultiSelectDropdown
                                                    label="Kategori"
                                                    options={allCategories}
                                                    selected={summaryFilterCategories}
                                                    onChange={setSummaryFilterCategories}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: '#f1f5f9', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{summaryStats.totalProducts}</span>
                                                <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Malzeme</span>
                                            </div>
                                            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                                                <ExportButtons
                                                    data={stockSummary}
                                                    title="Stok Özeti Raporu"
                                                    columns={[
                                                        { key: 'name', label: 'MALZEME' },
                                                        { key: 'category', label: 'KATEGORİ' },
                                                        { key: 'totalReceived', label: 'TOPLAM GİRİŞ' },
                                                        { key: 'totalUsed', label: 'TOPLAM ÇIKIŞ' },
                                                        { key: 'quantity', label: 'BAKİYE' },
                                                        { key: 'unit', label: 'BİRİM' }
                                                    ]}
                                                    filename={`Stok_Ozeti_${new Date().toLocaleDateString('tr-TR')}`}
                                                    options={{ showKpis: true }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0 }}>
                                        {/* ── SOL: LİSTE ── */}
                                        <div style={{ width: '300px', flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                            {/* Arama — tam genişlik */}
                                            <div className="search-container" style={{ margin: 0, borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--border)' }}>
                                                <Search size={13} className="search-icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Malzeme ara..."
                                                    className="search-input search-input-full"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>

                                            {/* Liste */}
                                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                                {stockSummary.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>Sonuç bulunamadı</div>
                                                ) : stockSummary.map(row => {
                                                    const sm = statusMeta(row.status);
                                                    const isSel = selRow?.id === row.id;
                                                    return (
                                                        <button
                                                            key={row.id}
                                                            onClick={() => setSummarySelected(row)}
                                                            onContextMenu={isAdmin ? (e) => handleCtxMenu(e, row, 'items') : undefined}
                                                            style={{
                                                                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                                                                gap: '10px', padding: '9px 12px',
                                                                background: isSel ? '#1e293b' : 'transparent',
                                                                cursor: 'pointer', border: 'none', borderBottom: '1px solid var(--border)',
                                                                transition: 'background 0.12s',
                                                            }}
                                                            onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                                            onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? '#1e293b' : 'transparent'; }}
                                                        >
                                                            <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '2px', background: isSel ? '#94a3b8' : sm.barColor, flexShrink: 0 }} />
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: '12px', fontWeight: 600, color: isSel ? '#f1f5f9' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
                                                                <div style={{ fontSize: '10px', color: isSel ? '#94a3b8' : 'var(--text-muted)', marginTop: '1px' }}>{row.category || '—'}</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: isSel ? '#e2e8f0' : sm.color }}>{formatNumber(row.quantity)}</div>
                                                                <div style={{ fontSize: '10px', color: isSel ? '#94a3b8' : 'var(--text-muted)' }}>{row.unit}</div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* ── SAĞ: DETAY PANELİ ── */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {selRow ? (() => {
                                                const sm = statusMeta(selRow.status);
                                                const occupancy = selRow.minStock > 0 ? Math.min(100, Math.round((selRow.quantity / (selRow.minStock * 3)) * 100)) : Math.min(100, Math.round((selRow.quantity / Math.max(selRow.totalReceived, 1)) * 100));
                                                const depoMiktar = selRow.quantity - selRow.zimmetteCount;
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {/* Başlık Kartı */}
                                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px 24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                                                <div>
                                                                    {selRow.category && (
                                                                        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '20px', background: 'var(--bg-hover)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'inline-block', marginBottom: '8px' }}>{selRow.category}</span>
                                                                    )}
                                                                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.3 }}>{selRow.name}</h2>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                                                                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: sm.bg, color: sm.color }}>{sm.label}</span>
                                                                    <button className="btn-icon" title="Düzenle" onClick={() => { setEditingItem(selRow); setShowModal(true); }}><Edit3 size={14} /></button>
                                                                    {isAdmin && <button className="btn-icon" title="Sil" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteItem(selRow.id)}><Trash2 size={14} /></button>}
                                                                </div>
                                                            </div>

                                                            {/* Büyük Stok Göstergesi */}
                                                            <div style={{ marginTop: '20px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stok Seviyesi</span>
                                                                    <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{formatNumber(selRow.quantity)} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>{selRow.unit}</span></span>
                                                                </div>
                                                                <div style={{ width: '100%', height: '10px', background: 'var(--bg-hover)', borderRadius: '5px', overflow: 'hidden' }}>
                                                                    <div style={{ height: '100%', width: `${occupancy}%`, background: sm.barColor, borderRadius: '5px', transition: 'width 0.6s ease' }} />
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                                    <span>Min. eşik: {formatNumber(selRow.minStock || 0)} {selRow.unit}</span>
                                                                    <span>{occupancy}% dolu</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* İstatistik Kartları */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                                            {[
                                                                { label: 'Toplam Giriş', val: formatNumber(selRow.totalReceived), sub: selRow.unit, color: '#10b981', bg: '#ecfdf5', onClick: () => setDetailModal({ show: true, item: selRow, type: 'in' }) },
                                                                { label: 'Toplam Çıkış', val: formatNumber(selRow.totalUsed),    sub: selRow.unit, color: '#ef4444', bg: '#fef2f2', onClick: () => setDetailModal({ show: true, item: selRow, type: 'out' }) },
                                                                { label: 'Depoda Net',   val: formatNumber(depoMiktar),          sub: selRow.unit, color: '#3b82f6', bg: '#eff6ff', onClick: null },
                                                                { label: 'Zimmette',     val: formatNumber(selRow.zimmetteCount), sub: selRow.unit, color: '#8b5cf6', bg: '#f5f3ff', onClick: null },
                                                            ].map(s => (
                                                                <div
                                                                    key={s.label}
                                                                    onClick={s.onClick || undefined}
                                                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', cursor: s.onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
                                                                    onMouseEnter={e => { if (s.onClick) e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                                                                >
                                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{s.label}</div>
                                                                    <div style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.val}</div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Alt Detay Satırı */}
                                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 20px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                                                            <div>
                                                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Son Hareket</div>
                                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{selRow.lastMove ? selRow.lastMove.toLocaleDateString('tr-TR') : '—'}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min. Stok</div>
                                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{formatNumber(selRow.minStock || 0)} {selRow.unit}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hareket Sayısı</div>
                                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{selRow.movements?.length || 0} kayıt</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stok Durumu</div>
                                                                <div style={{ fontSize: '13px', fontWeight: 600, color: sm.color, marginTop: '4px' }}>{sm.label}</div>
                                                            </div>
                                                        </div>

                                                        {/* Kasım 1'den Bugüne Grafik */}
                                                        {(() => {
                                                            const today = new Date(); today.setHours(23,59,59,999);
                                                            const from = new Date(2025, 10, 1); from.setHours(0,0,0,0); // Kasım 1, 2025
                                                            const totalDays = Math.round((today - from) / (1000 * 60 * 60 * 24)) + 1;
                                                            const days = Array.from({ length: totalDays }, (_, i) => {
                                                                const d = new Date(from); d.setDate(d.getDate() + i);
                                                                return d;
                                                            });
                                                            const lastIdx = totalDays - 1;
                                                            // Gün bazında giriş/çıkış
                                                            const dayMap = {};
                                                            (selRow.movements || []).forEach(m => {
                                                                const d = parseTrDate(m.date);
                                                                if (!d || d < from || d > today) return;
                                                                const key = d.toISOString().split('T')[0];
                                                                if (!dayMap[key]) dayMap[key] = 0;
                                                                dayMap[key] += m.type === 'in' ? (Number(m.amount) || 0) : -(Number(m.amount) || 0);
                                                            });
                                                            // Kasım 1 öncesindeki stok = mevcut stok - dönem içi toplam değişim
                                                            const periodChange = Object.values(dayMap).reduce((s, v) => s + v, 0);
                                                            let running = selRow.quantity - periodChange;
                                                            const points = days.map(d => {
                                                                const key = d.toISOString().split('T')[0];
                                                                running += (dayMap[key] || 0);
                                                                return { date: d, val: running };
                                                            });
                                                            const vals = points.map(p => p.val);
                                                            const minV = Math.min(...vals);
                                                            const maxV = Math.max(...vals);
                                                            const range = maxV - minV || 1;
                                                            const W = 600, H = 80, PAD = 8;
                                                            const toX = i => PAD + (i / lastIdx) * (W - PAD * 2);
                                                            const toY = v => H - PAD - ((v - minV) / range) * (H - PAD * 2);
                                                            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.val).toFixed(1)}`).join(' ');
                                                            const areaD = `${pathD} L${toX(lastIdx).toFixed(1)},${H} L${toX(0).toFixed(1)},${H} Z`;
                                                            const hasData = (selRow.movements || []).some(m => { const d = parseTrDate(m.date); return d && d >= from && d <= today; });
                                                            return (
                                                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kasım'dan Bugüne Stok Değişimi</span>
                                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{periodChange >= 0 ? '+' : ''}{formatNumber(periodChange)} {selRow.unit}</span>
                                                                    </div>
                                                                    {!hasData ? (
                                                                        <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>Bu dönemde hareket yok</div>
                                                                    ) : (
                                                                        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '80px', display: 'block' }}>
                                                                            <defs>
                                                                                <linearGradient id={`grad-${selRow.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                                    <stop offset="0%" stopColor={sm.barColor} stopOpacity="0.25" />
                                                                                    <stop offset="100%" stopColor={sm.barColor} stopOpacity="0" />
                                                                                </linearGradient>
                                                                            </defs>
                                                                            <path d={areaD} fill={`url(#grad-${selRow.id})`} />
                                                                            <path d={pathD} fill="none" stroke={sm.barColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                            {/* İlk ve son değer etiketleri */}
                                                                            <text x={toX(0)} y={toY(points[0].val) - 5} fontSize="9" fill="var(--text-muted)" textAnchor="middle">{formatNumber(points[0].val)}</text>
                                                                            <text x={toX(lastIdx)} y={toY(points[lastIdx].val) - 5} fontSize="9" fill={sm.barColor} textAnchor="middle" fontWeight="700">{formatNumber(points[lastIdx].val)}</text>
                                                                        </svg>
                                                                    )}
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                                                        <span>{from.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                                                        <span>{today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                );
                                            })() : (
                                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', gap: '10px' }}>
                                                    <Package size={40} style={{ opacity: 0.15 }} />
                                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Detay görmek için bir malzeme seçin</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* ── ZİMMET TAB ── */}
                    {activeTab === 'zimmet' && pagePerm('zimmet') === 'none' && (
                        <div className="table-card animate-fade" style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <Shield size={36} style={{ color: '#cbd5e1', marginBottom: '14px' }} />
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Erişim Yetkiniz Yok</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Bu sayfayı görüntüleme yetkiniz bulunmuyor. Yöneticinizle iletişime geçin.</div>
                        </div>
                    )}
                    {activeTab === 'zimmet' && pagePerm('zimmet') !== 'none' && (
                        <div className="table-card animate-fade" style={{ minHeight: '400px' }}>
                            <div className="table-toolbar">
                                <div className="flex align-center gap-3">
                                    <span className="section-title"><UserCheck size={17} /> Zimmet Yönetimi</span>
                                    <div className="tab-pill-container" style={{ marginLeft: '12px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
                                        <button
                                            className={zimmetView === 'active' ? 'tab-pill active' : 'tab-pill'}
                                            onClick={() => setZimmetView('active')}
                                            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', background: zimmetView === 'active' ? 'white' : 'transparent', color: zimmetView === 'active' ? '#4f46e5' : '#64748b', boxShadow: zimmetView === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                        >
                                            Aktif Zimmetler
                                        </button>
                                        <button
                                            className={zimmetView === 'history' ? 'tab-pill active' : 'tab-pill'}
                                            onClick={() => setZimmetView('history')}
                                            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', background: zimmetView === 'history' ? 'white' : 'transparent', color: zimmetView === 'history' ? '#4f46e5' : '#64748b', boxShadow: zimmetView === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                        >
                                            Zimmet Geçmişi
                                        </button>
                                    </div>
                                </div>
                                <div className="table-toolbar-right">
                                    <ExportButtons
                                        data={zimmet.filter(z =>
                                            (zimmetView === 'active' ? z.status === 'zimmette' : true) &&
                                            (z.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || z.person.toLowerCase().includes(searchQuery.toLowerCase()))
                                        )}
                                        title={zimmetView === 'active' ? "Aktif Zimmet Listesi" : "Zimmet Hareketleri"}
                                        columns={zimmetView === 'active' ? [
                                            { key: 'itemName', label: 'MALZEME' },
                                            { key: 'person', label: 'KIŞI/EKIP' },
                                            { key: 'amount', label: 'MIKTAR' },
                                            { key: 'date', label: 'TARİH' }
                                        ] : [
                                            { key: 'itemName', label: 'MALZEME' },
                                            { key: 'person', label: 'KIŞI/EKIP' },
                                            { key: 'amount', label: 'MIKTAR' },
                                            { key: 'date', label: 'TARİH' },
                                            { key: 'type', label: 'İŞLEM' }
                                        ]}
                                        filename={zimmetView === 'active' ? "Aktif_Zimmet" : "Zimmet_Gecmisi"}
                                    />
                                    <div className="search-container">
                                        <Search size={15} className="search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Malzeme veya kişi ara..."
                                            className="search-input"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            {(() => {
                                const zimFiltered = zimmet.filter(z =>
                                    (zimmetView === 'active' ? z.status === 'zimmette' : true) &&
                                    (z.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || z.person.toLowerCase().includes(searchQuery.toLowerCase()))
                                ).sort((a, b) => (b.updated_at || b.created_at || b.id || 0) - (a.updated_at || a.created_at || a.id || 0));
                                const zimSelKeys = tblSelKeys('zimmet');
                                const zimSelRows = zimFiltered.filter(z => zimSelKeys.includes(String(z.id)));
                                const zimAllSel = zimFiltered.length > 0 && zimFiltered.every(z => isRowSel('zimmet', z.id));
                                return isAdmin && tblSelCount('zimmet') > 0 ? (
                                    <TableActionBar
                                        count={tblSelCount('zimmet')}
                                        totalCount={zimFiltered.length}
                                        allSelected={zimAllSel}
                                        onSelectAll={() => selectAllTbl('zimmet', zimFiltered.map(z => String(z.id)))}
                                        onDelete={() => openBulkDel('zimmet', zimSelRows)}
                                        onEdit={() => { if (zimSelRows.length === 1) setEditRow({ row: zimSelRows[0], collection: 'zimmet' }); }}
                                        onHighlight={() => openHLPicker('zimmet', zimSelKeys)}
                                    />
                                ) : null;
                            })()}
                            <div className="table-responsive-wrapper" style={{ overflowX: 'auto' }}>
                                <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                    <colgroup>
                                        <col style={{ width: '36px' }} />
                                        <col className="col-tarih" />
                                        <col className="col-malzeme" />
                                        <col className="col-firma" />
                                        <col className="col-miktar" />
                                        <col className="col-islem" />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th style={{ ...CB_TH, border: '1px solid var(--border)' }}></th>
                                            <th style={{ border: '1px solid var(--border)' }}>İŞLEM TARİHİ</th>
                                            <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                            <th style={{ border: '1px solid var(--border)' }}>KİŞİ / EKİP</th>
                                            <th style={{ textAlign: 'right', border: '1px solid var(--border)' }}>MİKTAR</th>
                                            <th style={{ border: '1px solid var(--border)' }}>{zimmetView === 'active' ? 'İŞLEM' : 'TÜR'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const filtered = zimmet.filter(z =>
                                                (zimmetView === 'active' ? z.status === 'zimmette' : true) &&
                                                (z.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || z.person.toLowerCase().includes(searchQuery.toLowerCase()))
                                            ).sort((a, b) => (b.updated_at || b.created_at || b.id || 0) - (a.updated_at || a.created_at || a.id || 0));

                                            if (filtered.length === 0) {
                                                return <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{zimmetView === 'active' ? 'Aktif zimmet kaydı bulunamadı.' : 'Henüz bir hareket kaydı yok.'}</td></tr>;
                                            }

                                            return filtered.map(z => (
                                                <tr key={z.id} style={{ ...hlRowStyle('zimmet', z.id) }} onContextMenu={isAdmin ? (e) => handleCtxMenu(e, z, 'zimmet') : undefined}>
                                                    <td style={{ ...CB_TD, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                        <input type="checkbox" style={CB_STYLE} checked={isRowSel('zimmet', z.id)} onChange={() => toggleSel('zimmet', String(z.id))} />
                                                    </td>
                                                    <td data-label="İşlem Tarihi" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{z.date}</td>
                                                    <td data-label="Malzeme" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>{z.itemName}</td>
                                                    <td data-label="Kişi / Ekip" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{z.person}</td>
                                                    <td data-label="Miktar" style={{ textAlign: 'right', whiteSpace: 'nowrap', fontWeight: '600', border: '1px solid var(--border)' }}>{z.amount}</td>
                                                    <td data-label={zimmetView === 'active' ? "İşlem" : "Tür"} style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                        {zimmetView === 'active' ? (
                                                            pagePerm('zimmet') === 'edit' ? (
                                                                <button
                                                                    className="btn-ghost"
                                                                    style={{ color: '#4f46e5', fontWeight: '600', padding: '6px 12px', borderRadius: '6px', background: '#f5f3ff', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                                    onClick={() => handleReturnZimmet(z)}
                                                                >
                                                                    <RotateCcw size={14} /> Geri Alındı
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Eye size={13} /> Zimmette
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '11px',
                                                                fontWeight: '700',
                                                                background: z.type === 'verildi' ? '#eff6ff' : '#f0fdf4',
                                                                color: z.type === 'verildi' ? '#2563eb' : '#16a34a',
                                                                border: `1px solid ${z.type === 'verildi' ? '#dbeafe' : '#dcfce7'}`
                                                            }}>
                                                                {z.type === 'verildi' ? 'ZİMMET VERİLDİ' : 'GERİ ALINDI'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── PRICE TAB ── */}
                    {activeTab === 'price' && pagePerm('price') === 'none' && (
                        <div className="table-card animate-fade" style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <Shield size={36} style={{ color: '#cbd5e1', marginBottom: '14px' }} />
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Erişim Yetkiniz Yok</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Bu sayfayı görüntüleme yetkiniz bulunmuyor. Yöneticinizle iletişime geçin.</div>
                        </div>
                    )}
                    {activeTab === 'price' && pagePerm('price') !== 'none' && (() => {
                        const priceFiltered = priceAnalysis.filter(row => {
                            if (priceFilter.malzeme && !(row.name || '').toLowerCase().includes(priceFilter.malzeme.toLowerCase())) return false;
                            if (priceFilter.kategori && !(row.kategori || '').toLowerCase().includes(priceFilter.kategori.toLowerCase())) return false;
                            return true;
                        });
                        const hasFilter = priceFilter.malzeme || priceFilter.kategori;
                        const filterInputStyle = { fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', width: '160px' };
                        return (
                            <div className="table-card animate-fade">
                                <div className="table-toolbar">
                                    <div>
                                        <span className="section-title"><TrendingUp size={17} /> Fiyat Analizi</span>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            * Giriş işlemlerindeki fiyatlar baz alınarak hesaplanmaktadır.
                                        </div>
                                    </div>
                                    <ExportButtons
                                        data={priceFiltered}
                                        title="Malzeme Fiyat Analizi"
                                        columns={[
                                            { key: 'name', label: 'MALZEME' },
                                            { key: 'kategori', label: 'KATEGORİ' },
                                            { key: 'totalQtyReceived', label: 'TOPLAM' },
                                            { key: 'unit', label: 'BİRİM' },
                                            { key: 'avgPrice', label: 'ORT. BİRİM FİYAT' },
                                            { key: 'totalSpent', label: 'TOPLAM TUTAR' }
                                        ]}
                                        filename="Fiyat_Analizi"
                                    />
                                </div>
                                {/* Filtreler */}
                                <div style={{ display: 'flex', gap: '8px', padding: '8px 16px 12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        placeholder="Malzeme ara..."
                                        value={priceFilter.malzeme}
                                        onChange={e => setPriceFilter(f => ({ ...f, malzeme: e.target.value }))}
                                        style={filterInputStyle}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Kategori ara..."
                                        value={priceFilter.kategori}
                                        onChange={e => setPriceFilter(f => ({ ...f, kategori: e.target.value }))}
                                        style={filterInputStyle}
                                    />
                                    {hasFilter && (
                                        <button onClick={() => setPriceFilter({ malzeme: '', kategori: '' })} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            Temizle
                                        </button>
                                    )}
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{priceFiltered.length} malzeme</span>
                                </div>
                                {(() => {
                                    const prSelKeys = tblSelKeys('price');
                                    const prSelRows = priceFiltered.filter(r => prSelKeys.includes(String(r.id)));
                                    const prAllSel = priceFiltered.length > 0 && priceFiltered.every(r => isRowSel('price', r.id));
                                    return isAdmin && tblSelCount('price') > 0 ? (
                                        <TableActionBar
                                            count={tblSelCount('price')}
                                            totalCount={priceFiltered.length}
                                            allSelected={prAllSel}
                                            onSelectAll={() => selectAllTbl('price', priceFiltered.map(r => String(r.id)))}
                                            onDelete={() => openBulkDel('items', prSelRows)}
                                            onEdit={() => { if (prSelRows.length === 1) setEditRow({ row: prSelRows[0], collection: 'items' }); }}
                                            onHighlight={() => openHLPicker('price', prSelKeys)}
                                        />
                                    ) : null;
                                })()}
                                <div className="table-responsive-wrapper dash-unified-wrap">
                                    <table className="responsive-table" style={{ tableLayout: 'auto', width: '100%', borderCollapse: 'collapse' }}>
                                        <colgroup>
                                            <col style={{ width: '36px' }} />
                                            <col />
                                            <col />
                                            <col style={{ width: '100px' }} />
                                            <col style={{ width: '64px' }} />
                                            <col style={{ width: '160px' }} />
                                            <col style={{ width: '160px' }} />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th style={{ ...CB_TH, border: '1px solid var(--border)' }}></th>
                                                <th style={{ textAlign: 'left', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>MALZEME</th>
                                                <th style={{ textAlign: 'left', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>KATEGORİ</th>
                                                <th style={{ textAlign: 'right', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>TOPLAM</th>
                                                <th style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>BİRİM</th>
                                                <th style={{ textAlign: 'right', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>ORT. BİRİM FİYAT</th>
                                                <th style={{ textAlign: 'right', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>TOPLAM TUTAR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {priceFiltered.length === 0 ? (
                                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Kayıt bulunamadı.</td></tr>
                                            ) : priceFiltered.map((row, idx) => (
                                                <tr key={idx} style={{ ...hlRowStyle('price', row.id) }}>
                                                    <td style={{ ...CB_TD, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                        <input type="checkbox" style={CB_STYLE} checked={isRowSel('price', row.id)} onChange={() => toggleSel('price', String(row.id))} />
                                                    </td>
                                                    <td style={{ fontWeight: '600', textAlign: 'left', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{row.name}</td>
                                                    <td style={{ textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{row.kategori || '—'}</td>
                                                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{formatNumber(row.totalQtyReceived)}</td>
                                                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{row.unit}</td>
                                                    <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: '600', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{row.avgPrice > 0 ? `${formatNumber(row.avgPrice)} ₺` : '—'}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{row.totalSpent > 0 ? `${formatNumber(row.totalSpent)} ₺` : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── MOVEMENTS TAB ── */}
                    {activeTab === 'movements' && pagePerm('movements') === 'none' && (
                        <div className="table-card animate-fade" style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <Shield size={36} style={{ color: '#cbd5e1', marginBottom: '14px' }} />
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Erişim Yetkiniz Yok</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Bu sayfayı görüntüleme yetkiniz bulunmuyor. Yöneticinizle iletişime geçin.</div>
                        </div>
                    )}
                    {activeTab === 'movements' && pagePerm('movements') !== 'none' && (() => {
                        const toISODate2 = (dateStr) => {
                            const s = String(dateStr || '').split(',')[0].trim();
                            const parts = s.split('.');
                            if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            return s.slice(0, 10);
                        };
                        const movementsFiltered = filteredMovementsForPage.filter(m => {
                            if (movFilter.malzeme && !(m.itemName || '').toLowerCase().includes(movFilter.malzeme.toLowerCase())) return false;
                            if (movFilter.firma && !(m.firmaAdi || m.recipient || '').toLowerCase().includes(movFilter.firma.toLowerCase())) return false;
                            if (movFilter.irsaliye && !(m.irsaliyeNo || '').toLowerCase().includes(movFilter.irsaliye.toLowerCase())) return false;
                            if (movFilter.tarihBas || movFilter.tarihBitis) {
                                const mISO = toISODate2(m.date);
                                if (movFilter.tarihBas && mISO < movFilter.tarihBas) return false;
                                if (movFilter.tarihBitis && mISO > movFilter.tarihBitis) return false;
                            }
                            return true;
                        });
                        return (
                            <div className="table-card animate-fade">
                                <div className="table-toolbar">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="section-title"><History size={17} /> Tüm Stok Hareketleri</span>
                                    </div>
                                    <div className="flex align-center gap-2">
                                        <div className="export-container">
                                            <button className="btn-export-sm" onClick={() => exportToExcelGeneral(
                                                movementsFiltered.map(m => ({
                                                    Tarih: String(m.date || '-').split(',')[0].split(' ')[0],
                                                    Tur: m.normalizedType === 'in' ? 'Giriş' : 'Çıkış',
                                                    Malzeme: m.itemName || '',
                                                    Firma: m.firmaAdi || m.recipient || '-',
                                                    Miktar: m.amount || 0,
                                                    IrsaliyeNo: m.irsaliyeNo || '-'
                                                })),
                                                [{ key: 'Tarih', label: 'Tarih' }, { key: 'Tur', label: 'Tür' }, { key: 'Malzeme', label: 'Malzeme' }, { key: 'Firma', label: 'Firma' }, { key: 'Miktar', label: 'Miktar' }, { key: 'IrsaliyeNo', label: 'İrsaliye No' }],
                                                'Hareket_Kayitlari'
                                            )}>
                                                <FileSpreadsheet size={14} className="icon-excel" /> Excel
                                            </button>
                                            <button className="btn-export-sm" onClick={() => exportMovementsToPDF(movementsFiltered, 'Hareket_Kayitlari')}>
                                                <Download size={14} className="icon-pdf" /> PDF
                                            </button>
                                        </div>
                                        <button className="btn-ghost" onClick={() => setActiveTab('dashboard')}>Panele Dön</button>
                                    </div>
                                </div>

                                {/* Filtre Satırı */}
                                {(() => {
                                    const hasFilter = movFilter.malzeme || movFilter.tarihBas || movFilter.tarihBitis || movFilter.firma || movFilter.irsaliye;
                                    const inputStyle = { fontSize: '12px', fontFamily: 'inherit', padding: '0 10px', height: '32px', lineHeight: '32px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', width: '100%', boxSizing: 'border-box', display: 'block' };
                                    const selectStyle = { ...inputStyle, cursor: 'pointer' };
                                    const labelStyle = { fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' };
                                    const colStyle = { display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' };
                                    const uniqueMalzemeler = [...new Set(filteredMovementsForPage.map(m => m.itemName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));
                                    const uniqueFirmalar = [...new Set(filteredMovementsForPage.map(m => m.firmaAdi || m.recipient).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));
                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'end' }}>
                                            <div style={colStyle}>
                                                <label style={labelStyle}>Tarih Aralığı</label>
                                                <DateRangePicker
                                                    startDate={movFilter.tarihBas}
                                                    endDate={movFilter.tarihBitis}
                                                    onChange={(s, e) => setMovFilter(f => ({ ...f, tarihBas: s, tarihBitis: e }))}
                                                />
                                            </div>
                                            <div style={colStyle}>
                                                <label style={labelStyle}>Firma</label>
                                                <select value={movFilter.firma} onChange={e => setMovFilter(f => ({ ...f, firma: e.target.value }))} style={selectStyle}>
                                                    <option value="">Tümü</option>
                                                    {uniqueFirmalar.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                            <div style={colStyle}>
                                                <label style={labelStyle}>İrsaliye No</label>
                                                <input type="text" placeholder="İrsaliye ara..." value={movFilter.irsaliye} onChange={e => setMovFilter(f => ({ ...f, irsaliye: e.target.value }))} style={inputStyle} />
                                            </div>
                                            <div style={colStyle}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={labelStyle}>Malzeme</label>
                                                    <button onClick={() => setMovFilter({ malzeme: '', tarihBas: '', tarihBitis: '', firma: '', irsaliye: '' })} style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: '1.6', visibility: hasFilter ? 'visible' : 'hidden' }}>
                                                        Temizle
                                                    </button>
                                                </div>
                                                <select value={movFilter.malzeme} onChange={e => setMovFilter(f => ({ ...f, malzeme: e.target.value }))} style={selectStyle}>
                                                    <option value="">Tümü</option>
                                                    {uniqueMalzemeler.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {(() => {
                                    const movSelKeys = tblSelKeys('movements');
                                    const movSelRows = movementsFiltered.filter(m => movSelKeys.includes(`${m.category}-${m.id}`));
                                    const movAllSel = movementsFiltered.length > 0 && movementsFiltered.every(m => isRowSel('movements', `${m.category}-${m.id}`));
                                    return isAdmin && tblSelCount('movements') > 0 ? (
                                        <TableActionBar
                                            count={tblSelCount('movements')}
                                            totalCount={movementsFiltered.length}
                                            allSelected={movAllSel}
                                            onSelectAll={() => selectAllTbl('movements', movementsFiltered.map(m => `${m.category}-${m.id}`))}
                                            onDelete={() => openBulkDel('movements_mixed', movSelRows)}
                                            onEdit={() => { if (movSelRows.length === 1) { const m = movSelRows[0]; setEditRow({ row: m, collection: m.category === 'zimmet' ? 'zimmet' : 'movements' }); } }}
                                            onHighlight={() => openHLPicker('movements', movSelKeys)}
                                        />
                                    ) : null;
                                })()}
                                <div className="table-responsive-wrapper dash-unified-wrap">
                                    {(() => {
                                        return (
                                            <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                                <colgroup>
                                                    <col style={{ width: '36px' }} />
                                                    <col className="col-tarih" />
                                                    <col className="col-malzeme" />
                                                    <col className="col-kategori" />
                                                    <col className="col-miktar" />
                                                    <col className="col-birim" />
                                                    <col className="col-firma" />
                                                    <col className="col-detay" />
                                                </colgroup>
                                                <thead>
                                                    <tr>
                                                        <th style={{ ...CB_TH, border: '1px solid var(--border)' }}></th>
                                                        <th style={{ border: '1px solid var(--border)' }}>TARİH</th>
                                                        <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                                        <th style={{ border: '1px solid var(--border)' }}>KATEGORİ</th>
                                                        <th style={{ textAlign: 'right', border: '1px solid var(--border)' }}>MİKTAR</th>
                                                        <th style={{ border: '1px solid var(--border)' }}>BİRİM</th>
                                                        <th style={{ border: '1px solid var(--border)' }}>KİŞİ / FİRMA</th>
                                                        <th style={{ border: '1px solid var(--border)' }}>DETAY</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {movementsFiltered.length === 0 ? (
                                                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Kayıt bulunamadı.</td></tr>
                                                    ) : movementsFiltered.map((m) => {
                                                        const isIn = m.normalizedType === 'in';
                                                        const tipColor = isIn ? 'var(--success)' : 'var(--danger)';
                                                        const miktar = isIn ? `+${formatNumber(m.amount)}` : `−${formatNumber(m.amount)}`;
                                                        const kisi = isIn ? (m.firmaAdi || m.recipient || '—') : (m.recipient || m.firmaAdi || '—');
                                                        const detay = isIn ? (m.irsaliyeNo || '—') : (m.kullanimAlani || m.note || '—');
                                                        const tarih = String(m.date || '—').split(',')[0].split(' ')[0];
                                                        const rowKey = `${m.category}-${m.id}`;
                                                        return (
                                                            <tr key={m.id} style={{ borderLeft: `4px solid ${tipColor}`, ...hlRowStyle('movements', rowKey) }} onContextMenu={isAdmin ? (e) => handleCtxMenu(e, m, 'movements') : undefined}>
                                                                <td style={{ ...CB_TD, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                                    <input type="checkbox" style={CB_STYLE} checked={isRowSel('movements', rowKey)} onChange={() => toggleSel('movements', rowKey)} />
                                                                </td>
                                                                <td style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{tarih}</td>
                                                                <td style={{ border: '1px solid var(--border)' }}>{m.itemName || '—'}</td>
                                                                <td style={{ whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{m.malzemeTuru || 'Genel'}</td>
                                                                <td style={{ textAlign: 'right', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{miktar}</td>
                                                                <td style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{m.unit || '—'}</td>
                                                                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', border: '1px solid var(--border)' }}>{kisi}</td>
                                                                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', border: '1px solid var(--border)' }}>{detay}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        );
                                    })()}
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── İRSALİYELER TAB ── */}
                    {activeTab === 'irsaliyeler' && pagePerm('irsaliyeler') !== 'none' && (() => {
                        const inMovements = movements.filter(m => m.type === 'in' && m.irsaliyeNo && m.irsaliyeNo.trim());
                        const grouped = {};
                        inMovements.forEach(m => {
                            const key = m.irsaliyeNo.trim();
                            if (!grouped[key]) {
                                grouped[key] = { irsaliyeNo: key, items: [], date: m.date, firma: m.firmaAdi || m.recipient || '—', teslimAlan: m.teslimAlan || m.recipient || '—' };
                            }
                            grouped[key].items.push(m);
                        });
                        const irsaliyeList = Object.values(grouped)
                            .sort((a, b) => String(b.date || '') > String(a.date || '') ? 1 : -1)
                            .map(irsaliye => {
                                const metaKey = irsaliye.irsaliyeNo.replace(/[./\s]/g, '_');
                                const meta = irsaliyeMeta[metaKey] || {};
                                return { ...irsaliye, plaka: meta.plaka || '', sofor: meta.sofor || '' };
                            });
                        const rowStyle = { height: '36px' };
                        const cellStyle = { padding: '4px 10px', verticalAlign: 'middle', whiteSpace: 'nowrap' };
                        return (
                            <div className="table-card animate-fade">
                                <div className="table-toolbar">
                                    <span className="section-title"><FileText size={17} /> İrsaliyeler</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{irsaliyeList.length} irsaliye</span>
                                </div>
                                {irsaliyeList.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                        Henüz irsaliyeli giriş kaydı yok.
                                    </div>
                                ) : (
                                    <>
                                        {(() => {
                                            const irsSelKeys = tblSelKeys('irsaliyeler');
                                            const irsSelRows = irsaliyeList.filter(ir => irsSelKeys.includes(String(ir.irsaliyeNo)));
                                            const irsAllSel = irsaliyeList.length > 0 && irsaliyeList.every(ir => isRowSel('irsaliyeler', ir.irsaliyeNo));
                                            return canEdit && tblSelCount('irsaliyeler') > 0 ? (
                                                <TableActionBar
                                                    count={tblSelCount('irsaliyeler')}
                                                    totalCount={irsaliyeList.length}
                                                    allSelected={irsAllSel}
                                                    onSelectAll={() => selectAllTbl('irsaliyeler', irsaliyeList.map(ir => String(ir.irsaliyeNo)))}
                                                    onDelete={() => openBulkDel('irsaliyeler_batch', irsSelRows)}
                                                    onEdit={() => { if (irsSelRows.length === 1) setEditRow({ row: irsSelRows[0], collection: 'irsaliyeler' }); }}
                                                    onHighlight={() => openHLPicker('irsaliyeler', irsSelKeys)}
                                                />
                                            ) : null;
                                        })()}
                                    <div className="table-responsive-wrapper">
                                        <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                            <colgroup>
                                                <col style={{ width: '36px' }} />
                                                <col className="col-tarih" />
                                                <col className="col-kategori" />
                                                <col className="col-firma" />
                                                <col className="col-birim" />
                                                <col className="col-firma" />
                                                <col style={{ width: '110px' }} />
                                                <col style={{ width: '120px' }} />
                                            </colgroup>
                                            <thead>
                                                <tr>
                                                    <th style={{ ...CB_TH, border: '1px solid var(--border)' }}></th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>TARİH</th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>İRSALİYE NO</th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>FİRMA</th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>ADET</th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>TESLİM ALAN</th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>PLAKA</th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>ŞOFÖR</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {irsaliyeList.map(irsaliye => {
                                                    const tarih = String(irsaliye.date || '—').split(',')[0].split(' ')[0];
                                                    return (
                                                        <tr
                                                            key={irsaliye.irsaliyeNo}
                                                            onClick={() => { setSelectedIrsaliye(irsaliye); setShowIrsaliyeDetailModal(true); }}
                                                            onContextMenu={canEdit ? (e) => { e.preventDefault(); e.stopPropagation(); handleCtxMenu(e, irsaliye, 'irsaliyeler'); } : undefined}
                                                            style={{ cursor: 'pointer', ...rowStyle, ...hlRowStyle('irsaliyeler', irsaliye.irsaliyeNo) }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover-row)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = ''}
                                                        >
                                                            <td style={{ ...CB_TD, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                                <input type="checkbox" style={CB_STYLE} checked={isRowSel('irsaliyeler', irsaliye.irsaliyeNo)} onChange={() => toggleSel('irsaliyeler', String(irsaliye.irsaliyeNo))} />
                                                            </td>
                                                            <td style={{ ...cellStyle, textAlign: 'center', border: '1px solid var(--border)' }}>{tarih}</td>
                                                            <td style={{ ...cellStyle, fontWeight: '600', textAlign: 'center', border: '1px solid var(--border)' }}>{irsaliye.irsaliyeNo}</td>
                                                            <td style={{ ...cellStyle, textAlign: 'center', border: '1px solid var(--border)' }}>{irsaliye.firma}</td>
                                                            <td style={{ ...cellStyle, textAlign: 'center', fontWeight: '700', color: 'var(--text-main)', border: '1px solid var(--border)' }}>{irsaliye.items.length}</td>
                                                            <td style={{ ...cellStyle, textAlign: 'center', border: '1px solid var(--border)' }}>{irsaliye.teslimAlan}</td>
                                                            <td style={{ ...cellStyle, textAlign: 'center', color: irsaliye.plaka ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '12px', border: '1px solid var(--border)' }}>{irsaliye.plaka || '—'}</td>
                                                            <td style={{ ...cellStyle, textAlign: 'center', color: irsaliye.sofor ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '12px', border: '1px solid var(--border)' }}>{irsaliye.sofor || '—'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                    {/* ── USERS TAB (Admin + Yönetici) ── */}
                    {activeTab === 'users' && canEdit && (
                        <div className="animate-fade">
                            {/* Pending Approvals */}
                            {pendingUsers.length > 0 && (
                                <div className="card mb-4" style={{ borderLeft: '3px solid var(--warning)' }}>
                                    <div className="flex align-center gap-2 mb-4" style={{ color: '#92400e' }}>
                                        <Clock size={16} />
                                        <span style={{ fontWeight: '600', fontSize: '14px' }}>Onay Bekleyen Kullanıcılar</span>
                                        <span className="badge badge-warning">{pendingUsers.length}</span>
                                    </div>
                                    <div className="flex flex-column gap-3">
                                        {pendingUsers.map(u => (
                                            <div key={u.uid} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
                                                <div className="flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '10px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{u.name}</div>
                                                        <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>{u.email}</div>
                                                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                                                            Kayıt: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '-'}
                                                        </div>
                                                    </div>
                                                    <div className="flex align-center gap-2" style={{ flexWrap: 'wrap' }}>
                                                        <div>
                                                            <label className="label" style={{ fontSize: '11px', marginBottom: '2px' }}>Rol Seç</label>
                                                            <select
                                                                value={pendingRoleMap[u.uid] || 'izleyici'}
                                                                onChange={e => setPendingRoleMap(prev => ({ ...prev, [u.uid]: e.target.value }))}
                                                                style={{ fontSize: '13px', padding: '6px 10px' }}
                                                            >
                                                                <option value="yonetici">Yönetici</option>
                                                                <option value="izleyici">İzleyici</option>
                                                            </select>
                                                        </div>
                                                        <button
                                                            className="btn-primary flex align-center gap-1"
                                                            style={{ background: '#16a34a', fontSize: '13px', marginTop: '14px' }}
                                                            onClick={() => handleApproveUser(u.uid)}
                                                        >
                                                            <UserCheck size={16} /> Onayla
                                                        </button>
                                                        <button
                                                            className="btn-primary flex align-center gap-1"
                                                            style={{ background: '#dc2626', fontSize: '13px', marginTop: '14px' }}
                                                            onClick={() => handleRejectUser(u.uid)}
                                                        >
                                                            <UserX size={16} /> Reddet
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Users */}
                            <div className="table-card">
                                <div className="table-toolbar">
                                    <span className="section-title"><Users size={17} /> Tüm Kullanıcılar</span>
                                    <div className="flex align-center gap-2">
                                        <ExportButtons
                                            data={allUsers.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map(u => ({
                                                Ad: u.name || '',
                                                Eposta: u.email || '',
                                                Tarih: u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '-',
                                                Durum: u.status === 'approved' ? 'Onaylı' : u.status === 'pending' ? 'Bekliyor' : 'Reddedildi',
                                                Rol: ROLE_LABELS[u.role] || u.role
                                            }))}
                                            title="Kullanıcı Listesi"
                                            columns={[
                                                { key: 'Ad', label: 'Ad Soyad' },
                                                { key: 'Eposta', label: 'E-Posta' },
                                                { key: 'Tarih', label: 'Kayıt Tarihi' },
                                                { key: 'Durum', label: 'Durum' },
                                                { key: 'Rol', label: 'Rol' }
                                            ]}
                                            filename="Kullanici_Listesi"
                                        />
                                        <button className="btn-primary flex align-center gap-1" onClick={() => { setEditingUser(null); setShowUserModal(true); }}>
                                            <UserPlus size={15} /> Yeni Kullanıcı
                                        </button>
                                    </div>
                                </div>
                                {allUsers.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>Kullanıcı bulunamadı.</p>
                                ) : (
                                    <>
                                        {(() => {
                                            const usrSorted = allUsers.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                                            const usrSelKeys = tblSelKeys('users');
                                            const usrSelRows = usrSorted.filter(u => usrSelKeys.includes(String(u.uid)));
                                            const usrAllSel = usrSorted.length > 0 && usrSorted.every(u => isRowSel('users', u.uid));
                                            return isAdmin && tblSelCount('users') > 0 ? (
                                                <TableActionBar
                                                    count={tblSelCount('users')}
                                                    totalCount={usrSorted.length}
                                                    allSelected={usrAllSel}
                                                    onSelectAll={() => selectAllTbl('users', usrSorted.map(u => String(u.uid)))}
                                                    onDelete={() => openBulkDel('users', usrSelRows.filter(u => u.uid !== authUser.uid))}
                                                    onEdit={() => { if (usrSelRows.length === 1) setEditRow({ row: usrSelRows[0], collection: 'users' }); }}
                                                    onHighlight={() => openHLPicker('users', usrSelKeys)}
                                                />
                                            ) : null;
                                        })()}
                                    <div className="table-responsive-wrapper">
                                        <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                            <colgroup>
                                                <col style={{ width: '36px' }} />
                                                <col className="col-tarih" />
                                                <col className="col-malzeme" />
                                                <col className="col-malzeme" />
                                                <col className="col-kategori" />
                                                <col className="col-islem" />
                                            </colgroup>
                                            <thead>
                                                <tr>
                                                    <th style={{ ...CB_TH, border: '1px solid var(--border)' }}></th>
                                                    <th style={{ border: '1px solid var(--border)' }}>KAYIT TARİHİ</th>
                                                    <th style={{ border: '1px solid var(--border)' }}>AD SOYAD</th>
                                                    <th style={{ border: '1px solid var(--border)' }}>E-POSTA</th>
                                                    <th style={{ border: '1px solid var(--border)' }}>ROL</th>
                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>İŞLEMLER</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allUsers.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map(u => (
                                                    <tr key={u.uid} style={{ ...hlRowStyle('users', u.uid) }} onContextMenu={isAdmin ? (e) => handleCtxMenu(e, u, 'users') : undefined}>
                                                        <td style={{ ...CB_TD, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                            <input type="checkbox" style={CB_STYLE} checked={isRowSel('users', u.uid)} onChange={() => toggleSel('users', String(u.uid))} />
                                                        </td>
                                                        <td data-label="Kayıt Tarihi" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '—'}
                                                        </td>
                                                        <td data-label="Ad Soyad" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                                <span style={{
                                                                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                                                    background: presence[u.uid]?.online ? '#22c55e' : '#d1d5db',
                                                                    boxShadow: presence[u.uid]?.online ? '0 0 0 2px rgba(34,197,94,0.25)' : 'none',
                                                                }} title={presence[u.uid]?.online ? 'Çevrimiçi' : (presence[u.uid]?.lastSeen ? `Son görülme: ${new Date(presence[u.uid].lastSeen).toLocaleString('tr-TR')}` : 'Çevrimdışı')} />
                                                                {u.name}
                                                                {u.uid === authUser.uid && (
                                                                    <span style={{ fontSize: '11px', color: '#6d28d9', background: '#ede9fe', borderRadius: '10px', padding: '1px 7px' }}>Siz</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td data-label="E-posta" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{u.email}</td>
                                                        <td data-label="Rol" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                            <span style={{
                                                                background: ROLE_COLORS[u.role]?.bg || '#f1f5f9',
                                                                color: ROLE_COLORS[u.role]?.color || '#475569',
                                                                borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '600'
                                                            }}>
                                                                {ROLE_LABELS[u.role] || u.role}
                                                            </span>
                                                        </td>
                                                        <td data-label="İşlemler" style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                            <div className="flex align-center gap-1">
                                                                <button
                                                                    className="btn-icon"
                                                                    title="Düzenle"
                                                                    onClick={() => { setEditingUser(u); setPagePermissionsEdit(u.pagePermissions || {}); setShowUserModal(true); }}
                                                                    style={{ color: '#3b82f6' }}
                                                                >
                                                                    <Edit3 size={15} />
                                                                </button>
                                                                {u.uid !== authUser.uid && (
                                                                    <button
                                                                        className="btn-icon"
                                                                        title="Sil"
                                                                        onClick={() => handleDeleteUser(u.uid, u.name)}
                                                                        style={{ color: '#ef4444' }}
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}


                    {/* ── SEVKİYAT TAB ── */}
                    {activeTab === 'sevkiyat' && (() => {
                        const durumMap = {
                            BEKLEMEDE: { label: 'Beklemede', bg: '#fef3c7', color: '#b45309' },
                            SATIN_ALINDI: { label: 'Satın Alındı', bg: '#dcfce7', color: '#166534' },
                            EKSIK_MALZEME: { label: 'Eksik Malzeme', bg: '#fee2e2', color: '#991b1b' },
                        };
                        return (
                            <div className="animate-fade">
                                {/* Header */}
                                <div className="table-card mb-4" style={{ padding: '12px 20px' }}>
                                    <div className="flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <span className="section-title"><Truck size={17} /> Satın Alım Listesi</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn-export-sm"
                                                onClick={() => exportSevkiyatToExcel(sevkiyat)}
                                            >
                                                <FileSpreadsheet size={14} className="icon-excel" /> Excel
                                            </button>
                                            <button
                                                className="btn-export-sm"
                                                onClick={() => exportSevkiyatToPDF(sevkiyat)}
                                            >
                                                <Download size={14} className="icon-pdf" /> PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {sevkiyat.length === 0 ? (
                                    <div className="table-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                        <Truck size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
                                        <div style={{ fontWeight: '600', marginBottom: 6 }}>Henüz sevkiyat kaydı yok</div>
                                        <div style={{ fontSize: '13px' }}>Satın alım ekranından "Satışa Gönder" ile kayıt oluşturun.</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* ÜST PANEL: Malzeme Talep Formları Listesi */}
                                        <div className="table-card">
                                            <div className="table-toolbar">
                                                <span className="section-title"><Truck size={17} /> Malzeme Talep Formları</span>
                                            </div>
                                            {(() => {
                                                const sevSelKeys = tblSelKeys('sevkiyat');
                                                const sevSelRows = sevkiyat.filter(s => sevSelKeys.includes(String(s.id)));
                                                const sevAllSel = sevkiyat.length > 0 && sevkiyat.every(s => isRowSel('sevkiyat', s.id));
                                                return canEdit && tblSelCount('sevkiyat') > 0 ? (
                                                    <TableActionBar
                                                        count={tblSelCount('sevkiyat')}
                                                        totalCount={sevkiyat.length}
                                                        allSelected={sevAllSel}
                                                        onSelectAll={() => selectAllTbl('sevkiyat', sevkiyat.map(s => String(s.id)))}
                                                        onDelete={() => openBulkDel('sevkiyat', sevSelRows)}
                                                        onEdit={() => { if (sevSelRows.length === 1) setEditRow({ row: sevSelRows[0], collection: 'sevkiyat' }); }}
                                                        onHighlight={() => openHLPicker('sevkiyat', sevSelKeys)}
                                                    />
                                                ) : null;
                                            })()}
                                            <div className="table-responsive-wrapper" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                                <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                                    <colgroup>
                                                        <col style={{ width: '36px' }} />
                                                        <col className="col-tarih" />
                                                        <col className="col-kategori" />
                                                        <col className="col-malzeme" />
                                                        <col className="col-kategori" />
                                                        <col style={{ width: '40px' }} />
                                                    </colgroup>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ ...CB_TH, border: '1px solid var(--border)' }}></th>
                                                            <th style={{ border: '1px solid var(--border)' }}>TARİH</th>
                                                            <th style={{ border: '1px solid var(--border)' }}>FORM NO</th>
                                                            <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>MALZEME</th>
                                                            <th style={{ border: '1px solid var(--border)' }}>DURUM</th>
                                                            <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sevkiyat.map((s) => {
                                                            const durum = durumMap[s.satin_alim_durumu] || durumMap.BEKLEMEDE;
                                                            return (
                                                                <tr key={s.id} onClick={() => setSevkiyatModal({ show: true, data: s })} onContextMenu={isAdmin ? (e) => handleCtxMenu(e, s, 'sevkiyat') : undefined} style={{ cursor: 'pointer', ...hlRowStyle('sevkiyat', s.id) }}>
                                                                    <td style={{ ...CB_TD, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                                        <input type="checkbox" style={CB_STYLE} checked={isRowSel('sevkiyat', s.id)} onChange={() => toggleSel('sevkiyat', String(s.id))} />
                                                                    </td>
                                                                    <td data-label="Tarih" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{s.sevkiyata_gonderilme_tarihi_tr?.split(' ')[0] || '-'}</td>
                                                                    <td data-label="Form No" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{s.satin_alim_form_no}</td>
                                                                    <td data-label="Malzeme" style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{(s.items || []).length} kalem</td>
                                                                    <td data-label="Durum" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                                        <span className={"movement-type-pill " + (durum.label === 'Tamamlandı' ? 'in' : 'out')}>
                                                                            {durum.label}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ textAlign: 'center', border: '1px solid var(--border)' }}><ArrowUpRight size={14} color="var(--text-muted)" /></td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* ALT PANEL: Bekleyen Malzemeler Listesi */}
                                        <div className="table-card">
                                            <div className="table-toolbar">
                                                <span className="section-title"><History size={17} /> Satın Alım</span>
                                                <span className="movement-type-pill out">
                                                    {(() => {
                                                        let count = 0;
                                                        sevkiyat.forEach(s => {
                                                            (s.items || []).forEach((_, idx) => {
                                                                if (!s.itemStatuses?.[idx] || s.itemStatuses?.[idx] === 'pending') count++;
                                                            });
                                                        });
                                                        return `${count} bekleyen`;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="table-responsive-wrapper">
                                                <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                                    <colgroup>
                                                        <col className="col-malzeme" />
                                                        <col className="col-kategori" />
                                                        <col className="col-birim" />
                                                        <col className="col-firma" />
                                                        <col className="col-islem" />
                                                    </colgroup>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                                            <th style={{ border: '1px solid var(--border)' }}>FORM NO</th>
                                                            <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>MİKTAR</th>
                                                            <th style={{ border: '1px solid var(--border)' }}>TALEP EDEN</th>
                                                            <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>İŞLEMLER</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(() => {
                                                            const pendingList = [];
                                                            sevkiyat.forEach(s => {
                                                                (s.items || []).forEach((it, idx) => {
                                                                    if (!s.itemStatuses?.[idx] || s.itemStatuses[idx] === 'pending') {
                                                                        pendingList.push({ ...it, s_id: s.id, s_no: s.satin_alim_form_no, s_idx: idx });
                                                                    }
                                                                });
                                                            });

                                                            if (pendingList.length === 0) {
                                                                return <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>İşlem bekleyen malzeme kalmadı.</td></tr>;
                                                            }

                                                            return pendingList.map((item) => (
                                                                <tr key={`${item.s_id}-${item.s_idx}`}>
                                                                    <td data-label="Malzeme" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>{item.itemName}</td>
                                                                    <td data-label="Form No" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{item.s_no}</td>
                                                                    <td data-label="Miktar" style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}><strong>{item.amount}</strong> {item.unit}</td>
                                                                    <td data-label="Talep Eden" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{item.requestedBy}</td>
                                                                    <td data-label="İşlemler" style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                                        <div className="flex gap-2 justify-center">
                                                                            <button
                                                                                className="btn-primary"
                                                                                onClick={() => handleUpdateItemStatus(item.s_id, item.s_idx, 'purchased')}
                                                                                style={{ background: 'var(--success)', fontSize: '11px', padding: '5px 12px' }}
                                                                            >
                                                                                <Check size={14} /> Satın Alındı
                                                                            </button>
                                                                            <button
                                                                                className="btn-primary"
                                                                                onClick={() => handleUpdateItemStatus(item.s_id, item.s_idx, 'cancelled')}
                                                                                style={{ background: 'var(--danger)', fontSize: '11px', padding: '5px 12px' }}
                                                                            >
                                                                                <X size={14} /> İptal Et
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ));
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* ── SEVKİYAT DETAY MODAL ── */}
                    {sevkiyatModal.show && sevkiyatModal.data && (
                        <div style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                            zIndex: 9999, padding: '40px 16px', overflowY: 'auto'
                        }} onClick={() => { setSevkiyatModal({ show: false, data: null }); setEksikSelectionMode(false); setEksikSelectedIndices([]); }}>
                            <div style={{
                                background: 'white', borderRadius: '16px', padding: '28px',
                                width: '100%', maxWidth: '720px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            }} onClick={e => e.stopPropagation()}>
                                {/* Modal Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '17px', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Truck size={18} color="#ea580c" />
                                            {sevkiyatModal.data.satin_alim_form_no}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                            <span>👤 Talep Eden: <strong style={{ color: '#ea580c' }}>{sevkiyatModal.data.talep_eden || (sevkiyatModal.data.items || []).map(it => it.requestedBy).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '—'}</strong></span>
                                            <span>📅 {sevkiyatModal.data.sevkiyata_gonderilme_tarihi_tr}</span>
                                            <span>👤 {sevkiyatModal.data.gonderen}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => { setSevkiyatModal({ show: false, data: null }); setEksikSelectionMode(false); setEksikSelectedIndices([]); }} style={{
                                        background: '#f1f5f9', border: 'none', borderRadius: '8px',
                                        padding: '6px 10px', cursor: 'pointer', color: '#64748b'
                                    }}><X size={16} /></button>
                                </div>

                                {/* Durum */}
                                <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Satın Alım Durumu:</span>
                                    {canEdit ? (
                                        <select
                                            value={eksikSelectionMode ? 'EKSIK_MALZEME' : (sevkiyatModal.data.satin_alim_durumu || 'BEKLEMEDE')}
                                            onChange={e => {
                                                const newDurum = e.target.value;
                                                if (newDurum === 'EKSIK_MALZEME') {
                                                    setEksikSelectionMode(true);
                                                    setEksikSelectedIndices(sevkiyatModal.data.eksik_items || []);
                                                } else {
                                                    setEksikSelectionMode(false);
                                                    setEksikSelectedIndices([]);
                                                    handleSevkiyatDurumUpdate(sevkiyatModal.data.id, newDurum);
                                                    setSevkiyatModal(prev => ({ ...prev, data: { ...prev.data, satin_alim_durumu: newDurum } }));
                                                }
                                            }}
                                            style={{
                                                padding: '5px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                                                border: '1.5px solid #fdba74', background: '#fff7ed', color: '#9a3412', cursor: 'pointer'
                                            }}
                                        >
                                            <option value="BEKLEMEDE">Beklemede</option>
                                            <option value="SATIN_ALINDI">Satın Alındı</option>
                                            <option value="EKSIK_MALZEME">Eksik Malzeme</option>
                                        </select>
                                    ) : (
                                        <span style={{
                                            background: sevkiyatModal.data.satin_alim_durumu === 'SATIN_ALINDI' ? '#dcfce7' : sevkiyatModal.data.satin_alim_durumu === 'EKSIK_MALZEME' ? '#fee2e2' : '#fef3c7',
                                            color: sevkiyatModal.data.satin_alim_durumu === 'SATIN_ALINDI' ? '#166534' : sevkiyatModal.data.satin_alim_durumu === 'EKSIK_MALZEME' ? '#991b1b' : '#b45309',
                                            borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: '700'
                                        }}>{sevkiyatModal.data.satin_alim_durumu}</span>
                                    )}
                                </div>

                                {/* Eksik Malzeme Seçim Modu */}
                                {eksikSelectionMode && (
                                    <div style={{
                                        marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center',
                                        background: '#fef2f2', padding: '10px 14px', borderRadius: '10px', border: '1px solid #fca5a5',
                                    }}>
                                        <AlertTriangle size={16} color="#dc2626" />
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#991b1b', flex: 1 }}>
                                            Eksik malzemeleri işaretleyin ({eksikSelectedIndices.length} seçili)
                                        </span>
                                        <button
                                            onClick={() => handleEksikSave(sevkiyatModal.data.id)}
                                            style={{
                                                background: '#dc2626', color: 'white',
                                                border: 'none', borderRadius: '6px', padding: '6px 14px',
                                                fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                            }}
                                        >
                                            <CheckCheck size={14} /> Kaydet
                                        </button>
                                        <button
                                            onClick={() => { setEksikSelectionMode(false); setEksikSelectedIndices([]); }}
                                            style={{
                                                background: '#f1f5f9', border: 'none', borderRadius: '8px',
                                                padding: '6px 14px', fontWeight: '600', fontSize: '13px',
                                                cursor: 'pointer', color: '#64748b',
                                            }}
                                        >
                                            İptal
                                        </button>
                                    </div>
                                )}

                                {/* Malzeme Kalemleri */}
                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#334155', marginBottom: '10px' }}>
                                    Malzeme Kalemleri ({(sevkiyatModal.data.items || []).length} kalem)
                                </div>
                                {(sevkiyatModal.data.items || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>Kalem bulunamadı.</div>
                                ) : (
                                    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc' }}>
                                                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: '700', border: '1px solid #e2e8f0' }}>Malzeme</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: '700', border: '1px solid #e2e8f0' }}>Miktar</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: '700', border: '1px solid #e2e8f0' }}>Birim</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: '700', border: '1px solid #e2e8f0' }}>Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(sevkiyatModal.data.items || []).map((it, idx) => {
                                                    const st = sevkiyatModal.data.itemStatuses?.[idx] || 'pending';
                                                    return (
                                                        <tr key={idx} style={{
                                                            background: st === 'purchased' ? '#f0fdf4' : st === 'cancelled' ? '#fef2f2' : 'white'
                                                        }}>
                                                            <td style={{
                                                                padding: '10px 12px',
                                                                fontWeight: '600',
                                                                color: st === 'purchased' ? '#166534' : st === 'cancelled' ? '#991b1b' : '#334155',
                                                                textDecoration: st === 'cancelled' ? 'line-through' : 'none',
                                                                border: '1px solid #e2e8f0'
                                                            }}>{it.itemName}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{it.amount}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>{it.unit}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                                                <span style={{
                                                                    fontSize: '11px', fontWeight: '700', borderRadius: '8px', padding: '2px 8px',
                                                                    background: st === 'purchased' ? '#dcfce7' : st === 'cancelled' ? '#fee2e2' : '#f1f5f9',
                                                                    color: st === 'purchased' ? '#166534' : st === 'cancelled' ? '#991b1b' : '#64748b'
                                                                }}>
                                                                    {st === 'purchased' ? 'ALINDI' : st === 'cancelled' ? 'İPTAL' : 'BEKLEMEDE'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── SİPARİŞLER TAB ── */}
                    {activeTab === 'siparisler' && (
                        <div className="animate-fade">
                            <div className="table-card mb-4" style={{ padding: '16px 20px' }}>
                                <span className="section-title"><Package size={17} /> Siparişler</span>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Satın alınan ve eksik malzemelerin takibi.
                                </div>
                            </div>

                            <div className="siparisler-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {/* SOL: Satın Alınan Malzemeler */}
                                <div className="table-card" style={{ padding: '0', overflow: 'hidden' }}>
                                    <div style={{
                                        padding: '10px 16px', background: '#f8fafb', borderBottom: '1px solid var(--border)',
                                        color: '#166534', fontWeight: '600', fontSize: '13px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}>
                                        <div className="flex align-center gap-2">
                                            <CheckCircle2 size={15} /> Satın Alınan Malzemeler
                                            <span style={{ background: 'rgba(22,163,74,0.1)', color: '#166534', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                                                {siparislerData.satinAlinan.length}
                                            </span>
                                        </div>
                                        <ExportButtons
                                            data={siparislerData.satinAlinan.map(it => ({
                                                Malzeme: it.itemName || '',
                                                Miktar: it.amount || 0,
                                                Birim: it.unit || '-',
                                                FormNo: it.formNo || '-'
                                            }))}
                                            title="Satın Alınan Malzemeler"
                                            columns={[
                                                { key: 'Malzeme', label: 'Malzeme' },
                                                { key: 'Miktar', label: 'Miktar' },
                                                { key: 'Birim', label: 'Birim' },
                                                { key: 'FormNo', label: 'Form No' }
                                            ]}
                                            filename="Satin_Alinanlar"
                                        />
                                    </div>
                                    {siparislerData.satinAlinan.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                            <CheckCircle2 size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                                            <div>Henüz satın alınan malzeme yok</div>
                                        </div>
                                    ) : (
                                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                            {siparislerData.satinAlinan.map((item, idx) => (
                                                <div key={`sa-${item.sevkiyatId}-${idx}`} style={{
                                                    padding: '10px 18px', borderBottom: '1px solid #f1f5f9',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    background: idx % 2 === 0 ? '#f0fdf4' : 'white',
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#166534', fontSize: '13px' }}>{item.itemName}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                            {item.amount} {item.unit}{item.adet ? ` x ${item.adet} adet` : ''} · {item.formNo}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
                                                        {item.requestedBy}<br />{item.tarihTR}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* SAĞ: Eksik Malzemeler */}
                                <div className="table-card" style={{ padding: '0', overflow: 'hidden' }}>
                                    <div style={{
                                        padding: '10px 16px', background: '#f8fafb', borderBottom: '1px solid var(--border)',
                                        color: '#991b1b', fontWeight: '600', fontSize: '13px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}>
                                        <div className="flex align-center gap-2">
                                            <AlertTriangle size={15} /> Eksik Malzemeler
                                            <span style={{ background: 'rgba(220,38,38,0.08)', color: '#991b1b', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                                                {siparislerData.eksikler.length}
                                            </span>
                                        </div>
                                        <ExportButtons
                                            data={siparislerData.eksikler.map(it => ({
                                                Malzeme: it.itemName || '',
                                                Miktar: it.amount || 0,
                                                Birim: it.unit || '-',
                                                FormNo: it.formNo || '-'
                                            }))}
                                            title="Eksik Malzemeler"
                                            columns={[
                                                { key: 'Malzeme', label: 'Malzeme' },
                                                { key: 'Miktar', label: 'Miktar' },
                                                { key: 'Birim', label: 'Birim' },
                                                { key: 'FormNo', label: 'Form No' }
                                            ]}
                                            filename="Eksik_Malzemeler"
                                        />
                                    </div>
                                    {siparislerData.eksikler.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                            <AlertTriangle size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                                            <div>Eksik malzeme yok</div>
                                        </div>
                                    ) : (
                                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                            {siparislerData.eksikler.map((item, idx) => (
                                                <div key={`ek-${item.sevkiyatId}-${idx}`} style={{
                                                    padding: '10px 18px', borderBottom: '1px solid #f1f5f9',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    background: idx % 2 === 0 ? '#fef2f2' : 'white',
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '13px' }}>{item.itemName}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                            {item.amount} {item.unit}{item.adet ? ` x ${item.adet} adet` : ''} · {item.formNo}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
                                                        {item.requestedBy}<br />{item.tarihTR}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SEVKİYAT TOAST ── */}
                    {sevkiyatToast.show && (
                        <div style={{
                            position: 'fixed', bottom: '28px', right: '28px', zIndex: 99999,
                            background: sevkiyatToast.type === 'error' ? '#fee2e2' : '#dcfce7',
                            color: sevkiyatToast.type === 'error' ? '#991b1b' : '#166534',
                            border: `1.5px solid ${sevkiyatToast.type === 'error' ? '#fca5a5' : '#86efac'}`,
                            borderRadius: '12px', padding: '14px 20px', maxWidth: '380px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px',
                            animation: 'slideInRight 0.3s ease',
                        }}>
                            {sevkiyatToast.type === 'error'
                                ? <XCircle size={18} />
                                : <CheckCircle2 size={18} />
                            }
                            {sevkiyatToast.message}
                        </div>
                    )}

                    {/* ── PUANTAJ TAB ── */}
                    {activeTab === 'puantaj' && (
                        <div className="animate-fade">
                            <div className="table-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="table-toolbar" style={{ flexShrink: 0 }}>
                                    <span className="section-title"><Users size={16} /> Personel Listesi</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            Toplam: <strong>{personel.length}</strong> &nbsp;|&nbsp; Aktif: <strong style={{ color: 'var(--success)' }}>{personel.filter(p => !p.cikisTarihi).length}</strong>
                                        </span>
                                        <button
                                            className="btn-primary"
                                            style={{ fontSize: '12px', padding: '6px 14px', gap: '6px', background: 'var(--success)' }}
                                            onClick={exportPuantajToExcel}
                                        >
                                            <FileSpreadsheet size={14} /> Günlük Puantaj Formu Oluştur
                                        </button>
                                        {canEdit && (
                                            <>
                                                <button
                                                    className="btn-primary"
                                                    style={{ fontSize: '12px', padding: '6px 14px', gap: '6px', background: 'var(--accent)' }}
                                                    onClick={handleNotionSync}
                                                    disabled={isSyncingNotion}
                                                    title="Notion'dan personel listesini güncelle"
                                                >
                                                    {isSyncingNotion ? '⟳ Güncelleniyor...' : '⟳ Notion\'dan Güncelle'}
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    style={{ fontSize: '12px', padding: '6px 14px', gap: '6px' }}
                                                    onClick={() => { setEditingPersonel(null); setPersonelForm({ tc: '', adSoyad: '', girisTarihi: '', cikisTarihi: '', taseron: '' }); setShowPersonelModal(true); }}
                                                >
                                                    <UserPlus size={14} /> Personel Ekle
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {(() => {
                                    const perSelKeys = tblSelKeys('personel');
                                    const perSelRows = personel.filter(p => perSelKeys.includes(String(p.id)));
                                    const perAllSel = personel.length > 0 && personel.every(p => isRowSel('personel', p.id));
                                    return canEdit && tblSelCount('personel') > 0 ? (
                                        <TableActionBar
                                            count={tblSelCount('personel')}
                                            totalCount={personel.length}
                                            allSelected={perAllSel}
                                            onSelectAll={() => selectAllTbl('personel', personel.map(p => String(p.id)))}
                                            onDelete={() => openBulkDel('personel', perSelRows)}
                                            onEdit={() => { if (perSelRows.length === 1) setEditRow({ row: perSelRows[0], collection: 'personel' }); }}
                                            onHighlight={() => openHLPicker('personel', perSelKeys)}
                                        />
                                    ) : null;
                                })()}
                                <div style={{ overflowY: 'auto', height: '555px' }}>
                                    <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <colgroup>
                                            <col style={{ width: '36px' }} />
                                            <col className="col-tarih" />
                                            <col className="col-tarih" />
                                            <col className="col-detay" />
                                            <col className="col-malzeme" />
                                            <col className="col-firma" />
                                            <col className="col-kategori" />
                                            {canEdit && <col style={{ width: '90px' }} />}
                                        </colgroup>
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-table-header)' }}>
                                            <tr>
                                                <th style={{ ...CB_TH, border: '1px solid var(--border)' }}></th>
                                                <th style={{ border: '1px solid var(--border)' }}>GİRİŞ TARİHİ</th>
                                                <th style={{ border: '1px solid var(--border)' }}>ÇIKIŞ TARİHİ</th>
                                                <th style={{ border: '1px solid var(--border)' }}>TC</th>
                                                <th style={{ border: '1px solid var(--border)' }}>AD SOYAD</th>
                                                <th style={{ border: '1px solid var(--border)' }}>TAŞERON</th>
                                                <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>DURUM</th>
                                                {canEdit && <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>İŞLEMLER</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {personel.length === 0 && (
                                                <tr>
                                                    <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                                        Henüz personel kaydı yok.
                                                    </td>
                                                </tr>
                                            )}
                                            {personel.map(p => (
                                                <tr key={p.id} style={{ ...hlRowStyle('personel', p.id) }} onContextMenu={isAdmin ? (e) => handleCtxMenu(e, p, 'personel') : undefined}>
                                                    <td style={{ ...CB_TD, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                        <input type="checkbox" style={CB_STYLE} checked={isRowSel('personel', p.id)} onChange={() => toggleSel('personel', String(p.id))} />
                                                    </td>
                                                    <td data-label="Giriş Tarihi" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{p.girisTarihi}</td>
                                                    <td data-label="Çıkış Tarihi" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{p.cikisTarihi || '—'}</td>
                                                    <td data-label="TC" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{p.tc}</td>
                                                    <td data-label="Ad Soyad" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>{p.adSoyad}</td>
                                                    <td data-label="Taşeron" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{p.taseron}</td>
                                                    <td data-label="Durum" style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                        {!p.cikisTarihi
                                                            ? <span className="movement-type-pill in">Çalışıyor</span>
                                                            : <span className="movement-type-pill out">Çıkış Yapıldı</span>
                                                        }
                                                    </td>
                                                    {canEdit && (
                                                        <td data-label="İşlemler" style={{ textAlign: 'center', border: '1px solid var(--border)' }}>
                                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                                <button
                                                                    className="btn-icon"
                                                                    title="Düzenle"
                                                                    onClick={() => {
                                                                        setEditingPersonel(p);
                                                                        setPersonelForm({ tc: p.tc, adSoyad: p.adSoyad, girisTarihi: p.girisTarihi, cikisTarihi: p.cikisTarihi || '', taseron: p.taseron });
                                                                        setShowPersonelModal(true);
                                                                    }}
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon"
                                                                    title="Sil"
                                                                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                                    onClick={() => handleDeletePersonel(p.id)}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── REQUESTS TAB ── */}
                    {activeTab === 'requests' && (
                        <div className="animate-fade split-view-container">
                            <div className="split-top">
                                <div className="table-card" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                    <div className="flex justify-between align-center mb-4">
                                        <div>
                                            <span className="section-title">
                                                <Clock size={16} /> Bekleyen Malzeme Talepleri
                                            </span>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Onay bekleyen son malzeme talepleri.
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <ExportButtons
                                                data={requests.filter(req => req.status === 'pending').map(req => ({
                                                    Malzeme: req.itemName || '',
                                                    Miktar: req.amount || 0,
                                                    TalepEden: req.requestedBy || '',
                                                    Tarih: String(req.date || '').split(',')[0].split(' ')[0]
                                                }))}
                                                title="Bekleyen Malzeme Talepleri"
                                                columns={[
                                                    { key: 'Malzeme', label: 'Malzeme' },
                                                    { key: 'Miktar', label: 'Miktar' },
                                                    { key: 'TalepEden', label: 'Talep Eden' },
                                                    { key: 'Tarih', label: 'Tarih' }
                                                ]}
                                                filename="Bekleyen_Talepler"
                                            />
                                            <button className="btn-primary" onClick={() => setShowRequestModal(true)}
                                                style={{ fontSize: '13px', padding: '7px 14px' }}>
                                                <Plus size={15} /> Yeni Talep
                                            </button>
                                        </div>
                                    </div>

                                    <div className="scrollable-pending-list">
                                        {(() => {
                                            const pendingReqs = requests.filter(r => r.status === 'pending');
                                            const reqSelKeys = tblSelKeys('requests');
                                            const reqSelRows = pendingReqs.filter(r => reqSelKeys.includes(String(r.id)));
                                            const reqAllSel = pendingReqs.length > 0 && pendingReqs.every(r => isRowSel('requests', r.id));
                                            return canEdit && tblSelCount('requests') > 0 ? (
                                                <TableActionBar
                                                    count={tblSelCount('requests')}
                                                    totalCount={pendingReqs.length}
                                                    allSelected={reqAllSel}
                                                    onSelectAll={() => selectAllTbl('requests', pendingReqs.map(r => String(r.id)))}
                                                    onDelete={() => openBulkDel('requests', reqSelRows)}
                                                    onEdit={() => { if (reqSelRows.length === 1) setEditRow({ row: reqSelRows[0], collection: 'requests' }); }}
                                                    onHighlight={() => openHLPicker('requests', reqSelKeys)}
                                                />
                                            ) : null;
                                        })()}
                                        <div className="table-responsive-wrapper">
                                            <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                                <colgroup>
                                                    <col style={{ width: '36px' }} />
                                                    <col className="col-tarih" />
                                                    <col className="col-malzeme" />
                                                    <col className="col-miktar" />
                                                    <col className="col-firma" />
                                                    {canEdit && <col className="col-islem" />}
                                                </colgroup>
                                                <thead>
                                                    <tr>
                                                        <th style={{ ...CB_TH, border: '1px solid var(--border)' }}></th>
                                                        <th style={{ border: '1px solid var(--border)' }}>TARİH</th>
                                                        <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                                        <th style={{ textAlign: 'right', border: '1px solid var(--border)' }}>MİKTAR</th>
                                                        <th style={{ border: '1px solid var(--border)' }}>TALEP EDEN</th>
                                                        {canEdit && <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>İŞLEMLER</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {requests.filter(r => r.status === 'pending').length === 0 ? (
                                                        <tr><td colSpan={canEdit ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Bekleyen talep yok.</td></tr>
                                                    ) : requests.filter(r => r.status === 'pending').map(req => (
                                                        <tr key={req.id} style={{ ...hlRowStyle('requests', req.id) }} onContextMenu={isAdmin ? (e) => handleCtxMenu(e, req, 'requests') : undefined}>
                                                            <td style={{ ...CB_TD, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                                <input type="checkbox" style={CB_STYLE} checked={isRowSel('requests', req.id)} onChange={() => toggleSel('requests', String(req.id))} />
                                                            </td>
                                                            <td data-label="Tarih" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{String(req.date || '').split(',')[0].split(' ')[0]}</td>
                                                            <td data-label="Malzeme" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>{req.itemName}</td>
                                                            <td data-label="Miktar" style={{ textAlign: 'right', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{req.amount} {req.unit}</td>
                                                            <td data-label="Talep Eden" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{req.requestedBy}</td>
                                                            {canEdit && (
                                                                <td data-label="İşlemler" style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                                                                    <div className="flex gap-2 justify-center">
                                                                        <button
                                                                            className="btn-primary"
                                                                            style={{ background: 'var(--success)', fontSize: '11px', padding: '5px 12px' }}
                                                                            onClick={() => handleApproveRequest(req)}
                                                                        >
                                                                            Onayla
                                                                        </button>
                                                                        <button
                                                                            className="btn-primary"
                                                                            style={{ background: 'var(--danger)', fontSize: '11px', padding: '5px 12px' }}
                                                                            onClick={() => handleRejectRequest(req)}
                                                                        >
                                                                            Reddet
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="section-divider"></div>

                            <div className="split-bottom">
                                {(() => {
                                    const approvedReqs = requests.filter(r => r.status === 'approved' && !r.sevkiyatId);
                                    const currentDraftNo = `AFAD.MT.${new Date().getFullYear()}-${purchaseFormId.slice(-4)}`;
                                    const purchaseCols = [
                                        { key: 'itemName', label: 'Malzeme' },
                                        { key: 'amount', label: 'Miktar' },
                                        { key: 'unit', label: 'Birim' },
                                        { key: 'adet', label: 'Adet' },
                                        { key: 'requestedBy', label: 'Talep Eden' },
                                        { key: 'note', label: 'Açıklama' },
                                        { key: 'approvedBy', label: 'Onaylayan' },
                                        { key: 'approvedAt', label: 'Onay Tarihi' },
                                    ];

                                    return (
                                        <div className="shrink-effect flex flex-column" ref={satinAlimRef} style={{ animation: 'fadeIn 0.4s ease', minHeight: 0, flex: 1 }}>
                                            <div className="table-card mb-3" style={{ flexShrink: 0 }}>
                                                <div className="table-toolbar">
                                                    <div className="flex align-center gap-3">
                                                        <span className="section-title"><ShoppingCart size={17} /> Malzeme Talep Formu</span>
                                                        <span className="movement-type-pill in">{currentDraftNo}</span>
                                                    </div>
                                                    {approvedReqs.length > 0 && (
                                                        <div className="flex gap-2">
                                                            <button className="btn-primary" style={{ background: 'var(--success)', fontSize: '12px', padding: '6px 12px' }}
                                                                onClick={() => exportToExcelGeneral(approvedReqs, purchaseCols, 'Satin_Alim_Listesi')}>
                                                                <FileSpreadsheet size={15} /> Excel
                                                            </button>
                                                            <button className="btn-primary" style={{ background: 'var(--danger)', fontSize: '12px', padding: '6px 12px' }}
                                                                onClick={() => exportToPDF(approvedReqs, 'Satın Alım Listesi', purchaseCols, 'Satin_Alim_Listesi')}>
                                                                <Download size={15} /> PDF
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="table-card scrollable-purchase-list">
                                                {approvedReqs.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                                        <ShoppingCart size={32} style={{ opacity: 0.2, marginBottom: 10 }} />
                                                        <div style={{ fontWeight: '600', fontSize: '13px' }}>Malzeme talep listesi boş</div>
                                                    </div>
                                                ) : (
                                                    <div className="table-responsive-wrapper">
                                                        <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                                            <colgroup>
                                                                <col style={{ width: '40px' }} />
                                                                <col className="col-malzeme" />
                                                                <col className="col-miktar" />
                                                                <col className="col-miktar" />
                                                                <col className="col-birim" />
                                                                <col className="col-firma" />
                                                                <col className="col-detay" />
                                                            </colgroup>
                                                            <thead>
                                                                <tr>
                                                                    <th style={{ border: '1px solid var(--border)' }}>#</th>
                                                                    <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>STOK</th>
                                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>TALEP</th>
                                                                    <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>BİRİM</th>
                                                                    <th style={{ border: '1px solid var(--border)' }}>TALEP EDEN</th>
                                                                    <th style={{ border: '1px solid var(--border)' }}>ACIKLAMA</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {approvedReqs.map((req, idx) => {
                                                                    const stockItem = items.find(i => Number(i.id) === Number(req.itemId));
                                                                    const stockQty = stockItem ? stockItem.quantity : 0;
                                                                    return (
                                                                        <tr key={req.id}>
                                                                            <td data-label="#" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{idx + 1}</td>
                                                                            <td data-label="Malzeme" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>{req.itemName}</td>
                                                                            <td data-label="Stok" style={{ textAlign: 'center', border: '1px solid var(--border)' }}>
                                                                                <span style={{ color: stockQty <= 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '600' }}>
                                                                                    {formatNumber(stockQty)}
                                                                                </span>
                                                                            </td>
                                                                            <td data-label="Miktar" style={{ textAlign: 'center', border: '1px solid var(--border)' }}>{req.amount}</td>
                                                                            <td data-label="Birim" style={{ textAlign: 'center', border: '1px solid var(--border)' }}>{req.unit}</td>
                                                                            <td data-label="Talep Eden" style={{ border: '1px solid var(--border)' }}>{req.requestedBy}</td>
                                                                            <td data-label="Açıklama" style={{ border: '1px solid var(--border)' }}>{req.note || '—'}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>

                                            {canEdit && approvedReqs.length > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', flexShrink: 0 }}>
                                                    <button onClick={handleSatisaGonder} disabled={sevkiyatLoading}
                                                        style={{
                                                            padding: '8px 18px', borderRadius: '6px',
                                                            background: '#dc2626', color: 'white',
                                                            border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}>
                                                        <Truck size={16} /> {sevkiyatLoading ? 'Gönderiliyor...' : 'Satışa Gönder'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* ── AYARLAR TAB ── */}
                    {activeTab === 'settings' && canEdit && (
                        <div className="animate-fade" style={{ maxWidth: '640px', margin: '0 auto' }}>
                            {/* Sayfa başlığı */}
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Ayarlar</h2>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Uygulama tercihleri ve veri yönetimi</p>
                            </div>

                            {/* Görünüm Kartı */}
                            <div className="card" style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <Sun size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Görünüm</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gündüz veya gece modunu seçin</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setTheme('light')}
                                        style={{
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '12px 16px', borderRadius: '10px',
                                            border: theme === 'light' ? '2px solid var(--primary)' : '2px solid var(--border)',
                                            background: theme === 'light' ? 'var(--primary-glow)' : 'var(--bg-main)',
                                            color: theme === 'light' ? 'var(--primary)' : 'var(--text-muted)',
                                            fontWeight: theme === 'light' ? '700' : '500',
                                            fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit'
                                        }}
                                    >
                                        <Sun size={16} /> Gündüz
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        style={{
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '12px 16px', borderRadius: '10px',
                                            border: theme === 'dark' ? '2px solid var(--primary)' : '2px solid var(--border)',
                                            background: theme === 'dark' ? 'var(--primary-glow)' : 'var(--bg-main)',
                                            color: theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)',
                                            fontWeight: theme === 'dark' ? '700' : '500',
                                            fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit'
                                        }}
                                    >
                                        <Moon size={16} /> Gece
                                    </button>
                                </div>
                            </div>

                            {/* Raporlar Kartı */}
                            <div className="card" style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                                        <FileSpreadsheet size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Excel Raporları</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Stok ve hareket raporlarını dışa aktarın</div>
                                    </div>
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '10px', background: 'var(--success)' }}
                                    onClick={() => { setExportType('stock'); setSelectedItemsForExport(items.map(i => i.id)); setShowExportModal(true); }}
                                >
                                    <FileSpreadsheet size={15} /> Excel Raporu Hazırla
                                </button>
                            </div>

                            {/* Veri Yönetimi Kartı */}
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                                        <Download size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Veri Yönetimi</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Verilerinizi yedekleyin veya geri yükleyin</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ width: '100%', justifyContent: 'center', padding: '10px', background: '#475569' }}
                                        onClick={backupData}
                                    >
                                        <Download size={15} /> Veriyi Yedekle (JSON)
                                    </button>
                                    {isAdmin && (
                                        <button
                                            className="btn-primary"
                                            style={{ width: '100%', justifyContent: 'center', padding: '10px', background: '#64748b' }}
                                            onClick={() => fileInputRef.current.click()}
                                        >
                                            <Upload size={15} /> Yedek Yükle
                                        </button>
                                    )}
                                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={restoreData} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── MODALS (Global) ── */}

                    {/* Excel Export Modal */}
                    {showExportModal && (
                        <div className="modal-overlay">
                            <div className="modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                                <div className="modal-header">
                                    <span className="modal-title flex align-center gap-1"><FileSpreadsheet size={18} /> Excel Raporu Hazırla</span>
                                    <button className="btn-icon" onClick={() => setShowExportModal(false)}><X size={16} /></button>
                                </div>
                                <div className="flex gap-2 mb-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                    <button className={`btn-${exportType === 'stock' ? 'primary' : 'ghost'}`} style={{ flex: 1 }} onClick={() => setExportType('stock')}>Mevcut Stok</button>
                                    <button className={`btn-${exportType === 'movements' ? 'primary' : 'ghost'}`} style={{ flex: 1 }} onClick={() => setExportType('movements')}>Stok Hareketleri</button>
                                </div>
                                {exportType === 'movements' ? (
                                    <div className="animate-fade">
                                        <div className="flex gap-2 mb-2">
                                            <div style={{ flex: 1 }}>
                                                <label className="label">Başlangıç Tarihi</label>
                                                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label className="label">Bitiş Tarihi</label>
                                                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                                            </div>
                                        </div>
                                        <button className="btn-primary" style={{ width: '100%', background: '#059669' }} onClick={() => { exportMovementsToExcel(dateRange.start, dateRange.end); setShowExportModal(false); }}>Hareket Raporu Oluştur</button>
                                    </div>
                                ) : (
                                    <div className="animate-fade">
                                        <label className="label">Malzemeleri Seçin ({selectedItemsForExport.length})</label>
                                        <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', marginBottom: '1rem' }}>
                                            {items.map(item => (
                                                <label key={item.id} className="flex align-center gap-2 mb-1" style={{ cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={selectedItemsForExport.includes(item.id)} onChange={(e) => {
                                                        if (e.target.checked) setSelectedItemsForExport([...selectedItemsForExport, item.id]);
                                                        else setSelectedItemsForExport(selectedItemsForExport.filter(id => id !== item.id));
                                                    }} />
                                                    <span style={{ fontSize: '14px' }}>{item.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <button className="btn-primary" style={{ width: '100%', background: '#059669' }} onClick={() => { exportFilteredStockToExcel(selectedItemsForExport); setShowExportModal(false); }}>Stok Raporu Oluştur</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Add/Edit Item Modal */}
                    {showModal && canEdit && (
                        <div className="modal-overlay">
                            <div className="modal-card">
                                <div className="modal-header">
                                    <span className="modal-title">{editingItem ? 'Malzeme Düzenle' : 'Yeni Malzeme'}</span>
                                    <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
                                </div>
                                <form onSubmit={handleAddItem}>
                                    <div className="mb-2"><label className="label">Malzeme Adı</label><input name="name" defaultValue={editingItem?.name} required placeholder="Örn: 20mm Boru" /></div>
                                    <div className="flex gap-2 mb-2">
                                        <div style={{ flex: 1 }}><label className="label">Kategori</label><select name="category" defaultValue={editingItem?.category || 'Genel'}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
                                        <div style={{ flex: 1 }}><label className="label">Birim</label><select name="unit" defaultValue={editingItem?.unit || 'Adet'}><option>Adet</option><option>Torba</option><option>Metre</option><option>Palet</option><option>M3</option><option>Ton</option></select></div>
                                    </div>
                                    <div className="flex gap-2 mb-2">
                                        {!editingItem && (<div style={{ flex: 1 }}><label className="label">Başl. Stoğu</label><input name="quantity" type="number" defaultValue="0" min="0" /></div>)}
                                        <div style={{ flex: 1 }}><label className="label">Kritik Limit</label><input name="minStock" type="number" defaultValue={editingItem?.minStock || '10'} min="0" /></div>
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={isSaving} style={{ width: '100%', marginTop: '1rem', opacity: isSaving ? 0.7 : 1 }}>
                                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Move Stock Modal */}
                    {showMoveModal && (pagePerm('action_giris') === 'edit' || pagePerm('action_cikis') === 'edit') && (() => {
                        const isIn = movementType === 'in';
                        const accentGradient = isIn
                            ? 'linear-gradient(160deg, #34d399 0%, #059669 100%)'
                            : 'linear-gradient(160deg, #f87171 0%, #dc2626 100%)';
                        const closeModal = () => {
                            setShowMoveModal(false); setIsQuickAdd(false); setIsNewRecipient(false);
                            setInIrsaliyeNo(''); setShowAddMalzemeAdi(false); setShowAddMalzemeTuru(false);
                            setShowAddBirim(false); setShowAddFirma(false); setShowAddIrsaliye(false);
                            setShowAddVerilenBirim(false); setShowAddKullanimAlani(false); setShowAddRecipient(false);
                            setNewVerilenBirimInput(''); setNewKullanimAlaniInput(''); setNewRecipientInput('');
                        };
                        return (
                            <div className="modal-overlay">
                                <div className="fm-modal">
                                    {/* Sol Panel */}
                                    <div className="fm-panel" style={{ background: accentGradient }}>
                                        <div className="fm-panel-icon">
                                            {isIn ? <ArrowUpRight size={30} /> : <ArrowDownLeft size={30} />}
                                        </div>
                                        <div className="fm-panel-title">
                                            {isIn ? 'Malzeme\nGirişi' : 'Malzeme\nÇıkışı'}
                                        </div>
                                        <div className="fm-panel-desc">
                                            {isIn
                                                ? 'Depoya gelen malzemeleri kayıt altına alın'
                                                : 'Depodan çıkan malzemeleri takip edin'}
                                        </div>
                                    </div>

                                    {/* Sağ Gövde */}
                                    <div className="fm-body">
                                        <div className="fm-close-row">
                                            <button className="btn-icon" onClick={closeModal}><X size={16} /></button>
                                        </div>

                                        <form onSubmit={handleMoveStock} className="fm-form">
                                            {isIn ? (
                                                <>
                                                    {/* 1. Tarih */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row"><span className="fm-label">Tarih</span></div>
                                                        <input className="fm-input" name="actionDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                                                    </div>

                                                    {/* 2. Firma */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Firma</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddFirma(v => !v)}>+ Ekle</button>
                                                        </div>
                                                        {showAddFirma && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newFirmaInput} onChange={e => setNewFirmaInput(e.target.value)} placeholder="Firma adı..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => { if (!newFirmaInput.trim()) return; const id = String(Date.now()); await set(ref(db, `firmalar/${id}`), { id, name: newFirmaInput.trim() }); setNewFirmaInput(''); setShowAddFirma(false); }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddFirma(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <input className="fm-input" list="firma-datalist" value={inFirmaAdi} onChange={e => setInFirmaAdi(e.target.value)} placeholder="Firma adı yazın..." autoComplete="off" />
                                                        <datalist id="firma-datalist">{allFirmaAdlari.map(f => <option key={f} value={f} />)}</datalist>
                                                    </div>

                                                    {/* 3. İrsaliye No */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">İrsaliye No</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddIrsaliye(v => !v)}>+ Ekle</button>
                                                        </div>
                                                        {showAddIrsaliye && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newIrsaliyeInput} onChange={e => setNewIrsaliyeInput(e.target.value)} placeholder="İrsaliye numarası..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => { if (!newIrsaliyeInput.trim()) return; const id = String(Date.now()); await set(ref(db, `irsaliyeListesi/${id}`), { id: Number(id), no: newIrsaliyeInput.trim() }); setInIrsaliyeNo(newIrsaliyeInput.trim()); setNewIrsaliyeInput(''); setShowAddIrsaliye(false); }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddIrsaliye(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <input className="fm-input" name="irsaliyeNo" list="irsaliye-datalist" value={inIrsaliyeNo} onChange={e => setInIrsaliyeNo(e.target.value)} placeholder="Örn: IRS-2026-001" autoComplete="off" />
                                                        <datalist id="irsaliye-datalist">{irsaliyeListesi.map(i => <option key={i.id} value={i.no} />)}</datalist>
                                                    </div>

                                                    {/* 4. Malzeme */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Malzeme</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddMalzemeAdi(v => !v)}>+ Yeni Ekle</button>
                                                        </div>
                                                        {showAddMalzemeAdi && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newMalzemeAdiInput} onChange={e => setNewMalzemeAdiInput(e.target.value)} placeholder="Yeni malzeme adı..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 14px', background: 'var(--success)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => { if (!newMalzemeAdiInput.trim()) return; const id = String(Date.now()); await set(ref(db, `items/${id}`), { id: Number(id), name: newMalzemeAdiInput.trim(), unit: 'Adet', category: 'Genel', quantity: 0, minStock: 0 }); setNewMalzemeAdiInput(''); setShowAddMalzemeAdi(false); }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddMalzemeAdi(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <input className="fm-input" list="malzeme-datalist" value={inMalzemeAdi} onChange={e => setInMalzemeAdi(e.target.value)} placeholder="Malzeme adı yazın veya seçin..." required autoComplete="off" />
                                                        <datalist id="malzeme-datalist">{sortedItems.map(i => <option key={i.id} value={i.name} />)}</datalist>
                                                    </div>

                                                    {/* 5. Miktar */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row"><span className="fm-label">Miktar</span></div>
                                                        <input className="fm-input" name="amount" type="number" required min="0.01" step="0.01" placeholder="0.00" />
                                                    </div>

                                                    {/* 6. Birim */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Birim</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddBirim(v => !v)}>+ Ekle</button>
                                                        </div>
                                                        {showAddBirim && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newBirimInput} onChange={e => setNewBirimInput(e.target.value)} placeholder="Yeni birim..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => { if (!newBirimInput.trim()) return; const id = String(Date.now()); await set(ref(db, `birimler/${id}`), { id, name: newBirimInput.trim() }); setNewBirimInput(''); setShowAddBirim(false); }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddBirim(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <select name="unit" className="fm-input">{birimlerList.map(b => <option key={b}>{b}</option>)}</select>
                                                    </div>

                                                    {/* 7. Birim Fiyat */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Birim Fiyat</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>opsiyonel</span>
                                                        </div>
                                                        <div style={{ position: 'relative' }}>
                                                            <input className="fm-input" name="price" type="number" min="0" step="0.01" placeholder="0.00" style={{ paddingRight: '32px' }} />
                                                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }}>₺</span>
                                                        </div>
                                                    </div>

                                                    {/* 8. Teslim Alan */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Teslim Alan</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddTeslimAlan(v => !v)}>+ Ekle</button>
                                                        </div>
                                                        {showAddTeslimAlan && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newTeslimAlanAdi} onChange={e => setNewTeslimAlanAdi(e.target.value)} placeholder="Kişi adı..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => { if (!newTeslimAlanAdi.trim()) return; const id = String(Date.now()); await set(ref(db, `teslimAlanlar/${id}`), { id, name: newTeslimAlanAdi.trim() }); setNewTeslimAlanAdi(''); setShowAddTeslimAlan(false); }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddTeslimAlan(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <select name="teslimAlan" className="fm-input">
                                                            <option value="">— Seçin —</option>
                                                            {teslimAlanlar.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                        </select>
                                                    </div>

                                                     {/* 9. Malzeme Türü / Kategori */}
                                                     <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Malzeme Kategorisi</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddMalzemeTuru(v => !v)}>+ Ekle</button>
                                                        </div>
                                                        {showAddMalzemeTuru && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newMalzemeTuruInput} onChange={e => setNewMalzemeTuruInput(e.target.value)} placeholder="Yeni kategori adı..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => { 
                                                                        if (!newMalzemeTuruInput.trim()) return; 
                                                                        const id = String(Date.now()); 
                                                                        await set(ref(db, `malzemeTurleri/${id}`), newMalzemeTuruInput.trim()); 
                                                                        setNewMalzemeTuruInput(''); 
                                                                        setShowAddMalzemeTuru(false); 
                                                                    }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddMalzemeTuru(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <select name="malzemeTuru" className="fm-input">
                                                            <option value="">Genel</option>
                                                            {malzemeTurleri.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Tarih */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row"><span className="fm-label">Tarih</span></div>
                                                        <input className="fm-input" name="actionDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                                                    </div>
                                                    {/* Malzeme */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Malzeme</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddMalzemeAdi(v => !v)}>+ Yeni Ekle</button>
                                                        </div>
                                                        {showAddMalzemeAdi && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newMalzemeAdiInput} onChange={e => setNewMalzemeAdiInput(e.target.value)} placeholder="Yeni malzeme adı..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 14px', background: 'var(--success)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => {
                                                                        if (!newMalzemeAdiInput.trim()) return;
                                                                        const id = Date.now();
                                                                        const newItem = { id: Number(id), name: newMalzemeAdiInput.trim(), unit: 'Adet', category: 'Genel', quantity: 0, minStock: 0 };
                                                                        await set(ref(db, `items/${id}`), newItem);
                                                                        setSelectedItemForMove(newItem);
                                                                        setNewMalzemeAdiInput('');
                                                                        setShowAddMalzemeAdi(false);
                                                                    }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddMalzemeAdi(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <select className="fm-input" name="itemId" required value={selectedItemForMove?.id || ''} onChange={e => setSelectedItemForMove(items.find(i => String(i.id) === String(e.target.value)))}>
                                                            <option value="" disabled>— Seçin —</option>
                                                            {sortedItems.map(i => <option key={i.id} value={i.id}>{i.name} (Stok: {i.quantity})</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Miktar */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row"><span className="fm-label">Miktar</span></div>
                                                        <input className="fm-input" name="amount" type="number" required min="0.01" step="0.01" placeholder="0.00" />
                                                    </div>

                                                    {/* Birim */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Birim</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddBirim(v => !v)}>+ Ekle</button>
                                                        </div>
                                                        {showAddBirim && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newBirimInput} onChange={e => setNewBirimInput(e.target.value)} placeholder="Yeni birim..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => { if (!newBirimInput.trim()) return; const id = String(Date.now()); await set(ref(db, `birimler/${id}`), { id, name: newBirimInput.trim() }); setNewBirimInput(''); setShowAddBirim(false); }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddBirim(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <select className="fm-input" name="unit" defaultValue={selectedItemForMove?.unit || 'Adet'}>
                                                            {birimlerList.map(b => <option key={b}>{b}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Verilen Birim */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Verilen Birim</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddVerilenBirim(v => !v)}>+ Ekle</button>
                                                        </div>
                                                        {showAddVerilenBirim && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newVerilenBirimInput} onChange={e => setNewVerilenBirimInput(e.target.value)} placeholder="Yeni birim/ekip..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => { if (!newVerilenBirimInput.trim()) return; const id = String(Date.now()); await set(ref(db, `verilenBirimler/${id}`), { id, name: newVerilenBirimInput.trim() }); setNewVerilenBirimInput(''); setShowAddVerilenBirim(false); }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddVerilenBirim(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <select className="fm-input" name="verilenBirim">
                                                            <option value="">— Seçin —</option>
                                                            {uniqueVerilenBirimler.map(v => <option key={v} value={v}>{v}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Verilen Kişi */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Verilen Kişi</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddRecipient(v => !v)}>+ Ekle</button>
                                                        </div>
                                                        {showAddRecipient && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newRecipientInput} onChange={e => setNewRecipientInput(e.target.value)} placeholder="Kişi adı..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => {
                                                                        if (!newRecipientInput.trim()) return;
                                                                        const id = String(Date.now());
                                                                        await set(ref(db, `teslimAlanlar/${id}`), { id, name: newRecipientInput.trim() });
                                                                        setShowAddRecipient(false);
                                                                    }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddRecipient(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <select className="fm-input" name="recipient">
                                                            <option value="">— Seçin —</option>
                                                            {newRecipientInput && <option value={newRecipientInput}>{newRecipientInput} (Yeni)</option>}
                                                            {[...new Set([...uniqueRecipients, ...teslimAlanlar.map(t => t.name)])].sort((a, b) => a.localeCompare(b, 'tr')).map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Kullanım Alanı */}
                                                    <div className="fm-field">
                                                        <div className="fm-label-row">
                                                            <span className="fm-label">Kullanım Alanı</span>
                                                            <button type="button" className="fm-add-chip" onClick={() => setShowAddKullanimAlani(v => !v)}>+ Ekle</button>
                                                        </div>
                                                        {showAddKullanimAlani && (
                                                            <div className="fm-inline-add" style={{ marginBottom: '6px' }}>
                                                                <input className="fm-input" value={newKullanimAlaniInput} onChange={e => setNewKullanimAlaniInput(e.target.value)} placeholder="Yeni kullanım alanı..." style={{ flex: 1 }} />
                                                                <button type="button" className="fm-btn-submit" style={{ flex: '0 0 auto', padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', fontSize: '12px' }}
                                                                    onClick={async () => { if (!newKullanimAlaniInput.trim()) return; const id = String(Date.now()); await set(ref(db, `kullanimAlanlari/${id}`), { id, name: newKullanimAlaniInput.trim() }); setNewKullanimAlaniInput(''); setShowAddKullanimAlani(false); }}>
                                                                    Kaydet
                                                                </button>
                                                                <button type="button" className="btn-icon" onClick={() => setShowAddKullanimAlani(false)}><X size={14} /></button>
                                                            </div>
                                                        )}
                                                        <select className="fm-input" name="kullanimAlani">
                                                            <option value="">— Seçin —</option>
                                                            {uniqueKullanimAlanlari.map(k => <option key={k} value={k}>{k}</option>)}
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            <div className="fm-footer">
                                                <button type="button" className="fm-btn-cancel" onClick={closeModal}>İptal</button>
                                                <button
                                                    type="submit"
                                                    className="fm-btn-submit"
                                                    disabled={isSaving || (movementType === 'out' && !selectedItemForMove) || (movementType === 'in' && !inMalzemeAdi.trim())}
                                                    style={{ background: isIn ? 'linear-gradient(135deg, #34d399, #059669)' : 'linear-gradient(135deg, #f87171, #dc2626)' }}
                                                >
                                                    {isSaving ? 'İşleniyor...' : (isIn ? '↑ Girişi Tamamla' : '↓ Çıkışı Tamamla')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Zimmet Modal */}
                    {showZimmetModal && pagePerm('action_zimmet') === 'edit' && (
                        <div className="modal-overlay">
                            <div className="fm-modal">
                                {/* Sol Panel */}
                                <div className="fm-panel" style={{ background: 'linear-gradient(160deg, #a78bfa 0%, #6d28d9 100%)' }}>
                                    <div className="fm-panel-icon">
                                        <UserCheck size={30} />
                                    </div>
                                    <div className="fm-panel-title">Malzeme Zimmet</div>
                                    <div className="fm-panel-desc">Malzemeyi kişi veya ekibe zimmetleyin</div>
                                </div>

                                {/* Sağ Gövde */}
                                <div className="fm-body">
                                    <div className="fm-close-row">
                                        <button className="btn-icon" onClick={() => setShowZimmetModal(false)}><X size={16} /></button>
                                    </div>
                                    <form onSubmit={handleZimmet} className="fm-form">

                                        <div className="fm-field">
                                            <div className="fm-label-row"><span className="fm-label">İşlem Tarihi</span></div>
                                            <input className="fm-input" name="actionDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                                        </div>

                                        <div className="fm-field">
                                            <div className="fm-label-row"><span className="fm-label">Malzeme</span></div>
                                            <select className="fm-input" name="itemId" required value={selectedItemForZimmet?.id || ''} onChange={e => setSelectedItemForZimmet(items.find(i => String(i.id) === e.target.value))}>
                                                <option value="" disabled>— Seçin —</option>
                                                {sortedItems.map(i => <option key={i.id} value={i.id}>{i.name} (Stok: {i.quantity})</option>)}
                                            </select>
                                        </div>

                                        <div className="fm-field">
                                            <div className="fm-label-row"><span className="fm-label">Kişi / Ekip</span></div>
                                            <input className="fm-input" name="person" required placeholder="Örn: Ahmet Yılmaz / Tesisat Ekibi" />
                                        </div>

                                        <div className="fm-grid-2">
                                            <div>
                                                <div className="fm-label-row"><span className="fm-label">Miktar</span></div>
                                                <input className="fm-input" name="amount" type="number" defaultValue="1" min="1" required />
                                            </div>
                                            <div>
                                                <div className="fm-label-row"><span className="fm-label">Birim</span></div>
                                                <select className="fm-input" name="unit" defaultValue={selectedItemForZimmet?.unit || 'Adet'}>
                                                    <option>Adet</option><option>Torba</option><option>Metre</option><option>Palet</option><option>M3</option><option>Ton</option><option>Kg</option><option>Lt</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="fm-field">
                                            <div className="fm-label-row"><span className="fm-label">Not / Açıklama</span><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>opsiyonel</span></div>
                                            <input className="fm-input" name="note" placeholder="Örn: Geçici kullanım için" />
                                        </div>

                                        <div className="fm-footer">
                                            <button type="button" className="fm-btn-cancel" onClick={() => setShowZimmetModal(false)}>İptal</button>
                                            <button
                                                type="submit"
                                                className="fm-btn-submit"
                                                disabled={isSaving || !selectedItemForZimmet}
                                                style={{ background: 'linear-gradient(135deg, #a78bfa, #6d28d9)' }}
                                            >
                                                {isSaving ? 'İşleniyor...' : '✓ Zimmeti Kaydet'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personel Add/Edit Modal */}
                    {showPersonelModal && (
                        <div className="modal-overlay" onClick={() => setShowPersonelModal(false)}>
                            <div className="modal-card" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <span className="modal-title">{editingPersonel ? 'Personel Düzenle' : 'Yeni Personel Ekle'}</span>
                                    <button className="btn-icon" onClick={() => { setShowPersonelModal(false); setEditingPersonel(null); }}><X size={16} /></button>
                                </div>
                                <div className="mb-3">
                                    <label className="label">TC Kimlik No</label>
                                    <input
                                        type="text"
                                        maxLength={11}
                                        placeholder="11 haneli TC kimlik numarası"
                                        value={personelForm.tc}
                                        onChange={e => setPersonelForm(f => ({ ...f, tc: e.target.value.replace(/\D/g, '') }))}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="label">Ad Soyad</label>
                                    <input
                                        type="text"
                                        placeholder="Personelin adı ve soyadı"
                                        value={personelForm.adSoyad}
                                        onChange={e => setPersonelForm(f => ({ ...f, adSoyad: e.target.value }))}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="label">Taşeron</label>
                                    <input
                                        type="text"
                                        placeholder="Bağlı olduğu taşeron firma"
                                        value={personelForm.taseron}
                                        onChange={e => setPersonelForm(f => ({ ...f, taseron: e.target.value }))}
                                    />
                                </div>
                                <div className="form-row">
                                    <div style={{ flex: 1 }}>
                                        <label className="label">Giriş Tarihi</label>
                                        <input
                                            type="text"
                                            placeholder="GG.AA.YYYY"
                                            value={personelForm.girisTarihi}
                                            onChange={e => setPersonelForm(f => ({ ...f, girisTarihi: e.target.value }))}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="label">Çıkış Tarihi <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsiyonel)</span></label>
                                        <input
                                            type="text"
                                            placeholder="GG.AA.YYYY"
                                            value={personelForm.cikisTarihi}
                                            onChange={e => setPersonelForm(f => ({ ...f, cikisTarihi: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button className="btn-ghost" type="button" onClick={() => { setShowPersonelModal(false); setEditingPersonel(null); }}>İptal</button>
                                    <button className="btn-primary" type="button" onClick={handleSavePersonel} disabled={isSaving}>
                                        {isSaving ? 'Kaydediliyor...' : (editingPersonel ? 'Güncelle' : 'Kaydet')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Add/Edit Modal */}
                    {showUserModal && isAdmin && (
                        <div className="modal-overlay">
                            <div className="modal-card">
                                <div className="modal-header">
                                    <span className="modal-title">{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</span>
                                    <button className="btn-icon" onClick={() => { setShowUserModal(false); setEditingUser(null); }}><X size={16} /></button>
                                </div>
                                <form onSubmit={handleSaveUser}>
                                    <div className="mb-3">
                                        <label className="label">Ad Soyad</label>
                                        <input name="name" required defaultValue={editingUser?.name || ''} placeholder="Kullanıcı adı soyadı" />
                                    </div>

                                    <div className="mb-3">
                                        <label className="label">E-posta</label>
                                        <input
                                            name="email"
                                            type="email"
                                            required={!editingUser}
                                            defaultValue={editingUser?.email || ''}
                                            disabled={!!editingUser}
                                            placeholder="ornek@email.com"
                                            style={editingUser ? { background: '#f1f5f9', color: '#94a3b8' } : {}}
                                        />
                                    </div>

                                    {!editingUser && (
                                        <div className="mb-3">
                                            <label className="label">Şifre</label>
                                            <input name="password" type="password" required minLength={6} placeholder="En az 6 karakter" />
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="label">Rol</label>
                                        <input
                                            name="role"
                                            type="text"
                                            defaultValue={editingUser?.role || 'izleyici'}
                                            placeholder="admin / yonetici / izleyici"
                                        />
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            Geçerli değerler: <code>admin</code> · <code>yonetici</code> · <code>izleyici</code>
                                        </div>
                                    </div>

                                    {editingUser && (
                                        <div className="mb-3">
                                            <label className="label">Durum</label>
                                            <select name="status" defaultValue={editingUser?.status || 'approved'}>
                                                <option value="approved">Aktif</option>
                                                <option value="pending">Beklemede</option>
                                                <option value="rejected">Reddedildi</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* ── Sayfa İzinleri ── */}
                                    {editingUser && (() => {
                                        const editedRole = (editingUser.role || '').toLowerCase()
                                            .replace(/İ/g, 'i').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
                                            .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c')
                                            .replace(/[^a-z]/g, '');
                                        const roleDefault = (editedRole === 'yonetici') ? 'edit' : 'view';
                                        return (
                                            <div className="mb-3">
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <label className="label" style={{ margin: 0 }}>Sayfa İzinleri</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPagePermissionsEdit({})}
                                                        style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'pointer' }}
                                                    >Varsayılana Sıfırla</button>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {PAGE_DEFS.map(page => {
                                                        const actionDefault = canEdit ? 'edit' : 'none';
                                                        const current = pagePermissionsEdit[page.key] !== undefined
                                                            ? pagePermissionsEdit[page.key]
                                                            : (page.isAction ? actionDefault : roleDefault);
                                                        const options = page.isAction
                                                            ? [
                                                                { val: 'none', lbl: 'Gizli', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
                                                                { val: 'edit', lbl: 'Yönetim', bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
                                                            ]
                                                            : [
                                                                { val: 'none', lbl: 'Gizli', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
                                                                { val: 'view', lbl: 'İzle', bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
                                                                { val: 'edit', lbl: 'Düzenle', bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
                                                            ];
                                                        return (
                                                            <div key={page.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>
                                                                    {page.icon} {page.label}
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    {options.map(({ val, lbl, bg, color, border }) => {
                                                                        const active = current === val;
                                                                        return (
                                                                            <button
                                                                                key={val}
                                                                                type="button"
                                                                                onClick={() => setPagePermissionsEdit(prev => ({ ...prev, [page.key]: val }))}
                                                                                style={{
                                                                                    padding: '4px 10px',
                                                                                    borderRadius: '6px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '700',
                                                                                    border: active ? `2px solid ${border}` : '2px solid var(--border)',
                                                                                    background: active ? bg : 'transparent',
                                                                                    color: active ? color : 'var(--text-muted)',
                                                                                    cursor: 'pointer',
                                                                                    transition: 'all 0.15s',
                                                                                }}
                                                                            >{lbl}</button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isSaving}
                                        style={{ width: '100%', marginTop: '10px', opacity: isSaving ? 0.7 : 1 }}
                                    >
                                        {isSaving ? 'İşleniyor...' : editingUser ? 'Güncelle' : 'Kullanıcı Ekle'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Detail Modal */}
                    {detailModal.show && (
                        <div className="modal-overlay">
                            <div className="modal-card modal-card-wide" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                                <div className="modal-header">
                                    <div>
                                        <span className="modal-title" style={{ color: detailModal.type === 'in' ? 'var(--success)' : 'var(--danger)' }}>
                                            {detailModal.type === 'in' ? 'Giriş Geçmişi' : 'Çıkış Geçmişi'}
                                        </span>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: '500' }}>{detailModal.item.name}</div>
                                    </div>
                                    <div className="flex align-center gap-2">
                                        <ExportButtons
                                            data={detailModal.item.movements.filter(m => m.type === detailModal.type)}
                                            title={`${detailModal.item.name} - ${detailModal.type === 'in' ? 'Giriş' : 'Çıkış'} Detayları`}
                                            columns={[
                                                { key: 'date', label: 'Tarih' },
                                                { key: 'recipient', label: detailModal.type === 'in' ? 'Kaynak' : 'Alan' },
                                                { key: 'amount', label: 'Miktar' }
                                            ]}
                                            filename={`${detailModal.item.name}_Hareket_Detay`}
                                        />
                                        <button className="btn-icon" onClick={() => setDetailModal({ show: false, item: null, type: null })}><X size={16} /></button>
                                    </div>
                                </div>
                                <div className="table-responsive-wrapper" style={{ marginTop: '1rem' }}>
                                    <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                        <colgroup>
                                            <col className="col-tarih" />
                                            <col className="col-malzeme" />
                                            <col className="col-miktar" />
                                            <col className="col-birim" />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th style={{ border: '1px solid var(--border)' }}>Tarih</th>
                                                <th style={{ border: '1px solid var(--border)' }}>{detailModal.type === 'in' ? 'Kaynak' : 'Alan'}</th>
                                                <th style={{ textAlign: 'right', border: '1px solid var(--border)' }}>Miktar</th>
                                                <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>Birim</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailModal.item.movements.filter(m => m.type === detailModal.type).sort((a, b) => b.id - a.id).map(m => (
                                                <tr key={m.id}>
                                                    <td data-label="Tarih" style={{ border: '1px solid var(--border)' }}>{String(m.date || '').split(',')[0].split(' ')[0]}</td>
                                                    <td data-label={detailModal.type === 'in' ? 'Kaynak' : 'Alan'} style={{ border: '1px solid var(--border)' }}>{m.recipient || '-'}</td>
                                                    <td style={{ textAlign: 'right', border: '1px solid var(--border)' }} data-label="Miktar">{formatNumber(m.amount)}</td>
                                                    <td style={{ textAlign: 'center', border: '1px solid var(--border)' }} data-label="Birim">{detailModal.item.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    <footer style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', paddingBottom: '20px' }}>
                        &copy; 2026 Shintea | Serkan Kalmaz
                    </footer>

                </div>
            </div>

            {/* Center Success Message Overlay */}
            {showIrsaliyeDetailModal && selectedIrsaliye && (
                <div className="modal-overlay">
                    <div className="modal-card modal-card-wide" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="modal-title">{selectedIrsaliye.irsaliyeNo} — Malzeme Listesi</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {selectedIrsaliye.firma} | {selectedIrsaliye.date}
                                </span>
                            </div>
                            <div className="flex align-center gap-2">
                                <ExportButtons
                                    data={selectedIrsaliye.items.map(m => ({
                                        'Malzeme': m.itemName,
                                        'Miktar': m.amount,
                                        'Birim': m.unit,
                                        'Birim Fiyat': m.birimFiyat ? `${formatNumber(m.birimFiyat)} ₺` : '—'
                                    }))}
                                    title={`Irsaliye_${selectedIrsaliye.irsaliyeNo}_Detay`}
                                    columns={[
                                        { key: 'Malzeme', label: 'MALZEME' },
                                        { key: 'Miktar', label: 'MİKTAR' },
                                        { key: 'Birim', label: 'BİRİM' },
                                        { key: 'Birim Fiyat', label: 'BİRİM FİYAT' }
                                    ]}
                                    filename={`Irsaliye_${selectedIrsaliye.irsaliyeNo}`}
                                />
                                <button className="btn-icon" onClick={() => setShowIrsaliyeDetailModal(false)}><X size={16} /></button>
                            </div>
                        </div>
                        <div className="table-responsive-wrapper" style={{ marginTop: '1rem' }}>
                            <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                <colgroup>
                                    <col className="col-malzeme" />
                                    <col className="col-miktar" />
                                    <col className="col-birim" />
                                    <col className="col-miktar" />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                        <th style={{ textAlign: 'right', border: '1px solid var(--border)' }}>MİKTAR</th>
                                        <th style={{ textAlign: 'center', border: '1px solid var(--border)' }}>BİRİM</th>
                                        <th style={{ textAlign: 'right', border: '1px solid var(--border)' }}>BİRİM FİYAT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedIrsaliye.items.map((m, idx) => (
                                        <tr key={idx}>
                                            <td data-label="Malzeme" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>{m.itemName}</td>
                                            <td data-label="Miktar" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--success)', border: '1px solid var(--border)' }}>{formatNumber(m.amount)}</td>
                                            <td data-label="Birim" style={{ textAlign: 'center', border: '1px solid var(--border)' }}>{m.unit}</td>
                                            <td data-label="Birim Fiyat" style={{ textAlign: 'right', border: '1px solid var(--border)' }}>{m.birimFiyat ? `${formatNumber(m.birimFiyat)} ₺` : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-primary" onClick={() => setShowIrsaliyeDetailModal(false)}>Kapat</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Center Success Message Overlay */}
            {dashModal.show && (
                <div className="modal-overlay">
                    <div className="modal-card modal-card-wide" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <span className="modal-title">{dashModal.title}</span>
                            <div className="flex align-center gap-2">
                                <ExportButtons
                                    data={dashModal.data}
                                    title={dashModal.title}
                                    columns={dashModal.type === 'stock' ? [
                                        { key: 'name', label: 'MALZEME' },
                                        { key: 'quantity', label: 'MIKTAR' },
                                        { key: 'unit', label: 'BIRIM' }
                                    ] : dashModal.moveType === 'in' ? [
                                        { key: 'date', label: 'TARİH' },
                                        { key: 'firmaAdi', label: 'FİRMA' },
                                        { key: 'irsaliyeNo', label: 'İRSALİYE NO' },
                                        { key: 'itemName', label: 'MALZEME' },
                                        { key: 'amount', label: 'MİKTAR' },
                                        { key: 'unit', label: 'BİRİM' }
                                    ] : [
                                        { key: 'date', label: 'TARİH' },
                                        { key: 'itemName', label: 'MALZEME' },
                                        { key: 'amount', label: 'MİKTAR' },
                                        { key: 'unit', label: 'BİRİM' },
                                        { key: 'verilenBirim', label: 'VERİLEN BİRİM' },
                                        { key: 'recipient', label: 'VERİLEN KİŞİ' },
                                        { key: 'kullanimAlani', label: 'KULLANIM ALANI' }
                                    ]}
                                    filename={dashModal.title.replace(/\s+/g, '_')}
                                />
                                <button className="btn-icon" onClick={() => setDashModal({ ...dashModal, show: false })}><X size={16} /></button>
                            </div>
                        </div>
                        <div className="table-responsive-wrapper">
                            <table className="responsive-table" style={{ borderCollapse: 'collapse' }}>
                                {dashModal.type === 'stock' ? (
                                    <colgroup>
                                        <col className="col-malzeme" />
                                        <col className="col-miktar" />
                                        <col className="col-birim" />
                                    </colgroup>
                                ) : dashModal.moveType === 'in' ? (
                                    <colgroup>
                                        <col className="col-tarih" />
                                        <col className="col-firma" />
                                        <col className="col-kategori" />
                                        <col className="col-malzeme" />
                                        <col className="col-miktar" />
                                        <col className="col-birim" />
                                    </colgroup>
                                ) : (
                                    <colgroup>
                                        <col className="col-tarih" />
                                        <col className="col-malzeme" />
                                        <col className="col-miktar" />
                                        <col className="col-birim" />
                                        <col className="col-birim" />
                                        <col className="col-firma" />
                                        <col className="col-detay" />
                                    </colgroup>
                                )}
                                <thead>
                                    {dashModal.type === 'stock' ? (
                                        <tr>
                                            <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                            <th className="txt-right" style={{ border: '1px solid var(--border)' }}>MİKTAR</th>
                                            <th className="txt-center" style={{ border: '1px solid var(--border)' }}>BİRİM</th>
                                        </tr>
                                    ) : dashModal.moveType === 'in' ? (
                                        <tr>
                                            <th style={{ border: '1px solid var(--border)' }}>TARİH</th>
                                            <th style={{ border: '1px solid var(--border)' }}>FİRMA</th>
                                            <th style={{ border: '1px solid var(--border)' }}>İRSALİYE NO</th>
                                            <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                            <th className="txt-right" style={{ border: '1px solid var(--border)' }}>MİKTAR</th>
                                            <th className="txt-center" style={{ border: '1px solid var(--border)' }}>BİRİM</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th style={{ border: '1px solid var(--border)' }}>TARİH</th>
                                            <th style={{ border: '1px solid var(--border)' }}>MALZEME</th>
                                            <th className="txt-right" style={{ border: '1px solid var(--border)' }}>MİKTAR</th>
                                            <th className="txt-center" style={{ border: '1px solid var(--border)' }}>BİRİM</th>
                                            <th className="txt-center" style={{ border: '1px solid var(--border)' }}>BİRİM</th>
                                            <th style={{ border: '1px solid var(--border)' }}>VERİLEN KİŞİ</th>
                                            <th style={{ border: '1px solid var(--border)' }}>KULLANIM ALANI</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {dashModal.data.length === 0 ? (
                                        <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Kayıt bulunamadı.</td></tr>
                                    ) : dashModal.data.map((item, idx) => (
                                        <tr key={idx}>
                                            {dashModal.type === 'stock' ? (
                                                <>
                                                    <td data-label="Malzeme" style={{ border: '1px solid var(--border)' }}>
                                                        <div className="material-cell"><Package size={14} className="material-icon-small" /><span>{item.name}</span></div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap', border: '1px solid var(--border)' }} data-label="Miktar" className="txt-right">{formatNumber(item.quantity)}</td>
                                                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border)' }} data-label="Birim" className="txt-center">{item.unit}</td>
                                                </>
                                            ) : dashModal.moveType === 'in' ? (
                                                <>
                                                    <td data-label="Tarih" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{String(item.date || '').split(',')[0].split(' ')[0]}</td>
                                                    <td data-label="Firma" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{item.firmaAdi || '—'}</td>
                                                    <td data-label="İrsaliye No" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{item.irsaliyeNo || '—'}</td>
                                                    <td data-label="Malzeme" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>{item.itemName}</td>
                                                    <td data-label="Miktar" style={{ color: 'var(--success)', fontWeight: '700', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>+{formatNumber(item.amount)}</td>
                                                    <td data-label="Birim" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{item.unit || '—'}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td data-label="Tarih" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{String(item.date || '').split(',')[0].split(' ')[0]}</td>
                                                    <td data-label="Malzeme" style={{ fontWeight: '600', border: '1px solid var(--border)' }}>{item.itemName}</td>
                                                    <td data-label="Miktar" style={{ color: 'var(--danger)', fontWeight: '700', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>−{formatNumber(item.amount)}</td>
                                                    <td data-label="Birim" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{item.unit || '—'}</td>
                                                    <td data-label="Verilen Birim" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{item.verilenBirim || '—'}</td>
                                                    <td data-label="Verilen Kişi" style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{item.recipient || '—'}</td>
                                                    <td data-label="Kullanım Alanı" style={{ border: '1px solid var(--border)' }}>{item.kullanimAlani || item.note || '—'}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {showRequestModal && (
                <div className="modal-overlay">
                    <div className="modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <span className="modal-title">
                                <ClipboardList size={16} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                                Malzeme Talebi Oluştur
                            </span>
                            <button className="btn-icon" onClick={() => setShowRequestModal(false)}><X size={16} /></button>
                        </div>
                        <div style={{
                            background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 6,
                            padding: '8px 12px', fontSize: '12px', color: '#6b7280', marginBottom: 14
                        }}>
                            ℹ️ Talebiniz yöneticiye iletilecek. Onaylandığında satın alım listesine eklenir.
                        </div>
                        <form onSubmit={handleCreateRequest}>
                            <div className="mb-2">
                                <label className="label">Malzeme Seçin</label>
                                <select name="itemId" required defaultValue="">
                                    <option value="" disabled>-- Malzeme Seçin --</option>
                                    {items.sort((a, b) => a.name.localeCompare(b.name)).map(i => (
                                        <option key={i.id} value={String(i.id)}>{i.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 mb-2">
                                <div style={{ flex: 1 }}>
                                    <label className="label">Miktar</label>
                                    <input name="amount" type="number" required min="1" placeholder="Örn: 50" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="label">Birim</label>
                                    <select name="unit" defaultValue="Adet">
                                        <option>Adet</option>
                                        <option>Metre</option>
                                        <option>Torba</option>
                                        <option>Palet</option>
                                        <option>M3</option>
                                        <option>Ton</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mb-2">
                                <label className="label">Açıklama / Sebep</label>
                                <input name="note" placeholder="Örn: A Blok çatı için gerekli" />
                            </div>
                            <button type="submit" className="btn-primary"
                                style={{ width: '100%', marginTop: '1rem' }}>
                                <Send size={14} /> Talebi Gönder
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Center Success Message Overlay */}
            {showSuccessOverlay && (
                <div className="center-success-overlay">
                    <div className="success-message-card">
                        <CheckCircle2 size={48} color="#16a34a" />
                        <span>SATIN ALIM İÇİN GÖNDERİLDİ</span>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirm */}
            <BulkDeleteModal
                data={bulkDelState}
                onConfirm={async () => {
                    if (bulkDelState) {
                        if (bulkDelState.tableId === 'dash_mixed') {
                            for (const row of bulkDelState.rows) {
                                const col = row.category === 'zimmet' ? 'zimmet' : 'movements';
                                const cfg = EDIT_CONFIGS[col];
                                try { await remove(ref(db, cfg.path(row))); } catch(e) {}
                            }
                            clearSel('dash');
                        } else if (bulkDelState.tableId === 'movements_mixed') {
                            for (const row of bulkDelState.rows) {
                                const col = row.category === 'zimmet' ? 'zimmet' : 'movements';
                                const cfg = EDIT_CONFIGS[col];
                                try { await remove(ref(db, cfg.path(row))); } catch(e) {}
                            }
                            clearSel('movements');
                        } else if (bulkDelState.tableId === 'irsaliyeler_batch') {
                            for (const irsaliye of bulkDelState.rows) {
                                const relatedMovements = movements.filter(m => m.irsaliyeNo === irsaliye.irsaliyeNo);
                                for (const mv of relatedMovements) {
                                    try { await remove(ref(db, `movements/${mv.id}`)); } catch(e) {}
                                }
                                const metaKey = irsaliye.irsaliyeNo.replace(/[./\s]/g, '_');
                                try { await remove(ref(db, `irsaliyeMeta/${metaKey}`)); } catch(e) {}
                            }
                            clearSel('irsaliyeler');
                        } else {
                            await handleBulkDelete(bulkDelState.tableId, bulkDelState.rows);
                        }
                    }
                    setBulkDelState(null);
                }}
                onCancel={() => setBulkDelState(null)}
            />
            {/* Highlight Color Picker */}
            {hlPickerState && (
                <HighlightColorPicker
                    onSelect={(color) => applyHL(hlPickerState.tableId, hlPickerState.rowKeys, color)}
                    onClose={() => setHlPickerState(null)}
                />
            )}
            {/* Admin Right-Click Menu */}
            <AdminContextMenu
                ctx={ctxMenu}
                onEdit={handleCtxEdit}
                onDelete={handleCtxDelete}
                onClose={() => setCtxMenu(null)}
            />
            <EditRowModal
                ctx={editRow}
                onSave={handleEditSave}
                onClose={() => setEditRow(null)}
            />
        </div>
    );
};

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorMessage: error?.message || 'Bilinmeyen bir hata oluştu.' };
    }

    componentDidCatch(error) {
        console.error('Uygulama hatası:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="auth-screen">
                    <div className="auth-card" style={{ maxWidth: 520 }}>
                        <div className="auth-section-title">Uygulama Hatası</div>
                        <p style={{ color: '#64748b', lineHeight: 1.6 }}>
                            Ekran yüklenirken bir hata oluştu. Sayfayı yenileyin. Sorun devam ederse yöneticinize bu mesajı iletin.
                        </p>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, fontSize: 12, color: '#334155' }}>
                            {this.state.errorMessage}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const AppRoot = () => (
    <AppErrorBoundary>
        <App />
    </AppErrorBoundary>
);

export default AppRoot;
