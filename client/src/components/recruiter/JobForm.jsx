import { useEffect, useState } from 'react';

const emptyForm = {
  title: '',
  company: '',
  location: 'Remote',
  experienceLevel: 'Entry Level',
  description: '',
};

const levels = ['Internship', 'Entry Level', 'Mid Level', 'Senior', 'Lead'];

const JobForm = ({ initialJob = null, onCancel, onSubmit, saving = false }) => {
  const [form, setForm] = useState(emptyForm);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (initialJob) {
      setForm({
        title: initialJob.title || '',
        company: initialJob.company || '',
        location: initialJob.location || 'Remote',
        experienceLevel: initialJob.experienceLevel || 'Entry Level',
        description: initialJob.description || '',
      });
      setSkills(initialJob.requiredSkills || []);
    } else {
      setForm(emptyForm);
      setSkills([]);
    }
  }, [initialJob]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSkillKeyDown = (event) => {
    if (event.key !== 'Enter' || !skillInput.trim()) return;
    event.preventDefault();
    const newSkill = skillInput.trim().toLowerCase();
    if (!skills.includes(newSkill)) {
      setSkills((current) => [...current, newSkill]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => setSkills((current) => current.filter((item) => item !== skill));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, requiredSkills: skills });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Job Title*</span>
          <input
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Company</span>
          <input
            value={form.company}
            onChange={(event) => updateField('company', event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Location</span>
          <input
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Experience Level</span>
          <select
            value={form.experienceLevel}
            onChange={(event) => updateField('experienceLevel', event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            {levels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-slate-700">Required Skills</span>
        <input
          value={skillInput}
          onChange={(event) => setSkillInput(event.target.value)}
          onKeyDown={handleSkillKeyDown}
          placeholder="Type a skill and press Enter"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
        />
      </label>

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => removeSkill(skill)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"
            >
              {skill} ×
            </button>
          ))}
        </div>
      )}

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-slate-700">Job Description*</span>
        <textarea
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          rows={8}
          className="mt-2 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </label>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:bg-slate-300"
        >
          {saving ? 'Saving...' : initialJob ? 'Save Changes' : 'Post Job'}
        </button>
      </div>
    </form>
  );
};

export default JobForm;
