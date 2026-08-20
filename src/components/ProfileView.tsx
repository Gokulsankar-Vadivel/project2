import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  Building2,
  Award,
  Layers,
  Save,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OpportunityCategory } from '../types';
import { SAMPLE_USER_PRESETS } from '../data/seedOpportunities';

const ALL_CATEGORIES: OpportunityCategory[] = [
  'Jobs',
  'Internships',
  'Hackathons',
  'Scholarships',
  'Government schemes',
  'Competitions',
  'Courses',
  'Examination notifications',
  'Important deadlines'
];

const SUGGESTED_SKILLS = [
  'Python',
  'Data Structures & Algorithms',
  'React.js',
  'Machine Learning',
  'SQL',
  'Agri-Tech IoT',
  'PowerBI',
  'Tableau',
  'Soil Microbiology',
  'GIS & Remote Sensing',
  'Java',
  'Cloud / AWS',
  'Business Analytics',
  'Full Stack Development'
];

export const ProfileView: React.FC<{ onSaveSuccess?: () => void }> = ({ onSaveSuccess }) => {
  const { user, updateProfile, switchUserPreset } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    education: user.education,
    degree: user.degree,
    college: user.college,
    currentYear: user.currentYear,
    cgpa: user.cgpa || 8.0,
    age: user.age || 20,
    location: user.location,
    careerGoal: user.careerGoal,
    interests: user.interests || [],
    skills: user.skills || [],
    preferredCategories: user.preferredCategories || []
  });

  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddSkill = (skillToAdd?: string) => {
    const val = (skillToAdd || newSkill).trim();
    if (val && !formData.skills.includes(val)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, val] }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleAddInterest = () => {
    const val = newInterest.trim();
    if (val && !formData.interests.includes(val)) {
      setFormData(prev => ({ ...prev, interests: [...prev.interests, val] }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
  };

  const handleCategoryToggle = (cat: OpportunityCategory) => {
    setFormData(prev => {
      const exists = prev.preferredCategories.includes(cat);
      if (exists) {
        return { ...prev, preferredCategories: prev.preferredCategories.filter(c => c !== cat) };
      } else {
        return { ...prev, preferredCategories: [...prev.preferredCategories, cat] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    if (onSaveSuccess) onSaveSuccess();
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            User Profile & Eligibility Baseline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your profile coordinates the 5-Agent Discovery Engine to calculate personalized eligibility verdicts
          </p>
        </div>

        {/* Demo Persona Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">Try Demo:</span>
          {SAMPLE_USER_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                switchUserPreset(preset.id);
                setFormData({
                  name: preset.name,
                  email: preset.email,
                  education: preset.education,
                  degree: preset.degree,
                  college: preset.college,
                  currentYear: preset.currentYear,
                  cgpa: preset.cgpa || 8.0,
                  age: preset.age || 20,
                  location: preset.location,
                  careerGoal: preset.careerGoal,
                  interests: preset.interests || [],
                  skills: preset.skills || [],
                  preferredCategories: preset.preferredCategories || []
                });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                user.id === preset.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {preset.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Profile updated successfully! Recommendation and eligibility scores recalculated.</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Personal Details */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Location / State</label>
              <input
                type="text"
                placeholder="e.g. Bengaluru, Karnataka or All India"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">CGPA / Percentage</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.cgpa}
                  onChange={e => setFormData({ ...formData, cgpa: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Education & Academic Stage */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <span>Education & Institutional Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Education Stage</label>
              <select
                value={formData.education}
                onChange={e => setFormData({ ...formData, education: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="Undergraduate">Undergraduate (B.Tech, B.Sc, B.Com, etc.)</option>
                <option value="Postgraduate">Postgraduate (M.Tech, M.Sc, MBA, etc.)</option>
                <option value="High School">High School (Class 9-12)</option>
                <option value="Diploma">Diploma / Polytechnic</option>
                <option value="Doctorate">Doctorate / Ph.D.</option>
                <option value="Working Professional">Working Professional</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Current Year of Study</label>
              <select
                value={formData.currentYear}
                onChange={e => setFormData({ ...formData, currentYear: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="Final Year">Final Year</option>
                <option value="Graduated">Graduated / Alumni</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Degree / Specialization</label>
              <input
                type="text"
                placeholder="e.g. B.Tech in Computer Science & AI"
                value={formData.degree}
                onChange={e => setFormData({ ...formData, degree: e.target.value })}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">College / Institute Name</label>
              <input
                type="text"
                placeholder="e.g. NIT Karnataka, Suratkal"
                value={formData.college}
                onChange={e => setFormData({ ...formData, college: e.target.value })}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Skills Tag Management */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Skills & Technical Stack</span>
            </h3>
            <span className="text-xs text-slate-400">Used for automated eligibility matching</span>
          </div>

          {/* Active Skills Chips */}
          <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-2xl bg-slate-50 border border-slate-200">
            {formData.skills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-blue-200 px-3 py-1 text-xs font-bold text-blue-800 shadow-2xs"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-600 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {formData.skills.length === 0 && (
              <span className="text-xs text-slate-400 italic">No skills added yet. Type below or pick suggestions.</span>
            )}
          </div>

          {/* Add Skill Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. PyTorch, GIS, Drone Tech, SQL, React)..."
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
            />
            <button
              type="button"
              onClick={() => handleAddSkill()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>

          {/* Suggested Skills */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Suggested Skills (Click to add):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_SKILLS.map(s => {
                const isSelected = formData.skills.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isSelected}
                    onClick={() => handleAddSkill(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                    }`}
                  >
                    + {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interests & Career Goals */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span>Interests & Career Aspirations</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Career Goal Statement</label>
              <textarea
                rows={2}
                value={formData.careerGoal}
                onChange={e => setFormData({ ...formData, careerGoal: e.target.value })}
                placeholder="e.g. Secure a top-tier software engineering internship and research fellowship."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Preferred Opportunity Categories</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {ALL_CATEGORIES.map(cat => {
                  const isSelected = formData.preferredCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            id="btn-save-profile"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Profile & Refresh Recommendations</span>
          </button>
        </div>

      </form>

    </div>
  );
};
