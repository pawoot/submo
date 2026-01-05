# Phase 4: Feature Flag Read Path Switch

## 🎯 Goal
Gradually switch read queries from legacy fields to new fields using feature flags.
This allows instant rollback without code deploy.

---

## 🚩 Feature Flags to Implement

### 1. `use_new_dashboard_reads`
**Controls:** Dashboard aggregate queries (total spending, upcoming bills, etc.)

**Default:** `false`

**When enabled:**
- Dashboard reads from `category_id`, `payment_method_id`, `status`
- Uses FK joins to `categories`, `payment_methods`

**Rollback:** Set to `false` → dashboard reads from legacy fields

---

### 2. `use_new_subscription_reads`
**Controls:** Subscription list and detail reads

**Default:** `false`

**When enabled:**
- List queries join with `categories`, `payment_methods` via FK
- Detail queries use `reminder_enabled_v2`, `reminder_days_array`

**Rollback:** Set to `false` → reads from legacy fields

---

### 3. `use_new_shares_model`
**Controls:** Subscription sharing reads

**Default:** `false`

**When enabled:**
- Reads from `subscription_shares` table
- Uses RPC functions: `get_shared_subscriptions()`

**Rollback:** Set to `false` → reads from `shared_with` array

---

### 4. `use_new_reminders_model`
**Controls:** Reminder logic

**Default:** `false`

**When enabled:**
- Uses `reminder_enabled_v2` + `reminder_days_array`

**Rollback:** Set to `false` → uses old reminder fields

---

## 📂 App Integration

### 1. Create Feature Flag Helper

**File:** `src/services/featureFlagService.ts`

```typescript
import { supabase } from "@/integrations/supabase/client";

// Cache feature flags in memory (refresh every 5 min)
let featureFlagCache: Record<string, boolean> = {};
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getFeatureFlag(key: string): Promise<boolean> {
  const now = Date.now();
  
  // Use cache if fresh
  if (now - lastFetchTime < CACHE_TTL && key in featureFlagCache) {
    return featureFlagCache[key];
  }
  
  // Fetch from database
  const { data, error } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("key", key)
    .maybeSingle();
  
  if (error) {
    console.error(`Error fetching feature flag ${key}:`, error);
    return false; // Fail closed
  }
  
  const enabled = data?.enabled ?? false;
  featureFlagCache[key] = enabled;
  lastFetchTime = now;
  
  return enabled;
}

// Refresh cache (call on app load or interval)
export async function refreshFeatureFlags() {
  const { data, error } = await supabase
    .from("feature_flags")
    .select("key, enabled");
  
  if (error) {
    console.error("Error refreshing feature flags:", error);
    return;
  }
  
  featureFlagCache = {};
  data?.forEach((flag) => {
    featureFlagCache[flag.key] = flag.enabled;
  });
  lastFetchTime = Date.now();
}
```

---

### 2. Update Dashboard Queries

**File:** `src/services/subscriptionService.ts`

```typescript
import { getFeatureFlag } from "./featureFlagService";

export async function getDashboardStats(userId: string) {
  const useNewReads = await getFeatureFlag("use_new_dashboard_reads");
  
  if (useNewReads) {
    // ✅ NEW: Read from new fields with FK joins
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        name,
        amount,
        currency,
        billing_cycle,
        next_billing_date,
        status,
        category_id,
        payment_method_id,
        categories!category_id (
          name_en,
          name_th,
          icon
        ),
        payment_methods!payment_method_id (
          name_en,
          name_th,
          icon
        )
      `)
      .eq("user_id", userId)
      .eq("status", "active");
    
    // ... process data
  } else {
    // ⚠️ LEGACY: Read from old fields
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        name,
        amount,
        currency,
        billing_cycle,
        next_billing_date,
        is_active,
        category,
        payment_method
      `)
      .eq("user_id", userId)
      .eq("is_active", true);
    
    // ... process data (legacy format)
  }
  
  return { data, error };
}
```

---

### 3. Update Subscription List

**File:** `src/pages/index.tsx` or subscription list component

```typescript
import { getFeatureFlag } from "@/services/featureFlagService";

async function loadSubscriptions() {
  const useNewReads = await getFeatureFlag("use_new_subscription_reads");
  
  if (useNewReads) {
    // ✅ NEW: FK joins
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        categories!category_id (name_en, name_th, icon),
        payment_methods!payment_method_id (name_en, name_th, icon)
      `)
      .eq("user_id", userId)
      .order("next_billing_date", { ascending: true });
    
    // Map data
    const subscriptions = data?.map((sub) => ({
      ...sub,
      category_name: sub.categories?.name_en || sub.category_legacy,
      payment_method_name: sub.payment_methods?.name_en || sub.payment_method_legacy,
    }));
    
    return subscriptions;
  } else {
    // ⚠️ LEGACY: Read from text fields
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("next_billing_date", { ascending: true });
    
    return data;
  }
}
```

---

### 4. Update Reminder Logic

**File:** `src/services/notificationService.ts`

```typescript
export async function getUpcomingReminders(userId: string) {
  const useNewReminders = await getFeatureFlag("use_new_reminders_model");
  
  if (useNewReminders) {
    // ✅ NEW: Use reminder_enabled_v2 + reminder_days_array
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("reminder_enabled_v2", true)
      .not("reminder_days_array", "is", null);
    
    // Check if any reminder days match today
    const today = new Date();
    const reminders = data?.filter((sub) => {
      const nextBilling = new Date(sub.next_billing_date);
      const daysUntil = Math.ceil(
        (nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return sub.reminder_days_array?.includes(daysUntil);
    });
    
    return reminders;
  } else {
    // ⚠️ LEGACY: Use old reminder fields
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .or("remind_3_days_before.eq.true,remind_7_days_before.eq.true");
    
    // ... legacy logic
    return data;
  }
}
```

---

### 5. Update Sharing Reads

**File:** `src/services/subscriptionService.ts`

```typescript
export async function getSharedWithMe(userId: string) {
  const useNewShares = await getFeatureFlag("use_new_shares_model");
  
  if (useNewShares) {
    // ✅ NEW: Read from subscription_shares table
    const { data, error } = await supabase
      .rpc("get_shared_subscriptions", {
        p_user_id: userId,
      });
    
    return { data, error };
  } else {
    // ⚠️ LEGACY: Read from shared_with array
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .contains("shared_with", [userId]);
    
    return { data, error };
  }
}
```

---

## 🧪 Testing Checklist

### ✅ Feature Flag OFF (default)
- [ ] Dashboard reads from legacy fields
- [ ] Subscription list reads from legacy fields
- [ ] Reminders use old logic
- [ ] Sharing uses `shared_with` array

### ✅ Feature Flag ON
- [ ] Dashboard reads from new fields with FK joins
- [ ] Subscription list uses new fields
- [ ] Reminders use v2 fields
- [ ] Sharing uses `subscription_shares` table

### ✅ Fallback Logic
- [ ] If new field is NULL, fallback to legacy field
- [ ] No crashes or errors
- [ ] Data consistency maintained

---

## 📊 Gradual Rollout Strategy

### Week 1: Enable for 10% of users
```sql
UPDATE feature_flags 
SET enabled = true, rollout_percentage = 10 
WHERE key = 'use_new_dashboard_reads';
```

### Week 2: Enable for 50% of users
```sql
UPDATE feature_flags 
SET rollout_percentage = 50 
WHERE key = 'use_new_dashboard_reads';
```

### Week 3: Enable for 100% of users
```sql
UPDATE feature_flags 
SET rollout_percentage = 100 
WHERE key = 'use_new_dashboard_reads';
```

---

## 🔄 Rollback Plan

**If issues arise:**

1. **Instant rollback:**
```sql
UPDATE feature_flags SET enabled = false WHERE key = 'use_new_dashboard_reads';
```

2. **Clear cache:**
```typescript
await refreshFeatureFlags();
```

3. **Monitor:** Check error rates, query performance

---

## 📅 Timeline

**Duration:** 2-3 weeks (gradual rollout)  
**Monitoring:** Track errors, performance, user feedback  
**Next:** Proceed to Phase 5 (Validation) once stable at 100%

---

**Status:** 🟡 Pending  
**Next Phase:** Phase 5 - Validation & Monitoring