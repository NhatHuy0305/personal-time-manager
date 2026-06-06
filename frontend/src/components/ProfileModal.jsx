import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../api/authApi';
import { UserCircleIcon, EnvelopeIcon, CalendarDaysIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const ProfileModal = ({ isOpen, onClose }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editName, setEditName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
            setIsEditing(false);
            setSuccess('');
            setError('');
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await getProfile();
            setProfile(res.data);
            setEditName(res.data.fullName || '');
        } catch (err) {
            console.error('Loi tai ho so:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editName.trim()) {
            setError('Ten khong duoc de trong!');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await updateProfile({ fullName: editName.trim() });
            setProfile(prev => ({ ...prev, fullName: editName.trim() }));
            setIsEditing(false);
            setSuccess('Cap nhat ho so thanh cong!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Loi khi cap nhat ho so!');
        } finally {
            setSaving(false);
        }
    };

    const getProviderLabel = (provider) => {
        switch (provider) {
            case 'GOOGLE': return { text: 'Google', color: 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' };
            default: return { text: 'Email/Password', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' };
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-xs p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-colors">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-lg font-bold z-10 p-1 cursor-pointer"
                >
                    ✕
                </button>

                {/* Header gradient */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 pt-8 pb-14 relative">
                    <h2 className="text-xl font-bold text-white">Ho so ca nhan</h2>
                    <p className="text-blue-100 text-sm mt-1">Quan ly thong tin tai khoan</p>
                </div>

                {/* Avatar overlap */}
                <div className="flex justify-center -mt-10 mb-4">
                    <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center">
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <UserCircleIcon className="w-16 h-16 text-gray-300 dark:text-slate-500" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400 dark:text-slate-500">Dang tai...</div>
                    ) : profile ? (
                        <div className="space-y-4">
                            {/* Success / Error messages */}
                            {success && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl border border-green-100 dark:border-green-800 font-medium">
                                    <CheckCircleIcon className="w-5 h-5 shrink-0" />
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800 font-medium">
                                    {error}
                                </div>
                            )}

                            {/* Full Name */}
                            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    <UserCircleIcon className="w-4 h-4" />
                                    Ten hien thi
                                </label>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-gray-900 dark:text-white"
                                            autoFocus
                                            placeholder="Nhap ten cua ban..."
                                        />
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            {saving ? '...' : 'Luu'}
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(false); setEditName(profile.fullName || ''); setError(''); }}
                                            className="px-3 py-2 bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors cursor-pointer"
                                        >
                                            Huy
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-medium text-gray-900 dark:text-white">
                                            {profile.fullName || 'Chua cap nhat'}
                                        </span>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        >
                                            Chinh sua
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    <EnvelopeIcon className="w-4 h-4" />
                                    Email
                                </label>
                                <span className="text-base text-gray-700 dark:text-slate-300">{profile.email}</span>
                            </div>

                            {/* Auth Provider */}
                            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    <ShieldCheckIcon className="w-4 h-4" />
                                    Phuong thuc dang nhap
                                </label>
                                {(() => {
                                    const provider = getProviderLabel(profile.authProvider);
                                    return (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${provider.color}`}>
                                            {provider.text}
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* Created At */}
                            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    Ngay tham gia
                                </label>
                                <span className="text-base text-gray-700 dark:text-slate-300">
                                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN', {
                                        day: '2-digit', month: '2-digit', year: 'numeric'
                                    }) : 'N/A'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-red-400">Khong the tai ho so</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
