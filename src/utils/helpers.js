export const pad2 = (n) => String(n).padStart(2, '0');

export const formatTimeRange = (timeStart, timeEnd) => {
  if (!timeStart || !timeEnd) return '';
  const s = new Date(timeStart);
  const e = new Date(timeEnd);
  const opts = { hour: '2-digit', minute: '2-digit' };
  return `${s.toLocaleTimeString(undefined, opts)} - ${e.toLocaleTimeString(undefined, opts)}`;
};

export const formatDayTimeRange = (day, timeStart, timeEnd) => {
  // Handle old data format (timestamps) and new format (time strings)
  const formatTime12Hour = (t) => {
    if (!t) return '';
    let d;
    // If it's a number/timestamp, create date from it
    if (typeof t === 'number' || /^\d+$/.test(String(t))) {
      d = new Date(Number(t));
      if (isNaN(d.getTime())) return '';
    } else {
      // Parse time string like "14:30" or "2:30 PM"
      const timeStr = String(t).trim();
      // If already has AM/PM, just return it formatted
      if (/[AP]M$/i.test(timeStr)) {
        return timeStr;
      }
      // Parse "HH:MM" format
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return '';
      d = new Date();
      d.setHours(hours, minutes, 0, 0);
    }
    // Format as 12-hour with AM/PM
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const startStr = formatTime12Hour(timeStart);
  const endStr = formatTime12Hour(timeEnd);

  if (!startStr || !endStr) return '';

  const timeRange = `${startStr} - ${endStr}`;
  return day ? `${day}, ${timeRange}` : timeRange;
};

export const toDatetimeLocalValue = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromDatetimeLocalValue = (value) => {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
};

export const statusToTagClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'scheduled') return 'tag--scheduled';
  if (s === 'in progress' || s === 'in_progress') return 'tag--progress';
  if (s === 'completed') return 'tag--completed';
  if (s === 'cancelled' || s === 'canceled') return 'tag--cancelled';
  if (s === 'on time' || s === 'ontime' || s === 'on_time') return 'tag--ontime';
  if (s === 'delayed') return 'tag--delayed';
  if (s === 'room change' || s === 'room_change') return 'tag--room';
  return 'tag--scheduled';
};

export const makeQrUrl = (user) => {
  const payload = {
    uid: user?.uid || '',
    name: user?.fullName || 'Maria Santos',
    id: user?.employeeId || 'EMP-2018-001',
    dept: user?.department || 'Computer Science',
    email: user?.email || 'maria.santos@lcu.edu.ph',
    type: 'professor_time_card',
  };
  const data = encodeURIComponent(JSON.stringify(payload));
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}`;
};
