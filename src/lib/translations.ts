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
  "subscriptions.addCustomService": {
    th: "เพิ่มบริการที่คุณต้องการ",
    en: "Add your own service"
  },
  "subscriptions.notFoundAddCustom": {
    th: "ไม่พบบริการที่ต้องการ?",
    en: "Service not found?"
  },

  // Search & Filter
  "search.label": {
    th: "ค้นหา",
    en: "Search"
  },
  "search.placeholder": {
    th: "ค้นหาชื่อ Subscription...",
    en: "Search subscription name..."
  },
  "filter.timePeriod": {
    th: "ช่วงเวลา",
    en: "Time Period"
  },
  "filter.priceRange": {
    th: "ช่วงราคา",
    en: "Price Range"
  },
  "filter.all": {
    th: "ทั้งหมด",
    en: "All"
  },
  "filter.button": {
    th: "ตัวกรองข้อมูล",
    en: "Filter"
  },
  "filter.apply": {
    th: "ค้นหา",
    en: "Apply"
  },

  // Charts
  "charts.monthlyByCategory": {
    th: "ค่าใช้จ่ายรายเดือนตามหมวดหมู่",
    en: "Monthly Cost by Category"
  },
  "charts.categoryDistribution": {
    th: "สัดส่วนค่าใช้จ่ายตามหมวดหมู่",
    en: "Cost Distribution by Category"
  },
  "charts.paymentMethodCost": {
    th: "ค่าใช้จ่ายตามช่องทางการชำระเงิน",
    en: "Cost by Payment Method"
  },
  "charts.paymentMethodDistribution": {
    th: "สัดส่วนการใช้ช่องทางการชำระเงิน",
    en: "Payment Method Distribution"
  },
  "charts.thisMonth": {
    th: "เดือนนี้",
    en: "This Month"
  },
  "charts.thisQuarter": {
    th: "ไตรมาสนี้",
    en: "This Quarter"
  },
  "charts.thisYear": {
    th: "ปีนี้",
    en: "This Year"
  },
  "charts.expiringSoon": {
    th: "ใกล้หมดอายุ",
    en: "Expiring Soon"
  },
  "charts.noResults": {
    th: "ไม่พบข้อมูลที่ค้นหา",
    en: "No Results Found"
  },
  "charts.noResultsDesc": {
    th: "ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง",
    en: "Try adjusting your search or filter criteria"
  },
  "charts.currentFilters": {
    th: "เงื่อนไขที่ใช้:",
    en: "Current filters:"
  },
  "charts.clearFilters": {
    th: "ล้างตัวกรองทั้งหมด",
    en: "Clear All Filters"
  },
  "charts.emptyTitle": {
    th: "เริ่มต้นบริหารจัดการ Subscription",
    en: "Start Managing Your Subscriptions"
  },
  "charts.emptyDesc": {
    th: "ยังไม่มี Subscription ในระบบ เพิ่มรายการแรกของคุณเพื่อเริ่มติดตามค่าใช้จ่าย",
    en: "No subscriptions yet. Add your first one to start tracking expenses"
  },
  "charts.trackSpending": {
    th: "ติดตามค่าใช้จ่าย",
    en: "Track Spending"
  },
  "charts.viewCharts": {
    th: "ดูกราฟและสถิติ",
    en: "View Charts & Stats"
  },
  "charts.analyzeSpending": {
    th: "วิเคราะห์รายจ่าย",
    en: "Analyze Expenses"
  },
  "charts.byCategory": {
    th: "แยกตามหมวดหมู่",
    en: "By Category"
  },
  "charts.autoReminders": {
    th: "แจ้งเตือนอัตโนมัติ",
    en: "Auto Reminders"
  },
  "charts.beforeDue": {
    th: "ก่อนครบกำหนด",
    en: "Before Due Date"
  },
  "charts.addFirst": {
    th: "เพิ่ม Subscription แรก",
    en: "Add First Subscription"
  },
  "charts.quickStart": {
    th: "💡 เริ่มต้นง่ายๆ ใช้เวลาแค่ไม่กี่วินาที",
    en: "💡 Quick and easy to get started"
  },

  // Add Subscription Page
  "addSub.title": {
    th: "เพิ่มรายการสมาชิก",
    en: "Add Subscription"
  },
  "addSub.desc": {
    th: "เพิ่มรายการสมาชิกใหม่เพื่อติดตามค่าใช้จ่ายของคุณ",
    en: "Add a new subscription to track your expenses"
  },
  "addSub.name": {
    th: "ชื่อ Subscription",
    en: "Subscription Name"
  },
  "addSub.namePlaceholder": {
    th: "เช่น Netflix, Spotify",
    en: "e.g. Netflix, Spotify"
  },
  "addSub.description": {
    th: "คำอธิบาย",
    en: "Description"
  },
  "addSub.descriptionPlaceholder": {
    th: "คำอธิบายเพิ่มเติม...",
    en: "Additional description..."
  },
  "addSub.category": {
    th: "หมวดหมู่",
    en: "Category"
  },
  "addSub.selectCategory": {
    th: "เลือกหมวดหมู่",
    en: "Select category"
  },
  "addSub.website": {
    th: "เว็บไซต์",
    en: "Website"
  },
  "addSub.websitePlaceholder": {
    th: "https://example.com",
    en: "https://example.com"
  },
  "addSub.cost": {
    th: "จำนวนเงิน",
    en: "Amount"
  },
  "addSub.costPlaceholder": {
    th: "0.00",
    en: "0.00"
  },
  "addSub.currency": {
    th: "สกุลเงิน",
    en: "Currency"
  },
  "addSub.selectCurrency": {
    th: "เลือกสกุลเงิน",
    en: "Select currency"
  },
  "addSub.billing": {
    th: "รอบการชำระเงิน",
    en: "Billing Cycle"
  },
  "addSub.selectBilling": {
    th: "เลือกรอบการชำระเงิน",
    en: "Select billing cycle"
  },
  "addSub.billingMonthly": {
    th: "รายเดือน",
    en: "Monthly"
  },
  "addSub.billingYearly": {
    th: "รายปี",
    en: "Yearly"
  },
  "addSub.startDate": {
    th: "วันที่เริ่มต้น",
    en: "Start Date"
  },
  "addSub.nextBillingDate": {
    th: "วันต่ออายุถัดไป",
    en: "Next Billing Date"
  },
  "addSub.paymentMethod": {
    th: "วิธีชำระเงิน",
    en: "Payment Method"
  },
  "addSub.selectPayment": {
    th: "เลือกวิธีชำระเงิน",
    en: "Select payment method"
  },
  "addSub.cardNumber": {
    th: "เลขบัตร 4 หลักท้าย",
    en: "Card Last 4 Digits"
  },
  "addSub.cardPlaceholder": {
    th: "1234",
    en: "1234"
  },
  "addSub.sharedUsers": {
    th: "แบ่งปันกับ",
    en: "Shared With"
  },
  "addSub.sharedUsersPlaceholder": {
    th: "อีเมลของผู้ใช้ (แยกด้วยเครื่องหมายจุลภาค)",
    en: "User emails (comma-separated)"
  },
  "addSub.emailInUse": {
    th: "อีเมลนี้มีอยู่ในรายการแล้ว",
    en: "This email is already in the list"
  },
  "addSub.notes": {
    th: "หมายเหตุ",
    en: "Notes"
  },
  "addSub.notesPlaceholder": {
    th: "บันทึกเพิ่มเติม...",
    en: "Additional notes..."
  },
  "addSub.submit": {
    th: "เพิ่ม Subscription",
    en: "Add Subscription"
  },
  "addSub.submitting": {
    th: "กำลังเพิ่ม...",
    en: "Adding..."
  },
  "addSub.success": {
    th: "เพิ่ม Subscription สำเร็จ!",
    en: "Subscription added successfully!"
  },
  "addSub.error": {
    th: "เกิดข้อผิดพลาด",
    en: "Error occurred"
  },
  "addSub.popularTemplates": {
    th: "เทมเพลตยอดนิยม",
    en: "Popular Templates"
  },
  "addSub.browseAll": {
    th: "ดูทั้งหมด",
    en: "Browse all"
  },
  "addSub.quickAdd": {
    th: "เพิ่มด่วนจากบริการยอดนิยม",
    en: "Quick Add from Popular Services"
  },
  "addSub.selectService": {
    th: "เลือกบริการ",
    en: "Select a Service"
  },
  "addSub.templateSelected": {
    th: "เลือกบริการสำเร็จ!",
    en: "Service selected!"
  },
  "addSub.templateSelectedDesc": {
    th: "กรอกข้อมูลอัตโนมัติแล้ว",
    en: "Auto-filled"
  },
  "addSub.basicInfo": {
    th: "ข้อมูลบริการและราคา",
    en: "Subscription Information"
  },
  "addSub.pricingInfo": {
    th: "ข้อมูลราคา",
    en: "Pricing Information"
  },
  "addSub.paymentInfo": {
    th: "การเรียกเก็บเงิน",
    en: "Billing & Payment"
  },
  "addSub.additionalInfo": {
    th: "ข้อมูลเพิ่มเติม",
    en: "Additional Information"
  },
  "addSub.usageFrequency": {
    th: "ความถี่ในการใช้งาน",
    en: "Usage Frequency"
  },
  "addSub.often": {
    th: "ใช้บ่อย (ทุกวัน)",
    en: "Often (Daily)"
  },
  "addSub.sometimes": {
    th: "ใช้บางครั้ง (สัปดาห์ละครั้ง)",
    en: "Sometimes (Weekly)"
  },
  "addSub.rarely": {
    th: "ใช้นานๆ ครั้ง (เดือนละครั้ง)",
    en: "Rarely (Monthly)"
  },
  "addSub.summary": {
    th: "สรุปค่าใช้จ่าย",
    en: "Cost Summary"
  },
  "addSub.subscription": {
    th: "บริการ",
    en: "Subscription"
  },
  "addSub.monthlyCost": {
    th: "ค่าใช้จ่ายต่อเดือน",
    en: "Monthly Cost"
  },
  "addSub.yearlyCost": {
    th: "ค่าใช้จ่ายต่อปี",
    en: "Yearly Cost"
  },
  "addSub.billedYearly": {
    th: "เรียกเก็บรายปี",
    en: "Billed Yearly"
  },
  "addSub.calculatedYearly": {
    th: "คำนวณจากรายเดือน",
    en: "Calculated Yearly"
  },
  "addSub.highCostWarning": {
    th: "ค่าใช้จ่ายสูงกว่าปกติ",
    en: "High Cost Warning"
  },
  "addSub.highCostDesc": {
    th: "รายการนี้มีค่าใช้จ่ายสูงกว่าค่าเฉลี่ยรายเดือนของคุณ",
    en: "This item has a higher cost than your average monthly expense."
  },
  "addSub.autoSelected": {
    th: "เลือกอัตโนมัติจาก Template",
    en: "Auto-selected from Template"
  },
  "addSub.nextBilling": {
    th: "วันเรียกเก็บเงินถัดไป",
    en: "Next Billing Date"
  },
  "addSub.autoCalculated": {
    th: "คำนวณอัตโนมัติจากรอบบิล",
    en: "Auto-calculated from Invoice"
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
  "addSub.quickToggles": {
    th: "ตั้งค่าด่วน",
    en: "Quick Settings"
  },
  "addSub.remind3Days": {
    th: "เตือนก่อน 3 วัน",
    en: "Remind 3 days before"
  },
  "addSub.remind7Days": {
    th: "เตือนก่อน 7 วัน",
    en: "Remind 7 days before"
  },
  "addSub.optionalContext": {
    th: "บริบท (ไม่บังคับ)",
    en: "Context (Optional)"
  },
  "addSub.costSummary": {
    th: "สรุปค่าใช้จ่าย",
    en: "Cost Summary"
  },
  "addSub.yearlyBillingInfo": {
    th: "ข้อมูลการชำระรายปี",
    en: "Yearly Billing Info"
  },
  "addSub.monthlyBillingInfo": {
    th: "ข้อมูลการชำระรายเดือน",
    en: "Monthly Billing Info"
  },
  "addSub.remindersEnabled": {
    th: "เปิดการแจ้งเตือนแล้ว",
    en: "Reminders enabled"
  },
  "addSub.beforeBilling": {
    th: "ก่อนวันชำระเงิน",
    en: "before billing date"
  },
  "subscription.monthly_cost": {
    th: "ค่าใช้จ่ายรายเดือน",
    en: "Monthly Cost"
  },
  "subscription.yearly_cost": {
    th: "ค่าใช้จ่ายรายปี",
    en: "Yearly Cost"
  },
  "subscription.add_success": {
    th: "เพิ่มรายการสมัครสมาชิกเรียบร้อยแล้ว",
    en: "Subscription added successfully"
  },
  "subscription.update_success": {
    th: "อัปเดตรายการสมัครสมาชิกเรียบร้อยแล้ว",
    en: "Subscription updated successfully"
  },
  "subscription.payment_method": {
    th: "วิธีการชำระเงิน",
    en: "Payment Method"
  },

  // Edit Subscription Page
  "editSub.title": {
    th: "แก้ไข Subscription",
    en: "Edit Subscription"
  },
  "editSub.submit": {
    th: "บันทึกการแก้ไข",
    en: "Save Changes"
  },
  "editSub.submitting": {
    th: "กำลังบันทึก...",
    en: "Saving..."
  },
  "editSub.success": {
    th: "บันทึกการแก้ไขสำเร็จ!",
    en: "Changes saved successfully!"
  },
  "editSub.loading": {
    th: "กำลังโหลดข้อมูล...",
    en: "Loading..."
  },
  "editSub.notFound": {
    th: "ไม่พบ Subscription",
    en: "Subscription not found"
  },
  "editSub.loadError": {
    th: "ไม่สามารถโหลดข้อมูลได้",
    en: "Failed to load subscription data"
  },
  "editSub.updateError": {
    th: "ไม่สามารถอัปเดตข้อมูลได้",
    en: "Failed to update subscription"
  },

  // Profile Page
  "profile.title": {
    th: "ตั้งค่าโปรไฟล์",
    en: "Profile"
  },
  "profile.personalInfo": {
    th: "ข้อมูลส่วนตัว",
    en: "Personal Information"
  },
  "profile.fullName": {
    th: "ชื่อ-นามสกุล",
    en: "Full Name"
  },
  "profile.email": {
    th: "อีเมล",
    en: "Email"
  },
  "profile.preferences": {
    th: "การตั้งค่า",
    en: "Preferences"
  },
  "profile.preferredCurrency": {
    th: "สกุลเงินหลัก",
    en: "Preferred Currency"
  },
  "profile.notifications": {
    th: "การแจ้งเตือน",
    en: "Notifications"
  },
  "profile.emailNotifications": {
    th: "แจ้งเตือนทางอีเมล",
    en: "Email Notifications"
  },
  "profile.reminderDays": {
    th: "แจ้งเตือนก่อนวันต่ออายุ",
    en: "Reminder Before Renewal"
  },
  "profile.days": {
    th: "วัน",
    en: "days"
  },
  "profile.saveChanges": {
    th: "บันทึกการเปลี่ยนแปลง",
    en: "Save Changes"
  },
  "profile.saving": {
    th: "กำลังบันทึก...",
    en: "Saving..."
  },
  "profile.success": {
    th: "บันทึกการเปลี่ยนแปลงสำเร็จ!",
    en: "Changes saved successfully!"
  },
  "profile.error": {
    th: "เกิดข้อผิดพลาดในการบันทึก",
    en: "Error saving changes"
  },
  "profile.myProfile": {
    th: "โปรไฟล์ของฉัน",
    en: "My Profile"
  },
  "profile.manageAccount": {
    th: "จัดการข้อมูลส่วนตัวและการตั้งค่า",
    en: "Manage your personal information and settings"
  },
  "profile.usageStats": {
    th: "สถิติการใช้งาน",
    en: "Usage Statistics"
  },
  "profile.totalSubs": {
    th: "Subscriptions ทั้งหมด",
    en: "Total Subscriptions"
  },
  "profile.activeSubs": {
    th: "กำลังใช้งาน",
    en: "Active Subscriptions"
  },
  "profile.monthlyCost": {
    th: "ค่าใช้จ่ายรายเดือน",
    en: "Monthly Cost"
  },
  "profile.yearlyCost": {
    th: "ค่าใช้จ่ายรายปี",
    en: "Yearly Cost"
  },
  "profile.updateInfo": {
    th: "อัปเดตข้อมูลโปรไฟล์ของคุณ",
    en: "Update your profile information"
  },
  "profile.avatarUrl": {
    th: "URL รูปโปรไฟล์",
    en: "Avatar URL"
  },
  "profile.avatarUploadDesc": {
    th: "หรือคลิกที่รูปด้านซ้ายเพื่ออัปโหลดรูปใหม่",
    en: "Or click the avatar on the left to upload a new one"
  },
  "profile.security": {
    th: "ความปลอดภัย",
    en: "Security"
  },
  "profile.changePasswordDesc": {
    th: "เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชี",
    en: "Change your password to secure your account"
  },
  "profile.currencySettings": {
    th: "การตั้งค่าสกุลเงิน",
    en: "Currency Settings"
  },
  "profile.selectCurrencyDesc": {
    th: "เลือกสกุลเงินที่ต้องการแสดงในระบบ",
    en: "Select the currency you want to display"
  },
  "profile.displayCurrency": {
    th: "สกุลเงินที่แสดง",
    en: "Display Currency"
  },
  "profile.currencyAutoConvert": {
    th: "ระบบจะแปลงค่าเงินทั้งหมดเป็นสกุลที่คุณเลือกโดยอัตโนมัติ",
    en: "System will automatically convert all amounts to your selected currency"
  },
  "profile.currentCurrency": {
    th: "สกุลเงินปัจจุบัน",
    en: "Current Currency"
  },
  "profile.dangerZone": {
    th: "Danger Zone",
    en: "Danger Zone"
  },
  "profile.irreversibleAction": {
    th: "การดำเนินการเหล่านี้ไม่สามารถย้อนกลับได้",
    en: "This action cannot be undone"
  },
  "profile.deleteAccount": {
    th: "ลบบัญชีถาวร",
    en: "Delete Account Permanently"
  },
  "profile.deleteConfirmTitle": {
    th: "คุณแน่ใจหรือไม่?",
    en: "Are you sure?"
  },
  "profile.deleteConfirmDesc": {
    th: "การลบบัญชีจะทำให้ข้อมูลทั้งหมดของคุณถูกลบอย่างถาวร รวมถึง:",
    en: "Deleting your account will permanently remove all your data, including:"
  },
  "profile.deleteHistory": {
    th: "ประวัติการใช้งาน",
    en: "Usage history"
  },
  "profile.cannotUndo": {
    th: "การกระทำนี้ไม่สามารถยกเลิกได้",
    en: "This action cannot be undone"
  },
  "profile.confirmDelete": {
    th: "ยืนยันการลบบัญชี",
    en: "Confirm Account Deletion"
  },
  "profile.memberSince": {
    th: "สมาชิกตั้งแต่",
    en: "Member since"
  },
  "profile.fileTooLarge": {
    th: "ไฟล์ใหญ่เกินไป",
    en: "File too large"
  },
  "profile.fileTooLargeDesc": {
    th: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 2MB",
    en: "Please select a file smaller than 2MB"
  },
  "profile.invalidFileType": {
    th: "ไฟล์ไม่ถูกต้อง",
    en: "Invalid file type"
  },
  "profile.invalidFileTypeDesc": {
    th: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
    en: "Please select an image file only"
  },
  "profile.avatarUploaded": {
    th: "อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว",
    en: "Avatar uploaded successfully"
  },
  "profile.passwordMismatch": {
    th: "รหัสผ่านไม่ตรงกัน",
    en: "Passwords do not match"
  },
  "profile.passwordMismatchDesc": {
    th: "กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง",
    en: "Please enter matching passwords in both fields"
  },
  "profile.passwordTooShort": {
    th: "รหัสผ่านสั้นเกินไป",
    en: "Password too short"
  },
  "profile.passwordTooShortDesc": {
    th: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    en: "Password must be at least 6 characters long"
  },
  "profile.currencyUpdated": {
    th: "เปลี่ยนสกุลเงินเรียบร้อยแล้ว",
    en: "Currency updated successfully"
  },
  "profile.accountDeleted": {
    th: "ลบบัญชีสำเร็จ",
    en: "Account deleted"
  },
  "profile.thankYou": {
    th: "ขอบคุณที่ใช้บริการ",
    en: "Thank you for using our service"
  },
  "profile.noName": {
    th: "ไม่ระบุชื่อ",
    en: "No Name"
  },
  "profile.country": {
    th: "ประเทศ",
    en: "Country"
  },
  "profile.logout": {
    th: "ออกจากระบบ",
    en: "Logout"
  },
  "profile.logoutDesc": {
    th: "ออกจากระบบบนอุปกรณ์นี้",
    en: "Sign out from your account on this device"
  },

  // Notifications Page
  "notif.title": {
    th: "การแจ้งเตือน",
    en: "Notifications"
  },
  "notif.markAllRead": {
    th: "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว",
    en: "Mark all as read"
  },
  "notif.empty": {
    th: "ไม่มีการแจ้งเตือน",
    en: "No notifications"
  },
  "notif.emptyDesc": {
    th: "คุณไม่มีการแจ้งเตือนใดๆ ในขณะนี้",
    en: "You don't have any notifications at the moment"
  },
  "notif.unread": {
    th: "ยังไม่ได้อ่าน",
    en: "Unread"
  },
  "notif.markRead": {
    th: "ทำเครื่องหมายว่าอ่านแล้ว",
    en: "Mark as read"
  },
  "notif.delete": {
    th: "ลบ",
    en: "Delete"
  },
  "notif.markedAllRead": {
    th: "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว!",
    en: "All notifications marked as read!"
  },
  "notif.deleted": {
    th: "ลบการแจ้งเตือนแล้ว",
    en: "Notification deleted"
  },
  "notif.backToHome": {
    th: "กลับไปหน้าหลัก",
    en: "Back to Home"
  },
  "notif.pageTitle": {
    th: "การตั้งค่าการแจ้งเตือน",
    en: "Notification Settings"
  },
  "notif.pageDesc": {
    th: "จัดการการแจ้งเตือนและดูประวัติการแจ้งเตือนทั้งหมด",
    en: "Manage notifications and view history"
  },
  "notif.new": {
    th: "ใหม่",
    en: "New"
  },
  "notif.history": {
    th: "ประวัติ",
    en: "History"
  },
  "notif.emailDesc": {
    th: "รับการแจ้งเตือนผ่านอีเมลของคุณ",
    en: "Receive notifications via email"
  },
  "notif.enableEmail": {
    th: "เปิดใช้งานการแจ้งเตือนทางอีเมล",
    en: "Enable email notifications"
  },
  "notif.beforeDue": {
    th: "แจ้งเตือนก่อนครบกำหนดชำระ:",
    en: "Remind before due date:"
  },
  "notif.7days": {
    th: "7 วันก่อนครบกำหนด",
    en: "7 days before due"
  },
  "notif.3days": {
    th: "3 วันก่อนครบกำหนด",
    en: "3 days before due"
  },
  "notif.1day": {
    th: "1 วันก่อนครบกำหนด",
    en: "1 day before due"
  },
  "notif.onDueDate": {
    th: "วันครบกำหนด",
    en: "On due date"
  },
  "notif.otherNotifs": {
    th: "การแจ้งเตือนอื่นๆ:",
    en: "Other notifications:"
  },
  "notif.monthlySummary": {
    th: "สรุปรายเดือน",
    en: "Monthly summary"
  },
  "notif.priceChanges": {
    th: "การเปลี่ยนแปลงราคา",
    en: "Price changes"
  },
  "notif.pushDesc": {
    th: "รับการแจ้งเตือนบนเบราว์เซอร์แบบ Real-time",
    en: "Receive real-time browser notifications"
  },
  "notif.pushUnsupported": {
    th: "เบราว์เซอร์ของคุณไม่รองรับ Push Notifications",
    en: "Your browser does not support Push Notifications"
  },
  "notif.pushDenied": {
    th: "คุณได้ปิดการอนุญาต Push Notifications",
    en: "You have denied Push Notifications"
  },
  "notif.pushDeniedDesc": {
    th: "กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์",
    en: "Please enable in browser settings"
  },
  "notif.enablePush": {
    th: "เปิดใช้งาน Push Notifications",
    en: "Enable Push Notifications"
  },
  "notif.pushGranted": {
    th: "ได้รับอนุญาตแล้ว",
    en: "Permission granted"
  },
  "notif.enable": {
    th: "เปิดใช้งาน",
    en: "Enable"
  },
  "notif.preferences": {
    th: "ความชอบการแจ้งเตือน",
    en: "Notification Preferences"
  },
  "notif.preferencesDesc": {
    th: "ตั้งค่าเวลาและช่วงเวลาการแจ้งเตือน",
    en: "Set notification time and quiet hours"
  },
  "notif.time": {
    th: "เวลาที่ต้องการรับการแจ้งเตือน",
    en: "Preferred notification time"
  },
  "notif.timeDesc": {
    th: "การแจ้งเตือนจะถูกส่งในช่วงเวลาที่กำหนด",
    en: "Notifications will be sent at this time"
  },
  "notif.quietHours": {
    th: "Quiet Hours (ช่วงเวลาไม่รับการแจ้งเตือน)",
    en: "Quiet Hours (Do not disturb)"
  },
  "notif.start": {
    th: "เริ่ม",
    en: "Start"
  },
  "notif.end": {
    th: "สิ้นสุด",
    en: "End"
  },
  "notif.quietHoursDesc": {
    th: "ในช่วงเวลานี้จะไม่มีการแจ้งเตือน (ถ้าไม่ระบุจะรับการแจ้งเตือนตลอด 24 ชม.)",
    en: "No notifications during these hours (leave blank for 24/7 notifications)"
  },
  "notif.timezone": {
    th: "Timezone",
    en: "Timezone"
  },
  "notif.timezoneDesc": {
    th: "Timezone จะถูกตั้งค่าอัตโนมัติตามเบราว์เซอร์ของคุณ",
    en: "Timezone is automatically set based on your browser"
  },
  "notif.historyTitle": {
    th: "ประวัติการแจ้งเตือน",
    en: "Notification History"
  },
  "notif.showing": {
    th: "แสดง",
    en: "Showing"
  },
  "notif.recent": {
    th: "รายการล่าสุด",
    en: "recent items"
  },
  "notif.saved": {
    th: "บันทึกสำเร็จ",
    en: "Saved successfully"
  },
  "notif.settingsSaved": {
    th: "การตั้งค่าถูกบันทึกเรียบร้อยแล้ว",
    en: "Settings saved successfully"
  },
  "notif.pushEnabled": {
    th: "เปิดใช้งาน Push Notifications",
    en: "Push Notifications Enabled"
  },
  "notif.pushEnabledDesc": {
    th: "คุณจะได้รับการแจ้งเตือนบนเบราว์เซอร์",
    en: "You will receive notifications on your browser"
  },
  "notif.pushError": {
    th: "ไม่สามารถเปิดใช้งานได้",
    en: "Failed to enable"
  },
  "notif.email": {
    th: "Email",
    en: "Email"
  },
  "notif.push": {
    th: "Push",
    en: "Push"
  },
  "notif.inApp": {
    th: "In-App",
    en: "In-App"
  },

  // Auth Pages
  "auth.login": {
    th: "เข้าสู่ระบบ",
    en: "Login"
  },
  "auth.signup": {
    th: "สมัครสมาชิก",
    en: "Sign Up"
  },
  "auth.email": {
    th: "อีเมล",
    en: "Email"
  },
  "auth.password": {
    th: "รหัสผ่าน",
    en: "Password"
  },
  "auth.confirmPassword": {
    th: "ยืนยันรหัสผ่าน",
    en: "Confirm Password"
  },
  "auth.fullName": {
    th: "ชื่อ-นามสกุล",
    en: "Full Name"
  },
  "auth.forgotPassword": {
    th: "ลืมรหัสผ่าน?",
    en: "Forgot password?"
  },
  "auth.noAccount": {
    th: "ยังไม่มีบัญชี?",
    en: "Don't have an account?"
  },
  "auth.hasAccount": {
    th: "มีบัญชีอยู่แล้ว?",
    en: "Already have an account?"
  },
  "auth.resetPassword": {
    th: "ตั้งรหัสผ่านใหม่",
    en: "Reset Password"
  },
  "auth.sendResetLink": {
    th: "ส่งลิงก์รีเซ็ตรหัสผ่าน",
    en: "Send Reset Link"
  },
  "auth.backToLogin": {
    th: "กลับไปหน้าเข้าสู่ระบบ",
    en: "Back to login"
  },
  "auth.emailPlaceholder": {
    th: "อีเมลของคุณ",
    en: "Your email"
  },
  "auth.passwordPlaceholder": {
    th: "รหัสผ่าน",
    en: "Password"
  },
  "auth.fullNamePlaceholder": {
    th: "ชื่อ-นามสกุล",
    en: "Full Name"
  },
  "auth.loggingIn": {
    th: "กำลังเข้าสู่ระบบ...",
    en: "Logging in..."
  },
  "auth.signingUp": {
    th: "กำลังสมัครสมาชิก...",
    en: "Signing up..."
  },
  "auth.loginSuccess": {
    th: "เข้าสู่ระบบสำเร็จ!",
    en: "Login successful!"
  },
  "auth.signupSuccess": {
    th: "สมัครสมาชิกสำเร็จ!",
    en: "Sign up successful!"
  },
  "auth.loginError": {
    th: "เข้าสู่ระบบไม่สำเร็จ",
    en: "Login failed"
  },
  "auth.signupError": {
    th: "สมัครสมาชิกไม่สำเร็จ",
    en: "Sign up failed"
  },
  "auth.invalidCredentials": {
    th: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    en: "Invalid email or password"
  },
  "auth.emailInUse": {
    th: "อีเมลนี้ถูกใช้งานแล้ว",
    en: "Email already in use"
  },
  "auth.weakPassword": {
    th: "รหัสผ่านไม่ปลอดภัยเพียงพอ",
    en: "Password is too weak"
  },
  "auth.passwordMismatch": {
    th: "รหัสผ่านไม่ตรงกัน",
    en: "Passwords do not match"
  },
  "auth.resetEmailSent": {
    th: "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว",
    en: "Password reset email sent"
  },
  "auth.resetSuccess": {
    th: "รีเซ็ตรหัสผ่านสำเร็จ!",
    en: "Password reset successful!"
  },
  "auth.checkEmail": {
    th: "ตรวจสอบอีเมลของคุณ",
    en: "Check your email"
  },
  "auth.resetLinkSent": {
    th: "เราได้ส่งลิงก์รีเซ็ตไปยัง",
    en: "We've sent a password reset link to"
  },
  "auth.checkSpam": {
    th: "กรุณาตรวจสอบโฟลเดอร์ Spam ด้วย",
    en: "Please check your spam folder"
  },
  "auth.newPassword": {
    th: "รหัสผ่านใหม่",
    en: "New Password"
  },
  "auth.confirmNewPassword": {
    th: "ยืนยันรหัสผ่านใหม่",
    en: "Confirm New Password"
  },
  "auth.changePassword": {
    th: "เปลี่ยนรหัสผ่าน",
    en: "Change Password"
  },
  "auth.changingPassword": {
    th: "กำลังเปลี่ยนรหัสผ่าน...",
    en: "Changing password..."
  },
  "auth.passwordChanged": {
    th: "เปลี่ยนรหัสผ่านสำเร็จ!",
    en: "Password changed successfully!"
  },
  "auth.redirecting": {
    th: "กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...",
    en: "Redirecting to login..."
  },
  "auth.invalidToken": {
    th: "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว",
    en: "Invalid or expired link"
  },
  "auth.passwordStrength": {
    th: "ความแข็งแกร่งของรหัสผ่าน",
    en: "Password Strength"
  },
  "auth.weak": {
    th: "อ่อนแอ",
    en: "Weak"
  },
  "auth.medium": {
    th: "ปานกลาง",
    en: "Medium"
  },
  "auth.strong": {
    th: "แข็งแกร่ง",
    en: "Strong"
  },
  "auth.passwordsMatch": {
    th: "รหัสผ่านตรงกัน",
    en: "Passwords match"
  },
  "auth.passwordsDoNotMatch": {
    th: "รหัสผ่านไม่ตรงกัน",
    en: "Passwords do not match"
  },
  "auth.forgotPasswordDesc": {
    th: "ใส่อีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน",
    en: "Enter your email to receive a password reset link"
  },
  "auth.sendingEmail": {
    th: "กำลังส่งอีเมล...",
    en: "Sending email..."
  },
  "auth.emailSent": {
    th: "ส่งอีเมลสำเร็จ!",
    en: "Email Sent!"
  },
  "auth.checkEmailDesc": {
    th: "กรุณาตรวจสอบอีเมลเพื่อรีเซ็ตรหัสผ่าน",
    en: "Please check your email to reset password"
  },
  "auth.sendEmailError": {
    th: "ส่งอีเมลไม่สำเร็จ",
    en: "Failed to send email"
  },
  "auth.linkSentTo": {
    th: "เราได้ส่งลิงก์รีเซ็ตไปยัง",
    en: "We sent a password reset link to"
  },
  "auth.checkSpamFolder": {
    th: "ไม่เห็นอีเมล? ตรวจสอบในโฟลเดอร์ Spam",
    en: "Don't see the email? Check your Spam folder"
  },
  "auth.rememberPassword": {
    th: "จำรหัสผ่านได้แล้ว?",
    en: "Remember your password?"
  },
  "auth.enterNewPassword": {
    th: "กรุณากรอกรหัสผ่านใหม่ของคุณ",
    en: "Please enter your new password"
  },
  "auth.passwordChangedDesc": {
    th: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว",
    en: "Your password has been changed successfully"
  },
  "auth.redirectingLogin": {
    th: "กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...",
    en: "Redirecting to login..."
  },
  "auth.weakPasswordDesc": {
    th: "รหัสผ่านไม่ปลอดภัยเพียงพอ กรุณาใช้รหัสผ่านที่แข็งแกร่งกว่านี้",
    en: "Password is too weak. Please use a stronger password."
  },
  "auth.passwordMatch": {
    th: "รหัสผ่านตรงกัน",
    en: "Passwords match"
  },
  "auth.passwordMismatchDesc": {
    th: "รหัสผ่านไม่ตรงกัน",
    en: "Passwords do not match"
  },
  "auth.passwordRequirements": {
    th: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และควรประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ",
    en: "Password must be at least 8 characters long and should contain uppercase, lowercase, numbers, and special characters"
  },
  "auth.strength.weak": {
    th: "รหัสผ่านอย่างอ่อน",
    en: "Weak password"
  },
  "auth.strength.medium": {
    th: "รหัสผ่านปานกลาง",
    en: "Medium password"
  },
  "auth.strength.strong": {
    th: "รหัสผ่านแข็งแกร่ง",
    en: "Strong password"
  },
  "auth.invalidLink": {
    th: "ลิงก์ไม่ถูกต้องหรือหมดอายุ",
    en: "Invalid or expired link"
  },
  "auth.requestNewLink": {
    th: "กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่",
    en: "Please request a new password reset link"
  },
  "auth.changePasswordError": {
    th: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
    en: "Error changing password"
  },
  "auth.changePasswordFailed": {
    th: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
    en: "Failed to change password"
  },

  // Categories
  "category.streaming": {
    th: "Streaming",
    en: "Streaming"
  },
  "category.music": {
    th: "Music",
    en: "Music"
  },
  "category.productivity": {
    th: "Productivity",
    en: "Productivity"
  },
  "category.cloud-storage": {
    th: "Cloud Storage",
    en: "Cloud Storage"
  },
  "category.development": {
    th: "Development",
    en: "Development"
  },
  "category.design": {
    th: "Design",
    en: "Design"
  },
  "category.gaming": {
    th: "Gaming",
    en: "Gaming"
  },
  "category.education": {
    th: "Education",
    en: "Education"
  },
  "category.fitness": {
    th: "Fitness",
    en: "Fitness"
  },
  "category.news": {
    th: "News",
    en: "News"
  },
  "category.entertainment": {
    th: "Entertainment",
    en: "Entertainment"
  },
  "category.other": {
    th: "อื่นๆ",
    en: "Other"
  },

  // Payment Methods
  "payment.credit-card": {
    th: "บัตรเครดิต",
    en: "Credit Card"
  },
  "payment.debit-card": {
    th: "บัตรเดบิต",
    en: "Debit Card"
  },
  "payment.paypal": {
    th: "PayPal",
    en: "PayPal"
  },
  "payment.bank-transfer": {
    th: "โอนเงินผ่านธนาคาร",
    en: "Bank Transfer"
  },
  "payment.google-pay": {
    th: "Google Pay",
    en: "Google Pay"
  },
  "payment.apple-pay": {
    th: "Apple Pay",
    en: "Apple Pay"
  },
  "payment.crypto": {
    th: "สกุลเงินดิจิทัล",
    en: "Cryptocurrency"
  },
  "payment.other": {
    th: "อื่นๆ",
    en: "Other"
  },
  "payment.select_method": {
    th: "เลือกวิธีการชำระเงิน",
    en: "Select payment method"
  },

  // Common
  "common.loading": {
    th: "กำลังโหลด...",
    en: "Loading..."
  },
  "common.error": {
    th: "เกิดข้อผิดพลาด",
    en: "Error occurred"
  },
  "common.error_occurred": {
    th: "เกิดข้อผิดพลาดขึ้น",
    en: "An error occurred"
  },
  "common.success": {
    th: "สำเร็จ",
    en: "Success"
  },
  "common.save": {
    th: "บันทึก",
    en: "Save"
  },
  "common.saving": {
    th: "กำลังบันทึก...",
    en: "Saving..."
  },
  "common.add": {
    th: "เพิ่ม",
    en: "Add"
  },
  "common.cancel": {
    th: "ยกเลิก",
    en: "Cancel"
  },
  "common.delete": {
    th: "ลบ",
    en: "Delete"
  },
  "common.edit": {
    th: "แก้ไข",
    en: "Edit"
  },
  "common.back": {
    th: "ย้อนกลับ",
    en: "Back"
  },
  "common.next": {
    th: "ถัดไป",
    en: "Next"
  },
  "common.previous": {
    th: "ก่อนหน้า",
    en: "Previous"
  },
  "common.search": {
    th: "ค้นหา",
    en: "Search"
  },
  "common.filter": {
    th: "กรอง",
    en: "Filter"
  },
  "common.all": {
    th: "ทั้งหมด",
    en: "All"
  },
  "common.view": {
    th: "ดู",
    en: "View"
  },
  "common.close": {
    th: "ปิด",
    en: "Close"
  },
  "common.select": {
    th: "เลือก",
    en: "Select"
  },
  "common.confirm": {
    th: "ยืนยัน",
    en: "Confirm"
  },
  "common.yes": {
    th: "ใช่",
    en: "Yes"
  },
  "common.no": {
    th: "ไม่",
    en: "No"
  },
  "common.optional": {
    th: "(ไม่จำเป็น)",
    en: "(Optional)"
  },
  "common.required": {
    th: "(จำเป็น)",
    en: "(Required)"
  },
  "common.or": {
    th: "หรือ",
    en: "or"
  },
  "common.unknown": {
    th: "ไม่ระบุ",
    en: "Unknown"
  },
  "common.recommended": {
    th: "แนะนำ",
    en: "Recommended"
  },
  "common.step": {
    th: "ขั้นตอน",
    en: "Step"
  },
  "common.of": {
    th: "จาก",
    en: "of"
  },
  "common.continue": {
    th: "ถัดไป",
    en: "Continue"
  },
  "common.days": {
    th: "วัน",
    en: "days"
  },
  "common.no_results": {
    th: "ไม่พบผลลัพธ์",
    en: "No results found"
  },
  "common.billingCycle.monthly": {
    th: "รายเดือน",
    en: "Monthly"
  },
  "common.billingCycle.yearly": {
    th: "รายปี",
    en: "Yearly"
  },
  "common.billingCycle.quarterly": {
    th: "รายไตรมาส",
    en: "Quarterly"
  },
  "common.billingCycle.half-yearly": {
    th: "ราย 6 เดือน",
    en: "Half-yearly"
  },

  // Notifications & Reminders
  "notifications.reminders": {
    th: "การแจ้งเตือน",
    en: "Reminders"
  },
  "notifications.remind_3_days": {
    th: "แจ้งเตือนก่อน 3 วัน",
    en: "Remind 3 days before"
  },
  "notifications.remind_7_days": {
    th: "แจ้งเตือนก่อน 7 วัน",
    en: "Remind 7 days before"
  },

  // Validation Messages
  "validation.required": {
    th: "กรุณากรอกข้อมูล",
    en: "This field is required"
  },
  "validation.invalidEmail": {
    th: "รูปแบบอีเมลไม่ถูกต้อง",
    en: "Invalid email format"
  },
  "validation.invalidUrl": {
    th: "รูปแบบ URL ไม่ถูกต้อง",
    en: "Invalid URL format"
  },
  "validation.minLength": {
    th: "ต้องมีอย่างน้อย",
    en: "Must be at least"
  },
  "validation.maxLength": {
    th: "ต้องไม่เกิน",
    en: "Must not exceed"
  },
  "validation.characters": {
    th: "ตัวอักษร",
    en: "characters"
  },
  "validation.positiveNumber": {
    th: "ต้องเป็นตัวเลขที่มากกว่า 0",
    en: "Must be a positive number"
  },
  "validation.invalidDate": {
    th: "วันที่ไม่ถูกต้อง",
    en: "Invalid date"
  },

  // Toast Messages
  "toast.deleteSuccess": {
    th: "ลบสำเร็จ!",
    en: "Deleted successfully!"
  },
  "toast.deleteError": {
    th: "ลบไม่สำเร็จ",
    en: "Failed to delete"
  },
  "toast.deleted": {
    th: "ลบรายการเรียบร้อยแล้ว",
    en: "Item deleted successfully"
  },
  "toast.updateSuccess": {
    th: "อัปเดตสำเร็จ!",
    en: "Updated successfully!"
  },
  "toast.updateError": {
    th: "อัปเดตไม่สำเร็จ",
    en: "Failed to update"
  },
  "toast.createSuccess": {
    th: "สร้างสำเร็จ!",
    en: "Created successfully!"
  },
  "toast.createError": {
    th: "สร้างไม่สำเร็จ",
    en: "Failed to create"
  },
  "toast.loadError": {
    th: "โหลดข้อมูลไม่สำเร็จ",
    en: "Failed to load data"
  },
  "toast.errorLoading": {
    th: "ไม่สามารถโหลดข้อมูลได้",
    en: "Failed to load data"
  },
  "toast.errorLoadingDesc": {
    th: "กรุณาลองใหม่อีกครั้งในภายหลัง",
    en: "Please try again later"
  },
  "toast.networkError": {
    th: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
    en: "Network error occurred"
  },
  "toast.unknownError": {
    th: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
    en: "An unknown error occurred"
  },
  "toast.logoutSuccess": {
    th: "ออกจากระบบสำเร็จ",
    en: "Logged out successfully"
  },
  "toast.logoutError": {
    th: "ไม่สามารถออกจากระบบได้",
    en: "Failed to logout"
  },
  "toast.accountDeleted": {
    th: "ลบบัญชีสำเร็จ",
    en: "Account deleted"
  },
  "toast.accountDeletedDesc": {
    th: "บัญชีของคุณถูกลบอย่างถาวร",
    en: "Your account has been permanently deleted"
  },
  "toast.accountDeleteError": {
    th: "ไม่สามารถลบบัญชีได้",
    en: "Failed to delete account"
  },

  // Date & Time
  "time.today": {
    th: "วันนี้",
    en: "Today"
  },
  "time.tomorrow": {
    th: "พรุ่งนี้",
    en: "Tomorrow"
  },
  "time.yesterday": {
    th: "เมื่อวาน",
    en: "Yesterday"
  },
  "time.daysAgo": {
    th: "วันที่แล้ว",
    en: "days ago"
  },
  "time.hoursAgo": {
    th: "ชั่วโมงที่แล้ว",
    en: "hours ago"
  },
  "time.minutesAgo": {
    th: "นาทีที่แล้ว",
    en: "minutes ago"
  },
  "time.justNow": {
    th: "เมื่อสักครู่",
    en: "Just now"
  },

  // Admin Panel
  "admin.title": {
    th: "แอดมิน",
    en: "Admin Panel"
  },
  "admin.dashboard": {
    th: "แดชบอร์ด",
    en: "Dashboard"
  },
  "admin.users": {
    th: "ผู้ใช้",
    en: "Users"
  },
  "admin.templates": {
    th: "เทมเพลต Subscription",
    en: "Subscription Templates"
  },
  "admin.categories": {
    th: "หมวดหมู่",
    en: "Categories"
  },
  "admin.paymentMethods": {
    th: "วิธีชำระเงิน",
    en: "Payment Methods"
  },
  "admin.addPaymentMethod": {
    th: "เพิ่มวิธีชำระเงิน",
    en: "Add Payment Method"
  },
  "admin.editPaymentMethod": {
    th: "แก้ไขวิธีชำระเงิน",
    en: "Edit Payment Method"
  },
  "admin.paymentMethodName": {
    th: "ชื่อวิธีชำระเงิน",
    en: "Payment Method Name"
  },
  "admin.nameEnglish": {
    th: "ชื่อภาษาอังกฤษ",
    en: "English Name"
  },
  "admin.nameThai": {
    th: "ชื่อภาษาไทย",
    en: "Thai Name"
  },
  "admin.slug": {
    th: "Slug (ไม่ซ้ำ)",
    en: "Slug (Unique)"
  },
  "admin.icon": {
    th: "ไอคอน",
    en: "Icon"
  },
  "admin.color": {
    th: "สี",
    en: "Color"
  },
  "admin.active": {
    th: "ใช้งาน",
    en: "Active"
  },
  "admin.displayOrder": {
    th: "ลำดับการแสดง",
    en: "Display Order"
  },
  "admin.usageCount": {
    th: "จำนวนการใช้งาน",
    en: "Usage Count"
  },
  "admin.actions": {
    th: "จัดการ",
    en: "Actions"
  },
  "admin.statistics": {
    th: "สถิติ",
    en: "Statistics"
  },
  "admin.totalPaymentMethods": {
    th: "วิธีชำระเงินทั้งหมด",
    en: "Total Payment Methods"
  },
  "admin.activePaymentMethods": {
    th: "ใช้งานอยู่",
    en: "Active"
  },
  "admin.mostUsed": {
    th: "ใช้มากที่สุด",
    en: "Most Used"
  },
  "admin.createSuccess": {
    th: "สร้างสำเร็จ!",
    en: "Created successfully!"
  },
  "admin.updateSuccess": {
    th: "อัปเดตสำเร็จ!",
    en: "Updated successfully!"
  },
  "admin.deleteSuccess": {
    th: "ลบสำเร็จ!",
    en: "Deleted successfully!"
  },
  "admin.confirmDeletePaymentMethod": {
    th: "คุณแน่ใจหรือไม่ว่าต้องการลบวิธีชำระเงินนี้?",
    en: "Are you sure you want to delete this payment method?"
  },
  "admin.deleteWarning": {
    th: "การกระทำนี้ไม่สามารถย้อนกลับได้",
    en: "This action cannot be undone"
  },
  "admin.enterTemplateName": {
    th: "ระบุชื่อเทมเพลต",
    en: "Enter template name"
  },
  "admin.websiteUrl": {
    th: "URL เว็บไซต์",
    en: "Website URL"
  },
  "admin.faviconAutomatic": {
    th: "ดึง Favicon อัตโนมัติ",
    en: "Auto-fetch Favicon"
  },
  "admin.category": {
    th: "หมวดหมู่",
    en: "Category"
  },
  "admin.selectCategory": {
    th: "เลือกหมวดหมู่",
    en: "Select Category"
  },
  "admin.currency": {
    th: "สกุลเงิน",
    en: "Currency"
  },
  "admin.billingCycle": {
    th: "รอบการชำระเงิน",
    en: "Billing Cycle"
  },
  "admin.description": {
    th: "คำอธิบาย",
    en: "Description"
  },
  "admin.templates.table.icon": {
    th: "ไอคอน",
    en: "Icon"
  },
  "admin.templates.table.name": {
    th: "ชื่อเทมเพลต",
    en: "Template Name"
  },
  "admin.templates.table.website": {
    th: "เว็บไซต์",
    en: "Website URL"
  },
  "admin.templates.table.category": {
    th: "หมวดหมู่",
    en: "Category"
  },
  "admin.templates.table.amount": {
    th: "จำนวนเงิน",
    en: "Amount"
  },
  "admin.templates.table.users": {
    th: "ผู้ใช้",
    en: "Users"
  },
  "admin.templates.table.status": {
    th: "สถานะ",
    en: "Status"
  },
  "admin.templates.table.actions": {
    th: "จัดการ",
    en: "Actions"
  },
  "admin.templates.form.name": {
    th: "ชื่อเทมเพลต",
    en: "Template Name"
  },
  "admin.templates.form.namePlaceholder": {
    th: "เช่น Netflix",
    en: "e.g., Netflix"
  },
  "admin.templates.form.website": {
    th: "URL เว็บไซต์",
    en: "Website URL"
  },
  "admin.templates.form.websitePlaceholder": {
    th: "https://example.com",
    en: "https://example.com"
  },
  "admin.templates.form.category": {
    th: "หมวดหมู่",
    en: "Category"
  },
  "admin.templates.form.categoryPlaceholder": {
    th: "เลือกหมวดหมู่",
    en: "Select category"
  },
  "admin.templates.form.amount": {
    th: "จำนวนเงินเริ่มต้น",
    en: "Default Amount"
  },
  "admin.templates.form.currency": {
    th: "สกุลเงิน",
    en: "Currency"
  },
  "admin.templates.form.billingCycle": {
    th: "รอบการชำระ",
    en: "Billing Cycle"
  },
  "admin.templates.form.description": {
    th: "คำอธิบาย",
    en: "Description"
  },
  "admin.templates.form.descriptionPlaceholder": {
    th: "คำอธิบายเพิ่มเติม (ถ้ามี)",
    en: "Optional description"
  },
  "admin.templates.form.usageCount": {
    th: "จำนวนการใช้งาน",
    en: "Usage Count"
  },
  "admin.templates.form.usageCountHelp": {
    th: "จำนวนครั้งที่ผู้ใช้เลือกเทมเพลตนี้",
    en: "Number of times this template has been selected"
  },
  "admin.templates.form.isActive": {
    th: "เปิดใช้งาน",
    en: "Active"
  },
  "admin.templates.form.isActiveHelp": {
    th: "เฉพาะเทมเพลตที่เปิดใช้งานเท่านั้นที่ผู้ใช้จะเห็น",
    en: "Only active templates are visible to users"
  },
  "admin.templateName": {
    th: "ชื่อเทมเพลต",
    en: "Template Name"
  },
  "admin.enterDescription": {
    th: "กรอกคำอธิบาย",
    en: "Enter description"
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
    en: "of total monthly spending"
  },
  "intelligence.rank": {
    th: "อันดับที่ {rank} จาก {total}",
    en: "Rank {rank} of {total}"
  },
  "intelligence.highYearlyCost": {
    th: "⚠️ บริการนี้มีค่าใช้จ่ายมากกว่า {amount} บาท/ปี",
    en: "⚠️ This subscription costs more than {amount}/year"
  },
  "intelligence.multipleInCategory": {
    th: "🔁 คุณมีบริการในหมวดหมู่นี้แล้ว {count} รายการ",
    en: "🔁 You already have {count} item(s) in this category"
  }
};

export type TranslationKey = keyof typeof translations;

export function getTranslation(key: TranslationKey, language: Language): string {
  return translations[key]?.[language] || key;
}