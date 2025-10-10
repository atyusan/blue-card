# Treatment Transfer System Documentation

## Overview

A comprehensive system for transferring patient treatments between healthcare providers, with full tracking, acknowledgment workflow, and notification system.

## Features Implemented

### ✅ **1. Treatment Transfer Flow**

- Transfer treatments from one provider to another (e.g., to a specialist)
- Select new provider with search functionality
- Provide transfer reason (predefined options)
- Add optional notes for context
- Previous provider automatically added to treatment team as consultant
- Audit trail created via treatment notes

### ✅ **2. Transfer Acknowledgment System**

- New providers must acknowledge transferred treatments
- Tracks acknowledgment status and timestamp in database
- Visual indicators for pending acknowledgments
- "Acknowledge Transfer" button on both dashboard and treatments page

### ✅ **3. Transferred Treatments Tab**

- Dedicated "Transferred to Me" tab on Treatments page
- Shows treatments transferred to current provider (last 30 days)
- Badge showing count of unacknowledged transfers
- Filter by acknowledgment status
- Quick acknowledge action in table

### ✅ **4. Dashboard Widget**

- "Pending Transfers" card showing unacknowledged transfers
- Displays up to 3 most recent transfers
- Shows patient name, priority, and transfer date
- One-click acknowledge button
- Link to view all transferred treatments
- Auto-refreshes every 2 minutes

### ✅ **5. Notification Badges**

- Sidebar badge on "Treatments" menu item
- Shows count of pending transfers
- Warning color for visibility
- Updates in real-time (every 2 minutes)

---

## Database Changes

### Schema Update: `TreatmentProvider`

```prisma
model TreatmentProvider {
  id                    String       @id @default(cuid())
  treatmentId           String
  providerId            String
  role                  ProviderRole
  isActive              Boolean      @default(true)
  joinedAt              DateTime     @default(now())
  leftAt                DateTime?
  transferAcknowledged  Boolean      @default(false)     // NEW
  transferAcknowledgedAt DateTime?                        // NEW

  treatment Treatment   @relation(...)
  provider  StaffMember @relation(...)
}
```

**Migration:** `20251009133456_add_transfer_acknowledgment`

---

## Backend API Endpoints

### **1. Transfer Treatment**

```typescript
POST /api/v1/treatments/:id/transfer
```

**Permission Required:** `update_treatments`

**Request Body:**

```json
{
  "newProviderId": "cmxyz123",
  "reason": "specialist_referral",
  "notes": "Patient needs cardiology specialist consultation"
}
```

**Transfer Reasons:**

- `specialist_referral` - Specialist Referral Required
- `provider_unavailable` - Current Provider Unavailable
- `patient_request` - Patient Request
- `workload_distribution` - Workload Distribution
- `expertise_needed` - Specific Expertise Needed
- `emergency_coverage` - Emergency Coverage
- `other` - Other

**Response:** Updated `TreatmentResponse` with new primary provider

**Transfer Process:**

1. Validates treatment and new provider exist
2. Checks new provider is a service provider
3. Prevents transfer to same provider
4. Updates primary provider in transaction
5. Creates audit trail via treatment note
6. Adds previous provider to team as CONSULTANT
7. Sets new provider as PRIMARY with `transferAcknowledged: false`

---

### **2. Get Transferred Treatments**

```typescript
GET / api / v1 / treatments / transferred - to - me;
```

**Permission Required:** `view_treatments`

**Query Parameters:**

- `acknowledged` (optional): `true` | `false` - Filter by acknowledgment status

**Response:**

```json
{
  "treatments": [...],
  "total": 5,
  "unacknowledged": 3
}
```

**Logic:**

- Returns treatments where current user is primary provider
- Filters to treatments transferred within last 30 days
- Checks `TreatmentProvider.joinedAt` for recent joins
- Counts unacknowledged transfers separately

---

### **3. Acknowledge Transfer**

```typescript
POST /api/v1/treatments/:id/acknowledge-transfer
```

**Permission Required:** `view_treatments`

**Response:**

```json
{
  "success": true,
  "message": "Transfer acknowledged successfully"
}
```

**Process:**

1. Finds `TreatmentProvider` record for current user
2. Validates user is the primary provider
3. Updates `transferAcknowledged: true`
4. Sets `transferAcknowledgedAt: <current timestamp>`

---

## Frontend Implementation

### **TreatmentDetailsPage**

#### **Transfer Dialog Components:**

1. **Current Provider Display**

   - Shows current primary provider info
   - Specialization display

2. **Provider Search**

   - Real-time search by name, specialization, employee ID
   - Auto-fetches service providers when dialog opens

3. **Provider Selection Dropdown**

   - Avatar with initials
   - Provider name and specialization
   - Filters out current provider

4. **Transfer Reason Dropdown**

   - 7 predefined reasons
   - Validates selection required

5. **Additional Notes**

   - Optional text area
   - 4-row multiline input

6. **Warning Message**
   - Explains transfer consequences
   - Notes that previous provider becomes consultant

#### **Action Buttons:**

- **Edit** - Edit treatment details (`update_treatments`)
- **Update Status** - Change treatment status (`update_treatment_status`)
- **Link** - Link to other treatments (`manage_treatment_links`)
- **More Actions** (⋮):
  - **Transfer Treatment** (`update_treatments`)
  - **Delete Treatment** (`delete_treatments`)

---

### **TreatmentsPage**

#### **Tabs:**

**Tab 1: All Treatments**

- Standard treatments list with filters
- Status, Type, Priority filters
- Search functionality

**Tab 2: Transferred to Me** 🆕

- Shows treatments transferred to current provider
- Badge with unacknowledged count (red)
- Extra "Transfer" column with acknowledge button
- Only shows transfers from last 30 days

#### **Transfer Column:**

- **Unacknowledged**: Green "Acknowledge" button
- **Acknowledged**: "Acknowledged" chip with checkmark

#### **URL Parameter Support:**

- `?tab=transferred` - Opens "Transferred to Me" tab directly
- Used by dashboard widget links

---

### **DashboardPage**

#### **Pending Transfers Widget:**

**Visibility:**

- Only shows if user has `view_treatments` permission
- Only displays if `unacknowledgedCount > 0`
- Auto-hides when all transfers are acknowledged

**Design:**

- Orange gradient background
- Warning-colored border
- Sync icon header
- Badge showing count

**Content:**

- Shows up to 3 most recent transfers
- Each card displays:
  - Treatment title
  - Patient name
  - Priority chip (color-coded)
  - Transfer date
  - "Acknowledge" button

**Actions:**

- Click card → Navigate to treatment details
- Click "Acknowledge" → Mark transfer as acknowledged
- "View All" button → Navigate to Treatments page (transferred tab)

**Auto-Refresh:**

- Refreshes every 2 minutes
- Updates count and list automatically

---

### **Sidebar**

#### **Notification Badge:**

**Location:** "Treatments" menu item

**Behavior:**

- Shows count of pending transfers
- Warning color (orange)
- Only visible when count > 0
- Updates every 2 minutes

**Design:**

- Small chip badge
- Bold font weight
- Positioned next to "Treatments" label

---

## User Workflows

### **Workflow 1: Transferring a Treatment**

1. Doctor opens treatment details page
2. Clicks **More Actions** (⋮) → **Transfer Treatment**
3. Search/selects new provider (e.g., specialist)
4. Selects reason (e.g., "Specialist Referral Required")
5. Optionally adds notes
6. Clicks "Transfer Treatment"
7. ✅ Success toast shown
8. Treatment primary provider updated
9. Previous provider added to team as consultant
10. Treatment note created for audit trail

---

### **Workflow 2: Acknowledging a Transfer**

#### **Option A: From Dashboard**

1. Provider logs in
2. Sees "Pending Transfers" widget
3. Reviews transfer details
4. Clicks "Acknowledge" button
5. ✅ Transfer marked as acknowledged
6. Widget updates/hides if no more pending

#### **Option B: From Treatments Page**

1. Provider navigates to Treatments
2. Sees badge on "Transferred to Me" tab (e.g., "2")
3. Clicks tab
4. Sees list of transferred treatments
5. Clicks "Acknowledge" button on each row
6. ✅ Button changes to "Acknowledged" chip

#### **Option C: From Treatment Details**

1. Provider clicks treatment card
2. Views full treatment details
3. Can acknowledge from details page (future enhancement)

---

## Permission Requirements

| Action                      | Permission          | Who Has Access       |
| --------------------------- | ------------------- | -------------------- |
| Transfer Treatment          | `update_treatments` | Admin, Doctor        |
| View Transferred Treatments | `view_treatments`   | Admin, Doctor, Nurse |
| Acknowledge Transfer        | `view_treatments`   | Admin, Doctor, Nurse |

---

## Data Flow

### **Transfer Process:**

```
User clicks "Transfer Treatment"
    ↓
Frontend validates form
    ↓
POST /api/v1/treatments/:id/transfer
    ↓
Backend Transaction:
  ├─ Update treatment.primaryProviderId
  ├─ Create TreatmentNote (audit trail)
  ├─ Update old provider → CONSULTANT
  └─ Create/Update new provider → PRIMARY (transferAcknowledged: false)
    ↓
Frontend receives updated treatment
    ↓
Invalidate queries:
  ├─ ['treatment', id]
  └─ ['treatments']
    ↓
Success toast displayed
```

### **Acknowledgment Process:**

```
User clicks "Acknowledge"
    ↓
POST /api/v1/treatments/:id/acknowledge-transfer
    ↓
Backend finds TreatmentProvider record
    ↓
Updates:
  ├─ transferAcknowledged: true
  └─ transferAcknowledgedAt: <now>
    ↓
Frontend invalidates queries:
  ├─ ['dashboard-transferred-treatments']
  ├─ ['transferred-treatments']
  └─ ['sidebar-transferred-count']
    ↓
UI updates:
  ├─ Dashboard widget count decreases
  ├─ Tab badge updates
  ├─ Sidebar badge updates
  └─ Row shows "Acknowledged" chip
```

---

## UI/UX Highlights

### **Visual Indicators:**

1. **Badge Colors:**

   - 🔴 Red/Warning - Unacknowledged transfers (urgent action needed)
   - 🟢 Green - Acknowledged transfers (completed action)

2. **Button States:**

   - **"Acknowledge"** - Green, clickable, with thumbs-up icon
   - **"Acknowledged"** - Outlined chip with checkmark icon

3. **Card Styling:**
   - Gradient background for pending transfers
   - Hover effects on transfer cards
   - Color-coded priority chips

### **Responsive Design:**

- Works on mobile, tablet, and desktop
- Tabs scroll on mobile
- Cards stack vertically on small screens

### **Loading States:**

- Skeleton loaders on initial load
- Disabled buttons during mutations
- "Acknowledging..." text during action

### **Empty States:**

- "No transferred treatments found" message
- Helpful guidance when no data

---

## Technical Details

### **Query Keys:**

```typescript
['transferred-treatments']['dashboard-transferred-treatments'][ // Treatments page // Dashboard widget
  'sidebar-transferred-count'
][('treatment', id)]['treatments'][('service-providers', search)]; // Sidebar badge // Single treatment // All treatments list // Provider search in transfer dialog
```

### **Refetch Intervals:**

- Dashboard widget: **2 minutes**
- Sidebar badge: **2 minutes**
- Treatments tab: **On demand** (when tab is active)

### **Cache Invalidation:**

After transfer:

- Treatment details
- All treatments list

After acknowledgment:

- Dashboard transfers
- Treatments page transfers
- Sidebar count

---

## Audit Trail

### **Transfer History:**

Each transfer creates a `TreatmentNote`:

```
"Treatment transferred from Dr. John Smith to Dr. Jane Doe.
Reason: Specialist Referral Required.
Notes: Patient needs cardiology specialist consultation"
```

**Note Details:**

- Type: `PROGRESS`
- Provider: New provider ID
- Private: `false`
- Timestamp: Auto-generated
- Content: Full transfer details

---

## Testing Scenarios

### **Scenario 1: Specialist Referral**

1. General practitioner starts treatment
2. Realizes patient needs specialist
3. Transfers to cardiologist
4. Cardiologist sees pending transfer on dashboard
5. Acknowledges transfer
6. Badge count decreases

### **Scenario 2: Emergency Coverage**

1. Doctor goes on emergency leave
2. Admin transfers active treatments to covering doctor
3. Covering doctor receives multiple transfers
4. Reviews each on "Transferred to Me" tab
5. Acknowledges after reviewing patient history

### **Scenario 3: Workload Distribution**

1. Doctor has too many active treatments
2. Manager transfers some to another provider
3. New provider sees transfers on login
4. Reviews and acknowledges each treatment

---

## Future Enhancements

### **Potential Additions:**

1. **Transfer History Tab**

   - View all historical transfers
   - Filter by date range
   - Export transfer reports

2. **Bulk Acknowledge**

   - Acknowledge multiple transfers at once
   - "Acknowledge All" button

3. **Transfer Notifications**

   - Email notification to new provider
   - In-app notification system
   - Push notifications for mobile

4. **Transfer Rejection**

   - Allow providers to reject transfers
   - Provide rejection reason
   - Return to original provider or admin

5. **Transfer Analytics**

   - Track transfer patterns
   - Identify bottlenecks
   - Provider workload metrics

6. **Enhanced Audit Trail**
   - View complete transfer history
   - Timeline view of all transfers
   - Download transfer logs

---

## API Documentation

### **Request/Response Examples:**

#### **Transfer Treatment:**

```bash
curl -X POST http://localhost:3000/api/v1/treatments/cmxyz123/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newProviderId": "cmabc456",
    "reason": "specialist_referral",
    "notes": "Patient needs cardiology consultation"
  }'
```

#### **Get Transferred Treatments:**

```bash
curl -X GET "http://localhost:3000/api/v1/treatments/transferred-to-me?acknowledged=false" \
  -H "Authorization: Bearer <token>"
```

#### **Acknowledge Transfer:**

```bash
curl -X POST http://localhost:3000/api/v1/treatments/cmxyz123/acknowledge-transfer \
  -H "Authorization: Bearer <token>"
```

---

## File Changes Summary

### **Backend Files:**

1. **`backend/prisma/schema.prisma`**

   - Added `transferAcknowledged` and `transferAcknowledgedAt` to `TreatmentProvider`

2. **`backend/src/treatments/treatments.controller.ts`**

   - Added `transferTreatment()` endpoint
   - Added `getTransferredTreatments()` endpoint
   - Added `acknowledgeTransfer()` endpoint
   - Proper route ordering (specific routes before parameterized)

3. **`backend/src/treatments/treatments.service.ts`**
   - Implemented `transferTreatment()` method
   - Implemented `getTransferredTreatments()` method
   - Implemented `acknowledgeTransfer()` method
   - Transaction-based transfer logic
   - Automatic treatment note creation

### **Frontend Files:**

1. **`frontend/src/services/treatment.service.ts`**

   - Added `transferTreatment()` method
   - Added `getTransferredTreatments()` method
   - Added `acknowledgeTransfer()` method

2. **`frontend/src/pages/TreatmentDetailsPage.tsx`**

   - Added transfer dialog with form
   - Provider search functionality
   - Transfer validation
   - Transfer mutation with error handling

3. **`frontend/src/pages/TreatmentsPage.tsx`**

   - Added "Transferred to Me" tab
   - Badge showing unacknowledged count
   - Acknowledge button in table
   - URL parameter support (`?tab=transferred`)

4. **`frontend/src/pages/DashboardPage.tsx`**

   - Added "Pending Transfers" widget
   - Shows up to 3 recent transfers
   - Acknowledge action
   - Auto-refresh every 2 minutes

5. **`frontend/src/components/layout/Sidebar.tsx`**

   - Added notification badge on "Treatments" menu
   - Real-time count updates
   - Warning color for visibility

6. **`frontend/src/types/index.ts`**
   - Added `transferAcknowledged` to `TreatmentProviderRole`
   - Added `transferAcknowledgedAt` to `TreatmentProviderRole`

---

## Security Considerations

### **Permission Checks:**

1. **Transfer Action:**

   - User must have `update_treatments` permission
   - User must have permission to update specific treatment
   - Validated on both frontend and backend

2. **View Transfers:**

   - User must have `view_treatments` permission
   - Can only see treatments transferred to them
   - Uses `staffMemberId` from JWT token

3. **Acknowledge Transfer:**
   - User must be the primary provider
   - Validated against `TreatmentProvider` record
   - Prevents unauthorized acknowledgments

### **Data Validation:**

- New provider must be a service provider
- Cannot transfer to same provider
- Reason is required
- Notes are optional
- Treatment must exist and be active

---

## Performance Optimization

### **Query Optimization:**

1. **Transferred Treatments:**

   - Indexed on `primaryProviderId`
   - Indexed on `status`
   - Date range filter (30 days) reduces dataset
   - Includes only necessary relations

2. **Provider Search:**

   - Limited to 50 results
   - Filters for active providers only
   - Lazy-loaded when dialog opens

3. **Count Queries:**
   - Separate count query for efficiency
   - Cached result for badge display

### **Caching Strategy:**

- Dashboard widget: 2-minute cache
- Sidebar badge: 2-minute cache
- Treatments tab: On-demand (when active)
- Invalidation on mutations for data consistency

---

## Troubleshooting

### **Common Issues:**

1. **404 Error on Transfer:**

   - **Cause:** Route ordering issue
   - **Fix:** Ensure `@Post(':id/transfer')` comes before `@Get(':id')`

2. **Transfer Not Showing:**

   - **Cause:** Provider not marked as service provider
   - **Fix:** Ensure `staffMember.serviceProvider = true`

3. **Badge Not Updating:**

   - **Cause:** Cache not invalidating
   - **Fix:** Check query key invalidation after acknowledge

4. **Can't Acknowledge:**
   - **Cause:** User not primary provider
   - **Fix:** Verify treatment assignment and role

---

## Role-Specific Views

### **Admin:**

- ✅ Can transfer any treatment
- ✅ Can view all transferred treatments
- ✅ Can acknowledge any transfer
- ✅ Full access to transfer system

### **Doctor:**

- ✅ Can transfer their own treatments
- ✅ Can view treatments transferred to them
- ✅ Can acknowledge their transfers
- ✅ Dashboard widget visible

### **Nurse:**

- ❌ Cannot transfer treatments
- ✅ Can view treatments transferred to them
- ✅ Can acknowledge their transfers
- ✅ Dashboard widget visible (if applicable)

### **Receptionist/Cashier:**

- ❌ Cannot access transfer system
- ❌ No dashboard widget
- ❌ No sidebar badge

---

## Success Criteria

All features successfully implemented:

- ✅ Treatment transfer with provider selection
- ✅ Transfer reason and notes capture
- ✅ Previous provider added to team
- ✅ Audit trail via treatment notes
- ✅ Transfer acknowledgment tracking
- ✅ "Transferred to Me" tab on Treatments page
- ✅ Dashboard widget for pending transfers
- ✅ Sidebar notification badge
- ✅ Real-time updates (2-minute intervals)
- ✅ Permission-based access control
- ✅ Beautiful, modern UI
- ✅ Mobile-responsive design
- ✅ Error handling and validation
- ✅ Loading states and skeletons
- ✅ Toast notifications

---

## Metrics & Analytics

### **Trackable Metrics:**

1. **Transfer Volume:**

   - Number of transfers per day/week/month
   - Transfers by provider
   - Transfers by reason

2. **Acknowledgment Speed:**

   - Average time to acknowledge
   - Providers with fastest acknowledgment
   - Overdue acknowledgments

3. **Transfer Patterns:**

   - Most common transfer reasons
   - Provider transfer network
   - Specialist referral rates

4. **System Usage:**
   - Active transfer users
   - Dashboard widget engagement
   - Tab usage statistics

---

## Conclusion

The Treatment Transfer System provides a complete, production-ready solution for managing patient treatment transfers between healthcare providers. With comprehensive tracking, acknowledgment workflows, and real-time notifications, providers can seamlessly collaborate on patient care while maintaining full audit trails and accountability.

**Key Benefits:**

- 🏥 Improves care coordination
- 👨‍⚕️ Streamlines specialist referrals
- 📊 Complete audit trail
- 🔔 Real-time notifications
- ✅ Full RBAC integration
- 🎨 Beautiful, intuitive UI

---

**Last Updated:** October 9, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
