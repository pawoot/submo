# 🔥 Submo.ai Safe Migration Plan
**Zero Breaking Changes • Feature Flags • RLS Security • Data Reports**

---

## 📊 Current Schema Problems

### 1. **Duplicated Fields** (subscriptions table)
- ❌ `category` (text) AND `category_id` (uuid fk)
- ❌ `payment_method` (text) AND `payment_method_id` (uuid fk)
- **Problem**: Inconsistent data, hard to maintain, no referential integrity

### 2. **Conflicting Reminder Fields**
- ❌ `remind_3_days_before` (boolean)
- ❌ `remind_7_days_before` (boolean)
- ❌ `reminder_enabled` (boolean)
- ❌ `reminder_days` (integer)
- **Problem**: 4 different fields for same concept, confusing logic

### 3. **User Ownership Issues**
- ❌ `subscriptions.user_id` is NULLABLE
- **Problem**: Non-template subscriptions should ALWAYS have an owner

### 4. **Template Mixing**
- ❌ Templates stored in same table with `is_template`, `template_id`, `popularity_score`, `icon_url`
- **Problem**: Pollutes user data queries, hard to manage templates separately

### 5. **Missing Features**
- ❌ No subscription history/events tracking
- ❌ No proper sharing model (using raw `shared_with` array)
- ❌ No multi-currency normalization
- ❌ Missing critical indexes

---

## 🎯 Migration Strategy

### **Core Principles:**
1. ✅ **Add First, Drop Last** - New fields coexist with old
2. ✅ **Feature Flags** - Instant rollback by flipping a switch
3. ✅ **Dual Write Period** - Write to both old and new fields
4. ✅ **Data Reports** - Track unmapped/problematic records
5. ✅ **RLS First** - Security policies before data
6. ✅ **Validate Everything** - Multiple validation phases
7. ✅ **Staged Cleanup** - Drop old fields in waves

---

## 📦 8-Phase Implementation

### **Phase 0: Infrastructure** (Week 1)
- Create `feature_flags` table
- Create `migration_reports` table
- Setup admin access controls

### **Phase 1: New Tables/Columns** (Week 1-2)
- Add `subscription_events` table
- Add `subscription_shares` table
- Add new columns to `subscriptions`
- Create indexes

### **Phase 2: Backfill Data** (Week 2-3)
- Map old categories → category_id
- Map old payment methods → payment_method_id
- Consolidate reminder fields
- Generate migration report

### **Phase 3: Dual Write** (Week 3-4)
- Update app to write both old and new fields
- Record events on changes
- Monitor for inconsistencies

### **Phase 4: Feature Flag Reads** (Week 4-5)
- Implement feature flag checks
- Switch dashboard to new fields (flagged)
- Fallback logic for missing data

### **Phase 5: Validation** (Week 5-6)
- Run validation queries
- Performance testing
- Data consistency checks

### **Phase 6: RLS Policies** (Week 6)
- Enable RLS on new tables
- Create user access policies
- Admin-only policies

### **Phase 7: Enforce Constraints** (Week 7)
- Make user_id NOT NULL (non-templates)
- Add CHECK constraints
- Remove legacy write paths

### **Phase 8: Cleanup** (Week 8+)
- Stop writing old fields
- Deprecation warnings
- Final drop after validation

---

## 🚦 Feature Flags

### **Flags to Implement:**

| Flag Key | Purpose | Default | Impact |
|----------|---------|---------|--------|
| `use_new_dashboard_reads` | Dashboard queries use new schema | `false` | Dashboard performance |
| `use_new_subscription_reads` | List/detail uses FK joins | `false` | Core queries |
| `use_new_shares_model` | Read from subscription_shares | `false` | Sharing features |
| `use_new_reminders_model` | Use reminder_enabled_v2 + array | `false` | Notifications |

### **Rollback Strategy:**
```sql
-- Instant rollback: flip flag to false
UPDATE feature_flags 
SET enabled = false 
WHERE key = 'use_new_dashboard_reads';
```

---

## 📊 Migration Report Structure

### **Report Summary:**
```json
{
  "total_subscriptions": 1250,
  "unmapped_category_count": 23,
  "unmapped_payment_method_count": 15,
  "invalid_shared_with_count": 5,
  "mapped_success_rate_percent": 96.6,
  "notes": "Most failures from legacy 'Other' category text"
}
```

### **Report Rows (Drill-down):**
```sql
SELECT 
  entity,
  issue_type,
  COUNT(*) as count,
  array_agg(record_id) as affected_ids
FROM migration_report_rows
WHERE report_id = 'latest_report_id'
GROUP BY entity, issue_type;
```

---

## 🔒 RLS Security Strategy

### **User Data Isolation:**
```sql
-- Users can ONLY see their own subscriptions
CREATE POLICY "users_own_data" ON subscriptions
FOR SELECT USING (user_id = auth.uid());

-- Users can see shared subscriptions
CREATE POLICY "users_shared_data" ON subscriptions
FOR SELECT USING (
  id IN (
    SELECT subscription_id 
    FROM subscription_shares 
    WHERE shared_with_user_id = auth.uid()
  )
);
```

### **Admin Access:**
```sql
-- Admins can see all data (for support)
CREATE POLICY "admins_all_data" ON subscriptions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
```

---

## 🔄 Rollback Plan

### **Per Phase:**

| Phase | Rollback Method | Data Loss? | Time |
|-------|----------------|------------|------|
| 0-2 | None needed (additive) | ❌ No | Instant |
| 3-4 | Flip feature flags OFF | ❌ No | Instant |
| 5-6 | Revert app code + flags | ❌ No | 5 min |
| 7 | Drop new constraints | ❌ No | 1 min |
| 8 | Restore from backup | ⚠️ Possible | 30 min |

### **Emergency Rollback (All Phases):**
```bash
# 1. Flip all feature flags OFF
UPDATE feature_flags SET enabled = false;

# 2. Deploy previous app version
vercel rollback

# 3. Monitor for 24h
# 4. Investigate issues
# 5. Fix and re-enable gradually
```

---

## 📋 Checklist Per Phase

### **Phase 0:** ✅ Feature Flags + Reports
- [ ] Create `feature_flags` table
- [ ] Create `migration_reports` table
- [ ] Add initial flags (all disabled)
- [ ] Setup admin RLS policies
- [ ] Test flag toggling

### **Phase 1:** ✅ New Tables/Columns
- [ ] Create `subscription_events`
- [ ] Create `subscription_shares`
- [ ] Add new columns to `subscriptions`
- [ ] Create indexes
- [ ] Enable RLS on new tables

### **Phase 2:** ✅ Backfill Data
- [ ] Run category mapping script
- [ ] Run payment method mapping script
- [ ] Consolidate reminders
- [ ] Generate migration report
- [ ] Review unmapped records

### **Phase 3:** ✅ Dual Write
- [ ] Update app create/update paths
- [ ] Write to both old and new fields
- [ ] Start recording events
- [ ] Monitor for 1 week

### **Phase 4:** ✅ Feature Flag Reads
- [ ] Implement feature flag checks
- [ ] Add fallback logic
- [ ] Enable for 10% users
- [ ] Enable for 50% users
- [ ] Enable for 100% users

### **Phase 5:** ✅ Validation
- [ ] Run validation queries
- [ ] Performance tests (EXPLAIN ANALYZE)
- [ ] Data consistency checks
- [ ] User testing
- [ ] Sign-off from stakeholders

### **Phase 6:** ✅ RLS Policies
- [ ] User data isolation policies
- [ ] Sharing policies
- [ ] Admin policies
- [ ] Test with different user roles
- [ ] Security audit

### **Phase 7:** ✅ Enforce Constraints
- [ ] Make user_id NOT NULL (non-templates)
- [ ] Add CHECK constraints
- [ ] Remove legacy write paths
- [ ] Monitor for violations

### **Phase 8:** ✅ Cleanup
- [ ] Stop writing old fields (Wave A)
- [ ] Monitor for 2 releases
- [ ] Drop old columns (Wave B)
- [ ] Final data audit
- [ ] Update documentation

---

## 🎯 Success Metrics

### **Technical:**
- ✅ 0 breaking changes
- ✅ <5% unmapped records
- ✅ <100ms dashboard query time
- ✅ 100% RLS coverage

### **Business:**
- ✅ 0 user complaints
- ✅ 0 data loss incidents
- ✅ Smooth rollout over 8 weeks

---

## 📚 Files Overview

```
supabase/migrations/
├── MIGRATION_PLAN.md                    # This file
├── phase_0_infrastructure/
│   ├── 001_feature_flags.sql
│   ├── 002_migration_reports.sql
│   └── 003_admin_rls.sql
├── phase_1_new_schema/
│   ├── 010_subscription_events.sql
│   ├── 011_subscription_shares.sql
│   ├── 012_add_new_columns.sql
│   └── 013_create_indexes.sql
├── phase_2_backfill/
│   ├── 020_backfill_categories.sql
│   ├── 021_backfill_payment_methods.sql
│   ├── 022_backfill_reminders.sql
│   ├── 023_backfill_shares.sql
│   ├── 024_backfill_status.sql
│   ├── 025_create_initial_events.sql
│   └── 026_generate_report.sql
├── phase_3_dual_write/
│   └── APP_CODE_CHANGES.md
├── phase_4_feature_flags/
│   └── APP_FEATURE_FLAG_INTEGRATION.md
├── phase_5_validation/
│   ├── 050_validation_queries.sql
│   └── 051_performance_checks.sql
├── phase_6_rls/
│   ├── 060_subscription_events_rls.sql
│   ├── 061_subscription_shares_rls.sql
│   ├── 062_feature_flags_rls.sql
│   └── 063_reports_rls.sql
├── phase_7_constraints/
│   └── 070_enforce_constraints.sql
└── phase_8_cleanup/
    ├── 080_deprecate_writes.sql
    └── 081_drop_columns.sql
```

---

## 🚀 Next Steps

1. **Review this plan** with team
2. **Create Phase 0 migrations** (feature flags + reports)
3. **Test on staging** environment
4. **Deploy Phase 0** to production
5. **Monitor for 1 week** before Phase 1

---

**Questions? Contact: [Your Team]**  
**Last Updated: 2026-01-05**