import React, { useState } from 'react';
import { RegisteredUser } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Lock,
  Mail,
  Building,
  Briefcase,
  IdCard,
  Phone,
  UserCheck,
  UserX,
  Filter,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';

interface AdminUsersManagementProps {
  users: RegisteredUser[];
  onAddUser: (user: RegisteredUser) => void;
  onUpdateUser: (user: RegisteredUser) => void;
  onDeleteUser: (userId: string) => void;
  currentAdminEmail?: string;
}

const DOMAIN = 'mitwpu.edu.in';

export const AdminUsersManagement: React.FC<AdminUsersManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentAdminEmail = 'accounts@mitwpu.edu.in',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'faculty' | 'admin'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'faculty' | 'admin'>('faculty');
  const [department, setDepartment] = useState('Computer Engineering');
  const [designation, setDesignation] = useState('Assistant Professor & Faculty Coordinator');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  // Password visibility map for table rows
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Change Password Modal
  const [userForPasswordChange, setUserForPasswordChange] = useState<RegisteredUser | null>(null);
  const [changedPasswordInput, setChangedPasswordInput] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith(`@${DOMAIN}`)) {
      setFormError(`Official policy: Only institutional accounts ending in @${DOMAIN} can be registered.`);
      return;
    }

    if (!name.trim()) {
      setFormError('Please enter full official name.');
      return;
    }

    if (!employeeId.trim()) {
      setFormError('Please enter institutional Employee ID.');
      return;
    }

    const assignedPassword = password.trim() || (role === 'admin' ? 'admin123' : `${cleanEmail.split('@')[0]}@2026`);

    // Check duplicate
    if (users.some(u => u.email.trim().toLowerCase() === cleanEmail)) {
      setFormError(`An account with email "${cleanEmail}" is already registered.`);
      return;
    }

    const newUser: RegisteredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name: name.trim(),
      role,
      password: assignedPassword,
      department: department.trim(),
      designation: designation.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      phone: phone.trim() || undefined,
      status: 'active',
      registeredBy: `Admin Department (${currentAdminEmail})`,
      registeredAt: new Date().toISOString(),
    };

    onAddUser(newUser);
    setFeedbackMsg({
      type: 'success',
      text: `Account "${cleanEmail}" registered successfully with password "${assignedPassword}". The faculty can now log in.`,
    });
    setIsAddModalOpen(false);

    // Reset Form
    setName('');
    setEmail('');
    setPassword('');
    setEmployeeId('');
    setPhone('');
    setTimeout(() => setFeedbackMsg(null), 7000);
  };

  const handleSaveChangedPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForPasswordChange) return;

    if (!changedPasswordInput.trim() || changedPasswordInput.trim().length < 4) {
      setChangePasswordError('Password must be at least 4 characters long.');
      return;
    }

    const updatedUser: RegisteredUser = {
      ...userForPasswordChange,
      password: changedPasswordInput.trim(),
    };

    onUpdateUser(updatedUser);
    setFeedbackMsg({
      type: 'success',
      text: `Password for ${userForPasswordChange.email} updated successfully.`,
    });
    setUserForPasswordChange(null);
    setChangedPasswordInput('');
    setChangePasswordError('');
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleToggleStatus = (user: RegisteredUser) => {
    const updatedStatus: 'active' | 'suspended' = user.status === 'active' ? 'suspended' : 'active';
    const updatedUser: RegisteredUser = { ...user, status: updatedStatus };
    onUpdateUser(updatedUser);
    setFeedbackMsg({
      type: 'success',
      text: `Account ${user.email} is now ${updatedStatus === 'active' ? 'Active (allowed to login)' : 'Suspended (login blocked)'}.`,
    });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleDelete = (user: RegisteredUser) => {
    if (user.email === 'accounts@mitwpu.edu.in') {
      alert('The primary Admin Department root account cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to revoke access and remove "${user.email}" from the Admin Registry? They will no longer be able to log in.`)) {
      onDeleteUser(user.id);
      setFeedbackMsg({
        type: 'success',
        text: `Account "${user.email}" removed from Admin Registry. Access revoked.`,
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#002D5C] via-[#001f40] to-zinc-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono-tabular">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Department · Access Control</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-white font-heading">
            Authorized Accounts Registry
          </h1>
          <p className="text-zinc-300 text-xs mt-1 max-w-2xl leading-relaxed">
            Strict institutional whitelist enforcement: Only faculty and administrators registered in this registry with verified <strong>@{DOMAIN}</strong> credentials can log in. Random or unverified emails are strictly blocked.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError('');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Account</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Registry Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase font-mono-tabular">
            Total Registered
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {users.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Admin-authorized</div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase font-mono-tabular">
            Active Accounts
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Can login immediately</div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase font-mono-tabular">
            Faculty Members
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {users.filter(u => u.role === 'faculty').length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Field coordinators</div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase font-mono-tabular">
            Accounts Admins
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Auditors &amp; Finance</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono-tabular"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                roleFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              All Roles ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('faculty')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                roleFilter === 'faculty'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Faculty ({users.filter(u => u.role === 'faculty').length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                roleFilter === 'admin'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Admin ({users.filter(u => u.role === 'admin').length})
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase font-mono-tabular text-[10px]">
                <th className="py-3 px-4 font-semibold">User &amp; Email</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Department &amp; Designation</th>
                <th className="py-3 px-4 font-semibold">Employee ID</th>
                <th className="py-3 px-4 font-semibold">Password</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs">
                    No registered accounts found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const initials = user.name
                    .split(/\s+/)
                    .map(p => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const isSuspended = user.status === 'suspended';
                  const userPwd = user.password || (user.role === 'admin' ? 'admin123' : `${user.email.split('@')[0]}@2026`);
                  const isPwdRevealed = Boolean(visiblePasswords[user.id]);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition ${
                        isSuspended ? 'opacity-60 bg-zinc-50/50 dark:bg-zinc-900/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.email === currentAdminEmail && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold font-mono-tabular">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono-tabular flex items-center gap-1">
                              <Mail className="w-3 h-3 text-zinc-400" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono-tabular ${
                            user.role === 'admin'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{user.role === 'admin' ? 'Accounts Admin' : 'Faculty Member'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-zinc-900 dark:text-zinc-200 font-medium">
                          {user.department}
                        </div>
                        <div className="text-[10px] text-zinc-400">{user.designation}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono-tabular text-zinc-600 dark:text-zinc-300 font-semibold">
                        {user.employeeId}
                      </td>

                      {/* Individual Password Column */}
                      <td className="py-3.5 px-4 font-mono-tabular">
                        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 w-fit">
                          <Lock className="w-3 h-3 text-zinc-400" />
                          <span className="text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold select-all">
                            {isPwdRevealed ? userPwd : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                            title={isPwdRevealed ? 'Hide password' : 'Show password'}
                          >
                            {isPwdRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setUserForPasswordChange(user);
                              setChangedPasswordInput(user.password || '');
                              setChangePasswordError('');
                            }}
                            title="Reset password for this account"
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === 'active' ? 'Suspend account login' : 'Reactivate account'}
                            className={`p-1.5 rounded-lg border text-xs transition ${
                              user.status === 'active'
                                ? 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/50'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50'
                            }`}
                          >
                            {user.status === 'active' ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {user.email !== 'accounts@mitwpu.edu.in' && (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              title="Delete account from registry"
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                    Register Authorized Institutional Account
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono-tabular">
                    MIT-WPU Admin Department Enrollment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name (with Title) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Kulkarni"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Official Email */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Official University Email * (Must end in @{DOMAIN})
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={`faculty.name@${DOMAIN}`}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono-tabular text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Individual Password */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Faculty Personal Password * (Required for password login)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="e.g. prachi@mit2026"
                    className="w-full pl-9 pr-10 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono-tabular text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  The faculty member will use this exact password to sign in to their account.
                </p>
              </div>

              {/* Role & Employee ID Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    System Role *
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as 'faculty' | 'admin')}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="faculty">Faculty Member</option>
                    <option value="admin">Accounts &amp; Finance Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Employee ID *
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={e => setEmployeeId(e.target.value)}
                      placeholder="e.g. MIT-ENG-5102"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono-tabular text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Academic Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Engineering"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Assistant Professor"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Contact Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono-tabular text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register &amp; Authorize Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {userForPasswordChange && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                    Reset Account Password
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono-tabular">
                    {userForPasswordChange.name} ({userForPasswordChange.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserForPasswordChange(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChangedPassword} className="space-y-4">
              {changePasswordError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {changePasswordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  New Password for {userForPasswordChange.name} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={changedPasswordInput}
                    onChange={e => setChangedPasswordInput(e.target.value)}
                    placeholder="Enter new individual password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono-tabular text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Once saved, the user must use this new password to sign in to the portal.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserForPasswordChange(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
