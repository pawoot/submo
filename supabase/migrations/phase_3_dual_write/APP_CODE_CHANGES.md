# Phase 3: Dual Write Period - App Code Changes

## 🎯 Goal
Update app code to write to BOTH old and new fields during the transition period.
This ensures zero data loss and allows instant rollback by disabling feature flags.

---

## 📝 Checklist: Subscription Create/Update

### ✅ Write to NEW fields (primary):
```typescript
{
  category_id: uuid,              // ✅ NEW (FK to categories)
  payment_method_id: uuid,        // ✅ NEW (FK to payment_methods)
  reminder_enabled_v2: boolean,   // ✅ NEW (unified reminder flag)
  reminder_days_array: number[],  // ✅ NEW (e.g., [7, 3, 1, 0])
  status: 'active' | 'paused' | 'canceled', // ✅ NEW
  website_url: string,            // ✅ NEW
  description: string,            // ✅ NEW
  auto_renew: boolean,            // ✅ NEW
  usage_frequency: string,        // ✅ NEW
}
```

### ⚠️ ALSO write to OLD fields (backward compatibility):
```typescript
{
  category: string,                // ⚠️ Legacy (for old read paths)
  payment_method: string,          // ⚠️ Legacy
  reminder_enabled: boolean,       // ⚠️ Legacy
  remind_3_days_before: boolean,   // ⚠️ Legacy
  remind_7_days_before: boolean,   // ⚠️ Legacy
  reminder_days: number,           // ⚠️ Legacy
  is_active: boolean,              // ⚠️ Legacy (sync with status)
}
```

---

## 📂 Files to Update

### 1. `src/services/subscriptionService.ts`

**Function: `createSubscription()`**

```typescript
// ✅ BEFORE (Phase 2):
const { data, error } = await supabase
  .from("subscriptions")
  .insert({
    user_id: userId,
    name,
    category,              // ❌ Old field only
    amount,
    currency,
    billing_cycle,
    payment_method,        // ❌ Old field only
    // ...
  });

// ✅ AFTER (Phase 3 - Dual Write):
const { data, error } = await supabase
  .from("subscriptions")
  .insert({
    user_id: userId,
    name,
    
    // ✅ NEW fields (primary)
    category_id,                    // From categories table
    payment_method_id,              // From payment_methods table
    reminder_enabled_v2,            // Boolean
    reminder_days_array,            // [7, 3, 1, 0]
    status: 'active',               // Default
    website_url,
    description,
    auto_renew,
    usage_frequency,
    
    // ⚠️ LEGACY fields (backward compat)
    category: categoryName,         // Keep text version
    payment_method: paymentName,    // Keep text version
    reminder_enabled: reminder_enabled_v2,
    remind_3_days_before: reminder_days_array.includes(3),
    remind_7_days_before: reminder_days_array.includes(7),
    reminder_days: reminder_days_array[0] || 7,
    is_active: status === 'active',
    
    // ... rest of fields
  });
```

**Function: `updateSubscription()`**

```typescript
// ✅ AFTER (Phase 3 - Dual Write):
const updates: any = {};

// ✅ Write to NEW fields
if (category_id !== undefined) {
  updates.category_id = category_id;
  // ⚠️ Also write legacy field
  const category = await getCategoryById(category_id);
  updates.category = category?.name_en || category?.name_th;
}

if (payment_method_id !== undefined) {
  updates.payment_method_id = payment_method_id;
  // ⚠️ Also write legacy field
  const pm = await getPaymentMethodById(payment_method_id);
  updates.payment_method = pm?.name_en || pm?.name_th;
}

if (reminder_enabled_v2 !== undefined) {
  updates.reminder_enabled_v2 = reminder_enabled_v2;
  updates.reminder_days_array = reminder_days_array;
  // ⚠️ Also write legacy fields
  updates.reminder_enabled = reminder_enabled_v2;
  updates.remind_3_days_before = reminder_days_array.includes(3);
  updates.remind_7_days_before = reminder_days_array.includes(7);
  updates.reminder_days = reminder_days_array[0] || 7;
}

if (status !== undefined) {
  updates.status = status;
  // ⚠️ Also write legacy field
  updates.is_active = status === 'active';
}

const { data, error } = await supabase
  .from("subscriptions")
  .update(updates)
  .eq("id", subscriptionId);
```

---

### 2. `src/services/subscriptionService.ts` - Event Logging

**Add event logging for all mutations:**

```typescript
// Helper function to log events
async function logSubscriptionEvent(
  userId: string,
  subscriptionId: string,
  eventType: 'created' | 'updated' | 'canceled' | 'paused' | 'resumed' | 'renewed' | 'price_changed' | 'payment_method_changed',
  amount?: number,
  currency?: string,
  metadata?: any
) {
  await supabase
    .from("subscription_events")
    .insert({
      user_id: userId,
      subscription_id: subscriptionId,
      event_type: eventType,
      event_date: new Date().toISOString(),
      amount,
      currency,
      metadata,
    });
}

// ✅ Use in createSubscription:
const { data: newSub, error } = await supabase
  .from("subscriptions")
  .insert({ ... })
  .select()
  .single();

if (newSub) {
  await logSubscriptionEvent(
    userId,
    newSub.id,
    'created',
    newSub.amount,
    newSub.currency,
    { source: 'web_app' }
  );
}

// ✅ Use in updateSubscription:
if (updates.amount || updates.currency) {
  await logSubscriptionEvent(
    userId,
    subscriptionId,
    'price_changed',
    updates.amount,
    updates.currency,
    { old_amount, old_currency }
  );
}

if (updates.status === 'canceled') {
  await logSubscriptionEvent(userId, subscriptionId, 'canceled');
}
```

---

### 3. Sharing - Use `subscription_shares` table

**Update sharing functions:**

```typescript
// ✅ NEW: Share subscription (use subscription_shares table)
export async function shareSubscription(
  subscriptionId: string,
  sharedWithUserId: string,
  role: 'viewer' | 'editor' = 'viewer'
) {
  const { data, error } = await supabase
    .rpc('share_subscription', {
      p_subscription_id: subscriptionId,
      p_shared_with_user_id: sharedWithUserId,
      p_role: role,
    });
  
  return { data, error };
}

// ✅ NEW: Unshare subscription
export async function unshareSubscription(
  subscriptionId: string,
  sharedWithUserId: string
) {
  const { data, error } = await supabase
    .rpc('unshare_subscription', {
      p_subscription_id: subscriptionId,
      p_shared_with_user_id: sharedWithUserId,
    });
  
  return { data, error };
}

// ✅ NEW: Get shared subscriptions
export async function getSharedSubscriptions(userId: string) {
  const { data, error } = await supabase
    .rpc('get_shared_subscriptions', {
      p_user_id: userId,
    });
  
  return { data, error };
}
```

---

## 📊 Testing Checklist

### ✅ Create Subscription
- [ ] Creates record with BOTH new and legacy fields
- [ ] category_id and category text match
- [ ] payment_method_id and payment_method text match
- [ ] reminder_enabled_v2 syncs with old reminder fields
- [ ] status syncs with is_active
- [ ] Event logged in subscription_events

### ✅ Update Subscription
- [ ] Updates BOTH new and legacy fields
- [ ] Events logged for price changes, cancellations, etc.

### ✅ Share Subscription
- [ ] Uses subscription_shares table
- [ ] Event logged

### ✅ Backward Compatibility
- [ ] Old read paths (without feature flags) still work
- [ ] Dashboard queries work with legacy fields

---

## 🔄 Rollback Strategy

If issues arise:
1. Stop deploying new app code
2. Revert to previous release (reads from legacy fields only)
3. New writes continue to populate both old and new fields
4. No data loss

---

## 📅 Timeline

**Duration:** 1-2 weeks  
**Monitoring:** Check for any errors in dual-write logic  
**Next:** Proceed to Phase 4 (Feature Flag Reads) once stable

---

## 📝 Notes

- Dual write means **temporary data duplication** for safety
- Legacy fields will be dropped in Phase 8
- Monitor for any sync issues between old and new fields
- Consider adding a cron job to verify data consistency

---

**Status:** 🟡 In Progress  
**Next Phase:** Phase 4 - Feature Flag Read Path Switch