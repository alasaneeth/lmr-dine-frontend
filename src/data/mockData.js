// ─────────────────────────────────────────────
//  MOCK DATA  –  Restaurant Management System
// ─────────────────────────────────────────────

export const menuItems = [
  { id: 1, section: 0, name: "White String Hopper", price: 5,  emoji: "⬜", stock: 40, category: "Main Dishes" },
  { id: 2, section: 0, name: "Red String Hopper",   price: 5,  emoji: "🟥", stock: 35, category: "Main Dishes" },
  { id: 3, section: 0, name: "Rice Puttu",           price: 35, emoji: "🍚", stock: 20, category: "Main Dishes" },
  { id: 4, section: 0, name: "Wheat Puttu",          price: 40, emoji: "🌾", stock: 18, category: "Main Dishes" },
  { id: 5, section: 1, name: "Coconut Sambal",       price: 20, emoji: "🥥", stock: 50, category: "Curries" },
  { id: 6, section: 1, name: "Dal Curry",            price: 40, emoji: "🫘", stock: 30, category: "Curries" },
  { id: 7, section: 1, name: "Chicken Curry",        price: 80, emoji: "🍗", stock: 25, category: "Curries" },
  { id: 8, section: 1, name: "Beef Curry",           price: 90, emoji: "🥩", stock: 15, category: "Curries" },
  { id: 9, section: 2, name: "Dhal Vadai",           price: 15, emoji: "🫓", stock: 60, category: "Short Eats" },
  { id: 10, section: 2, name: "Ulunthu Vadai",       price: 20, emoji: "🔵", stock: 55, category: "Short Eats" },
  { id: 11, section: 2, name: "Ktlat",               price: 30, emoji: "🟤", stock: 40, category: "Short Eats" },
  { id: 12, section: 2, name: "Pettis",              price: 10, emoji: "🟠", stock: 70, category: "Short Eats" },
];

export const orders = [
  { id: "ORD-001", table: "Table 01", items: [{ name: "Chicken Curry", qty: 2, price: 80 }, { name: "Rice Puttu", qty: 3, price: 35 }], status: "pending",    time: "08:15 AM", total: 265, customer: "Amal P." },
  { id: "ORD-002", table: "Table 03", items: [{ name: "Beef Curry",    qty: 1, price: 90 }, { name: "Dal Curry",  qty: 2, price: 40 }], status: "preparing",  time: "08:30 AM", total: 170, customer: "Nimal S." },
  { id: "ORD-003", table: "Table 05", items: [{ name: "Dhal Vadai",   qty: 4, price: 15 }, { name: "Pettis",    qty: 2, price: 10 }], status: "ready",      time: "08:45 AM", total:  80, customer: "Kasun R." },
  { id: "ORD-004", table: "Table 07", items: [{ name: "White String Hopper", qty: 5, price: 5 },  { name: "Coconut Sambal", qty: 1, price: 20 }], status: "served", time: "09:00 AM", total: 45, customer: "Dilini F." },
  { id: "ORD-005", table: "Table 02", items: [{ name: "Wheat Puttu",  qty: 2, price: 40 }, { name: "Chicken Curry", qty: 1, price: 80 }], status: "pending",    time: "09:10 AM", total: 160, customer: "Ruwan M." },
  { id: "ORD-006", table: "Table 04", items: [{ name: "Ktlat",        qty: 3, price: 30 }, { name: "Dal Curry",  qty: 1, price: 40 }], status: "paid",       time: "09:20 AM", total: 130, customer: "Samantha K." },
];

export const invoices = [
  { id: "INV-001", orderId: "ORD-004", table: "Table 07", customer: "Dilini F.", subtotal: 45,   total: 45.0,  date: "2025-07-12", status: "paid" },
  { id: "INV-002", orderId: "ORD-006", table: "Table 04", customer: "Samantha K.", subtotal: 130, total: 130.0, date: "2025-07-12", status: "paid" },
  { id: "INV-003", orderId: "ORD-003", table: "Table 05", customer: "Kasun R.",    subtotal: 80,  total: 80.0,  date: "2025-07-12", status: "pending" },
  { id: "INV-004", orderId: "ORD-001", table: "Table 01", customer: "Amal P.",     subtotal: 265, total: 265.0, date: "2025-07-11", status: "paid" },
  { id: "INV-005", orderId: "ORD-002", table: "Table 03", customer: "Nimal S.",    subtotal: 170, total: 170.0, date: "2025-07-11", status: "pending" },
];

export const salesData = [
  { day: "Mon", revenue: 4200, orders: 32 },
  { day: "Tue", revenue: 3800, orders: 28 },
  { day: "Wed", revenue: 5100, orders: 41 },
  { day: "Thu", revenue: 4700, orders: 36 },
  { day: "Fri", revenue: 6200, orders: 52 },
  { day: "Sat", revenue: 7800, orders: 65 },
  { day: "Sun", revenue: 6900, orders: 58 },
];

export const topItems = [
  { name: "Chicken Curry",      sold: 124, revenue: 9920 },
  { name: "Beef Curry",         sold: 98,  revenue: 8820 },
  { name: "Rice Puttu",         sold: 210, revenue: 7350 },
  { name: "Dal Curry",          sold: 176, revenue: 7040 },
  { name: "White String Hopper",sold: 310, revenue: 1550 },
];

export const users = [
  { id: 1, name: "Kavindu Dilshan", email: "kavindu@resto.lk",  role: "admin",    status: "active",   joined: "2024-01-10" },
  { id: 2, name: "Nimal Perera",    email: "nimal@resto.lk",    role: "waiter",   status: "active",   joined: "2024-02-15" },
  { id: 3, name: "Samitha Bandara", email: "samitha@resto.lk",  role: "cashier",  status: "active",   joined: "2024-03-01" },
  { id: 4, name: "Dilini Fernando", email: "dilini@resto.lk",   role: "customer", status: "active",   joined: "2024-04-20" },
  { id: 5, name: "Ruwan Mendis",    email: "ruwan@resto.lk",    role: "waiter",   status: "inactive", joined: "2024-05-05" },
  { id: 6, name: "Amal Perera",     email: "amal@resto.lk",     role: "customer", status: "active",   joined: "2024-06-18" },
];

export const stockItems = [
  { id: 1, name: "Chicken",     unit: "kg",   qty: 15, minQty: 5,  price: 850 },
  { id: 2, name: "Beef",        unit: "kg",   qty: 8,  minQty: 5,  price: 1100 },
  { id: 3, name: "Rice",        unit: "kg",   qty: 50, minQty: 10, price: 120 },
  { id: 4, name: "Coconut",     unit: "units",qty: 30, minQty: 10, price: 75 },
  { id: 5, name: "Dal",         unit: "kg",   qty: 12, minQty: 5,  price: 240 },
  { id: 6, name: "Wheat Flour", unit: "kg",   qty: 20, minQty: 8,  price: 180 },
  { id: 7, name: "Oil",         unit: "L",    qty: 6,  minQty: 3,  price: 480 },
  { id: 8, name: "Onions",      unit: "kg",   qty: 4,  minQty: 5,  price: 160 },
];

// Demo credentials
export const demoCredentials = [
  { email: "admin@resto.lk",    password: "admin123",    role: "admin",    name: "Kavindu Dilshan", initials: "KD" },
  { email: "waiter@resto.lk",   password: "waiter123",   role: "waiter",   name: "Nimal Perera",    initials: "NP" },
  { email: "cashier@resto.lk",  password: "cashier123",  role: "cashier",  name: "Samitha Bandara", initials: "SB" },
  { email: "customer@resto.lk", password: "customer123", role: "customer", name: "Dilini Fernando", initials: "DF" },
];
