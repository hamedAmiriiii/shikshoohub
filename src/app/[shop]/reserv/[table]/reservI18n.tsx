"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ReservLocale = "fa" | "en" | "ar";

const STORAGE_KEY = "reserv_ui_locale";

type Dict = Record<string, string>;

const FA: Dict = {
  langFa: "فارسی",
  langEn: "English",
  langAr: "العربية",
  signIn: "ورود",
  signInAria: "ورود با شماره موبایل",
  themeLight: "حالت روشن",
  themeDark: "حالت تیره",
  foodOrdersAria: "سفارش غذا",
  roomServicesAria: "خدمات اتاق",
  pastOrdersAria: "سفارش‌های قبلی",
  menu: "منو",
  services: "خدمات",
  searchMenu: "جستجوی غذا، نوشیدنی و …",
  searchServices: "جستجوی خدمات اتاق…",
  searchMenuAria: "جستجوی منو",
  clearSearch: "پاک کردن جستجو",
  categoriesAria: "دسته‌بندی منو",
  all: "همه",
  category: "دسته",
  shop: "فروشگاه",
  table: "میز",
  room: "اتاق",
  invalidPlace: "{place} نامعتبر است",
  detailsOf: "جزئیات {name}",
  decrease: "کاهش {name}",
  increase: "افزایش {name}",
  addItem: "افزودن {name}",
  toman: "تومان",
  amountToman: "{amount} تومان",
  back: "بازگشت",
  cancelOrderConfirm: "لغو سفارش؟",
  cancelOrderHint: "فقط تا وقتی پرسنل پرداخت را تأیید نکرده باشد می‌توانید لغو کنید.",
  dismiss: "انصراف",
  retry: "تلاش مجدد",
  noSearchResult: "نتیجه‌ای برای «{term}» پیدا نشد.",
  useCreditLabel: "استفاده از اعتبار ({amount} تومان)",
  grandTotal: "جمع کل",
  creditDeduction: "کسر از اعتبار",
  payable: "قابل پرداخت",
  paymentMethodTitle: "روش پرداخت",
  onlineGatewayHint: "درگاه آنلاین فعلاً فعال نیست؛ انتخاب شما ثبت می‌شود و پرسنل بعد از تأیید فاکتور می‌سازند.",
  posHint: "پرداخت را روی کارتخوان فروشگاه انجام دهید تا پرسنل تأیید کنند.",
  noCardNumber: "شماره کارت فروشگاه هنوز در تنظیمات ثبت نشده است.",
  pastOrders: "سفارش‌های قبلی",
  noOrdersForPhone: "سفارشی با این شماره در این فروشگاه نیست",
  creditUsed: "اعتبار مصرف‌شده: {amount} تومان",
  payableLine: "قابل پرداخت: {amount} تومان",
  noItems: "اقلامی ثبت نشده",
  roomServicesTitle: "خدمات اتاق",
  noOpenService: "درخواست بازی برای این اتاق نیست.",
  phoneLoginHint: "با شماره، اعتبار همین فروشگاه و سفارش‌های قبلی را می‌بینید.",
  close: "بستن",
  decreaseShort: "کاهش",
  increaseShort: "افزایش",
  viewCartAria: "مشاهده سبد خرید",
  viewCart: "مشاهده سبد",
  cart: "سبد خرید",
  cartEmpty: "هنوز چیزی اضافه نکرده‌اید. با دکمه + غذا را انتخاب کنید.",
  free: "رایگان",
  request: "درخواست",
  requested: "ثبت شد",
  serviceDefaultDesc: "بدون هزینه — پس از درخواست به اتاقتان ارسال می‌شود.",
  currentRequests: "درخواست‌های جاری",
  pending: "در انتظار",
  cancel: "لغو",
  noServicesYet: "هنوز خدمتی تعریف نشده است.",
  noServiceMatch: "خدمتی برای «{term}» پیدا نشد.",
  serverError: "اتصال به سرور با مشکل مواجه شد.",
  noFood: "غذایی برای نمایش وجود ندارد.",
  noFoodInCategory: "غذایی در این دسته پیدا نشد.",
  loadMore: "موارد بیشتر",
  orderFor: "سفارش {label}",
  decreaseQty: "کاهش تعداد",
  increaseQty: "افزایش تعداد",
  removeFromCart: "حذف از سبد",
  noteOptional: "یادداشت (اختیاری)",
  creditHintLoggedIn: "با ثبت این سفارش، شماره روی فاکتور می‌ماند و در سفارش‌های بعدی دیده می‌شود.",
  creditHintGuest: "از دکمه ورود شماره را بدهید تا سفارش در تاریخچه بماند و بتوانید از اعتبار استفاده کنید.",
  changeReceipt: "تغییر رسید",
  sendReceipt: "ارسال رسید کارت‌به‌کارت",
  receipt: "رسید",
  removeReceipt: "حذف رسید",
  submitting: "در حال ثبت...",
  submitDineIn: "ثبت سفارش حضوری",
  order: "سفارش",
  product: "محصول",
  orderDetails: "جزئیات سفارش",
  currentOrder: "سفارش جاری",
  cancelled: "لغو شده",
  awaitingPayment: "منتظر پرداخت",
  cancelThisOrder: "لغو این سفارش",
  cancelOrder: "لغو سفارش",
  noOpenOrder: "سفارش بازی برای این میز نیست. بعد از تأیید صندوق از اینجا برداشته می‌شود.",
  phoneWithoutLogin: "شماره موبایل (بدون ورود)",
  removePhone: "حذف شماره",
  yourCredit: "اعتبار شما: {amount} تومان",
  noCredit: "اعتباری برای این شماره ثبت نشده",
  confirm: "تأیید",
  addToCart: "افزودن به سبد",
  total: "جمع",
  placeOrder: "ثبت سفارش",
  orderPlaced: "سفارش {label} ثبت شد",
  orderCancelledTitle: "سفارش {label} لغو شد",
  orderNumber: "شماره سفارش: {n}",
  orderHiddenFromPos: "این سفارش دیگر برای صندوق نمایش داده نمی‌شود.",
  orderPendingInvoice: "هنوز فاکتور نشده. روش پرداخت: {method}. پس از تأیید پرسنل فاکتور صادر می‌شود.",
  cardToCard: "کارت به کارت",
  phone11: "شماره موبایل را به‌صورت ۱۱ رقمی وارد کنید",
  phoneNotFound: "شماره پیدا نشد",
  phoneLookupError: "خطا در دریافت اطلاعات شماره",
  currentOrdersFail: "دریافت سفارش جاری ناموفق بود",
  networkError: "خطا در ارتباط با سرور",
  requestFail: "ثبت درخواست ناموفق بود",
  requestOk: "درخواست ثبت شد",
  cancelRequestFail: "لغو درخواست ناموفق بود",
  requestCancelled: "درخواست لغو شد",
  invoicedAlready: "این سفارش به فاکتور تبدیل شده",
  orderNotFound: "سفارش پیدا نشد",
  cardCopied: "شماره کارت کپی شد",
  copyFail: "کپی نشد",
  receiptTypes: "jpg، png، webp یا pdf",
  receiptTooBig: "حجم فایل اصلی نباید بیشتر از ۵ مگابایت باشد",
  receiptFail: "ارسال رسید ناموفق بود",
  receiptOk: "رسید ثبت شد",
  receiptReadFail: "خواندن فایل ناموفق بود",
  needPhoneForCredit: "برای استفاده از اعتبار، شماره موبایل را وارد کنید",
  choosePayment: "روش پرداخت را انتخاب کنید",
  submitFail: "ثبت سفارش ناموفق بود",
  cancelOrderFail: "لغو سفارش ناموفق بود",
  orderCancelled: "سفارش لغو شد",
  payOnline: "پرداخت آنلاین",
  payCard: "کارت به کارت",
  payPos: "کارتخوان فروشگاه",
  statusPendingSchedule: "در انتظار زمان‌بندی",
  statusScheduled: "زمان‌بندی شده",
  statusDone: "انجام شد",
  statusCancelled: "لغو شده",
  svcCleaning: "تمیز کردن اتاق",
  svcCleaningDesc: "نظافت و مرتب‌کردن اتاق",
  svcBlanket: "پتوی اضافه",
  svcBlanketDesc: "آوردن پتو یا روانداز اضافه",
  svcTowel: "حوله اضافه",
  svcTowelDesc: "حوله تمیز برای حمام",
  svcWater: "آب معدنی",
  svcWaterDesc: "چند بطری آب برای اتاق",
  svcPillow: "بالش اضافه",
  svcPillowDesc: "بالش بیشتر برای مهمان",
  svcIron: "اتو",
  svcIronDesc: "اتوی لباس برای اتاق",
  svcLaundry: "رختشویی",
  svcLaundryDesc: "تحویل لباس برای شست‌وشو",
  svcMaintenance: "تعمیرات",
  svcMaintenanceDesc: "بررسی مشکل فنی اتاق",
  svcWifi: "اینترنت",
  svcWifiDesc: "راهنمایی اتصال به اینترنت",
  svcOther: "سایر خدمات",
  svcOtherDesc: "درخواست خدمت از پذیرش",
};

const EN: Dict = {
  langFa: "فارسی",
  langEn: "English",
  langAr: "العربية",
  signIn: "Sign in",
  signInAria: "Sign in with mobile number",
  themeLight: "Light mode",
  themeDark: "Dark mode",
  foodOrdersAria: "Food orders",
  roomServicesAria: "Room services",
  pastOrdersAria: "Previous orders",
  menu: "Menu",
  services: "Services",
  searchMenu: "Search food, drinks and more…",
  searchServices: "Search room services…",
  searchMenuAria: "Search the menu",
  clearSearch: "Clear search",
  categoriesAria: "Menu categories",
  all: "All",
  category: "Category",
  shop: "Shop",
  table: "Table",
  room: "Room",
  invalidPlace: "Invalid {place}",
  detailsOf: "Details of {name}",
  decrease: "Decrease {name}",
  increase: "Increase {name}",
  addItem: "Add {name}",
  toman: "Toman",
  amountToman: "{amount} Toman",
  back: "Back",
  cancelOrderConfirm: "Cancel the order?",
  cancelOrderHint: "You can cancel only until staff have confirmed the payment.",
  dismiss: "Keep order",
  retry: "Try again",
  noSearchResult: "No results for “{term}”.",
  useCreditLabel: "Use store credit ({amount} Toman)",
  grandTotal: "Subtotal",
  creditDeduction: "Credit applied",
  payable: "Amount due",
  paymentMethodTitle: "Payment method",
  onlineGatewayHint: "Online checkout is not active yet. Your choice is saved and staff will issue the invoice after confirmation.",
  posHint: "Pay at the shop card terminal so staff can confirm.",
  noCardNumber: "The shop card number has not been set yet.",
  pastOrders: "Previous orders",
  noOrdersForPhone: "No orders for this number at this shop",
  creditUsed: "Credit used: {amount} Toman",
  payableLine: "Amount due: {amount} Toman",
  noItems: "No items recorded",
  roomServicesTitle: "Room services",
  noOpenService: "There are no open requests for this room.",
  phoneLoginHint: "With your number you can see this shop’s credit and previous orders.",
  close: "Close",
  decreaseShort: "Decrease",
  increaseShort: "Increase",
  viewCartAria: "View cart",
  viewCart: "View cart",
  cart: "Cart",
  cartEmpty: "Your cart is empty. Tap + to add a dish.",
  free: "Complimentary",
  request: "Request",
  requested: "Requested",
  serviceDefaultDesc: "No charge — it will be sent to your room after you request it.",
  currentRequests: "Current requests",
  pending: "Pending",
  cancel: "Cancel",
  noServicesYet: "No services have been added yet.",
  noServiceMatch: "No service found for “{term}”.",
  serverError: "Could not connect to the server.",
  noFood: "No dishes to display.",
  noFoodInCategory: "No dishes found in this category.",
  loadMore: "Load more",
  orderFor: "Order for {label}",
  decreaseQty: "Decrease quantity",
  increaseQty: "Increase quantity",
  removeFromCart: "Remove from cart",
  noteOptional: "Note (optional)",
  creditHintLoggedIn: "This number will appear on the invoice and on your later orders.",
  creditHintGuest: "Sign in with your mobile number so the order is saved and you can use store credit.",
  changeReceipt: "Change receipt",
  sendReceipt: "Upload bank-transfer receipt",
  receipt: "Receipt",
  removeReceipt: "Remove receipt",
  submitting: "Submitting…",
  submitDineIn: "Place dine-in order",
  order: "Order",
  product: "Item",
  orderDetails: "Order details",
  currentOrder: "Current order",
  cancelled: "Cancelled",
  awaitingPayment: "Awaiting payment",
  cancelThisOrder: "Cancel this order",
  cancelOrder: "Cancel order",
  noOpenOrder: "There is no open order for this table. It leaves this list after the cashier confirms it.",
  phoneWithoutLogin: "Mobile number (without signing in)",
  removePhone: "Remove number",
  yourCredit: "Your credit: {amount} Toman",
  noCredit: "No credit is registered for this number",
  confirm: "Confirm",
  addToCart: "Add to cart",
  total: "Total",
  placeOrder: "Place order",
  orderPlaced: "Order for {label} has been placed",
  orderCancelledTitle: "Order for {label} was cancelled",
  orderNumber: "Order no. {n}",
  orderHiddenFromPos: "This order is no longer shown at the cashier.",
  orderPendingInvoice: "Not invoiced yet. Payment method: {method}. An invoice is issued after staff confirmation.",
  cardToCard: "Bank transfer",
  phone11: "Enter an 11-digit mobile number",
  phoneNotFound: "Number not found",
  phoneLookupError: "Could not look up this number",
  currentOrdersFail: "Could not load the current order",
  networkError: "Connection error",
  requestFail: "Could not submit the request",
  requestOk: "Request submitted",
  cancelRequestFail: "Could not cancel the request",
  requestCancelled: "Request cancelled",
  invoicedAlready: "This order has already been invoiced",
  orderNotFound: "Order not found",
  cardCopied: "Card number copied",
  copyFail: "Could not copy",
  receiptTypes: "jpg, png, webp or pdf",
  receiptTooBig: "The original file must not exceed 5 MB",
  receiptFail: "Could not upload the receipt",
  receiptOk: "Receipt submitted",
  receiptReadFail: "Could not read the file",
  needPhoneForCredit: "Enter your mobile number to use credit",
  choosePayment: "Please choose a payment method",
  submitFail: "Could not place the order",
  cancelOrderFail: "Could not cancel the order",
  orderCancelled: "Order cancelled",
  payOnline: "Online payment",
  payCard: "Bank transfer",
  payPos: "Card terminal",
  statusPendingSchedule: "Awaiting scheduling",
  statusScheduled: "Scheduled",
  statusDone: "Completed",
  statusCancelled: "Cancelled",
  svcCleaning: "Room cleaning",
  svcCleaningDesc: "Cleaning and tidying the room",
  svcBlanket: "Extra blanket",
  svcBlanketDesc: "An extra blanket or throw for the room",
  svcTowel: "Extra towel",
  svcTowelDesc: "A clean towel for the bathroom",
  svcWater: "Bottled water",
  svcWaterDesc: "Bottled water for the room",
  svcPillow: "Extra pillow",
  svcPillowDesc: "An additional pillow for the guest",
  svcIron: "Iron",
  svcIronDesc: "A clothes iron for the room",
  svcLaundry: "Laundry",
  svcLaundryDesc: "Clothes collected for washing",
  svcMaintenance: "Maintenance",
  svcMaintenanceDesc: "A technician to check the room",
  svcWifi: "Wi-Fi",
  svcWifiDesc: "Help connecting to the internet",
  svcOther: "Other services",
  svcOtherDesc: "A request to reception",
};

const AR: Dict = {
  langFa: "فارسی",
  langEn: "English",
  langAr: "العربية",
  signIn: "تسجيل الدخول",
  signInAria: "تسجيل الدخول برقم الجوال",
  themeLight: "الوضع الفاتح",
  themeDark: "الوضع الداكن",
  foodOrdersAria: "طلبات الطعام",
  roomServicesAria: "خدمات الغرفة",
  pastOrdersAria: "الطلبات السابقة",
  menu: "القائمة",
  services: "الخدمات",
  searchMenu: "ابحث عن الطعام والمشروبات…",
  searchServices: "ابحث في خدمات الغرفة…",
  searchMenuAria: "البحث في القائمة",
  clearSearch: "مسح البحث",
  categoriesAria: "تصنيفات القائمة",
  all: "الكل",
  category: "تصنيف",
  shop: "المتجر",
  table: "الطاولة",
  room: "الغرفة",
  invalidPlace: "{place} غير صالح",
  detailsOf: "تفاصيل {name}",
  decrease: "إنقاص {name}",
  increase: "زيادة {name}",
  addItem: "إضافة {name}",
  toman: "تومان",
  amountToman: "{amount} تومان",
  back: "رجوع",
  cancelOrderConfirm: "إلغاء الطلب؟",
  cancelOrderHint: "يمكنكم الإلغاء فقط ما لم يؤكد الموظفون الدفع بعد.",
  dismiss: "إبقاء الطلب",
  retry: "إعادة المحاولة",
  noSearchResult: "لا نتائج لـ «{term}».",
  useCreditLabel: "استخدام الرصيد ({amount} تومان)",
  grandTotal: "المجموع",
  creditDeduction: "خصم من الرصيد",
  payable: "المبلغ المستحق",
  paymentMethodTitle: "طريقة الدفع",
  onlineGatewayHint: "بوابة الدفع الإلكتروني غير مفعّلة حالياً. يُحفظ اختياركم ويُصدر الموظفون الفاتورة بعد التأكيد.",
  posHint: "ادفعوا عبر جهاز المتجر ليؤكد الموظفون العملية.",
  noCardNumber: "رقم بطاقة المتجر غير مسجّل بعد في الإعدادات.",
  pastOrders: "الطلبات السابقة",
  noOrdersForPhone: "لا طلبات لهذا الرقم في هذا المتجر",
  creditUsed: "الرصيد المستخدم: {amount} تومان",
  payableLine: "المبلغ المستحق: {amount} تومان",
  noItems: "لم تُسجَّل أصناف",
  roomServicesTitle: "خدمات الغرفة",
  noOpenService: "لا طلبات مفتوحة لهذه الغرفة.",
  phoneLoginHint: "برقم الجوال ترون رصيد هذا المتجر وطلباتكم السابقة.",
  close: "إغلاق",
  decreaseShort: "إنقاص",
  increaseShort: "زيادة",
  viewCartAria: "عرض السلة",
  viewCart: "عرض السلة",
  cart: "سلة الطلبات",
  cartEmpty: "السلة فارغة. اضغط + لاختيار طبق.",
  free: "مجاناً",
  request: "طلب",
  requested: "تم الطلب",
  serviceDefaultDesc: "بدون رسوم — يُرسل إلى غرفتكم بعد تقديم الطلب.",
  currentRequests: "الطلبات الحالية",
  pending: "قيد الانتظار",
  cancel: "إلغاء",
  noServicesYet: "لم تُضف أي خدمات بعد.",
  noServiceMatch: "لا توجد خدمة مطابقة لـ «{term}».",
  serverError: "تعذّر الاتصال بالخادم.",
  noFood: "لا توجد أطباق للعرض.",
  noFoodInCategory: "لا توجد أطباق في هذا التصنيف.",
  loadMore: "المزيد",
  orderFor: "طلب {label}",
  decreaseQty: "إنقاص الكمية",
  increaseQty: "زيادة الكمية",
  removeFromCart: "حذف من السلة",
  noteOptional: "ملاحظة (اختياري)",
  creditHintLoggedIn: "سيظهر هذا الرقم على الفاتورة وفي طلباتكم اللاحقة.",
  creditHintGuest: "سجّلوا الدخول برقم الجوال لحفظ الطلب واستخدام الرصيد.",
  changeReceipt: "تغيير الإيصال",
  sendReceipt: "رفع إيصال التحويل البنكي",
  receipt: "إيصال",
  removeReceipt: "حذف الإيصال",
  submitting: "جارٍ الإرسال...",
  submitDineIn: "تأكيد الطلب الحضوري",
  order: "طلب",
  product: "صنف",
  orderDetails: "تفاصيل الطلب",
  currentOrder: "الطلب الحالي",
  cancelled: "ملغى",
  awaitingPayment: "بانتظار الدفع",
  cancelThisOrder: "إلغاء هذا الطلب",
  cancelOrder: "إلغاء الطلب",
  noOpenOrder: "لا يوجد طلب مفتوح لهذه الطاولة. يُزال من القائمة بعد تأكيد الصندوق.",
  phoneWithoutLogin: "رقم الجوال (دون تسجيل دخول)",
  removePhone: "حذف الرقم",
  yourCredit: "رصيدكم: {amount} تومان",
  noCredit: "لا يوجد رصيد مسجّل لهذا الرقم",
  confirm: "تأكيد",
  addToCart: "إضافة إلى السلة",
  total: "المجموع",
  placeOrder: "تأكيد الطلب",
  orderPlaced: "تم تسجيل طلب {label}",
  orderCancelledTitle: "أُلغي طلب {label}",
  orderNumber: "رقم الطلب: {n}",
  orderHiddenFromPos: "لم يعد هذا الطلب يظهر لدى الصندوق.",
  orderPendingInvoice: "لم تُصدر الفاتورة بعد. طريقة الدفع: {method}. تُصدر الفاتورة بعد تأكيد الموظفين.",
  cardToCard: "تحويل بنكي",
  phone11: "أدخلوا رقم جوال مكوّناً من ١١ رقماً",
  phoneNotFound: "الرقم غير موجود",
  phoneLookupError: "تعذّر جلب معلومات الرقم",
  currentOrdersFail: "تعذّر جلب الطلب الحالي",
  networkError: "خطأ في الاتصال",
  requestFail: "تعذّر إرسال الطلب",
  requestOk: "تم إرسال الطلب",
  cancelRequestFail: "تعذّر إلغاء الطلب",
  requestCancelled: "أُلغي الطلب",
  invoicedAlready: "حُوِّل هذا الطلب إلى فاتورة",
  orderNotFound: "الطلب غير موجود",
  cardCopied: "نُسخ رقم البطاقة",
  copyFail: "تعذّر النسخ",
  receiptTypes: "jpg أو png أو webp أو pdf",
  receiptTooBig: "يجب ألا يتجاوز حجم الملف الأصلي ٥ ميغابايت",
  receiptFail: "تعذّر رفع الإيصال",
  receiptOk: "تم تسجيل الإيصال",
  receiptReadFail: "تعذّر قراءة الملف",
  needPhoneForCredit: "أدخلوا رقم الجوال لاستخدام الرصيد",
  choosePayment: "يرجى اختيار طريقة الدفع",
  submitFail: "تعذّر تسجيل الطلب",
  cancelOrderFail: "تعذّر إلغاء الطلب",
  orderCancelled: "أُلغي الطلب",
  payOnline: "دفع إلكتروني",
  payCard: "تحويل بنكي",
  payPos: "جهاز الدفع",
  statusPendingSchedule: "بانتظار الجدولة",
  statusScheduled: "مجدول",
  statusDone: "مكتمل",
  statusCancelled: "ملغى",
  svcCleaning: "تنظيف الغرفة",
  svcCleaningDesc: "تنظيف الغرفة وترتيبها",
  svcBlanket: "بطانية إضافية",
  svcBlanketDesc: "إحضار بطانية أو غطاء إضافي",
  svcTowel: "منشفة إضافية",
  svcTowelDesc: "منشفة نظيفة للحمام",
  svcWater: "مياه معدنية",
  svcWaterDesc: "زجاجات مياه للغرفة",
  svcPillow: "وسادة إضافية",
  svcPillowDesc: "وسادة إضافية للنزيل",
  svcIron: "مكواة",
  svcIronDesc: "مكواة ملابس للغرفة",
  svcLaundry: "غسيل الملابس",
  svcLaundryDesc: "استلام الملابس للغسيل",
  svcMaintenance: "صيانة",
  svcMaintenanceDesc: "فحص مشكلة فنية في الغرفة",
  svcWifi: "الإنترنت",
  svcWifiDesc: "المساعدة على الاتصال بالإنترنت",
  svcOther: "خدمات أخرى",
  svcOtherDesc: "طلب خدمة من الاستقبال",
};

const DICTS: Record<ReservLocale, Dict> = { fa: FA, en: EN, ar: AR };

const SERVICE_NAME_KEYS: Record<string, { name: string; desc: string }> = {
  cleaning: { name: "svcCleaning", desc: "svcCleaningDesc" },
  blanket: { name: "svcBlanket", desc: "svcBlanketDesc" },
  towel: { name: "svcTowel", desc: "svcTowelDesc" },
  water: { name: "svcWater", desc: "svcWaterDesc" },
  pillow: { name: "svcPillow", desc: "svcPillowDesc" },
  iron: { name: "svcIron", desc: "svcIronDesc" },
  laundry: { name: "svcLaundry", desc: "svcLaundryDesc" },
  maintenance: { name: "svcMaintenance", desc: "svcMaintenanceDesc" },
  wifi: { name: "svcWifi", desc: "svcWifiDesc" },
  other: { name: "svcOther", desc: "svcOtherDesc" },
};

const STATUS_MAP: Record<string, string> = {
  pending: "statusPendingSchedule",
  scheduled: "statusScheduled",
  done: "statusDone",
  cancelled: "statusCancelled",
  "در انتظار زمان‌بندی": "statusPendingSchedule",
  "زمان‌بندی شده": "statusScheduled",
  "انجام شد": "statusDone",
  "لغو شده": "statusCancelled",
  "در انتظار": "pending",
};

type Ctx = {
  locale: ReservLocale;
  dir: "rtl" | "ltr";
  setLocale: (locale: ReservLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  formatNumber: (n: number) => string;
  formatDateTime: (value?: string | null) => string;
  translatePlace: (label: string, kind?: "table" | "room") => string;
  translateServiceName: (name?: string | null, iconKey?: string | null) => string;
  translateServiceDesc: (description?: string | null, iconKey?: string | null) => string;
  translateStatus: (status?: string | null, statusLabel?: string | null) => string;
  translatePayMethod: (key?: string | null, fallback?: string | null) => string;
};

const ReservI18nContext = createContext<Ctx | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
}

function readStoredLocale(): ReservLocale {
  if (typeof window === "undefined") return "fa";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "en" || raw === "ar" || raw === "fa") return raw;
  } catch {
    /* ignore */
  }
  return "fa";
}

export function ReservI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<ReservLocale>("fa");

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "en" ? "ltr" : "rtl";
  }, [locale]);

  const setLocale = useCallback((next: ReservLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = DICTS[locale];
    const t = (key: string, vars?: Record<string, string | number>) =>
      interpolate(dict[key] || DICTS.fa[key] || key, vars);
    const numberLocale = locale === "en" ? "en-US" : locale === "ar" ? "ar-SA" : "fa-IR";
    const formatNumber = (n: number) => new Intl.NumberFormat(numberLocale).format(n);
    const formatDateTime = (raw?: string | null) => {
      if (!raw) return "";
      const date = new Date(String(raw).replace(" ", "T"));
      if (Number.isNaN(date.getTime())) return raw;
      return new Intl.DateTimeFormat(numberLocale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    };
    const translatePlace = (label: string, kind?: "table" | "room") => {
      const trimmed = (label || "").trim();
      const noun = kind === "room" || /^اتاق/.test(trimmed) ? t("room") : t("table");
      const num = trimmed.match(/(\d+)/)?.[1];
      if (num) return `${noun} ${formatNumber(Number(num))}`;
      if (!trimmed) return noun;
      if (/^(میز|اتاق)\s*$/.test(trimmed)) return noun;
      if (/^(میز|اتاق)\s+/.test(trimmed)) return trimmed.replace(/^(میز|اتاق)/, noun);
      return trimmed;
    };
    const translateServiceName = (name?: string | null, iconKey?: string | null) => {
      const mapped = iconKey ? SERVICE_NAME_KEYS[iconKey] : undefined;
      if (mapped) return t(mapped.name);
      return name || t("svcOther");
    };
    const translateServiceDesc = (description?: string | null, iconKey?: string | null) => {
      const mapped = iconKey ? SERVICE_NAME_KEYS[iconKey] : undefined;
      if (mapped) return t(mapped.desc);
      if (description && locale === "fa") return description;
      return t("serviceDefaultDesc");
    };
    const translateStatus = (status?: string | null, statusLabel?: string | null) => {
      const key = STATUS_MAP[status || ""] || STATUS_MAP[statusLabel || ""];
      if (key) return t(key);
      if (locale === "fa") return statusLabel || t("pending");
      return t("pending");
    };
    const translatePayMethod = (key?: string | null, fallback?: string | null) => {
      if (key === "online") return t("payOnline");
      if (key === "card_to_card") return t("payCard");
      if (key === "pos") return t("payPos");
      if (fallback && locale === "fa") return fallback;
      return fallback || t("payOnline");
    };
    return {
      locale,
      dir: locale === "en" ? "ltr" : "rtl",
      setLocale,
      t,
      formatNumber,
      formatDateTime,
      translatePlace,
      translateServiceName,
      translateServiceDesc,
      translateStatus,
      translatePayMethod,
    };
  }, [locale, setLocale]);

  return <ReservI18nContext.Provider value={value}>{children}</ReservI18nContext.Provider>;
}

export function useReservI18n(): Ctx {
  const ctx = useContext(ReservI18nContext);
  if (!ctx) {
    const t = (key: string, vars?: Record<string, string | number>) => interpolate(FA[key] || key, vars);
    return {
      locale: "fa",
      dir: "rtl",
      setLocale: () => {},
      t,
      formatNumber: (n) => new Intl.NumberFormat("fa-IR").format(n),
      formatDateTime: () => "",
      translatePlace: (label) => label,
      translateServiceName: (name) => name || "",
      translateServiceDesc: (d) => d || "",
      translateStatus: (_s, label) => label || "",
      translatePayMethod: (_k, fallback) => fallback || "",
    };
  }
  return ctx;
}

export const RESERV_LOCALES: { id: ReservLocale; short: string }[] = [
  { id: "fa", short: "فارسی" },
  { id: "en", short: "EN" },
  { id: "ar", short: "عربي" },
];
