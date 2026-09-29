import React, { useState, useMemo } from 'react';
import { Expense, FacultyCoordinator, ImmersionCamp } from '../types';
import { AccountsStatement } from './AccountsStatement';
import { ChevronDown, UsersRound } from 'lucide-react';

interface AdminStatementsProps {
  setActiveScreen: (screen: string) => void;
  expenses: Expense[];
  facultyList: FacultyCoordinator[];
  immersion: ImmersionCamp;
  onExportCsv: (filteredExpenses?: Expense[]) => void;
  onRejectLedger?: (remark: string) => void;
  onApproveLedger?: () => void;
}

const ALL = '__ALL__';

export const AdminStatements: React.FC<AdminStatementsProps> = ({
  setActiveScreen,
  expenses,
  facultyList,
  immersion,
  onExportCsv,
  onRejectLedger,
  onApproveLedger,
}) => {
  const facultyNames = useMemo(
    () => Array.from(new Set(expenses.map(e => e.paidByFaculty))).sort(),
    [expenses]
  );

  const [selectedFaculty, setSelectedFaculty] = useState(ALL);

  const filteredExpenses =
    selectedFaculty === ALL
      ? expenses
      : expenses.filter(e => e.paidByFaculty === selectedFaculty);

  const activeCoordinator: FacultyCoordinator =
    selectedFaculty === ALL
      ? {
          name: 'All Faculty Coordinators',
          email: 'rural.immersion@mitwpu.edu.in',
          department: immersion.department,
          designation: 'Rural Immersion Programme Mentors',
          employeeId: '—',
          phone: '',
          avatarInitials: 'AF',
        }
      : facultyList.find(f => f.name === selectedFaculty) || {
          name: selectedFaculty,
          email: '',
          department: immersion.department,
          designation: 'Faculty Coordinator',
          employeeId: '—',
          phone: '',
          avatarInitials: selectedFaculty.slice(0, 2).toUpperCase(),
        };

  return (
    <div className="space-y-4">
      {/* Faculty Selection Card for Statement */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                Audit Clearance &amp; Final Statement
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Select whether to audit the consolidated camp ledger across all faculty or an individual coordinator’s claim.
            </p>
          </div>

          <div className="w-full sm:max-w-sm">
            <label htmlFor="accounts-faculty-filter" className="sr-only">
              Filter statement by faculty
            </label>
            <div className="relative">
              <select
                id="accounts-faculty-filter"
                value={selectedFaculty}
                onChange={e => setSelectedFaculty(e.target.value)}
                className="w-full appearance-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 pr-9 text-xs font-semibold text-zinc-800 dark:text-zinc-100 outline-none focus:border-emerald-500 font-mono-tabular"
              >
                <option value={ALL}>Consolidated Statement — All Faculty ({expenses.length} bills)</option>
                {facultyNames.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>

      <AccountsStatement
        setActiveScreen={setActiveScreen}
        expenses={filteredExpenses}
        faculty={activeCoordinator}
        immersion={immersion}
        onExportCsv={() => onExportCsv(filteredExpenses)}
        allowSubmission={false}
        ledgerScreen="admin-bills"
        statementOnly={true}
        canManageSignatures={true}
        onRejectLedger={onRejectLedger}
        onApproveLedger={onApproveLedger}
      />
    </div>
  );
};
