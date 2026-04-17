# Time Logs Page with QR Code Scanning - Implementation Plan

## Overview
Create a dedicated Time Logs page where professors can:
1. **Time In/Out via QR Code Scanning** - Scan their personal QR code to log attendance
2. **View Time Log History** - See all their time logs with associated schedule details

---

## User Flow

### 1. Time In/Out Flow
```
Professor navigates to "Time Logs" tab
    ↓
Sees their current status (Not Clocked In / Clocked In)
    ↓
Click "Scan QR to Time In" button
    ↓
Opens camera/QR scanner modal
    ↓
Scans their own QR code (generated from their profile)
    ↓
System validates QR and records time log
    ↓
Status updates to "Clocked In" with timestamp
    ↓
To Time Out: Repeat process (scan QR again)
```

### 2. Viewing Time Logs
```
Time Logs page displays:
- Current status card (In/Out)
- Today's summary
- List of recent time logs with schedule details
```

---

## Data Structure

### New Collection: `timeLogs`
```json
{
  "timeLogs": {
    "$logId": {
      "professorUid": "user_uid_string",
      "professorName": "Dr. Maria Santos",
      "employeeId": "EMP-2018-001",
      
      // Schedule reference (if associated with a class)
      "scheduleId": "schedule_id_or_null",
      "scheduleDetails": {
        "subject": "Data Structures",
        "classroom": "Room 101",
        "building": "IT Building",
        "day": "Monday",
        "timeStart": "09:00 AM",
        "timeEnd": "11:00 AM"
      },
      
      // Log details
      "type": "IN" | "OUT",
      "timestamp": 1713345600000,
      "date": "2024-04-17",
      "time": "09:15 AM",
      
      // QR scan metadata
      "scannedVia": "web_qr",
      "qrData": "{encoded_user_data}",
      
      // Status
      "status": "on_time" | "late" | "early",
      "createdAt": 1713345600000
    }
  }
}
```

### Modified Collection: `schedules` (add reference)
Already has `live` node with `tapInAt` and `tapOutAt`. We can link timeLogs to schedules.

---

## Components to Create

### 1. TimeLogsTab.jsx
**Location:** `src/components/tabs/TimeLogsTab.jsx`

**Props:**
```javascript
{
  profile,           // Current professor profile
  timeLogs,          // Array of time logs for this professor
  todayLog,          // Today's log (if any)
  onScanQR,          // Handler to open QR scanner
  onManualTimeIn,    // Manual time in (backup)
  onManualTimeOut,   // Manual time out (backup)
  scanBusy           // Loading state
}
```

**Sections:**
1. **Status Card**
   - Large status indicator (Green = Clocked In, Gray = Not Clocked In)
   - Current time
   - Last action timestamp
   - "Scan QR to Time In/Out" button

2. **Today's Summary**
   - Time in (if applicable)
   - Time out (if applicable)
   - Duration worked
   - Schedule associated (if any)

3. **Time Logs History**
   - Table/list of past logs
   - Columns: Date, Time In, Time Out, Duration, Subject, Status
   - Pagination or infinite scroll
   - Filter by date range

### 2. QRScannerModal.jsx
**Location:** `src/components/shared/QRScannerModal.jsx`

**Features:**
- Camera access via `navigator.mediaDevices.getUserMedia()`
- QR code scanning library (e.g., `html5-qrcode` or `jsQR`)
- Display camera feed with QR overlay
- Success/failure feedback
- Close button

**Props:**
```javascript
{
  isOpen,
  onClose,
  onScanSuccess,     // Callback with scanned QR data
  scanBusy
}
```

### 3. TimeLogCard.jsx (sub-component)
**Location:** `src/components/shared/TimeLogCard.jsx`

Display individual time log entry with:
- Date
- Time in/out
- Duration calculation
- Associated schedule info
- Status badge (On Time, Late, Early)

---

## Firebase Functions (cacheApi.js)

### 1. Create Time Log
```javascript
export const createTimeLog = async (professorUid, type, qrData, scheduleId = null) => {
  // Validate QR data matches professor
  // Check for duplicate logs (prevent double-scan)
  // Create log entry
  // Update schedule's live node if scheduleId provided
}
```

### 2. Watch Time Logs
```javascript
export const watchTimeLogsForProfessor = (professorUid, cb) => {
  // Return real-time listener for professor's time logs
  // Order by timestamp desc
}
```

### 3. Get Today's Log
```javascript
export const getTodayLogForProfessor = async (professorUid) => {
  // Query logs for today
  // Return current status (in/out) and today's entries
}
```

---

## QR Code Data Format

The QR code should encode:
```json
{
  "uid": "professor_uid",
  "name": "Dr. Maria Santos",
  "employeeId": "EMP-2018-001",
  "type": "professor_time_card",
  "hash": "sha256_signature"    // Verify authenticity
}
```

**Security Notes:**
- Printed QR codes are permanent (no expiration)
- Include a secret hash/signature to prevent forgery
- Validate that scanned QR belongs to the logged-in professor
- Optional: Track scan count to detect if someone else is using the card

---

## State Management (App.jsx)

### New State Variables
```javascript
const [timeLogs, setTimeLogs] = useState([]);
const [todayLog, setTodayLog] = useState(null);
const [qrScannerOpen, setQrScannerOpen] = useState(false);
const [scanBusy, setScanBusy] = useState(false);
```

### New Effect
```javascript
useEffect(() => {
  if (!authUser || isAdmin) return;
  
  const unsub = watchTimeLogsForProfessor(authUser.uid, (logs) => {
    setTimeLogs(logs);
    setTodayLog(getTodayLog(logs)); // Filter today's log
  });
  
  return () => unsub();
}, [authUser, isAdmin]);
```

### New Handlers
```javascript
const handleScanQR = async (qrData) => {
  // Parse QR
  // Validate QR belongs to current user
  // Determine if this is Time In or Time Out
  // Check if already clocked in/out to prevent duplicates
  // Create time log
  // Close scanner
};
```

---

## Navigation Update

### DashboardScreen.jsx
Add new tab "Time Logs" (only for professors, not admins):
```javascript
{!isAdmin && (
  <button
    className={`tab ${activeTab === 'timeLogs' ? 'is-active' : ''}`}
    onClick={() => onTabChange('timeLogs')}
  >
    <ClockIcon />
    Time Logs
  </button>
)}
```

---

## QR Generation

### Existing QR Code
The app already generates a QR code in the Profile tab. We can reuse that.

### Enhancements Needed
1. Add expiration timestamp to QR data
2. Add refresh button to regenerate QR (for security)
3. Display "Valid for X minutes" indicator

---

## Optional: NFC/RFID Alternative

For future expansion:
- Support NFC tap on supported devices
- RFID card reader integration
- Fallback to manual entry if QR fails

---

## Dependencies to Add

```bash
npm install html5-qrcode
```

Or use a lightweight QR scanning approach with `jsQR` + custom camera implementation.

---

## Security Considerations

1. **Printed QR Card Security**
   - Each professor gets a unique printed QR card (like an ID)
   - Include a secret hash/signature in QR data to prevent forgery
   - Card should be treated like an ID badge - don't share with others
   - Admin can invalidate and reissue cards if lost

2. **Scan Validation**
   - Verify scanned QR belongs to the currently logged-in professor
   - Prevent using someone else's card (or prompt for confirmation)
   - Log scan attempts for audit trail

3. **Location Validation** (optional)
   - Verify GPS location is within campus
   - WiFi network validation

---

## Implementation Phases

### Phase 1: Basic Time Logs
- [ ] Create TimeLogsTab component
- [ ] Create timeLogs Firebase functions
- [ ] Add "Time In/Out" buttons (manual, no QR yet)
- [ ] Display time log history

### Phase 2: QR Scanning
- [ ] Add QR scanner modal
- [ ] Integrate html5-qrcode library
- [ ] Implement QR validation
- [ ] Test scanning flow

### Phase 3: Schedule Association
- [ ] Auto-detect current class based on time
- [ ] Link time log to schedule
- [ ] Show "In Progress" class in Time Logs

### Phase 4: Polish
- [ ] Add animations/transitions
- [ ] Add sound feedback on scan
- [ ] Optimize for mobile
- [ ] Add offline support

---

## Questions to Consider

1. **Should professors scan their own QR or an admin/room QR?**
   - Own QR: Personal device, scan to self-report
   - Room QR: Fixed QR in classroom, scan to mark attendance

2. **What happens if QR scan fails?**
   - Manual entry fallback?
   - Retry with camera?
   - Admin override?

3. **Should we track location?**
   - GPS coordinates?
   - Just IP address?
   - No location tracking?

4. **Time validation rules:**
   - How early can they clock in? (e.g., 30 min before)
   - How late is considered "late"?
   - Auto-clock out if they forget?

---

## Files to Modify

1. `src/App.jsx` - Add state, handlers, watchers
2. `src/components/screens/DashboardScreen.jsx` - Add tab
3. `src/components/tabs/TimeLogsTab.jsx` - NEW
4. `src/components/shared/QRScannerModal.jsx` - NEW
5. `src/components/shared/TimeLogCard.jsx` - NEW
6. `src/cacheApi.js` - Add time log functions
7. `database.rules.json` - Add timeLogs rules
8. `src/components/shared/Icons.jsx` - Add ClockIcon (if not exists)

---

## Estimated Effort

- **Phase 1 (Basic):** 2-3 hours
- **Phase 2 (QR):** 3-4 hours
- **Phase 3 (Schedule Link):** 2 hours
- **Phase 4 (Polish):** 2-3 hours

**Total:** ~10-12 hours for full implementation
