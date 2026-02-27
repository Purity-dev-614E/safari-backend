# Frontend: Removed Members Implementation

This guide outlines the frontend implementation for the "Removed Members" feature, which allows authorized users to remove group members with justification and view removal history.

## Feature Overview

The frontend should provide:
1. **Member Removal Interface** - Remove members with required reason input
2. **Removed Members Tab** - View all removed members for a group
3. **Role-Based UI** - Different interfaces based on user permissions
4. **Confirmation Dialogs** - Prevent accidental removals

## UI Components

### 1. Remove Member Button

**Location**: Group members list/table
**Visibility**: Only for Admin, Super Admin, Root, Regional Manager

```jsx
// Example component structure
<MemberActions>
  {canRemoveMember && (
    <RemoveMemberButton 
      onClick={() => showRemoveDialog(member)}
      disabled={isRemoving}
    >
      Remove Member
    </RemoveMemberButton>
  )}
</MemberActions>
```

**Button States**:
- **Default**: Enabled, styled as warning/danger
- **Loading**: Disabled, showing spinner during API call
- **Disabled**: When user lacks permissions

### 2. Remove Member Modal/Dialog

**Trigger**: Clicking "Remove Member" button
**Required Fields**:
- Member information display
- Reason textarea (required, min length validation)
- Confirmation checkbox
- Cancel/Remove buttons

```jsx
<RemoveMemberModal
  isOpen={showModal}
  member={selectedMember}
  onClose={handleClose}
  onConfirm={handleRemoveMember}
  isLoading={isRemoving}
/>
```

**Modal Content**:
```
┌─────────────────────────────────────┐
│ Remove Member                        │
├─────────────────────────────────────┤
│ Member: John Doe (john@example.com) │
│                                     │
│ Reason for Removal:                 │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │ [Textarea - required]           │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ☐ I confirm this member removal     │
│                                     │
│        [Cancel]  [Remove Member]    │
└─────────────────────────────────────┘
```

### 3. Removed Members Tab

**Location**: Group details page, alongside "Members" tab
**Tab Label**: "Removed Members"
**Badge**: Show count of removed members

```jsx
<Tabs>
  <Tab label="Members" />
  <Tab label="Removed Members" badge={removedCount} />
  <Tab label="Settings" />
</Tabs>
```

### 4. Removed Members Table

**Columns**:
- Member Name (with avatar if available)
- Email
- Removal Reason
- Removed Date
- Removed By (who performed the removal)

```jsx
<RemovedMembersTable>
  <TableHeader>
    <Column>Member</Column>
    <Column>Reason</Column>
    <Column>Removed Date</Column>
    <Column>Removed By</Column>
  </TableHeader>
  <TableBody>
    {removedMembers.map(member => (
      <RemovedMemberRow key={member.user_id} member={member} />
    ))}
  </TableBody>
</RemovedMembersTable>
```

## User Experience Flow

### 1. Member Removal Flow

```
1. User navigates to group members list
2. User clicks "Remove Member" next to target member
3. Modal opens with member details
4. User enters removal reason (required)
5. User confirms removal action
6. API call is made
7. Member is removed from active list
8. Success notification shown
9. Member appears in "Removed Members" tab
```

### 2. View Removed Members Flow

```
1. User navigates to group details
2. User clicks "Removed Members" tab
3. Table loads with removal history
4. User can sort by date, reason, or removed by
5. User can search/filter removed members
```

## Permission-Based UI

### Role Visibility Matrix

| Component | Admin | Super Admin | Root | Regional Manager | User |
|-----------|-------|-------------|------|------------------|------|
| Remove Button | ✅ (own group) | ✅ (any group) | ✅ (any group) | ✅ (region groups) | ❌ |
| Removed Tab | ✅ (own group) | ✅ (any group) | ✅ (any group) | ✅ (region groups) | ❌ |
| View History | ✅ (own group) | ✅ (any group) | ✅ (any group) | ✅ (region groups) | ❌ |

### Implementation Example

```jsx
const canRemoveMembers = usePermissions({
  roles: ['admin', 'super_admin', 'root', 'regional_manager'],
  checkRegion: userRole === 'regional_manager'
});

const canViewRemovedTab = canRemoveMembers; // Same permissions
```

## API Integration

### 1. Remove Member API

```javascript
// Service function
export const removeGroupMember = async (groupId, userId, reason) => {
  try {
    const response = await api.post(
      `/api/groups/${groupId}/members/${userId}/remove`,
      { reason }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to remove member');
  }
};

// Component usage
const handleRemoveMember = async () => {
  setIsRemoving(true);
  try {
    await removeGroupMember(groupId, member.user_id, reason);
    showSuccess('Member removed successfully');
    refreshMembersList();
    closeModal();
  } catch (error) {
    showError(error.message);
  } finally {
    setIsRemoving(false);
  }
};
```

### 2. Get Removed Members API

```javascript
// Service function
export const getRemovedMembers = async (groupId) => {
  try {
    const response = await api.get(`/api/groups/${groupId}/removed-members`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch removed members');
  }
};

// Component usage
const { data: removedMembers, loading, error } = useAsync(
  () => getRemovedMembers(groupId),
  [groupId]
);
```

## State Management

### 1. Component State

```javascript
const [removedMembers, setRemovedMembers] = useState([]);
const [isRemoving, setIsRemoving] = useState(false);
const [showRemoveModal, setShowRemoveModal] = useState(false);
const [selectedMember, setSelectedMember] = useState(null);
const [removalReason, setRemovalReason] = useState('');
const [removalConfirmed, setRemovalConfirmed] = useState(false);
```

### 2. Global State (if using Redux/Zustand)

```javascript
// Store slice for group management
const groupSlice = {
  members: [],
  removedMembers: [],
  isLoading: false,
  error: null,
  
  actions: {
    removeMember: async (groupId, userId, reason) => { /* ... */ },
    fetchRemovedMembers: async (groupId) => { /* ... */ },
    clearRemovedMembers: () => { /* ... */ }
  }
};
```

## Validation & Error Handling

### 1. Form Validation

```javascript
const validateRemovalForm = (reason, confirmed) => {
  const errors = {};
  
  if (!reason || reason.trim().length < 3) {
    errors.reason = 'Reason must be at least 3 characters long';
  }
  
  if (!confirmed) {
    errors.confirmed = 'You must confirm the removal action';
  }
  
  return errors;
};
```

### 2. Error States

- **Network Error**: Show retry option
- **Permission Error**: Redirect or show access denied
- **Validation Error**: Show field-specific errors
- **Member Not Found**: Refresh member list

## Loading States

### 1. Remove Member Loading

```jsx
<RemoveMemberButton 
  onClick={handleRemoveClick}
  disabled={isRemoving || !canRemoveMember}
>
  {isRemoving ? (
    <>
      <Spinner size="sm" />
      Removing...
    </>
  ) : (
    'Remove Member'
  )}
</RemoveMemberButton>
```

### 2. Removed Members Loading

```jsx
{loading ? (
  <TableSkeleton rows={5} columns={4} />
) : error ? (
  <ErrorMessage message={error} onRetry={() => fetchRemovedMembers()} />
) : (
  <RemovedMembersTable data={removedMembers} />
)}
```

## Responsive Design

### Mobile Considerations

- **Remove Button**: Use icon-only button on small screens
- **Modal**: Full-screen on mobile devices
- **Table**: Convert to card layout on mobile
- **Tabs**: Use dropdown navigation on small screens

### Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  .removed-members-table {
    /* Convert to cards */
  }
  
  .remove-modal {
    width: 95%;
    max-height: 90vh;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Adjust table columns */
}
```

## Accessibility

### 1. Keyboard Navigation

- Tab order: Remove button → Modal fields → Cancel → Remove
- Escape key closes modal
- Enter key submits form when valid

### 2. Screen Reader Support

```jsx
<button
  onClick={handleRemoveClick}
  aria-label={`Remove ${member.name} from group`}
  aria-describedby={`remove-member-${member.id}-help`}
>
  Remove
</button>

<div id={`remove-member-${member.id}-help`} className="sr-only">
  This will permanently remove the member from the group and record the removal reason.
</div>
```

### 3. ARIA Labels

```jsx
<table role="table" aria-label="Removed members history">
  <caption>Removed members from {groupName}</caption>
  <!-- Table content -->
</table>
```

## Testing

### 1. Unit Tests

```javascript
describe('RemoveMemberModal', () => {
  test('requires reason input', () => {
    // Test validation
  });
  
  test('requires confirmation checkbox', () => {
    // Test confirmation requirement
  });
  
  test('calls API with correct data', () => {
    // Test API integration
  });
});
```

### 2. Integration Tests

```javascript
describe('Member Removal Flow', () => {
  test('admin can remove member from own group', async () => {
    // Test full flow
  });
  
  test('regional manager can remove from region group', async () => {
    // Test regional permissions
  });
  
  test('user cannot remove members', async () => {
    // Test permission denial
  });
});
```

### 3. E2E Tests

```javascript
// Cypress example
describe('Removed Members Feature', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/groups/test-group');
  });
  
  it('should remove member and show in removed tab', () => {
    cy.get('[data-testid="remove-member-btn"]').first().click();
    cy.get('[data-testid="reason-input"]').type('No longer active');
    cy.get('[data-testid="confirm-checkbox"]').check();
    cy.get('[data-testid="remove-confirm-btn"]').click();
    cy.get('[data-testid="success-toast"]').should('be.visible');
    cy.get('[data-testid="removed-members-tab"]').click();
    cy.contains('No longer active').should('be.visible');
  });
});
```

## Performance Considerations

### 1. Data Fetching

- **Lazy Loading**: Load removed members only when tab is clicked
- **Pagination**: Implement pagination for large removal histories
- **Caching**: Cache removed members data with TTL

### 2. Component Optimization

```jsx
// Memoize expensive operations
const MemoizedRemovedMembersTable = React.memo(RemovedMembersTable);

// Use useCallback for event handlers
const handleRemoveMember = useCallback(async () => {
  // Removal logic
}, [groupId, selectedMember, reason]);
```

## Analytics & Tracking

### 1. Event Tracking

```javascript
// Track member removal
analytics.track('member_removed', {
  group_id: groupId,
  member_role: member.role,
  remover_role: currentUser.role,
  removal_reason_category: categorizeReason(reason)
});

// Track removed members view
analytics.track('removed_members_viewed', {
  group_id: groupId,
  removed_count: removedMembers.length
});
```

### 2. Performance Metrics

- Modal open/close time
- API response times
- Form submission time
- Table render performance

## Security Considerations

### 1. Client-Side Validation

- Always validate required fields
- Sanitize reason input before display
- Prevent XSS in reason display

### 2. Permission Checks

```javascript
// Double-check permissions before showing UI
const showRemoveButton = useMemo(() => {
  return hasPermission(user.role, 'remove_members') && 
         (user.role === 'admin' ? isGroupAdmin : true) &&
         (user.role === 'regional_manager' ? isInRegion : true);
}, [user.role, isGroupAdmin, isInRegion]);
```

## Deployment Checklist

### Pre-Deployment

- [ ] All API endpoints are properly configured
- [ ] Permission checks are working correctly
- [ ] Error handling covers all scenarios
- [ ] Loading states are implemented
- [ ] Responsive design tested on all breakpoints
- [ ] Accessibility features are working
- [ ] Analytics tracking is implemented

### Post-Deployment

- [ ] Monitor API error rates
- [ ] Check performance metrics
- [ ] Verify user permissions are enforced
- [ ] Test with different user roles
- [ ] Validate audit logging is working

## Future Enhancements

### 1. Advanced Features

- **Bulk Removal**: Remove multiple members at once
- **Scheduled Removal**: Schedule member removal for future date
- **Undo Removal**: Restore accidentally removed members
- **Export History**: Export removal history to CSV/PDF

### 2. UI Improvements

- **Advanced Filtering**: Filter by removal date range, reason category
- **Member Search**: Search within removed members
- **Statistics Dashboard**: Show removal trends and analytics
- **Notification System**: Email notifications for member removals

This implementation provides a comprehensive, user-friendly interface for managing group member removals while maintaining security, accessibility, and performance standards.
