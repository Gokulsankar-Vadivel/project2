import React, { useState } from 'react';
import {
  BookmarkCheck,
  Building2,
  Calendar,
  Clock,
  ArrowUpRight,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Opportunity, ApplicationStatus } from '../types';
import { useOpportunities } from '../context/OpportunitiesContext';

const STATUS_COLUMNS: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'Saved', label: 'Bookmarked', color: 'bg-slate-100 border-slate-200 text-slate-700' },
  { status: 'Applied', label: 'Submitted', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { status: 'Shortlisted', label: 'Shortlisted / Test', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { status: 'In Review', label: 'Under Review', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  { status: 'Selected', label: 'Selected / Offer', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' }
];

export const SavedTrackerView: React.FC<{ onNavigateToExplorer: () => void }> = ({ onNavigateToExplorer }) => {
  const {
    savedOpportunities,
    saveOpportunity,
    removeSaved,
    setSelectedOpportunity
  } = useOpportunities();

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const handleNotesSave = (oppId: string, currentStatus: ApplicationStatus) => {
    saveOpportunity(oppId, currentStatus, tempNotes);
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Application Tracker & Saved Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your personal pipeline across public sector tests, hackathons, and corporate internships
          </p>
        </div>

        <button
          onClick={onNavigateToExplorer}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Browse More Opportunities</span>
        </button>
      </div>

      {savedOpportunities.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookmarkCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Your tracker is currently empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Save jobs, hackathons, scholarships, and exam notifications from the Opportunity Explorer to organize deadlines and applications.
            </p>
          </div>
          <button
            onClick={onNavigateToExplorer}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
          >
            Explore Opportunities
          </button>
        </div>
      ) : (
        /* Kanban Board Columns */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {STATUS_COLUMNS.map(col => {
            const itemsInColumn = savedOpportunities.filter(s => s.status === col.status);

            return (
              <div
                key={col.status}
                className="rounded-3xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{col.label}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                      {itemsInColumn.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {itemsInColumn.map(item => {
                    const opp = item.opportunity;
                    if (!opp) return null;

                    return (
                      <div
                        key={item.savedId}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md transition space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
                            {opp.category}
                          </span>
                          <button
                            onClick={() => removeSaved(opp.id)}
                            className="text-slate-400 hover:text-rose-600 transition p-1"
                            title="Remove from tracker"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div>
                          <h4
                            onClick={() => setSelectedOpportunity(opp)}
                            className="text-xs font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
                          >
                            {opp.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {opp.organization}
                          </p>
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{opp.deadline}</span>
                          </div>
                          <a
                            href={opp.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            <span>Link</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </div>

                        {/* Move Status Selector */}
                        <div className="pt-1">
                          <select
                            value={item.status}
                            onChange={e => saveOpportunity(opp.id, e.target.value as ApplicationStatus, item.notes)}
                            className="w-full text-[11px] font-semibold rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-700 cursor-pointer"
                          >
                            <option value="Saved">Mark: Bookmarked</option>
                            <option value="Applied">Mark: Submitted</option>
                            <option value="Shortlisted">Mark: Shortlisted</option>
                            <option value="In Review">Mark: In Review</option>
                            <option value="Selected">Mark: Selected</option>
                            <option value="Closed">Mark: Closed</option>
                          </select>
                        </div>

                        {/* Notes Preview / Edit */}
                        {editingNotesId === opp.id ? (
                          <div className="space-y-1.5 pt-1">
                            <textarea
                              rows={2}
                              value={tempNotes}
                              onChange={e => setTempNotes(e.target.value)}
                              placeholder="Notes or exam date..."
                              className="w-full text-xs p-1.5 rounded-lg border border-blue-300 focus:outline-hidden"
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="text-[10px] px-2 py-0.5 rounded-md text-slate-500"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleNotesSave(opp.id, item.status)}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-blue-600 text-white font-semibold"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNotesId(opp.id);
                              setTempNotes(item.notes || '');
                            }}
                            className="text-[11px] text-slate-500 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-dashed border-slate-200 cursor-pointer"
                          >
                            {item.notes ? (
                              <p className="line-clamp-2 italic text-slate-700">{item.notes}</p>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Add application notes...
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {itemsInColumn.length === 0 && (
                    <div className="h-24 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
