import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, appId } from '../../../App';
import { AvailabilitySlot } from '../../types/mockloop';
import { Calendar, Clock, Video, Loader2, RefreshCw } from 'lucide-react';
import { BookingModal } from './BookingModal';

export const SlotList = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [filterType, setFilterType] = useState<string>('All');

  useEffect(() => {
    if (!db) {
      setError('Database not initialized');
      setLoading(false);
      return;
    }

    const slotsRef = collection(db, 'artifacts', appId, 'public', 'data', 'mockloop_slots');
    // We only fetch slots with status 'available'
    const q = query(
      slotsRef, 
      where("status", "==", "available"), 
      orderBy("startTime", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeSlots: AvailabilitySlot[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter out expired slots on the client side just in case (optional, but good UX)
        const isFuture = new Date(data.startTime).getTime() > Date.now();
        
        if (isFuture) {
          activeSlots.push({ id: doc.id, ...data } as AvailabilitySlot);
        }
      });
      
      setSlots(activeSlots);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching slots:", err);
      setError('Failed to load slots');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredSlots = slots.filter(slot => 
    filterType === 'All' || slot.interviewType === filterType
  );

  const interviewTypes = ['All', ...Array.from(new Set(slots.map(s => s.interviewType)))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="animate-spin h-8 w-8 mb-4 text-[#188ab2]" />
        <p>Loading available slots...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-center border border-red-100">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Available Sessions</h2>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-500">Filter:</label>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2] shadow-sm font-medium text-slate-700"
          >
            {interviewTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredSlots.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
          <RefreshCw className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">No slots available right now</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Check back later or be the first to share your availability to practice with someone else!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlots.map(slot => {
            const startDate = new Date(slot.startTime);
            const endDate = new Date(slot.endTime);
            const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
            
            return (
              <div key={slot.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#188ab2]/10 text-[#188ab2] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                    {slot.interviewType}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{slot.hostName}</h3>
                  <p className="text-slate-500 text-sm line-clamp-1">{slot.role}</p>
                </div>
                
                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({duration} min)
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedSlot(slot)}
                  className="w-full py-3 rounded-xl bg-slate-100 text-slate-900 font-bold group-hover:bg-[#188ab2] group-hover:text-white transition-colors"
                >
                  Book Session
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedSlot && (
        <BookingModal 
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSuccess={() => {
            setSelectedSlot(null);
            alert("Booking confirmed! (Check your email for details)");
          }}
        />
      )}
    </div>
  );
};
