export type Language = "th" | "en";

export const translations = {
  // Header & Navigation
  "nav.home": {
    th: "หน้าหลัก",
    en: "Home"
  },
  "nav.addSubscription": {
    th: "เพิ่ม Subscription",
    en: "Add Subscription"
  },
  "nav.profile": {
    th: "โปรไฟล์",
    en: "Profile"
  },
  "nav.notifications": {
    th: "การแจ้งเตือน",
    en: "Notifications"
  },
  "nav.logout": {
    th: "ออกจากระบบ",
    en: "Logout"
  },
  "dialog.logoutTitle": {
    th: "ยืนยันการออกจากระบบ",
    en: "Confirm Logout"
  },
  "dialog.logoutDescription": {
    th: "คุณแน่ใจหรือไม่ที่ต้องการออกจากระบบ?",
    en: "Are you sure you want to logout?"
  },
  "dialog.cancel": {
    th: "ยกเลิก",
    en: "Cancel"
  },
  "dialog.confirm": {
    th: "ยืนยัน",
    en: "Confirm"
  },
  "nav.settings": {
    th: "ตั้งค่า",
    en: "Settings"
  },
  "nav.admin": {
    th: "แอดมิน",
    en: "Admin Panel"
  },
  "nav.stats": {
    th: "สถิติ",
    en: "Statistics"
  },
  "nav.login": {
    th: "เข้าสู่ระบบ",
    en: "Login"
  },
  "nav.signup": {
    th: "สมัครสมาชิก",
    en: "Sign Up"
  },

  // Home Page - Header
  "home.title": {
    th: "Submo",
    en: "Submo"
  },
  "home.tagline": {
    th: "Subscription Monitoring",
    en: "Subscription Monitoring"
  },
  "home.seo.title": {
    th: "Submo - Subscription Monitoring",
    en: "Submo - Subscription Monitoring"
  },
  "home.seo.description": {
    th: "ติดตามค่าใช้จ่ายสมาชิก แจ้งเตือนก่อนชำระเงิน และดูภาพรวมการใช้จ่ายของคุณ",
    en: "Track subscription costs, get payment reminders, and view your spending overview"
  },
  "home.welcome": {
    th: "ยินดีต้อนรับสู่ Submo.ai",
    en: "Welcome to Submo.ai"
  },
  "home.description": {
    th: "จัดการ Subscription ทั้งหมดของคุณในที่เดียว ติดตามค่าใช้จ่าย และไม่พลาดทุกการต่ออายุ",
    en: "Manage all your subscriptions in one place. Track expenses and never miss a renewal."
  },

  // Dashboard Cards
  "dashboard.totalCost": {
    th: "ค่าใช้จ่ายทั้งหมด",
    en: "Total Cost"
  },
  "dashboard.activeSubscriptions": {
    th: "Subscription ที่ใช้งาน",
    en: "Active Subscriptions"
  },
  "dashboard.upcomingRenewals": {
    th: "ต่ออายุเร็วๆ นี้",
    en: "Upcoming Renewals"
  },
  "dashboard.perMonth": {
    th: "/เดือน",
    en: "/month"
  },
  "dashboard.perYear": {
    th: "/ปี",
    en: "/year"
  },
  "dashboard.items": {
    th: "รายการ",
    en: "items"
  },
  "dashboard.within30Days": {
    th: "ใน 30 วันนี้",
    en: "within 30 days"
  },

  // Subscription List
  "subscriptions.title": {
    th: "รายการ Subscription",
    en: "Subscription List"
  },
  "subscriptions.sort": {
    th: "เรียงตาม",
    en: "Sort by"
  },
  "subscriptions.sortNewest": {
    th: "เพิ่มล่าสุด",
    en: "Newest"
  },
  "subscriptions.sortOldest": {
    th: "เพิ่มเก่าสุด",
    en: "Oldest"
  },
  "subscriptions.sortPriceHigh": {
    th: "ราคา: มาก → น้อย",
    en: "Price: High → Low"
  },
  "subscriptions.sortPriceLow": {
    th: "ราคา: น้อย → มาก",
    en: "Price: Low → High"
  },
  "subscriptions.sortNameAZ": {
    th: "ชื่อ: A → Z",
    en: "Name: A → Z"
  },
  "subscriptions.sortNameZA": {
    th: "ชื่อ: Z → A",
    en: "Name: Z → A"
  },
  "subscriptions.sortNextBilling": {
    th: "วันต่ออายุ: ใกล้สุด",
    en: "Next Billing: Soonest"
  },
  "subscriptions.sortNextBillingDesc": {
    th: "วันต่ออายุ: ไกลสุด",
    en: "Next Billing: Furthest"
  },
  "subscriptions.sortCategory": {
    th: "หมวดหมู่",
    en: "Category"
  },
  "subscriptions.page": {
    th: "หน้า",
    en: "Page"
  },
  "subscriptions.of": {
    th: "จาก",
    en: "of"
  },
  "subscriptions.items": {
    th: "รายการ",
    en: "items"
  },
  "subscriptions.searchPlaceholder": {
    th: "ค้นหาชื่อ Subscription...",
    en: "Search subscriptions..."
  },
  "subscriptions.showing": {
    th: "แสดง",
    en: "Showing"
  },
  "subscriptions.empty": {
    th: "ยังไม่มี Subscription",
    en: "No subscriptions yet"
  },
  "subscriptions.emptyDesc": {
    th: "เริ่มต้นเพิ่ม Subscription แรกของคุณเลย",
    en: "Start by adding your first subscription"
  },
  "subscriptions.monthly": {
    th: "รายเดือน",
    en: "Monthly"
  },
  "subscriptions.quarterly": {
    th: "รายไตรมาส",
    en: "Quarterly"
  },
  "subscriptions.halfYearly": {
    th: "ราย 6 เดือน",
    en: "Half-yearly"
  },
  "subscriptions.daysLeft": {
    th: "เหลือ {days} วัน",
    en: "{days} days left"
  },
  "subscriptions.yearly": {
    th: "รายปี",
    en: "Yearly"
  },
  "subscriptions.nextBilling": {
    th: "ต่ออายุถัดไป",
    en: "Next billing"
  },
  "subscriptions.sharedWith": {
    th: "แบ่งปันกับ",
    en: "Shared with"
  },
  "subscriptions.people": {
    th: "คน",
    en: "people"
  },
  "subscriptions.edit": {
    th: "แก้ไข",
    en: "Edit"
  },
  "subscriptions.delete": {
    th: "ลบ",
    en: "Delete"
  },
  "subscriptions.confirmDelete": {
    th: "ยืนยันการลบ",
    en: "Confirm Delete"
  },
  "subscriptions.confirmDeleteDesc": {
    th: "คุณแน่ใจหรือไม่ที่จะลบ Subscription นี้?",
    en: "Are you sure you want to delete this subscription?"
  },
  "subscriptions.cancel": {
    th: "ยกเลิก",
    en: "Cancel"
  },
  "subscriptions.perYear": {
    th: "/ปี",
    en: "/year"
  },
  "subscriptions.perMonth": {
    th: "/เดือน",
    en: "/month"
  },
  "subscriptions.browseAllTemplates": {
    th: "ดูเทมเพลตทั้งหมด",
    en: "Browse All Templates"
  },
  "subscriptions.noTemplatesFound": {
    th: "ไม่พบเทมเพลต",
    en: "No templates found"
  },
  "subscriptions.searchTemplates": {
    th: "ค้นหาเทมเพลต...",
    en: "Search templates..."
  },
  "subscriptions.cantFindAddCustom": {
    th: "ไม่พบบริการที่ต้องการ?",
    en: "Service not found?"
  },
  "subscriptions.addCustomService": {
    th: "เพิ่มบริการที่คุณต้องการ",
    en: "Add custom service"
  },

  // Add Subscription Page
  "addSub.title": {
    th: "เพิ่มรายการสมาชิก",
    en: "Add Subscription"
  },
  "addSub.subtitle": {
    th: "เพิ่ม Subscription ใหม่",
    en: "Add a new subscription"
  },
  "addSub.select_template": {
    th: "เลือกบริการ",
    en: "Select Service"
  },
  "addSub.fill_details": {
    th: "กรอกรายละเอียด",
    en: "Fill Details"
  },
  "addSub.review": {
    th: "ตรวจสอบ",
    en: "Review"
  },
  "addSub.custom_service": {
    th: "บริการอื่นๆ (กำหนดเอง)",
    en: "Custom Service"
  },

  // Common
  "common.loading": {
    th: "กำลังโหลด...",
    en: "Loading..."
  },
  "common.save": {
    th: "บันทึก",
    en: "Save"
  },
  "common.cancel": {
    th: "ยกเลิก",
    en: "Cancel"
  },
  "common.continue": {
    th: "ถัดไป",
    en: "Continue"
  },

  // Intelligence Layer
  "intelligence.costBreakdown": {
    th: "การคำนวณค่าใช้จ่าย",
    en: "Cost Breakdown"
  },
  "intelligence.monthlyEquivalent": {
    th: "รายเดือน",
    en: "Monthly"
  },
  "intelligence.yearlyEquivalent": {
    th: "รายปี",
    en: "Yearly"
  },
  "intelligence.dailyCost": {
    th: "รายวัน",
    en: "Daily cost"
  },
  "intelligence.spendingContext": {
    th: "บริบทการใช้จ่าย",
    en: "Spending Context"
  },
  "intelligence.ofTotalSpending": {
    th: "ของค่าใช้จ่ายรวมทั้งหมด",
    en: "of total spending"
  },
  "intelligence.rankingOf": {
    th: "อันดับที่ {rank} จาก {total}",
    en: "Ranked {rank} of {total}"
  },
  "intelligence.highYearlyCost": {
    th: "⚠️ บริการนี้มีค่าใช้จ่ายมากกว่า {amount} บาท/ปี",
    en: "⚠️ This subscription costs over {amount}/year"
  },
  "intelligence.multipleInCategory": {
    th: "🔁 คุณมีบริการในหมวดหมู่นี้แล้ว {count} รายการ",
    en: "🔁 You already have {count} subscriptions in this category"
  },
  "intelligence.rarelyUsed": {
    th: "✂️ บริการที่ใช้ไม่บ่อยมักจะถูกยกเลิกโดยผู้ใช้",
    en: "✂️ Rarely used services are often cancelled"
  },
  "intelligence.yearlyBillingSuggestion": {
    th: "💡 ลองพิจารณาจ่ายแบบรายปี อาจประหยัดได้ประมาณ {savings} บาท",
    en: "💡 Consider yearly billing to save approx {savings}"
  },
  "intelligence.reminderSuggestion": {
    th: "🔔 แนะนำให้เปิดการแจ้งเตือนเพื่อไม่ให้ลืมบริการนี้",
    en: "🔔 Recommended to enable reminders for this service"
  },
  "intelligence.summary": {
    th: "🧠 Submo Insight",
    en: "🧠 Submo Insight"
  },
  "intelligence.summaryYearlyCost": {
    th: "บริการนี้มีค่าใช้จ่าย {amount} ต่อปี",
    en: "This service costs {amount} per year"
  },
  "intelligence.summaryPercentage": {
    th: "คิดเป็น {percent}% ของค่าใช้จ่ายรายเดือนของคุณ",
    en: "Accounts for {percent}% of your monthly spending"
  },
  "intelligence.summaryReminder": {
    th: "เปิดการแจ้งเตือนเพื่อป้องกันการลืมแล้ว",
    en: "Reminders enabled to prevent forgetting"
  },
  "intelligence.noActionRequired": {
    th: "ไม่ต้องทำอะไรเพิ่มเติม",
    en: "No additional action required"
  }
};

export type TranslationKey = keyof typeof translations;

export function getTranslation(key: TranslationKey, language: Language): string {
  return translations[key]?.[language] || key;
}