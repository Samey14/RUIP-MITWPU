import React, { useState } from 'react';
import { TripRecord, FacultyCoordinator } from '../types';
import {
  ListTree,
  Plus,
  CalendarDays,
  MapPin,
  Users,
  WalletCards,
  PencilLine,
  Upload,
  GraduationCap,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface TripsManagementProps {
  trips: TripRecord[];
  facultyList: FacultyCoordinator[];
  selectedTripId: string;
  onSelect: (tripId: string) => void;
  onCreate: (trip: TripRecord) => void;
  onUpdate: (trip: TripRecord) => void;
}

function parseEmails(str: string): string[] {
  return Array.from(
    new Set(
      str
        .split(/[\s,;]+/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function parseStudents(str: string): string[] {
  return str
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

const SAMPLE_64_STUDENTS = [
  '1032230001 - Aarav Patil (School of Engineering - CSE)',
  '1032230002 - Ananya Deshpande (School of Engineering - CSE)',
  '1032230003 - Rohan Joshi (School of Engineering - Mech)',
  '1032230004 - Tanvi Kulkarni (School of Engineering - Civil)',
  '1032230005 - Aditya Shinde (School of Engineering - ECE)',
  '1032230006 - Snehal Gaikwad (School of Engineering - CSE)',
  '1032230007 - Pranav More (School of Engineering - Chemical)',
  '1032230008 - Neha Pawar (School of Engineering - Electrical)',
  '1032230009 - Siddharth Jadhav (School of Engineering - CSE)',
  '1032230010 - Riya Sawant (School of Engineering - Petroleum)',
  '1032230011 - Omkar Chavan (School of Engineering - Civil)',
  '1032230012 - Pooja Kadam (School of Engineering - Mech)',
  '1032230013 - Yash Bhosale (School of Engineering - CSE)',
  '1032230014 - Shruti Mane (School of Engineering - ECE)',
  '1032230015 - Digvijay Rane (School of Engineering - IT)',
  '1032230016 - Gaurav Salunkhe (School of Engineering - CSE)',
  '1032230017 - Sanjana Thorat (School of Engineering - Civil)',
  '1032230018 - Mayur Jagtap (School of Engineering - Mech)',
  '1032230019 - Priyanka Mohite (School of Engineering - ECE)',
  '1032230020 - Kunal Shirole (School of Engineering - CSE)',
  '1032230021 - Sakshi Wagh (School of Engineering - Electrical)',
  '1032230022 - Tejas Date (School of Engineering - Mech)',
  '1032230023 - Vaidehi Gokhale (School of Engineering - CSE)',
  '1032230024 - Rushikesh Kale (School of Engineering - Civil)',
];

const EMPTY_TRIP = {
  location: '',
  village: '',
  taluka: '',
  district: '',
  department: 'Engineering & Technology',
  startDate: '',
  endDate: '',
  faculty: '3',
  budget: '',
  status: 'Planned' as 'Planned' | 'Ongoing' | 'Completed',
  facultyEmails: '',
  studentsListText: '',
  notes: '',
};

export const TripsManagement: React.FC<TripsManagementProps> = ({
  trips,
  selectedTripId,
  onSelect,
  onCreate,
  onUpdate,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripRecord | null>(null);
  const [form, setForm] = useState(EMPTY_TRIP);
  const [error, setError] = useState('');
  const [viewingRosterTrip, setViewingRosterTrip] = useState<TripRecord | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  const openCreate = () => {
    setEditingTrip(null);
    setForm(EMPTY_TRIP);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (trip: TripRecord) => {
    setEditingTrip(trip);
    setForm({
      location: trip.location,
      village: trip.village,
      taluka: trip.taluka,
      district: trip.district,
      department: trip.department,
      startDate: trip.startDate,
      endDate: trip.endDate,
      faculty: String(trip.totalFaculty),
      budget: String(trip.budget),
      status: trip.status,
      facultyEmails: trip.coordinatorEmails.join('\n'),
      studentsListText: (trip.studentsList || []).join('\n'),
      notes: trip.notes || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const parsed = parseStudents(text);
      if (parsed.length > 0) {
        setForm(prev => ({
          ...prev,
          studentsListText: parsed.join('\n'),
        }));
        setError('');
      } else {
        setError('Uploaded file was empty or could not be parsed.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = parseEmails(form.facultyEmails);
    const invalid = emails.find(em => !em.endsWith('@mitwpu.edu.in'));

    if (!emails.length) {
      setError('Add at least one faculty coordinator email.');
      return;
    }
    if (invalid) {
      setError(`${invalid} is not a valid MIT-WPU faculty email.`);
      return;
    }

    const students = parseStudents(form.studentsListText);
    if (!students.length) {
      setError('Adding the students list is compulsory. Please add student roll numbers/names or upload a roster.');
      return;
    }

    const payload = {
      location: form.location,
      village: form.village || form.location,
      taluka: form.taluka,
      district: form.district,
      department: form.department,
      startDate: form.startDate,
      endDate: form.endDate,
      totalStudents: students.length,
      totalFaculty: Number(form.faculty) || 0,
      budget: Number(form.budget) || 0,
      status: form.status,
      coordinatorEmails: emails,
      studentsList: students,
      notes: form.notes,
    };

    if (editingTrip) {
      onUpdate({ ...editingTrip, ...payload });
    } else {
      const id = `trip-${Date.now()}`;
      onCreate({
        id,
        tripCode: `RUIP-${new Date().getFullYear()}-${form.location.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 14)}`,
        ...payload,
        createdAt: new Date().toISOString(),
      });
    }

    setModalOpen(false);
    setEditingTrip(null);
    setError('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ListTree className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Immersion Programmes &amp; Trips
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Create, select, and manage rural immersion programmes, budgets, and authorized coordinators.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Create New Trip
        </button>
      </div>

      {selectedTrip && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm font-mono-tabular">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {selectedTrip.tripCode}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                Active Trip in View
              </span>
            </div>
            <button
              onClick={() => openEdit(selectedTrip)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-emerald-400 hover:text-emerald-600 transition"
            >
              <PencilLine className="w-3.5 h-3.5" /> Edit Trip Details
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-xs">
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Schedule</span>
              <b className="text-zinc-900 dark:text-zinc-100">{selectedTrip.startDate} → {selectedTrip.endDate}</b>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Location</span>
              <b className="text-zinc-900 dark:text-zinc-100">{selectedTrip.location}, {selectedTrip.district}</b>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Cohort</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <b className="text-zinc-900 dark:text-zinc-100">{selectedTrip.totalStudents} students</b>
                <button
                  type="button"
                  onClick={() => setViewingRosterTrip(selectedTrip)}
                  className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold transition"
                >
                  View Roster
                </button>
              </div>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Coordinators</span>
              <b className="text-zinc-900 dark:text-zinc-100">{selectedTrip.coordinatorEmails.length} faculty emails</b>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Advance Budget</span>
              <b className="text-emerald-600 dark:text-emerald-400">₹{selectedTrip.budget.toLocaleString('en-IN')}</b>
            </div>
          </div>
        </div>
      )}

      {/* Grid of All Trips */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 font-mono-tabular">
        {trips.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`text-left rounded-2xl border p-4.5 transition ${
              selectedTripId === t.id
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10'
                : 'border-zinc-200 dark:border-zinc-800'
            } bg-white dark:bg-zinc-900 hover:border-emerald-300 dark:hover:border-zinc-700 shadow-sm`}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  {t.tripCode}
                </p>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mt-1 font-heading">
                  {t.location}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300">
                {t.status}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{t.startDate} — {t.endDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{t.village}, {t.taluka}, {t.district}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{t.totalStudents} students · {t.totalFaculty} faculty</span>
              </div>
              <div className="flex items-center gap-2">
                <WalletCards className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  Advance: ₹{t.budget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Create / Edit Trip Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold font-heading">
                  {editingTrip ? 'Edit Programme Trip' : 'Create New Immersion Trip'}
                </h2>
                <p className="text-xs text-zinc-500">
                  Configure location, dates, advance sanctioned, and authorized faculty coordinators.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Location Title *</label>
                <input
                  required
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Durgaon, Shirur"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Village Name</label>
                <input
                  type="text"
                  value={form.village}
                  onChange={e => setForm({ ...form, village: e.target.value })}
                  placeholder="e.g. Durgaon"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Taluka</label>
                <input
                  type="text"
                  value={form.taluka}
                  onChange={e => setForm({ ...form, taluka: e.target.value })}
                  placeholder="e.g. Shirur"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">District</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value })}
                  placeholder="e.g. Pune"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Start Date *</label>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-mono-tabular"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">End Date *</label>
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-mono-tabular"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Advance Sanctioned (₹) *</label>
                <input
                  required
                  type="number"
                  value={form.budget}
                  onChange={e => setForm({ ...form, budget: e.target.value })}
                  placeholder="e.g. 58000"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-mono-tabular"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Trip Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Planned">Planned</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold block mb-1">
                  Invited Faculty Coordinators <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.facultyEmails}
                  onChange={e => setForm({ ...form, facultyEmails: e.target.value })}
                  placeholder={`prachi.patil@mitwpu.edu.in\nrahul.sharma@mitwpu.edu.in`}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-zinc-500">
                  Only addresses ending in @mitwpu.edu.in. Separate by commas or newlines.
                </span>
              </div>

              {/* Compulsory Participating Students List */}
              <div className="md:col-span-2 space-y-2 p-3.5 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                      <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Participating Students Cohort Roster</span>
                      <span className="text-rose-500 font-bold">* (Compulsory)</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Adding students list is compulsory. Enter student Roll No., PRN, or Name per line.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-500 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center gap-1 shadow-xs transition">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload .csv / .txt</span>
                      <input
                        type="file"
                        accept=".txt,.csv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          studentsListText: SAMPLE_64_STUDENTS.join('\n'),
                        }));
                        setError('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 transition"
                    >
                      + Sample 24 Students
                    </button>
                  </div>
                </div>

                <textarea
                  required
                  rows={5}
                  value={form.studentsListText}
                  onChange={e => {
                    setForm({ ...form, studentsListText: e.target.value });
                    if (e.target.value.trim()) setError('');
                  }}
                  placeholder={`1032230001 - Aarav Patil (School of Engineering - CSE)\n1032230002 - Ananya Deshpande (School of Engineering - CSE)\n1032230003 - Rohan Joshi (School of Engineering - Mech)...`}
                  className={`w-full rounded-xl border ${
                    error && !form.studentsListText.trim()
                      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20'
                      : 'border-zinc-200 dark:border-zinc-700'
                  } bg-white dark:bg-zinc-950 p-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed`}
                />

                <div className="flex items-center justify-between text-[11px] font-mono-tabular">
                  <span className="text-zinc-500">
                    {parseStudents(form.studentsListText).length === 0 ? (
                      <span className="text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> 0 students entered — students list is compulsory
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {parseStudents(form.studentsListText).length} students registered in cohort
                      </span>
                    )}
                  </span>
                  <span className="text-zinc-400">One student per line</span>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
              >
                {editingTrip ? 'Save Changes' : 'Create Trip'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student Roster Modal Viewer */}
      {viewingRosterTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                    {viewingRosterTrip.location} — Student Cohort
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono-tabular">
                    {viewingRosterTrip.tripCode} · {viewingRosterTrip.totalStudents} enrolled students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingRosterTrip(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={rosterSearch}
              onChange={e => setRosterSearch(e.target.value)}
              placeholder="Search by student name or roll number..."
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono-tabular outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-mono-tabular">
              {(viewingRosterTrip.studentsList && viewingRosterTrip.studentsList.length > 0
                ? viewingRosterTrip.studentsList
                : SAMPLE_64_STUDENTS
              )
                .filter(st => st.toLowerCase().includes(rosterSearch.toLowerCase()))
                .map((student, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-zinc-400 text-[10px] w-6 text-center">{idx + 1}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex-1 truncate">{student}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                      Enrolled
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
              <span className="text-zinc-500 font-mono-tabular">
                {(viewingRosterTrip.studentsList || SAMPLE_64_STUDENTS).length} Total Students
              </span>
              <button
                onClick={() => setViewingRosterTrip(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
