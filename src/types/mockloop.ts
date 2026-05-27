export interface AvailabilitySlot {
  id?: string;
  hostName: string;
  hostEmail: string;
  role: string;
  interviewType: string;
  startTime: string; // ISO String or Firebase Timestamp
  endTime: string;   // ISO String or Firebase Timestamp
  timezone: string;
  meetingLink?: string;
  notes?: string;
  status: 'available' | 'booked' | 'cancelled';
  createdAt: any; // Firebase serverTimestamp
}

export interface Booking {
  id?: string;
  slotId: string;
  hostEmail: string;
  bookerName: string;
  bookerEmail: string;
  bookingTime: any; // Firebase serverTimestamp
  status: 'confirmed' | 'cancelled' | 'completed';
}
