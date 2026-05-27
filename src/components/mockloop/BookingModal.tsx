import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, User, Mail, Loader2, Calendar, Clock, Video } from 'lucide-react';
import { bookSlot } from '../../lib/mockloop-api';
import { AvailabilitySlot } from '../../types/mockloop';

const bookingSchema = z.object({
  bookerName: z.string().min(2, "Name is required"),
  bookerEmail: z.string().email("Invalid email"),
  notes: z.string().optional()
});

type FormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  slot: AvailabilitySlot;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal = ({ slot, onClose, onSuccess }: BookingModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(bookingSchema)
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      if (!slot.id) throw new Error("Invalid slot");
      await bookSlot(slot.id, {
        name: data.bookerName,
        email: data.bookerEmail,
        notes: data.notes
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to book slot. It might have just been taken!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startDate = new Date(slot.startTime);
  const endDate = new Date(slot.endTime);
  const timeString = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const dateString = startDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-fade-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Book Mock Interview</h2>
          <p className="text-slate-500">with <span className="font-semibold text-slate-900">{slot.hostName}</span> ({slot.role})</p>
          
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <Calendar className="h-5 w-5 text-[#188ab2]" />
              <span className="font-medium">{dateString}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <Clock className="h-5 w-5 text-[#188ab2]" />
              <span className="font-medium">{timeString} <span className="text-xs text-slate-400">({slot.timezone})</span></span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <Video className="h-5 w-5 text-[#188ab2]" />
              <span className="font-medium">{slot.interviewType}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input 
                {...register('bookerName')} 
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]"
                placeholder="e.g. Jane Smith"
              />
            </div>
            {errors.bookerName && <p className="text-red-500 text-xs mt-1">{errors.bookerName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input 
                {...register('bookerEmail')} 
                type="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]"
                placeholder="jane@example.com"
              />
            </div>
            {errors.bookerEmail && <p className="text-red-500 text-xs mt-1">{errors.bookerEmail.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Message to Host (Optional)</label>
            <textarea 
              {...register('notes')} 
              placeholder="Any specific topics you want to cover?"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2] h-20 resize-none"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="pt-2 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-1/3"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-[#188ab2] text-white hover:bg-[#157a9d] font-bold py-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Confirming...</>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
