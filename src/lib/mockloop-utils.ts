export type TimeRange = { start: string; end: string };

export type DaySchedule = {
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  ranges: TimeRange[];
};

/**
 * Generates discrete availability slots based on a weekly schedule.
 * @param schedule The weekly schedule (array of DaySchedule).
 * @param durationMinutes The duration of each slot in minutes (e.g., 60).
 * @param weeksToGenerate How many weeks into the future to generate slots.
 * @returns Array of objects containing startTime and endTime (ISO strings).
 */
export const generateSlotsFromSchedule = (
  schedule: DaySchedule[],
  durationMinutes: number,
  weeksToGenerate: number = 4
): { startTime: string; endTime: string }[] => {
  const slots: { startTime: string; endTime: string }[] = [];
  const durationMs = durationMinutes * 60000;
  
  const now = new Date();
  
  for (let week = 0; week < weeksToGenerate; week++) {
    for (const day of schedule) {
      if (day.ranges.length === 0) continue;
      
      // Calculate the date for this specific day of the week, 'week' weeks from now
      const targetDate = new Date(now.getTime());
      
      // Get current day of week (0-6)
      const currentDay = targetDate.getDay();
      
      // Calculate days to add to get to the target day of week
      let daysToAdd = day.dayOfWeek - currentDay;
      
      // If the target day is earlier in the week than today, and we're in week 0, 
      // we shouldn't generate slots for the past (we skip it or jump to next week).
      // However, typical Calendly generation just goes "forward".
      // Let's standardise: we find the NEXT occurrence of dayOfWeek, then add (week * 7) days.
      if (daysToAdd < 0) {
        daysToAdd += 7; // Next week's occurrence
      }
      
      daysToAdd += (week * 7);
      
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      
      const dateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD local time?
      // Wait, targetDate.toISOString() uses UTC. Let's use local string.
      const localYear = targetDate.getFullYear();
      const localMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
      const localDate = String(targetDate.getDate()).padStart(2, '0');
      const localDateString = `${localYear}-${localMonth}-${localDate}`;
      
      for (const range of day.ranges) {
        // Range start: HH:mm
        const startDateTime = new Date(`${localDateString}T${range.start}:00`);
        const endDateTime = new Date(`${localDateString}T${range.end}:00`);
        
        let currentSlotStart = startDateTime.getTime();
        
        // Slice the range into duration blocks
        while (currentSlotStart + durationMs <= endDateTime.getTime()) {
          const slotStart = new Date(currentSlotStart);
          const slotEnd = new Date(currentSlotStart + durationMs);
          
          // Only add if it's in the future
          if (slotStart.getTime() > Date.now()) {
            slots.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString()
            });
          }
          
          currentSlotStart += durationMs;
        }
      }
    }
  }
  
  return slots;
};
