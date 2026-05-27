import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Video, User, Mail, Loader2, Briefcase, Plus, X, Copy } from 'lucide-react';
import { batchCreateSlots } from '../../lib/mockloop-api';
import { generateSlotsFromSchedule, DaySchedule, TimeRange } from '../../lib/mockloop-utils';

const availabilitySchema = z.object({
  hostName: z.string().min(2, "Name is required"),
  hostEmail: z.string().email("Invalid email"),
  role: z.string().min(2, "Role is required (e.g. Senior PM)"),
  interviewType: z.string().min(1, "Select an interview type"),
  duration: z.string().min(1, "Duration is required"),
  meetingLink: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  notes: z.string().optional()
});

type FormData = z.infer<typeof availabilitySchema>;

const INTERVIEW_TYPES = [
  "Product Management",
  "Software Engineering",
  "Behavioral",
  "Resume Review",
  "System Design"
];

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const AvailabilityForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initial Schedule: Monday-Friday 9am-5pm
  const [schedule, setSchedule] = useState<{ dayOfWeek: number; active: boolean; ranges: (TimeRange & { id: string })[] }[]>(
    DAYS.map((_, i) => ({
      dayOfWeek: i,
      active: i >= 1 && i <= 5, // Mon-Fri active
      ranges: i >= 1 && i <= 5 ? [{ start: "09:00", end: "17:00", id: Math.random().toString() }] : []
    }))
  );

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      duration: "60",
      interviewType: "Product Management"
    }
  });

  const toggleDay = (dayIndex: number) => {
    setSchedule(prev => prev.map((d, i) => {
      if (i === dayIndex) {
        const newActive = !d.active;
        return { 
          ...d, 
          active: newActive,
          ranges: newActive && d.ranges.length === 0 ? [{ start: "09:00", end: "17:00", id: Math.random().toString() }] : d.ranges
        };
      }
      return d;
    }));
  };

  const addRange = (dayIndex: number) => {
    setSchedule(prev => prev.map((d, i) => {
      if (i === dayIndex) {
        return { ...d, ranges: [...d.ranges, { start: "09:00", end: "17:00", id: Math.random().toString() }] };
      }
      return d;
    }));
  };

  const removeRange = (dayIndex: number, rangeId: string) => {
    setSchedule(prev => prev.map((d, i) => {
      if (i === dayIndex) {
        const newRanges = d.ranges.filter(r => r.id !== rangeId);
        return { ...d, ranges: newRanges, active: newRanges.length > 0 };
      }
      return d;
    }));
  };

  const updateRange = (dayIndex: number, rangeId: string, field: 'start'|'end', value: string) => {
    setSchedule(prev => prev.map((d, i) => {
      if (i === dayIndex) {
        return {
          ...d,
          ranges: d.ranges.map(r => r.id === rangeId ? { ...r, [field]: value } : r)
        };
      }
      return d;
    }));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      // Prepare schedule data for generation
      const activeSchedule: DaySchedule[] = schedule
        .filter(d => d.active && d.ranges.length > 0)
        .map(d => ({
          dayOfWeek: d.dayOfWeek,
          ranges: d.ranges.map(r => ({ start: r.start, end: r.end }))
        }));

      if (activeSchedule.length === 0) {
        throw new Error("Please add at least one available time slot.");
      }

      const generatedSlots = generateSlotsFromSchedule(activeSchedule, parseInt(data.duration), 4); // 4 weeks

      if (generatedSlots.length === 0) {
        throw new Error("No future slots could be generated from this schedule.");
      }

      const slotsData = generatedSlots.map(slot => ({
        hostName: data.hostName,
        hostEmail: data.hostEmail,
        role: data.role,
        interviewType: data.interviewType,
        startTime: slot.startTime,
        endTime: slot.endTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        meetingLink: data.meetingLink || '',
        notes: data.notes || ''
      }));

      await batchCreateSlots(slotsData);

      reset();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create slots. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input 
              {...register('hostName')} 
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]"
              placeholder="e.g. John Doe"
            />
          </div>
          {errors.hostName && <p className="text-red-500 text-xs mt-1">{errors.hostName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input 
              {...register('hostEmail')} 
              type="email"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]"
              placeholder="john@example.com"
            />
          </div>
          {errors.hostEmail && <p className="text-red-500 text-xs mt-1">{errors.hostEmail.message}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Your Role / Current Title *</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input 
              {...register('role')} 
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]"
              placeholder="e.g. Senior PM at Google"
            />
          </div>
          {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Interview Type *</label>
            <select 
              {...register('interviewType')}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]"
            >
              {INTERVIEW_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.interviewType && <p className="text-red-500 text-xs mt-1">{errors.interviewType.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Slot Duration *</label>
            <select 
              {...register('duration')}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]"
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weekly Hours UI */}
      <div className="border-t border-slate-100 pt-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Weekly hours</h3>
          <p className="text-sm text-slate-500">Set when you are typically available for meetings. We'll generate slots for the next 4 weeks.</p>
        </div>

        <div className="space-y-4">
          {schedule.map((day, i) => (
            <div key={i} className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  day.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                }`}
                title={DAY_NAMES[i]}
              >
                {DAYS[i]}
              </button>
              
              <div className="flex-1">
                {!day.active || day.ranges.length === 0 ? (
                  <div className="h-10 flex items-center text-sm text-slate-400">
                    Unavailable
                  </div>
                ) : (
                  <div className="space-y-3">
                    {day.ranges.map((range, rangeIndex) => (
                      <div key={range.id} className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={range.start}
                            onChange={(e) => updateRange(i, range.id, 'start', e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2] text-sm"
                          />
                          <span className="text-slate-400">-</span>
                          <input 
                            type="time" 
                            value={range.end}
                            onChange={(e) => updateRange(i, range.id, 'end', e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2] text-sm"
                          />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            type="button" 
                            onClick={() => removeRange(i, range.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          
                          {/* Only show 'Add' button on the last range to avoid clutter */}
                          {rangeIndex === day.ranges.length - 1 && (
                            <button 
                              type="button" 
                              onClick={() => addRange(i)}
                              className="p-2 text-slate-400 hover:text-[#188ab2] transition-colors rounded-lg hover:bg-slate-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="border-t border-slate-100 pt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Link (Optional)</label>
          <div className="relative">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input 
              {...register('meetingLink')} 
              type="url"
              placeholder="e.g. https://meet.google.com/..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">If left blank, you must coordinate with the booker via email.</p>
          {errors.meetingLink && <p className="text-red-500 text-xs mt-1">{errors.meetingLink.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Notes for Booker (Optional)</label>
          <textarea 
            {...register('notes')} 
            placeholder="e.g. Looking to do a product design case study..."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2] h-24 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-[#188ab2] text-white hover:bg-[#157a9d] font-bold py-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Publishing Slots...</>
        ) : (
          'Publish Weekly Schedule'
        )}
      </button>
    </form>
  );
};
