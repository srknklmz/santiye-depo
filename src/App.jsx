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
    ChevronLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db, auth, secondaryAuth } from './firebase';
import { ref, onValue, set, remove, get, update } from 'firebase/database';
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
                    <div className="auth-logo-sub">Depo Yönetim Sistemi</div>
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
                    <div className="auth-logo-sub">Depo Yönetim Sistemi</div>
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

    const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const DAYS = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

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

    const formatDisplay = (iso) => {
        if (!iso) return 'Seçiniz';
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

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

    const calIcon = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

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
        <div ref={triggerRef} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div onClick={handleOpen} style={triggerStyle}>
                {calIcon}
                <span style={{ color: tempStart ? 'var(--text-main)' : 'var(--text-muted)' }}>{formatDisplay(tempStart)}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }}>—</span>
            <div onClick={handleOpen} style={triggerStyle}>
                {calIcon}
                <span style={{ color: tempEnd ? 'var(--text-main)' : 'var(--text-muted)' }}>{formatDisplay(tempEnd)}</span>
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
    const [categoryFilter, setCategoryFilter] = useState('Tümü');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [detailModal, setDetailModal] = useState({ show: false, item: null, type: null });
    const [dashModal, setDashModal] = useState({ show: false, title: '', data: [], type: '' });
    const [dashboardFilters, setDashboardFilters] = useState(new Set(['in', 'out', 'zimmet']));
    const [movFilter, setMovFilter] = useState({ malzeme: '', tarihBas: '', tarihBitis: '', firma: '', irsaliye: '' });
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
    const [showAddIrsaliye, setShowAddIrsaliye] = useState(false);
    const [newIrsaliyeInput, setNewIrsaliyeInput] = useState('');
    const [inIrsaliyeNo, setInIrsaliyeNo] = useState('');
    // ── Pending Actions State (geçmiş tarihli onay) ──
    const [pendingActions, setPendingActions] = useState([]);
    // ── User Management Modal ──
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fileInputRef = useRef(null);
    const satinAlimRef = useRef(null);
    const sevkiyatNavItemRef = useRef(null);

    // ── Auth State ──
    const [authUser, setAuthUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);
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
    const canEdit = userProfile?.role === 'admin' || userProfile?.role === 'yonetici';
    const isAdmin = userProfile?.role === 'admin';

    const formatNumber = (num) => Number(num || 0).toLocaleString('tr-TR');

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
                    setUserProfile(snap.exists() ? normalizeUserProfile(snap.val(), user.uid) : null);
                    setAuthLoading(false);
                });
            } else {
                // Auth bypass: direkt erişim için misafir profili
                setAuthUser({ uid: 'guest' });
                setUserProfile({ role: 'admin', name: 'Misafir', status: 'approved', uid: 'guest', email: '' });
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

    // ── Personnel Sync (Firebase) ──
    useEffect(() => {
        const personelRef = ref(db, 'personel');
        const unsub = onValue(personelRef, (snap) => {
            const data = snap.val();
            setPersonel(data ? Object.values(data).sort((a, b) => (a.adSoyad || '').localeCompare(b.adSoyad || '', 'tr')) : []);
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
        if (!isAdmin) return;
        const usersRef = ref(db, 'users');
        const unsub = onValue(usersRef, (snap) => {
            const data = snap.val();
            setAllUsers(data ? Object.entries(data).map(([uid, user]) => normalizeUserProfile(user, uid)).filter(Boolean) : []);
        });
        return () => unsub();
    }, [isAdmin]);

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
                role: isFirstUser ? 'admin' : 'izleyici',
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
            todayOut: movements.filter(m => m.type === 'out' && String(m.date || '').includes(today)).length
        };
    }, [items, movements]);

    const pendingRequestsCount = useMemo(() =>
        requests.filter(r => r.status === 'pending').length,
        [requests]);

    // Tedarikçi / Kaynak / Alan listesi (hareketlerden türetilir)
    const uniqueRecipients = useMemo(() => {
        const set = new Set();
        movements.forEach(m => { if (m.recipient && m.recipient.trim()) set.add(m.recipient.trim()); });
        return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
    }, [movements]);

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
        return items.map(item => {
            const itemMovements = movements.filter(m => Number(m.itemId) === Number(item.id));
            const totalReceived = itemMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
            const totalUsed = itemMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
            const zimmetteCount = zimmet
                .filter(z => Number(z.itemId) === Number(item.id) && z.status === 'zimmette')
                .reduce((sum, z) => sum + (Number(z.amount) || 0), 0);
            return { ...item, totalReceived, totalUsed, zimmetteCount, movements: itemMovements };
        });
    }, [items, movements, zimmet]);

    const priceAnalysis = useMemo(() => {
        return items.map(item => {
            const itemInMovements = movements.filter(m => Number(m.itemId) === Number(item.id) && m.type === 'in');
            const totalQtyReceived = itemInMovements.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
            const totalSpent = itemInMovements.reduce((sum, m) => sum + (Number(m.amount) * (Number(m.price) || 0)), 0);
            const avgPrice = totalQtyReceived > 0 ? (totalSpent / totalQtyReceived) : 0;
            return { ...item, totalQtyReceived, totalSpent, avgPrice };
        }).sort((a, b) => b.totalSpent - a.totalSpent);
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

                const moveBaseData = {
                    itemId: Number(item.id),
                    itemName: item.name,
                    malzemeTuru,
                    firmaAdi,
                    teslimAlan,
                    amount,
                    unit,
                    irsaliyeNo,
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
            const trMap = { 'ç':'c','Ç':'C','ğ':'g','Ğ':'G','ı':'i','İ':'I','ö':'o','Ö':'O','ş':'s','Ş':'S','ü':'u','Ü':'U' };
            const fixTR = (t) => String(t ?? '').replace(/[çÇğĞıİöÖşŞüÜ]/g, m => trMap[m] || m);
            const now = new Date();
            const ciktTarihi = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

            // Üst bilgi
            doc.setFontSize(13); doc.setTextColor(30,30,30);
            doc.text('TUM STOK HAREKETLERI', 14, 14);
            doc.setFontSize(9); doc.setTextColor(60,60,60);
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
                styles: { fontSize: 9, cellPadding: { top: 1.8, bottom: 1.8, left: 3, right: 3 }, textColor: [30,30,30], lineColor: [210,210,210], lineWidth: 0.2, overflow: 'ellipsize' },
                headStyles: { fillColor: [248,250,252], textColor: [80,80,80], fontStyle: 'bold', fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, lineWidth: 0.3, lineColor: [190,190,190] },
                alternateRowStyles: { fillColor: [255,255,255] },
                bodyStyles: { fillColor: [255,255,255] },
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
                // Miktar sütunu sağ kenarı: margin(14) + tarih(22) + malzeme(62) + miktar(20) = 118
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
            const doc = new jsPDF();
            const trMap = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U' };
            const fixTR = (text) => {
                if (text === null || text === undefined) return "";
                return String(text).replace(/[çÇğĞıİöÖşŞüÜ]/g, match => trMap[match]);
            };
            doc.setFontSize(16);
            doc.text(fixTR(title || 'Rapor'), 14, 15);
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
                startY: 25,
                styles: { fontSize: 9, font: 'courier', cellPadding: 3 },
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                margin: { top: 25 }
            });
            doc.save(`${filename || 'rapor'}.pdf`);
        } catch (error) {
            console.error("PDF Generate Exception:", error);
            alert("PDF Oluşturma Hatası: " + error.message);
        }
    };

    const exportToExcelGeneral = (data, columns, filename) => {
        const formattedData = data.map(item => {
            const obj = {};
            columns.forEach(col => { obj[col.label] = item[col.key]; });
            return obj;
        });
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rapor");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    const ExportButtons = ({ data, title, columns, filename }) => (
        <div className="export-container">
            <button className="btn-export-sm" onClick={() => exportToExcelGeneral(data, columns, filename)}>
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

    if (!authUser || !userProfile) {
        return authView === 'login'
            ? <LoginScreen
                onLogin={handleLogin}
                onSwitchToRegister={() => { setAuthView('register'); setAuthError(''); }}
                error={authError}
                loading={authSubmitting}
            />
            : <RegisterScreen
                onRegister={handleRegister}
                onSwitchToLogin={() => { setAuthView('login'); setAuthError(''); }}
                error={authError}
                loading={authSubmitting}
            />;
    }

    if (userProfile.status === 'pending' || userProfile.status === 'rejected') {
        return <PendingScreen
            userName={userProfile.name || userProfile.email || 'Kullanıcı'}
            userStatus={userProfile.status}
            onSignOut={handleSignOut}
        />;
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
                        <div className="sidebar-logo-text">Shintea</div>
                        <div className="sidebar-logo-sub">Depo Yönetimi</div>
                    </div>
                </div>

                {/* Connection Status */}
                <div className="sidebar-status-bar">
                    <div className={`status-dot ${isConnected ? 'status-online' : 'status-offline'}`} />
                    <span>{isConnected ? 'Bulut bağlı' : 'Bağlantı yok'}</span>
                </div>

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
                    <button
                        className={`nav-item${activeTab === 'summary' ? ' active' : ''}`}
                        onClick={() => { setActiveTab('summary'); setMobileSidebarOpen(false); }}
                    >
                        <BarChart2 size={17} /> Stok Özeti
                    </button>
                    <button
                        className={`nav-item${activeTab === 'price' ? ' active' : ''}`}
                        onClick={() => { setActiveTab('price'); setMobileSidebarOpen(false); }}
                    >
                        <TrendingUp size={17} /> Fiyat Analizi
                    </button>
                    <button
                        className={`nav-item${activeTab === 'movements' ? ' active' : ''}`}
                        onClick={() => { setMovementViewType('all'); setActiveTab('movements'); setMobileSidebarOpen(false); }}
                    >
                        <History size={17} /> Tüm Hareketler
                    </button>
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
                    </button>

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

                    {isAdmin && (
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
                            {/* İzleyici için bilgi */}
                            {!canEdit && (
                                <div className="viewer-banner">
                                    <Eye size={17} />
                                    <span>İzleyici modundasınız. Malzeme talebinde bulunabilirsiniz.</span>
                                </div>
                            )}

                            {/* Stats Cards */}
                            <div className={`stats-grid${canEdit ? ' stats-grid-with-actions' : ''}`}>
                                <div className="stat-card" onClick={() => setDashModal({ show: true, title: 'Tüm Malzemeler', data: items, type: 'stock' })}>
                                    <div className="stat-card-top">
                                        <div className="stat-icon stat-icon-primary"><Package size={18} /></div>
                                    </div>
                                    <div className="stat-value">{stats.totalItems}</div>
                                    <div className="stat-label">Toplam Malzeme</div>
                                </div>
                                <div className="stat-card" onClick={() => setDashModal({ show: true, title: 'Kritik Stoktaki Malzemeler', data: items.filter(i => i.quantity <= i.minStock), type: 'stock' })}>
                                    <div className="stat-card-top">
                                        <div className="stat-icon stat-icon-danger"><AlertTriangle size={18} /></div>
                                    </div>
                                    <div className="stat-value">{stats.lowStock}</div>
                                    <div className="stat-label">Kritik Stok</div>
                                </div>
                                <div className="stat-card" onClick={() => {
                                    const today = new Date().toLocaleDateString();
                                    const todayIn = movements.filter(m => m.type === 'in' && String(m.date || '').includes(today));
                                    setDashModal({ show: true, title: 'Bugünkü Giriş İşlemleri', data: todayIn, type: 'move', moveType: 'in' });
                                }}>
                                    <div className="stat-card-top">
                                        <div className="stat-icon stat-icon-success"><ArrowUpRight size={18} /></div>
                                    </div>
                                    <div className="stat-value">{stats.todayIn}</div>
                                    <div className="stat-label">Bugün Giriş</div>
                                </div>
                                <div className="stat-card" onClick={() => {
                                    const today = new Date().toLocaleDateString();
                                    const todayOut = movements.filter(m => m.type === 'out' && String(m.date || '').includes(today));
                                    setDashModal({ show: true, title: 'Bugünkü Çıkış İşlemleri', data: todayOut, type: 'move', moveType: 'out' });
                                }}>
                                    <div className="stat-card-top">
                                        <div className="stat-icon stat-icon-warning"><ArrowDownLeft size={18} /></div>
                                    </div>
                                    <div className="stat-value">{stats.todayOut}</div>
                                    <div className="stat-label">Bugün Çıkış</div>
                                </div>
                                {canEdit && (<>
                                    <div className="action-card action-card-success" onClick={() => { setMovementType('in'); setSelectedItemForMove(null); setShowMoveModal(true); }}>
                                        <ArrowUpRight size={24} />
                                        <span>Giriş Ekle</span>
                                    </div>
                                    <div className="action-card action-card-danger" onClick={() => { setMovementType('out'); setSelectedItemForMove(null); setShowMoveModal(true); }}>
                                        <ArrowDownLeft size={24} />
                                        <span>Çıkış Ekle</span>
                                    </div>
                                    <div className="action-card action-card-purple" onClick={() => { setShowZimmetModal(true); setSelectedItemForZimmet(null); }}>
                                        <UserCheck size={24} />
                                        <span>Zimmet Ekle</span>
                                    </div>
                                </>)}
                            </div>

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
                                        <table className="responsive-table col-6">
                                            <thead>
                                                <tr>
                                                    <th>TARİH</th>
                                                    <th>TÜR</th>
                                                    <th>MALZEME</th>
                                                    <th style={{ textAlign: 'center' }}>MİKTAR</th>
                                                    <th>TALEP EDEN</th>
                                                    <th style={{ textAlign: 'center', width: '180px' }}>İŞLEMLER</th>
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
                                                            <td data-label="Tarih">{String(action.data?.date || '').split(',')[0].split(' ')[0]}</td>
                                                            <td data-label="Tür">
                                                                <span className={`movement-type-pill ${pillClass}`}>{typeLabel}</span>
                                                            </td>
                                                            <td data-label="Malzeme" style={{ fontWeight: '600' }}>{action.data?.itemName}</td>
                                                            <td data-label="Miktar" style={{ textAlign: 'center' }}>
                                                                <strong>{action.data?.amount}</strong>
                                                            </td>
                                                            <td data-label="Talep Eden">{action.requestedBy}</td>
                                                            <td data-label="İşlemler" style={{ textAlign: 'center' }}>
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
                                const filterBg   = { all: 'var(--accent)', in: 'var(--success)', out: 'var(--danger)', zimmet: '#4f46e5' };
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
                                }).slice(0, 10);
                                return (
                                    <div className="table-card">
                                        {/* Filtre Butonları */}
                                        <div className="table-toolbar" style={{ justifyContent: 'space-between', gap: '8px' }}>
                                            <button className="btn-filter-3d" onClick={() => { setMovementViewType('all'); setActiveTab('movements'); }} style={{
                                                background: '#fff',
                                                color: 'var(--text-main)',
                                                boxShadow: inactiveShadow,
                                                border: '1px solid var(--border)',
                                                width: 'auto',
                                                padding: '6px 14px',
                                                whiteSpace: 'nowrap',
                                            }}>Tümünü Gör</button>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {[['in','Giriş'], ['out','Çıkış'], ['zimmet','Zimmet']].map(([val, label]) => {
                                                    const active = dashboardFilters.has(val);
                                                    return (
                                                        <button key={val} className="btn-filter-3d" onClick={() => toggleFilter(val)} style={{
                                                            background: active ? filterBg[val] : 'var(--bg-hover)',
                                                            color: active ? '#fff' : 'var(--text-muted)',
                                                            boxShadow: active ? filterShadow[val] : inactiveShadow,
                                                        }}>{label}</button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Tablo */}
                                        <div className="table-responsive-wrapper dash-unified-wrap">
                                            <table className="responsive-table col-6">
                                                <colgroup>
                                                    <col style={{ width: '11%' }} />
                                                    <col style={{ width: '36%' }} />
                                                    <col style={{ width: '9%' }} />
                                                    <col style={{ width: '8%' }} />
                                                    <col style={{ width: '22%' }} />
                                                    <col style={{ width: '14%' }} />
                                                </colgroup>
                                                <thead>
                                                    <tr>
                                                        <th>TARİH</th>
                                                        <th>MALZEME</th>
                                                        <th style={{ textAlign: 'right' }}>MİKTAR</th>
                                                        <th>BİRİM</th>
                                                        <th>KİŞİ / FİRMA</th>
                                                        <th>İRSALİYE NO</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {combined.length === 0 ? (
                                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Kayıt bulunamadı.</td></tr>
                                                    ) : combined.map(m => {
                                                        const isIn = m.category === 'movement' && m.normalizedType === 'in';
                                                        const isOut = m.category === 'movement' && m.normalizedType === 'out';
                                                        const tipColor = isIn ? 'var(--success)' : isOut ? 'var(--danger)' : (m.type === 'geri_alindi' ? 'var(--success)' : '#4f46e5');
                                                        const miktar = isIn ? `+${formatNumber(m.amount)}` : isOut ? `−${formatNumber(m.amount)}` : (m.type === 'geri_alindi' ? `+${formatNumber(m.amount)}` : `−${formatNumber(m.amount)}`);
                                                        const kisi = isIn ? (m.firmaAdi || '—') : isOut ? (m.recipient || '—') : (m.person || '—');
                                                        const detay = isIn ? (m.irsaliyeNo || '—') : isOut ? (m.kullanimAlani || m.note || '—') : (m.note || '—');
                                                        const tarih = String(m.date || '').split(',')[0].split(' ')[0];
                                                        return (
                                                            <tr key={`${m.category}-${m.id}`} style={{ borderLeft: `20px solid ${tipColor}` }}>
                                                                <td data-label="Tarih" style={{ whiteSpace: 'nowrap' }}>{tarih}</td>
                                                                <td data-label="Malzeme" style={{ fontWeight: '600' }}>{m.itemName}</td>
                                                                <td data-label="Miktar" style={{ color: tipColor, fontWeight: '700', textAlign: 'right' }}>{miktar}</td>
                                                                <td data-label="Birim">{m.unit || '—'}</td>
                                                                <td data-label="Kişi / Firma">{kisi}</td>
                                                                <td data-label="Detay" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{detay}</td>
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
                    {activeTab === 'summary' && (
                        <div className="table-card animate-fade">
                            <div className="table-toolbar">
                                <span className="section-title"><BarChart2 size={17} /> Stok Listesi</span>
                                <div className="table-toolbar-right">
                                    <ExportButtons
                                        data={stockSummary.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                                        title="Tam Stok Listesi"
                                        columns={[
                                            { key: 'name', label: 'MALZEME' },
                                            { key: 'totalReceived', label: 'GIRIS' },
                                            { key: 'totalUsed', label: 'CIKIS' },
                                            { key: 'quantity', label: 'KALAN' },
                                            { key: 'unit', label: 'BIRIM' }
                                        ]}
                                        filename="Stok_Listesi"
                                    />
                                    <div className="search-container">
                                        <Search size={15} className="search-icon" />
                                        <input type="text" placeholder="Malzeme ara..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="table-responsive-wrapper dash-unified-wrap">
                                <table className="responsive-table col-7">
                                    <colgroup>
                                        <col style={{ width: '32%' }} />
                                        <col style={{ width: '11%' }} />
                                        <col style={{ width: '11%' }} />
                                        <col style={{ width: '11%' }} />
                                        <col style={{ width: '11%' }} />
                                        <col style={{ width: '11%' }} />
                                        <col style={{ width: '13%' }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>MALZEME</th>
                                            <th style={{ textAlign: 'right' }}>GİRİŞ</th>
                                            <th style={{ textAlign: 'right' }}>ÇIKIŞ</th>
                                            <th style={{ textAlign: 'right' }}>DEPO</th>
                                            <th style={{ textAlign: 'right' }}>ZİMMET</th>
                                            <th style={{ textAlign: 'right' }}>TOPLAM</th>
                                            <th style={{ textAlign: 'center' }}>BİRİM</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockSummary.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(row => {
                                            const depoCount = row.quantity - row.zimmetteCount;
                                            return (
                                                <tr key={row.id}>
                                                    <td data-label="Malzeme" style={{ fontWeight: '600' }}>{row.name}</td>
                                                    <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: '600' }} data-label="Giriş">
                                                        <button onClick={() => setDetailModal({ show: true, item: row, type: 'in' })}>{formatNumber(row.totalReceived)}</button>
                                                    </td>
                                                    <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: '600' }} data-label="Çıkış">
                                                        <button onClick={() => setDetailModal({ show: true, item: row, type: 'out' })}>{formatNumber(row.totalUsed)}</button>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }} data-label="Depo">{formatNumber(depoCount)}</td>
                                                    <td style={{ textAlign: 'right', color: '#4f46e5' }} data-label="Zimmet">{formatNumber(row.zimmetteCount)}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: '700' }} data-label="Toplam">{formatNumber(row.quantity)}</td>
                                                    <td style={{ textAlign: 'center' }} data-label="Birim">{row.unit}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── ZİMMET TAB ── */}
                    {activeTab === 'zimmet' && (
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
                            <div className="table-responsive-wrapper" style={{ overflowX: 'auto' }}>
                                <table className="responsive-table col-5">
                                    <thead>
                                        <tr>
                                            <th>İŞLEM TARİHİ</th>
                                            <th>MALZEME</th>
                                            <th>KİŞİ / EKİP</th>
                                            <th style={{ textAlign: 'right' }}>MİKTAR</th>
                                            <th>{zimmetView === 'active' ? 'İŞLEM' : 'TÜR'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const filtered = zimmet.filter(z =>
                                                (zimmetView === 'active' ? z.status === 'zimmette' : true) &&
                                                (z.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || z.person.toLowerCase().includes(searchQuery.toLowerCase()))
                                            ).sort((a, b) => (b.updated_at || b.created_at || b.id || 0) - (a.updated_at || a.created_at || a.id || 0));

                                            if (filtered.length === 0) {
                                                return <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{zimmetView === 'active' ? 'Aktif zimmet kaydı bulunamadı.' : 'Henüz bir hareket kaydı yok.'}</td></tr>;
                                            }

                                            return filtered.map(z => (
                                                <tr key={z.id}>
                                                    <td data-label="İşlem Tarihi">{z.date}</td>
                                                    <td data-label="Malzeme">{z.itemName}</td>
                                                    <td data-label="Kişi / Ekip">{z.person}</td>
                                                    <td data-label="Miktar" style={{ textAlign: 'right' }}>{z.amount}</td>
                                                    <td data-label={zimmetView === 'active' ? "İşlem" : "Tür"}>
                                                        {zimmetView === 'active' ? (
                                                            <button
                                                                className="btn-ghost"
                                                                style={{ color: '#4f46e5', fontWeight: '600', padding: '6px 12px', borderRadius: '6px', background: '#f5f3ff', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                                onClick={() => handleReturnZimmet(z)}
                                                            >
                                                                <RotateCcw size={14} /> Geri Alındı
                                                            </button>
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
                    {activeTab === 'price' && (
                        <div className="table-card animate-fade">
                            <div className="table-toolbar">
                                <div>
                                    <span className="section-title"><TrendingUp size={17} /> Fiyat Analizi</span>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        * Giriş işlemlerindeki fiyatlar baz alınarak hesaplanmaktadır.
                                    </div>
                                </div>
                                <ExportButtons
                                    data={priceAnalysis}
                                    title="Malzeme Fiyat Analizi"
                                    columns={[
                                        { key: 'name', label: 'MALZEME' },
                                        { key: 'totalQtyReceived', label: 'TOPLAM ALIM' },
                                        { key: 'avgPrice', label: 'ORT BIRIM FIYAT' },
                                        { key: 'totalSpent', label: 'TOPLAM TUTAR' }
                                    ]}
                                    filename="Fiyat_Analizi"
                                />
                            </div>
                            <div className="table-responsive-wrapper dash-unified-wrap">
                                <table className="responsive-table col-5">
                                    <colgroup>
                                        <col style={{ width: '34%' }} />
                                        <col style={{ width: '16%' }} />
                                        <col style={{ width: '18%' }} />
                                        <col style={{ width: '18%' }} />
                                        <col style={{ width: '14%' }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>MALZEME</th>
                                            <th style={{ textAlign: 'right' }}>TOPLAM ALIM</th>
                                            <th style={{ textAlign: 'right' }}>ORT. BİRİM FİYAT</th>
                                            <th style={{ textAlign: 'right' }}>TOPLAM TUTAR</th>
                                            <th style={{ textAlign: 'center' }}>BİRİM</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {priceAnalysis.length === 0 ? (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Fiyatlı giriş kaydı bulunamadı.</td></tr>
                                        ) : priceAnalysis.map((row, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: '600' }}>{row.name}</td>
                                                <td style={{ textAlign: 'right' }}>{formatNumber(row.totalQtyReceived)}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: '600' }}>{formatNumber(row.avgPrice)} ₺</td>
                                                <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatNumber(row.totalSpent)} ₺</td>
                                                <td style={{ textAlign: 'center' }}>{row.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── MOVEMENTS TAB ── */}
                    {activeTab === 'movements' && (() => {
                        const toISODate2 = (dateStr) => {
                            const s = String(dateStr || '').split(',')[0].trim();
                            const parts = s.split('.');
                            if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
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
                                <span className="section-title"><History size={17} /> {movementViewType === 'in' ? 'Tüm Girişler' : movementViewType === 'out' ? 'Tüm Çıkışlar' : 'Tüm Stok Hareketleri'}</span>
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
                                const uniqueMalzemeler = [...new Set(filteredMovementsForPage.map(m => m.itemName).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'tr'));
                                const uniqueFirmalar = [...new Set(filteredMovementsForPage.map(m => m.firmaAdi || m.recipient).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'tr'));
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

                            <div className="table-responsive-wrapper dash-unified-wrap">
                                {(() => {
                                    return (
                                <table className="responsive-table col-6">
                                    <colgroup>
                                        <col style={{ width: '11%' }} />
                                        <col style={{ width: '36%' }} />
                                        <col style={{ width: '9%' }} />
                                        <col style={{ width: '8%' }} />
                                        <col style={{ width: '22%' }} />
                                        <col style={{ width: '14%' }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>TARİH</th>
                                            <th>MALZEME</th>
                                            <th style={{ textAlign: 'right' }}>MİKTAR</th>
                                            <th>BİRİM</th>
                                            <th>KİŞİ / FİRMA</th>
                                            <th>İRSALİYE NO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movementsFiltered.length === 0 ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Kayıt bulunamadı.</td></tr>
                                        ) : movementsFiltered.map((m) => {
                                            const isIn = m.normalizedType === 'in';
                                            const tipColor = isIn ? 'var(--success)' : 'var(--danger)';
                                            const miktar = isIn ? `+${formatNumber(m.amount)}` : `−${formatNumber(m.amount)}`;
                                            const kisi = isIn ? (m.firmaAdi || m.recipient || '—') : (m.recipient || m.firmaAdi || '—');
                                            const detay = isIn ? (m.irsaliyeNo || '—') : (m.kullanimAlani || m.note || '—');
                                            const tarih = String(m.date || '—').split(',')[0].split(' ')[0];
                                            return (
                                                <tr key={m.id} style={{ borderLeft: `20px solid ${tipColor}` }}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{tarih}</td>
                                                    <td>{m.itemName || '—'}</td>
                                                    <td style={{ textAlign: 'right' }}>{miktar}</td>
                                                    <td>{m.unit || '—'}</td>
                                                    <td>{kisi}</td>
                                                    <td>{detay}</td>
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

                    {/* ── USERS TAB (Admin Only) ── */}
                    {activeTab === 'users' && isAdmin && (
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
                                    <div className="table-responsive-wrapper">
                                        <table className="responsive-table col-6" style={{ width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th>KAYIT TARİHİ</th>
                                                    <th>AD SOYAD</th>
                                                    <th>E-POSTA</th>
                                                    <th>DURUM</th>
                                                    <th>ROL</th>
                                                    <th>İŞLEMLER</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allUsers.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map(u => (
                                                    <tr key={u.uid}>
                                                        <td data-label="Kayıt Tarihi">
                                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '—'}
                                                        </td>
                                                        <td data-label="Ad Soyad">
                                                            {u.name}
                                                            {u.uid === authUser.uid && (
                                                                <span style={{ fontSize: '11px', color: '#6d28d9', background: '#ede9fe', borderRadius: '10px', padding: '1px 7px', marginLeft: '6px' }}>Siz</span>
                                                            )}
                                                        </td>
                                                        <td data-label="E-posta">{u.email}</td>
                                                        <td data-label="Durum">
                                                            <span style={{
                                                                background: u.status === 'approved' ? '#dcfce7' : u.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                                                color: u.status === 'approved' ? '#166534' : u.status === 'pending' ? '#b45309' : '#991b1b',
                                                                borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '600'
                                                            }}>
                                                                {u.status === 'approved' ? 'Aktif' : u.status === 'pending' ? 'Bekliyor' : 'Reddedildi'}
                                                            </span>
                                                        </td>
                                                        <td data-label="Rol">
                                                            <span style={{
                                                                background: ROLE_COLORS[u.role]?.bg || '#f1f5f9',
                                                                color: ROLE_COLORS[u.role]?.color || '#475569',
                                                                borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '600'
                                                            }}>
                                                                {ROLE_LABELS[u.role] || u.role}
                                                            </span>
                                                        </td>
                                                        <td data-label="İşlemler">
                                                            <div className="flex align-center gap-1">
                                                                <button
                                                                    className="btn-icon"
                                                                    title="Düzenle"
                                                                    onClick={() => { setEditingUser(u); setShowUserModal(true); }}
                                                                    style={{ color: '#3b82f6' }}
                                                                >
                                                                    <Edit3 size={15} />
                                                                </button>
                                                                {u.uid !== authUser.uid && u.role !== 'admin' && (
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
                                            <div className="table-responsive-wrapper" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                                <table className="responsive-table col-5">
                                                    <thead>
                                                        <tr>
                                                            <th>TARİH</th>
                                                            <th>FORM NO</th>
                                                            <th style={{ textAlign: 'center' }}>MALZEME</th>
                                                            <th>DURUM</th>
                                                            <th style={{ textAlign: 'center', width: '40px' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sevkiyat.map((s) => {
                                                            const durum = durumMap[s.satin_alim_durumu] || durumMap.BEKLEMEDE;
                                                            return (
                                                                <tr key={s.id} onClick={() => setSevkiyatModal({ show: true, data: s })} style={{ cursor: 'pointer' }}>
                                                                    <td data-label="Tarih">{s.sevkiyata_gonderilme_tarihi_tr?.split(' ')[0] || '-'}</td>
                                                                    <td data-label="Form No">{s.satin_alim_form_no}</td>
                                                                    <td data-label="Malzeme" style={{ textAlign: 'center' }}>{(s.items || []).length} kalem</td>
                                                                    <td data-label="Durum">
                                                                        <span className={"movement-type-pill " + (durum.label === 'Tamamlandı' ? 'in' : 'out')}>
                                                                            {durum.label}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ textAlign: 'center' }}><ArrowUpRight size={14} color="var(--text-muted)" /></td>
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
                                                <table className="responsive-table col-5">
                                                    <thead>
                                                        <tr>
                                                            <th>MALZEME</th>
                                                            <th>FORM NO</th>
                                                            <th style={{ textAlign: 'center' }}>MİKTAR</th>
                                                            <th>TALEP EDEN</th>
                                                            <th style={{ textAlign: 'center', width: '200px' }}>İŞLEMLER</th>
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
                                                                return <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>İşlem bekleyen malzeme kalmadı.</td></tr>;
                                                            }

                                                            return pendingList.map((item) => (
                                                                <tr key={`${item.s_id}-${item.s_idx}`}>
                                                                    <td data-label="Malzeme" style={{ fontWeight: '600' }}>{item.itemName}</td>
                                                                    <td data-label="Form No">{item.s_no}</td>
                                                                    <td data-label="Miktar" style={{ textAlign: 'center' }}><strong>{item.amount}</strong> {item.unit}</td>
                                                                    <td data-label="Talep Eden">{item.requestedBy}</td>
                                                                    <td data-label="İşlemler" style={{ textAlign: 'center' }}>
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
                                                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: '700', borderBottom: '1px solid #e2e8f0' }}>Malzeme</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: '700', borderBottom: '1px solid #e2e8f0' }}>Miktar</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: '700', borderBottom: '1px solid #e2e8f0' }}>Birim</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: '700', borderBottom: '1px solid #e2e8f0' }}>Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(sevkiyatModal.data.items || []).map((it, idx) => {
                                                    const st = sevkiyatModal.data.itemStatuses?.[idx] || 'pending';
                                                    return (
                                                        <tr key={idx} style={{
                                                            borderBottom: '1px solid #f1f5f9',
                                                            background: st === 'purchased' ? '#f0fdf4' : st === 'cancelled' ? '#fef2f2' : 'white'
                                                        }}>
                                                            <td style={{
                                                                padding: '10px 12px',
                                                                fontWeight: '600',
                                                                color: st === 'purchased' ? '#166534' : st === 'cancelled' ? '#991b1b' : '#334155',
                                                                textDecoration: st === 'cancelled' ? 'line-through' : 'none'
                                                            }}>{it.itemName}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>{it.amount}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{it.unit}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
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
                                <div style={{ overflowY: 'auto', height: '555px' }}>
                                    <table className="responsive-table col-7" style={{ width: '100%' }}>
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-table-header)' }}>
                                            <tr>
                                                <th>GİRİŞ TARİHİ</th>
                                                <th>ÇIKIŞ TARİHİ</th>
                                                <th>TC</th>
                                                <th>AD SOYAD</th>
                                                <th>TAŞERON</th>
                                                <th style={{ textAlign: 'center' }}>DURUM</th>
                                                {canEdit && <th style={{ textAlign: 'center', width: '90px' }}>İŞLEMLER</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {personel.length === 0 && (
                                                <tr>
                                                    <td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                                        Henüz personel kaydı yok.
                                                    </td>
                                                </tr>
                                            )}
                                            {personel.map(p => (
                                                <tr key={p.id}>
                                                    <td data-label="Giriş Tarihi">{p.girisTarihi}</td>
                                                    <td data-label="Çıkış Tarihi">{p.cikisTarihi || '—'}</td>
                                                    <td data-label="TC">{p.tc}</td>
                                                    <td data-label="Ad Soyad">{p.adSoyad}</td>
                                                    <td data-label="Taşeron">{p.taseron}</td>
                                                    <td data-label="Durum" style={{ textAlign: 'center' }}>
                                                        {!p.cikisTarihi
                                                            ? <span className="movement-type-pill in">Çalışıyor</span>
                                                            : <span className="movement-type-pill out">Çıkış Yapıldı</span>
                                                        }
                                                    </td>
                                                    {canEdit && (
                                                        <td data-label="İşlemler" style={{ textAlign: 'center' }}>
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
                                        <div className="table-responsive-wrapper">
                                            <table className="responsive-table col-5">
                                                <thead>
                                                    <tr>
                                                        <th>TARİH</th>
                                                        <th>MALZEME</th>
                                                        <th style={{ textAlign: 'right' }}>MİKTAR</th>
                                                        <th>TALEP EDEN</th>
                                                        {canEdit && <th style={{ textAlign: 'center', width: '180px' }}>İŞLEMLER</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {requests.filter(r => r.status === 'pending').length === 0 ? (
                                                        <tr><td colSpan={canEdit ? 5 : 4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Bekleyen talep yok.</td></tr>
                                                    ) : requests.filter(r => r.status === 'pending').map(req => (
                                                        <tr key={req.id}>
                                                            <td data-label="Tarih">{String(req.date || '').split(',')[0].split(' ')[0]}</td>
                                                            <td data-label="Malzeme">{req.itemName}</td>
                                                            <td data-label="Miktar" style={{ textAlign: 'right' }}>{req.amount} {req.unit}</td>
                                                            <td data-label="Talep Eden">{req.requestedBy}</td>
                                                            {canEdit && (
                                                                <td data-label="İşlemler" style={{ textAlign: 'center' }}>
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
                                                        <table className="responsive-table col-7">
                                                            <thead>
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>MALZEME</th>
                                                                    <th style={{ textAlign: 'center' }}>STOK</th>
                                                                    <th style={{ textAlign: 'center' }}>İSTENİLEN</th>
                                                                    <th style={{ textAlign: 'center' }}>BİRİM</th>
                                                                    <th>TALEP EDEN</th>
                                                                    <th>AÇIKLAMA</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {approvedReqs.map((req, idx) => {
                                                                    const stockItem = items.find(i => Number(i.id) === Number(req.itemId));
                                                                    const stockQty = stockItem ? stockItem.quantity : 0;
                                                                    return (
                                                                        <tr key={req.id}>
                                                                            <td data-label="#">{idx + 1}</td>
                                                                            <td data-label="Malzeme" style={{ fontWeight: '600' }}>{req.itemName}</td>
                                                                            <td data-label="Stok" style={{ textAlign: 'center' }}>
                                                                                <span style={{ color: stockQty <= 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '600' }}>
                                                                                    {formatNumber(stockQty)}
                                                                                </span>
                                                                            </td>
                                                                            <td data-label="Miktar" style={{ textAlign: 'center' }}>{req.amount}</td>
                                                                            <td data-label="Birim" style={{ textAlign: 'center' }}>{req.unit}</td>
                                                                            <td data-label="Talep Eden">{req.requestedBy}</td>
                                                                            <td data-label="Açıklama">{req.note || '—'}</td>
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
                    {showMoveModal && canEdit && (
                        <div className="modal-overlay">
                            <div className="modal-card">
                                <div className="modal-header">
                                    <span className="modal-title" style={{ color: movementType === 'in' ? 'var(--success)' : 'var(--danger)' }}>
                                        {movementType === 'in' ? '↑ Malzeme Girişi' : '↓ Malzeme Çıkışı'}
                                    </span>
                                    <button className="btn-icon" onClick={() => { setShowMoveModal(false); setIsQuickAdd(false); setIsNewRecipient(false); setInIrsaliyeNo(''); setShowAddMalzemeAdi(false); setShowAddMalzemeTuru(false); setShowAddBirim(false); setShowAddFirma(false); setShowAddIrsaliye(false); }}><X size={16} /></button>
                                </div>

                                <form onSubmit={handleMoveStock}>
                                    {movementType === 'in' ? (
                                        /* ── GİRİŞ FORMU ── */
                                        <>
                                            {/* 1. Malzeme Adı */}
                                            <div className="mb-2">
                                                <div className="flex align-center gap-2 mb-1">
                                                    <label className="label" style={{ margin: 0 }}>Malzeme Adı</label>
                                                    {canEdit && (
                                                        <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }}
                                                            onClick={() => setShowAddMalzemeAdi(v => !v)}>
                                                            + Malzeme Adı Ekle
                                                        </button>
                                                    )}
                                                </div>
                                                {showAddMalzemeAdi && canEdit && (
                                                    <div className="flex gap-2 mb-1">
                                                        <input
                                                            value={newMalzemeAdiInput}
                                                            onChange={e => setNewMalzemeAdiInput(e.target.value)}
                                                            placeholder="Yeni malzeme adı..."
                                                            style={{ flex: 1 }}
                                                        />
                                                        <button type="button" className="btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }}
                                                            onClick={async () => {
                                                                if (!newMalzemeAdiInput.trim()) return;
                                                                const id = String(Date.now());
                                                                await set(ref(db, `items/${id}`), { id: Number(id), name: newMalzemeAdiInput.trim(), unit: 'Adet', category: 'Genel', quantity: 0, minStock: 0 });
                                                                setNewMalzemeAdiInput('');
                                                                setShowAddMalzemeAdi(false);
                                                            }}>
                                                            Kaydet
                                                        </button>
                                                        <button type="button" className="btn-ghost" onClick={() => setShowAddMalzemeAdi(false)}><X size={14} /></button>
                                                    </div>
                                                )}
                                                <input
                                                    list="malzeme-datalist"
                                                    value={inMalzemeAdi}
                                                    onChange={e => setInMalzemeAdi(e.target.value)}
                                                    placeholder="Malzeme adı yazın..."
                                                    required
                                                    autoComplete="off"
                                                />
                                                <datalist id="malzeme-datalist">
                                                    {sortedItems.map(i => <option key={i.id} value={i.name} />)}
                                                </datalist>
                                            </div>
                                            {/* 2. Malzeme Türü */}
                                            <div className="mb-2">
                                                <div className="flex align-center gap-2 mb-1">
                                                    <label className="label" style={{ margin: 0 }}>Malzeme Türü</label>
                                                    {canEdit && (
                                                        <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }}
                                                            onClick={() => setShowAddMalzemeTuru(v => !v)}>
                                                            + Tür Ekle
                                                        </button>
                                                    )}
                                                </div>
                                                {showAddMalzemeTuru && canEdit && (
                                                    <div className="flex gap-2 mb-1">
                                                        <input
                                                            value={newMalzemeTuruInput}
                                                            onChange={e => setNewMalzemeTuruInput(e.target.value)}
                                                            placeholder="Yeni malzeme türü..."
                                                            style={{ flex: 1 }}
                                                        />
                                                        <button type="button" className="btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }}
                                                            onClick={async () => {
                                                                if (!newMalzemeTuruInput.trim()) return;
                                                                const id = String(Date.now());
                                                                await set(ref(db, `malzemeTurleri/${id}`), { id, name: newMalzemeTuruInput.trim() });
                                                                setNewMalzemeTuruInput('');
                                                                setShowAddMalzemeTuru(false);
                                                            }}>
                                                            Kaydet
                                                        </button>
                                                        <button type="button" className="btn-ghost" onClick={() => setShowAddMalzemeTuru(false)}><X size={14} /></button>
                                                    </div>
                                                )}
                                                <select name="malzemeTuru" required>
                                                    <option value="">-- Seçin --</option>
                                                    {malzemeTurleri.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            {/* 3. Tarih */}
                                            <div className="mb-2">
                                                <label className="label">Tarih</label>
                                                <input name="actionDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                                            </div>
                                            {/* 4+5. Miktar + Birim */}
                                            <div className="flex gap-2 mb-2">
                                                <div style={{ flex: 1 }}>
                                                    <label className="label">Miktar</label>
                                                    <input name="amount" type="number" required min="0.01" step="0.01" placeholder="0.00" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div className="flex align-center gap-2 mb-1">
                                                        <label className="label" style={{ margin: 0 }}>Birim</label>
                                                        {canEdit && (
                                                            <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }}
                                                                onClick={() => setShowAddBirim(v => !v)}>
                                                                + Birim Ekle
                                                            </button>
                                                        )}
                                                    </div>
                                                    {showAddBirim && canEdit && (
                                                        <div className="flex gap-2 mb-1">
                                                            <input
                                                                value={newBirimInput}
                                                                onChange={e => setNewBirimInput(e.target.value)}
                                                                placeholder="Yeni birim..."
                                                                style={{ flex: 1 }}
                                                            />
                                                            <button type="button" className="btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }}
                                                                onClick={async () => {
                                                                    if (!newBirimInput.trim()) return;
                                                                    const id = String(Date.now());
                                                                    await set(ref(db, `birimler/${id}`), { id, name: newBirimInput.trim() });
                                                                    setNewBirimInput('');
                                                                    setShowAddBirim(false);
                                                                }}>
                                                                Kaydet
                                                            </button>
                                                            <button type="button" className="btn-ghost" onClick={() => setShowAddBirim(false)}><X size={14} /></button>
                                                        </div>
                                                    )}
                                                    <select name="unit">
                                                        {birimlerList.map(b => <option key={b}>{b}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            {/* 6. İrsaliye No */}
                                            <div className="mb-2">
                                                <div className="flex align-center gap-2 mb-1">
                                                    <label className="label" style={{ margin: 0 }}>İrsaliye No</label>
                                                    {canEdit && (
                                                        <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }}
                                                            onClick={() => setShowAddIrsaliye(v => !v)}>
                                                            + İrsaliye No Ekle
                                                        </button>
                                                    )}
                                                </div>
                                                {showAddIrsaliye && canEdit && (
                                                    <div className="flex gap-2 mb-1">
                                                        <input
                                                            value={newIrsaliyeInput}
                                                            onChange={e => setNewIrsaliyeInput(e.target.value)}
                                                            placeholder="İrsaliye numarası..."
                                                            style={{ flex: 1 }}
                                                        />
                                                        <button type="button" className="btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }}
                                                            onClick={async () => {
                                                                if (!newIrsaliyeInput.trim()) return;
                                                                const id = String(Date.now());
                                                                await set(ref(db, `irsaliyeListesi/${id}`), { id: Number(id), no: newIrsaliyeInput.trim() });
                                                                setInIrsaliyeNo(newIrsaliyeInput.trim());
                                                                setNewIrsaliyeInput('');
                                                                setShowAddIrsaliye(false);
                                                            }}>
                                                            Kaydet
                                                        </button>
                                                        <button type="button" className="btn-ghost" onClick={() => setShowAddIrsaliye(false)}><X size={14} /></button>
                                                    </div>
                                                )}
                                                <input
                                                    name="irsaliyeNo"
                                                    list="irsaliye-datalist"
                                                    value={inIrsaliyeNo}
                                                    onChange={e => setInIrsaliyeNo(e.target.value)}
                                                    placeholder="Örn: IRS-2026-001"
                                                    autoComplete="off"
                                                />
                                                <datalist id="irsaliye-datalist">
                                                    {irsaliyeListesi.map(i => <option key={i.id} value={i.no} />)}
                                                </datalist>
                                            </div>
                                            {/* 7. Firma Adı */}
                                            <div className="mb-2">
                                                <div className="flex align-center gap-2 mb-1">
                                                    <label className="label" style={{ margin: 0 }}>Firma Adı</label>
                                                    {canEdit && (
                                                        <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }}
                                                            onClick={() => setShowAddFirma(v => !v)}>
                                                            + Firma Ekle
                                                        </button>
                                                    )}
                                                </div>
                                                {showAddFirma && canEdit && (
                                                    <div className="flex gap-2 mb-1">
                                                        <input
                                                            value={newFirmaInput}
                                                            onChange={e => setNewFirmaInput(e.target.value)}
                                                            placeholder="Yeni firma adı..."
                                                            style={{ flex: 1 }}
                                                        />
                                                        <button type="button" className="btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }}
                                                            onClick={async () => {
                                                                if (!newFirmaInput.trim()) return;
                                                                const id = String(Date.now());
                                                                await set(ref(db, `firmalar/${id}`), { id, name: newFirmaInput.trim() });
                                                                setNewFirmaInput('');
                                                                setShowAddFirma(false);
                                                            }}>
                                                            Kaydet
                                                        </button>
                                                        <button type="button" className="btn-ghost" onClick={() => setShowAddFirma(false)}><X size={14} /></button>
                                                    </div>
                                                )}
                                                <input
                                                    list="firma-datalist"
                                                    value={inFirmaAdi}
                                                    onChange={e => setInFirmaAdi(e.target.value)}
                                                    placeholder="Firma adı yazın..."
                                                    autoComplete="off"
                                                />
                                                <datalist id="firma-datalist">
                                                    {allFirmaAdlari.map(f => <option key={f} value={f} />)}
                                                </datalist>
                                            </div>
                                            {/* 8. Teslim Alan Kişi */}
                                            <div className="mb-2">
                                                <div className="flex align-center gap-2 mb-1">
                                                    <label className="label" style={{ margin: 0 }}>Teslim Alan Kişi</label>
                                                    {canEdit && (
                                                        <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }}
                                                            onClick={() => setShowAddTeslimAlan(v => !v)}>
                                                            + Kişi Ekle
                                                        </button>
                                                    )}
                                                </div>
                                                {showAddTeslimAlan && canEdit && (
                                                    <div className="flex gap-2 mb-1">
                                                        <input
                                                            value={newTeslimAlanAdi}
                                                            onChange={e => setNewTeslimAlanAdi(e.target.value)}
                                                            placeholder="Yeni kişi adı..."
                                                            style={{ flex: 1 }}
                                                        />
                                                        <button type="button" className="btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }}
                                                            onClick={async () => {
                                                                if (!newTeslimAlanAdi.trim()) return;
                                                                const id = String(Date.now());
                                                                await set(ref(db, `teslimAlanlar/${id}`), { id, name: newTeslimAlanAdi.trim() });
                                                                setNewTeslimAlanAdi('');
                                                                setShowAddTeslimAlan(false);
                                                            }}>
                                                            Kaydet
                                                        </button>
                                                        <button type="button" className="btn-ghost" onClick={() => setShowAddTeslimAlan(false)}><X size={14} /></button>
                                                    </div>
                                                )}
                                                <select name="teslimAlan">
                                                    <option value="">-- Seçin --</option>
                                                    {teslimAlanlar.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        /* ── ÇIKIŞ FORMU ── */
                                        <>
                                            <div className="mb-2">
                                                <label className="label">İşlem Tarihi</label>
                                                <input name="actionDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                                            </div>
                                            <div className="mb-2">
                                                <label className="label">Malzeme Seçin</label>
                                                <select name="itemId" required value={selectedItemForMove?.id || ""}
                                                    onChange={(e) => setSelectedItemForMove(items.find(i => i.id == e.target.value))}>
                                                    <option value="" disabled>-- Seçin --</option>
                                                    {sortedItems.map(i => (
                                                        <option key={i.id} value={i.id}>{i.name} (Stok: {i.quantity})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex gap-2 mb-2">
                                                <div style={{ flex: 1 }}>
                                                    <label className="label">Miktar</label>
                                                    <input name="amount" type="number" required min="0.01" step="0.01" placeholder="0.00" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label className="label">Birim</label>
                                                    <select name="unit" defaultValue={selectedItemForMove?.unit || 'Adet'}>
                                                        <option>Adet</option><option>Kg</option><option>M</option>
                                                        <option>M2</option><option>M3</option><option>Ton</option>
                                                        <option>Palet</option><option>Torba</option><option>Paket</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mb-2">
                                                <label className="label">Verilen Birim</label>
                                                <input name="verilenBirim" placeholder="Örn: A Ekibi, Elektrik Birimi..." />
                                            </div>
                                            <div className="mb-2">
                                                <label className="label">Verilen Kişi</label>
                                                {isNewRecipient ? (
                                                    <div className="flex gap-2">
                                                        <input autoFocus name="recipient" placeholder="Yeni kişi adı yazın..." />
                                                        <button type="button" className="btn-ghost" onClick={() => setIsNewRecipient(false)}><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <select name="recipient" defaultValue=""
                                                        onChange={(e) => { if (e.target.value === '__NEW__') setIsNewRecipient(true); }}>
                                                        <option value="">-- Seçin --</option>
                                                        <option value="__NEW__">Yeni Ekle</option>
                                                        {uniqueRecipients.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                            <div className="mb-2">
                                                <label className="label">Kullanım Alanı</label>
                                                <input name="kullanimAlani" placeholder="Örn: A Blok 3. kat, Temel kazısı..." />
                                            </div>
                                        </>
                                    )}
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isSaving || (movementType === 'out' && !selectedItemForMove) || (movementType === 'in' && !inMalzemeAdi.trim())}
                                        style={{ width: '100%', background: movementType === 'in' ? 'var(--success)' : 'var(--danger)', marginTop: '10px', opacity: isSaving ? 0.7 : 1 }}
                                    >
                                        {isSaving ? 'İşleniyor...' : (movementType === 'in' ? 'Girişi Tamamla' : 'Çıkışı Tamamla')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Zimmet Modal */}
                    {showZimmetModal && canEdit && (
                        <div className="modal-overlay">
                            <div className="modal-card">
                                <div className="modal-header">
                                    <span className="modal-title">
                                        <UserCheck size={16} /> Malzeme Zimmetle
                                    </span>
                                    <button className="btn-icon" onClick={() => setShowZimmetModal(false)}><X size={16} /></button>
                                </div>

                                <form onSubmit={handleZimmet}>
                                    <div className="mb-3">
                                        <label className="label">İşlem Tarihi</label>
                                        <input name="actionDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="label">Malzeme Seçin</label>
                                        <select
                                            name="itemId"
                                            required
                                            value={selectedItemForZimmet?.id || ""}
                                            onChange={(e) => setSelectedItemForZimmet(items.find(i => String(i.id) === e.target.value))}
                                        >
                                            <option value="" disabled>-- Seçin --</option>
                                            {sortedItems.map(i => (
                                                <option key={i.id} value={i.id}>{i.name} (Stok: {i.quantity})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="label">Kişi / Ekip</label>
                                        <input name="person" required placeholder="Örn: Ahmet Yılmaz / Tesisat Ekibi" />
                                    </div>

                                    <div className="flex gap-2 mb-3">
                                        <div style={{ flex: 1 }}>
                                            <label className="label">Miktar</label>
                                            <input name="amount" type="number" defaultValue="1" min="1" required />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className="label">Birim</label>
                                            <select name="unit" defaultValue={selectedItemForZimmet?.unit || 'Adet'}>
                                                <option>Adet</option><option>Torba</option><option>Metre</option><option>Palet</option><option>M3</option><option>Ton</option><option>Kg</option><option>Lt</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="label">Not / Açıklama</label>
                                        <input name="note" placeholder="Örn: Geçici kullanım için" />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isSaving || !selectedItemForZimmet}
                                        style={{
                                            width: '100%',
                                            background: '#4f46e5',
                                            marginTop: '10px',
                                            opacity: isSaving ? 0.7 : 1
                                        }}
                                    >
                                        {isSaving ? 'İşleniyor...' : 'Zimmeti Kaydet'}
                                    </button>
                                </form>
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
                                        <select name="role" defaultValue={editingUser?.role || 'izleyici'}>
                                            <option value="admin">Admin</option>
                                            <option value="yonetici">Yönetici</option>
                                            <option value="izleyici">İzleyici</option>
                                        </select>
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
                                    <table className="responsive-table col-4">
                                        <thead>
                                            <tr>
                                                <th>Tarih</th>
                                                <th>{detailModal.type === 'in' ? 'Kaynak' : 'Alan'}</th>
                                                <th>Miktar</th>
                                                <th>Birim</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailModal.item.movements.filter(m => m.type === detailModal.type).sort((a, b) => b.id - a.id).map(m => (
                                                <tr key={m.id}>
                                                    <td data-label="Tarih">{String(m.date || '').split(',')[0].split(' ')[0]}</td>
                                                    <td data-label={detailModal.type === 'in' ? 'Kaynak' : 'Alan'}>{m.recipient || '-'}</td>
                                                    <td style={{ textAlign: 'right' }} data-label="Miktar">{formatNumber(m.amount)}</td>
                                                    <td style={{ textAlign: 'center' }} data-label="Birim">{detailModal.item.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dashboard Detail Modal */}
                    {dashModal.show && (
                        <div className="modal-overlay">
                            <div className="modal-card modal-card-wide" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
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
                                    <table className={`responsive-table ${dashModal.type === 'stock' ? 'col-3' : dashModal.moveType === 'in' ? 'col-6' : 'col-7'}`}>
                                        <thead>
                                            {dashModal.type === 'stock' ? (
                                                <tr><th>MALZEME</th><th>MİKTAR</th><th>BİRİM</th></tr>
                                            ) : dashModal.moveType === 'in' ? (
                                                <tr>
                                                    <th>TARİH</th>
                                                    <th>FİRMA</th>
                                                    <th>İRSALİYE NO</th>
                                                    <th>MALZEME</th>
                                                    <th>MİKTAR</th>
                                                    <th>BİRİM</th>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <th>TARİH</th>
                                                    <th>MALZEME</th>
                                                    <th>MİKTAR</th>
                                                    <th>BİRİM</th>
                                                    <th>VERİLEN BİRİM</th>
                                                    <th>VERİLEN KİŞİ</th>
                                                    <th>KULLANIM ALANI</th>
                                                </tr>
                                            )}
                                        </thead>
                                        <tbody>
                                            {dashModal.data.length === 0 ? (
                                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Kayıt bulunamadı.</td></tr>
                                            ) : dashModal.data.map((item, idx) => (
                                                <tr key={idx}>
                                                    {dashModal.type === 'stock' ? (
                                                        <>
                                                            <td data-label="Malzeme">
                                                                <div className="material-cell"><Package size={14} className="material-icon-small" /><span>{item.name}</span></div>
                                                            </td>
                                                            <td style={{ textAlign: 'right' }} data-label="Miktar">{formatNumber(item.quantity)}</td>
                                                            <td style={{ textAlign: 'center' }} data-label="Birim">{item.unit}</td>
                                                        </>
                                                    ) : dashModal.moveType === 'in' ? (
                                                        <>
                                                            <td data-label="Tarih">{String(item.date || '').split(',')[0].split(' ')[0]}</td>
                                                            <td data-label="Firma">{item.firmaAdi || '—'}</td>
                                                            <td data-label="İrsaliye No">{item.irsaliyeNo || '—'}</td>
                                                            <td data-label="Malzeme" style={{ fontWeight: '600' }}>{item.itemName}</td>
                                                            <td data-label="Miktar" style={{ color: 'var(--success)', fontWeight: '700' }}>+{formatNumber(item.amount)}</td>
                                                            <td data-label="Birim">{item.unit || '—'}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td data-label="Tarih">{String(item.date || '').split(',')[0].split(' ')[0]}</td>
                                                            <td data-label="Malzeme" style={{ fontWeight: '600' }}>{item.itemName}</td>
                                                            <td data-label="Miktar" style={{ color: 'var(--danger)', fontWeight: '700' }}>−{formatNumber(item.amount)}</td>
                                                            <td data-label="Birim">{item.unit || '—'}</td>
                                                            <td data-label="Verilen Birim">{item.verilenBirim || '—'}</td>
                                                            <td data-label="Verilen Kişi">{item.recipient || '—'}</td>
                                                            <td data-label="Kullanım Alanı">{item.kullanimAlani || item.note || '—'}</td>
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

                    {/* ── REQUEST MODAL ── */}
                    {showRequestModal && (
                        <div className="modal-overlay">
                            <div className="modal-card">
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

                    <footer style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', paddingBottom: '20px' }}>
                        &copy; 2026 Shintea | Serkan Kalmaz
                    </footer>

                </div>
            </div>

            {/* Center Success Message Overlay */}
            {showSuccessOverlay && (
                <div className="center-success-overlay">
                    <div className="success-message-card">
                        <CheckCircle2 size={48} color="#16a34a" />
                        <span>SATIN ALIM İÇİN GÖNDERİLDİ</span>
                    </div>
                </div>
            )}
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
