import { useState, useEffect, useMemo } from 'react';
import { Expense, FacultyCoordinator, ImmersionCamp, TripRecord, UserSession, Attachment, BillVerificationStatus, RegisteredUser } from './types';
import { StorageService, FACULTY_ROSTER } from './services/storage';
import { FirestoreService } from './services/firestoreSync';
import { testFirestoreConnection, signOutUser, auth } from './firebase';
import { useOnlineStatus, usePWAInstall, useTheme } from './hooks/usePWA';

// Components
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { Dashboard } from './components/Dashboard';
import { AddExpense } from './components/AddExpense';
import { ExpenseLedger } from './components/ExpenseLedger';
import { Analytics } from './components/Analytics';
import { AccountsStatement } from './components/AccountsStatement';
import { ReceiptModal } from './components/ReceiptModal';
import { FacultyModal } from './components/FacultyModal';
import { ImmersionModal } from './components/ImmersionModal';
import { TripsManagement } from './components/TripsManagement';
import { LedgerVerification } from './components/LedgerVerification';
import { AdminStatements } from './components/AdminStatements';
import { AdminUsersManagement } from './components/AdminUsersManagement';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { theme, toggleTheme } = useTheme();

  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [session, setSession] = useState<UserSession | null>(() => StorageService.getSession());

  // Data states
  const [faculty, setFaculty] = useState<FacultyCoordinator>(() => StorageService.getFaculty());
  const [immersion, setImmersion] = useState<ImmersionCamp>(() => StorageService.getImmersion());
  const [expenses, setExpenses] = useState<Expense[]>(() => StorageService.getExpenses());
  const [trips, setTrips] = useState<TripRecord[]>(() => StorageService.getTrips());
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => StorageService.getRegisteredUsers());
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    return localStorage.getItem('ruip_selected_trip') || trips[0]?.id || 'trip-default';
  });

  // Modals
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [immersionModalOpen, setImmersionModalOpen] = useState(false);
  const [selectedExpenseForReceipt, setSelectedExpenseForReceipt] = useState<Expense | null>(null);

  // Firestore Real-Time Subscriptions & Connection Test
  useEffect(() => {
    // Mandated test of Firestore connection on boot
    testFirestoreConnection();

    // Per Firebase Skill: Only attach onSnapshot listeners if user is authenticated/session active
    if (!session && !auth.currentUser) {
      return;
    }

    // Subscribe to real-time collections from Firebase Firestore
    const unsubExpenses = FirestoreService.subscribeExpenses((freshExpenses) => {
      setExpenses(freshExpenses);
    });

    const unsubTrips = FirestoreService.subscribeTrips((freshTrips) => {
      setTrips(freshTrips);
    });

    const unsubImmersion = FirestoreService.subscribeImmersion((freshCamp) => {
      setImmersion(freshCamp);
    });

    const unsubUsers = FirestoreService.subscribeRegisteredUsers((freshUsers) => {
      setRegisteredUsers(freshUsers);
    });

    return () => {
      unsubExpenses();
      unsubTrips();
      unsubImmersion();
      unsubUsers();
    };
  }, [session]);

  // Sync state to LocalStorage for offline resilience
  useEffect(() => {
    StorageService.saveFaculty(faculty);
  }, [faculty]);

  useEffect(() => {
    StorageService.saveImmersion(immersion);
  }, [immersion]);

  useEffect(() => {
    StorageService.saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    StorageService.saveTrips(trips);
  }, [trips]);

  useEffect(() => {
    StorageService.saveRegisteredUsers(registeredUsers);
  }, [registeredUsers]);

  useEffect(() => {
    StorageService.saveSession(session);
  }, [session]);

  // Filter trips accessible to the current user
  // - Admins see all trips
  // - Faculty ONLY see trips where their email is in coordinatorEmails
  const userAccessibleTrips = useMemo(() => {
    if (!session) return [];
    if (session.role === 'admin') return trips;
    const userEmail = session.email.trim().toLowerCase();
    return trips.filter(trip =>
      (trip.coordinatorEmails || []).some(
        em => em.trim().toLowerCase() === userEmail
      )
    );
  }, [trips, session]);

  // Active Trip derived info: restricted strictly to accessible trips
  const activeTrip = useMemo(() => {
    if (userAccessibleTrips.length === 0) return null;
    const found = userAccessibleTrips.find(t => t.id === selectedTripId);
    return found || userAccessibleTrips[0];
  }, [userAccessibleTrips, selectedTripId]);

  // Keep selectedTripId in sync when accessible trips change
  useEffect(() => {
    if (activeTrip && activeTrip.id !== selectedTripId) {
      setSelectedTripId(activeTrip.id);
      localStorage.setItem('ruip_selected_trip', activeTrip.id);
    }
  }, [activeTrip, selectedTripId]);

  // Filter expenses for current trip
  const currentTripExpenses = useMemo(() => {
    if (!activeTrip) return [];
    return expenses.filter(e => (e.tripId || 'trip-default') === activeTrip.id);
  }, [expenses, activeTrip]);

  // Synchronize immersion settings with selected trip
  const activeImmersion: ImmersionCamp = useMemo(() => {
    if (!activeTrip) return immersion;
    return {
      ...immersion,
      tripCode: activeTrip.tripCode,
      village: activeTrip.village,
      taluka: activeTrip.taluka,
      district: activeTrip.district,
      department: activeTrip.department,
      startDate: activeTrip.startDate,
      endDate: activeTrip.endDate,
      totalStudents: activeTrip.totalStudents,
      totalFaculty: activeTrip.totalFaculty,
      advanceReceived: activeTrip.budget,
      status: activeTrip.status,
    };
  }, [immersion, activeTrip]);

  const currentTotalSpent = useMemo(() => {
    return currentTripExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentTripExpenses]);

  // Login handler
  const handleLogin = (userSession: UserSession) => {
    setSession(userSession);
    setActiveScreen('dashboard');

    if (userSession.role === 'faculty') {
      const regUser = registeredUsers.find(
        u => u.email.trim().toLowerCase() === userSession.email.trim().toLowerCase()
      );
      if (regUser) {
        setFaculty({
          name: regUser.name,
          email: regUser.email,
          department: regUser.department,
          designation: regUser.designation,
          employeeId: regUser.employeeId,
          phone: regUser.phone || '+91 98220 18492',
          avatarInitials: regUser.name
            .split(/\s+/)
            .map(p => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        });
      } else {
        const existingFaculty = FACULTY_ROSTER.find(f => f.email === userSession.email);
        if (existingFaculty) {
          setFaculty(existingFaculty);
        } else {
          setFaculty(prev => ({
            ...prev,
            name: userSession.name,
            email: userSession.email,
            avatarInitials: userSession.name
              .split(/\s+/)
              .map(p => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
          }));
        }
      }
    }
  };

  // Registered User Management Handlers (Admin Department)
  const handleAddRegisteredUser = (newUser: RegisteredUser) => {
    setRegisteredUsers(prev => [newUser, ...prev]);
    FirestoreService.saveRegisteredUser(newUser);
    StorageService.saveRegisteredUser(newUser);
  };

  const handleUpdateRegisteredUser = (updatedUser: RegisteredUser) => {
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    FirestoreService.saveRegisteredUser(updatedUser);
    StorageService.saveRegisteredUser(updatedUser);
  };

  const handleDeleteRegisteredUser = (userId: string) => {
    setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
    FirestoreService.deleteRegisteredUser(userId);
    StorageService.deleteRegisteredUser(userId);
  };

  const handleLogout = () => {
    signOutUser();
    setSession(null);
    setActiveScreen('dashboard');
  };

  // Add Expense
  const handleAddExpense = (newExp: Expense) => {
    const expenseWithTrip: Expense = {
      ...newExp,
      tripId: selectedTripId,
      billVerification: 'Pending',
    };
    setExpenses(prev => [expenseWithTrip, ...prev]);
    FirestoreService.saveExpense(expenseWithTrip);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    FirestoreService.deleteExpense(id);
  };

  // Attach proof to expense
  const handleAttachProof = (expenseId: string, attachment: Attachment) => {
    setExpenses(prev =>
      prev.map(e => {
        if (e.id !== expenseId) return e;
        const newAttachments = [...e.attachments, attachment];
        const updated = {
          ...e,
          attachments: newAttachments,
          hasBillProof: attachment.type === 'bill' ? true : e.hasBillProof,
          hasUpiProof: attachment.type === 'upi' ? true : e.hasUpiProof,
          billVerification: 'Pending' as const,
        };
        FirestoreService.saveExpense(updated);
        return updated;
      })
    );

    setSelectedExpenseForReceipt(prev => {
      if (prev && prev.id === expenseId) {
        return {
          ...prev,
          attachments: [...prev.attachments, attachment],
          hasBillProof: attachment.type === 'bill' ? true : prev.hasBillProof,
          hasUpiProof: attachment.type === 'upi' ? true : prev.hasUpiProof,
          billVerification: 'Pending',
        };
      }
      return prev;
    });
  };

  // Verify / Reject expense with mandatory remark on rejection
  const handleVerifyExpense = (
    expenseId: string,
    status: BillVerificationStatus,
    remark?: string
  ) => {
    const auditor = session?.name ? `${session.name} (${session.email})` : (session?.email || 'Accounts Administrator');
    const nowIso = new Date().toISOString();

    setExpenses(prev =>
      prev.map(e => {
        if (e.id === expenseId) {
          const updated: Expense = {
            ...e,
            billVerification: status,
            verifiedBy: auditor,
            verifiedAt: nowIso,
          };
          if (status === 'Rejected') {
            updated.rejectionRemark = remark?.trim() || 'Rejected by Accounts audit';
            updated.rejectedBy = auditor;
            updated.rejectedAt = nowIso;
          } else {
            delete updated.rejectionRemark;
            delete updated.rejectedBy;
            delete updated.rejectedAt;
          }
          FirestoreService.saveExpense(updated);
          return updated;
        }
        return e;
      })
    );

    setSelectedExpenseForReceipt(prev => {
      if (!prev || prev.id !== expenseId) return prev;
      const updated: Expense = {
        ...prev,
        billVerification: status,
        verifiedBy: auditor,
        verifiedAt: nowIso,
      };
      if (status === 'Rejected') {
        updated.rejectionRemark = remark?.trim() || 'Rejected by Accounts audit';
        updated.rejectedBy = auditor;
        updated.rejectedAt = nowIso;
      } else {
        delete updated.rejectionRemark;
        delete updated.rejectedBy;
        delete updated.rejectedAt;
      }
      return updated;
    });
  };

  // Batch Reject an entire Faculty Coordinator's ledger with remark
  const handleRejectFacultyLedger = (facultyName: string, remark: string) => {
    const auditor = session?.name ? `${session.name} (${session.email})` : (session?.email || 'Accounts Administrator');
    const nowIso = new Date().toISOString();
    const trimmedRemark = remark.trim() || 'Faculty coordinator ledger rejected by Accounts audit.';

    setExpenses(prev =>
      prev.map(e => {
        if (e.paidByFaculty === facultyName && (e.tripId === selectedTripId || !e.tripId)) {
          const updated: Expense = {
            ...e,
            billVerification: 'Rejected',
            rejectionRemark: trimmedRemark,
            rejectedBy: auditor,
            rejectedAt: nowIso,
          };
          FirestoreService.saveExpense(updated);
          return updated;
        }
        return e;
      })
    );
  };

  // Reject the entire Camp Ledger from Accounts with remark
  const handleRejectCampLedger = (remark: string) => {
    const auditor = session?.name ? `${session.name} (${session.email})` : (session?.email || 'Accounts Administrator');
    const nowIso = new Date().toISOString();
    const trimmedRemark = remark.trim() || 'Rural immersion camp ledger rejected by Accounts audit.';

    const updatedCamp: ImmersionCamp = {
      ...activeImmersion,
      ledgerStatus: 'Rejected',
      ledgerRejectionRemark: trimmedRemark,
      ledgerAuditedBy: auditor,
      ledgerAuditedAt: nowIso,
    };
    setImmersion(updatedCamp);
    FirestoreService.saveImmersion(updatedCamp);

    // Reject all unverified expenses for this camp with this remark
    setExpenses(prev =>
      prev.map(e => {
        if ((e.tripId === selectedTripId || !e.tripId) && e.billVerification !== 'Verified') {
          const updated: Expense = {
            ...e,
            billVerification: 'Rejected',
            rejectionRemark: trimmedRemark,
            rejectedBy: auditor,
            rejectedAt: nowIso,
          };
          FirestoreService.saveExpense(updated);
          return updated;
        }
        return e;
      })
    );
  };

  // Approve / Clear Camp Ledger from Accounts
  const handleApproveCampLedger = () => {
    const auditor = session?.name ? `${session.name} (${session.email})` : (session?.email || 'Accounts Administrator');
    const nowIso = new Date().toISOString();

    const updatedCamp: ImmersionCamp = {
      ...activeImmersion,
      ledgerStatus: 'Verified',
      ledgerAuditedBy: auditor,
      ledgerAuditedAt: nowIso,
    };
    delete updatedCamp.ledgerRejectionRemark;

    setImmersion(updatedCamp);
    FirestoreService.saveImmersion(updatedCamp);

    setExpenses(prev =>
      prev.map(e => {
        if ((e.tripId === selectedTripId || !e.tripId) && e.billVerification !== 'Verified') {
          const updated: Expense = {
            ...e,
            billVerification: 'Verified',
            verifiedBy: auditor,
            verifiedAt: nowIso,
          };
          delete updated.rejectionRemark;
          delete updated.rejectedBy;
          delete updated.rejectedAt;
          FirestoreService.saveExpense(updated);
          return updated;
        }
        return e;
      })
    );
  };

  // CSV Export
  const handleExportCsv = (customExpenses?: Expense[]) => {
    const expList = customExpenses || currentTripExpenses;
    const headers = [
      'ID',
      'Date',
      'Category',
      'Vendor',
      'Amount',
      'Payment Mode',
      'Bill Number',
      'Charge To',
      'Paid By',
      'Has Bill Proof',
      'Has UPI Proof',
      'Verification Status',
      'Rejection Remark',
      'Description',
    ];

    const rows = expList.map(e => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.category}"`,
      `"${e.vendor.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.paymentMode}"`,
      `"${e.billNumber || ''}"`,
      `"${e.chargeTo}"`,
      `"${e.paidByFaculty}"`,
      e.hasBillProof ? 'YES' : 'NO',
      e.hasUpiProof ? 'YES' : 'NO',
      `"${e.billVerification || 'Pending'}"`,
      `"${(e.rejectionRemark || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `RUIP-Expenses-${activeImmersion.village}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If user is not signed in, show Institutional Auth Screen
  if (!session) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        registeredUsers={registeredUsers}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const isAdmin = session.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col lg:flex-row font-sans transition-colors duration-200">
      {/* Persistent Sidebar / Mobile Drawer */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        faculty={faculty}
        immersion={activeImmersion}
        totalSpent={currentTotalSpent}
        expenseCount={currentTripExpenses.length}
        isOnline={isOnline}
        onOpenAuthModal={() => setFacultyModalOpen(true)}
        onOpenImmersionModal={() => setImmersionModalOpen(true)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={install}
        theme={theme}
        onToggleTheme={toggleTheme}
        isAdmin={isAdmin}
        accountName={session.name}
        accountEmail={session.email}
        onLogout={handleLogout}
        accessibleTrips={userAccessibleTrips}
        selectedTripId={selectedTripId}
        onSelectTrip={id => {
          setSelectedTripId(id);
          localStorage.setItem('ruip_selected_trip', id);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <OfflineBanner isOnline={isOnline} />

        <Header
          faculty={faculty}
          immersion={activeImmersion}
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          isOnline={isOnline}
          onOpenImmersionModal={() => setImmersionModalOpen(true)}
          onOpenAuthModal={() => setFacultyModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          canAddExpense={!isAdmin}
          accountsScreen={isAdmin ? 'admin-statements' : 'statement'}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />

        <main className="flex-1 pb-12">
          {/* If faculty member has not yet been assigned to any trip by the admin */}
          {!isAdmin && userAccessibleTrips.length === 0 ? (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                  No Active Immersion Trip Assigned
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Your account (<span className="font-mono-tabular font-medium text-emerald-600 dark:text-emerald-400">{session.email}</span>) is active in the MIT-WPU system, but the Accounts & Finance Admin has not assigned your email to any Rural Immersion Trip yet.
                </p>
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-500 dark:text-zinc-400">
                  Contact Accounts Administration to add your email to the trip coordinators list.
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
              {activeScreen === 'dashboard' && (
                <Dashboard
                  setActiveScreen={setActiveScreen}
                  faculty={faculty}
                  immersion={activeImmersion}
                  expenses={currentTripExpenses}
                  onOpenAddExpense={() => setActiveScreen('add')}
                  onOpenImmersionModal={() => setImmersionModalOpen(true)}
                  onViewExpenseReceipt={exp => setSelectedExpenseForReceipt(exp)}
                  canAddExpense={!isAdmin}
                  ledgerScreen={isAdmin ? 'admin-bills' : 'ledger'}
                  isAdmin={isAdmin}
                />
              )}

              {activeScreen === 'add' && !isAdmin && (
                <AddExpense
                  setActiveScreen={setActiveScreen}
                  onAddExpense={handleAddExpense}
                  faculty={faculty}
                  immersion={activeImmersion}
                  currentTotalSpent={currentTotalSpent}
                />
              )}

              {activeScreen === 'ledger' && !isAdmin && (
                <ExpenseLedger
                  setActiveScreen={setActiveScreen}
                  expenses={currentTripExpenses}
                  immersion={activeImmersion}
                  onDeleteExpense={handleDeleteExpense}
                  onViewExpenseReceipt={exp => setSelectedExpenseForReceipt(exp)}
                  onExportCsv={() => handleExportCsv()}
                  canAddExpense={!isAdmin}
                />
              )}

              {activeScreen === 'analytics' && (
                <Analytics
                  expenses={currentTripExpenses}
                  immersion={activeImmersion}
                />
              )}

              {activeScreen === 'statement' && !isAdmin && (
                <AccountsStatement
                  setActiveScreen={setActiveScreen}
                  expenses={currentTripExpenses}
                  faculty={faculty}
                  immersion={activeImmersion}
                  onExportCsv={() => handleExportCsv()}
                  allowSubmission={true}
                  ledgerScreen="ledger"
                  statementOnly={false}
                  canManageSignatures={false}
                />
              )}

              {activeScreen === 'trips' && isAdmin && (
                <TripsManagement
                  trips={trips}
                  facultyList={FACULTY_ROSTER}
                  selectedTripId={selectedTripId}
                  onSelect={id => {
                    setSelectedTripId(id);
                    localStorage.setItem('ruip_selected_trip', id);
                  }}
                  onCreate={newTrip => {
                    setTrips(prev => [newTrip, ...prev]);
                    setSelectedTripId(newTrip.id);
                    localStorage.setItem('ruip_selected_trip', newTrip.id);
                    FirestoreService.saveTrip(newTrip);
                  }}
                  onUpdate={updatedTrip => {
                    setTrips(prev => prev.map(t => (t.id === updatedTrip.id ? updatedTrip : t)));
                    FirestoreService.saveTrip(updatedTrip);
                  }}
                />
              )}

              {activeScreen === 'admin-bills' && isAdmin && (
                <LedgerVerification
                  expenses={currentTripExpenses}
                  facultyList={FACULTY_ROSTER}
                  onViewExpenseReceipt={exp => setSelectedExpenseForReceipt(exp)}
                  onVerify={handleVerifyExpense}
                  onRejectFacultyLedger={handleRejectFacultyLedger}
                />
              )}

              {activeScreen === 'admin-statements' && isAdmin && (
                <AdminStatements
                  setActiveScreen={setActiveScreen}
                  expenses={currentTripExpenses}
                  facultyList={FACULTY_ROSTER}
                  immersion={activeImmersion}
                  onExportCsv={handleExportCsv}
                  onRejectLedger={handleRejectCampLedger}
                  onApproveLedger={handleApproveCampLedger}
                />
              )}

              {activeScreen === 'admin-users' && isAdmin && (
                <AdminUsersManagement
                  users={registeredUsers}
                  onAddUser={handleAddRegisteredUser}
                  onUpdateUser={handleUpdateRegisteredUser}
                  onDeleteUser={handleDeleteRegisteredUser}
                  currentAdminEmail={session.email}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4 px-4 sm:px-6 lg:px-8 text-xs font-mono-tabular text-zinc-500 dark:text-zinc-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              Accounts &amp; Finance Directorate · Dr. Vishwanath Karad MIT World Peace University, Pune · Rural Immersion Programme {activeImmersion.academicYear}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setImmersionModalOpen(true)}
                className="hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              >
                Camp: {activeImmersion.village}
              </button>
              <span>·</span>
              <button
                onClick={() => setFacultyModalOpen(true)}
                className="hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              >
                {isAdmin
                  ? `Signed in: ${session.name}`
                  : `Coordinator: ${faculty.name}`}
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <FacultyModal
        isOpen={facultyModalOpen}
        onClose={() => setFacultyModalOpen(false)}
        faculty={faculty}
        onSaveFaculty={setFaculty}
      />

      <ImmersionModal
        isOpen={immersionModalOpen}
        onClose={() => setImmersionModalOpen(false)}
        immersion={activeImmersion}
        onSaveImmersion={setImmersion}
      />

      {selectedExpenseForReceipt && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedExpenseForReceipt(null)}
          expense={selectedExpenseForReceipt}
          isAdmin={isAdmin}
          onVerify={handleVerifyExpense}
          onAttachProof={!isAdmin ? handleAttachProof : undefined}
        />
      )}
    </div>
  );
}
