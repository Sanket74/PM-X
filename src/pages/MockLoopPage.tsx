import React, { useState } from 'react';
import { AvailabilityForm } from '../components/mockloop/AvailabilityForm';
import { SlotList } from '../components/mockloop/SlotList';
import { ArrowLeft, Users, CalendarDays, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MockLoopPage = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'host'>('browse');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handlePublishSuccess = () => {
    setActiveTab('browse');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#188ab2]/20">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link to="/" className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 leading-none">PM-X</span>
              <span className="text-[10px] font-bold text-[#188ab2] uppercase tracking-widest">MockLoop</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-24">
        {/* Hero Section */}
        <div className="container mx-auto px-6 mb-16 text-center max-w-3xl">
          <div className="inline-flex items-center justify-center p-3 bg-[#188ab2]/10 rounded-2xl mb-6">
            <Users className="h-8 w-8 text-[#188ab2]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Peer-to-Peer Mock Interviews
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-10">
            A community-driven marketplace. Share your availability to practice, or book a slot with a peer to sharpen your product sense and behavioural skills.
          </p>

          {/* Toggle Tabs */}
          <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'browse' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Find a Partner
            </button>
            <button
              onClick={() => setActiveTab('host')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'host' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Rocket className="h-4 w-4" />
              Share Availability
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'browse' ? (
              <div className="animate-fade-in">
                <SlotList />
              </div>
            ) : (
              <div className="animate-fade-in max-w-2xl mx-auto">
                <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                    <span className="bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">Free</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Publish a Slot</h2>
                  <p className="text-slate-500 mb-8">Offer a time to practice with others. You'll receive an email when someone books your slot.</p>
                  <AvailabilityForm onSuccess={handlePublishSuccess} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl font-medium animate-fade-in z-50">
          Availability published successfully!
        </div>
      )}
    </div>
  );
};
