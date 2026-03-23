# Performance Troubleshooting Decision Tree

## Quick Navigation by Symptom

Use this guide to quickly identify and fix performance issues.

---

## 🔴 ENDPOINT: /favicon.ico (21 seconds)

```
Problem: Files taking 21 seconds
│
├─ IS IT A STATIC FILE?
│  └─ Yes → Check nginx configuration
│           Favicon should be served by web server, not Laravel
│           
├─ SOLUTION:
│  1. Add to nginx.conf BEFORE Laravel location block:
│
│     location = /favicon.ico {
│         try_files $uri =404;
│         access_log off;
│     }
│
│  2. Place favicon.ico in public/
│
│  3. Reload nginx: docker-compose exec web nginx -s reload
│
├─ VERIFY:
│  curl -I http://localhost/favicon.ico
│  Should return: 200 OK
│  Response time: < 50ms
│
└─ IMPACT: 99% improvement (21s → 50ms)
```

**Files Affected:** `docker/nginx.conf`, `public/favicon.ico`  
**Time to Fix:** 5 minutes  
**Severity:** CRITICAL

---

## 🔴 ENDPOINT: /stats/dashboard (12+ seconds)

```
Problem: Admin dashboard slow
│
├─ ROOT CAUSES (Check in order):
│  ├─ Multiple database queries executing sequentially
│  ├─ Complex JOIN in getTopProducts()
│  ├─ No caching mechanism
│  └─ Missing database indexes
│
├─ DIAGNOSIS:
│  1. Open Laravel Telescope
│  2. Run dashboard endpoint
│  3. Count total queries (should be ~15-20)
│  4. Check if queries use indexes (look at EXPLAIN output)
│
├─ QUICK FIX PRIORITY:
│
│  Priority 1: Add Caching (30 mins)
│  ─────────────────────────────
│  Add to DashboardController.dashboard():
│
│  return Cache::remember(
│      "dashboard_{$role}_{$userId}", 
│      3600,  // 1 hour
│      fn() => $this->loadDashboard()
│  );
│
│  Impact: 70% improvement
│  
│  Priority 2: Add Database Indexes (5 mins)
│  ───────────────────────────────────────
│  Run: php artisan migrate
│  Migration: 2026_03_21_190000_add_missing_critical_indexes.php
│
│  Impact: 15% improvement
│  
│  Priority 3: Optimize getTopProducts() (20 mins)
│  ──────────────────────────────────────────────
│  Replace LEFT JOIN with better query structure
│
│  Impact: 5% improvement
│
├─ VALIDATION:
│  1. Before: php artisan tinker; benchmark dashboard call
│  2. Implement fixes
│  3. After: Re-run benchmark
│  4. Confirm: 70%+ improvement
│
└─ EXPECTED: 12s → 3-4s
```

**Files Affected:** 
- [DashboardController.php](app/Http/Controllers/Api/DashboardController.php#L25)
- `2026_03_21_190000_add_missing_critical_indexes.php`

**Time to Fix:** 20-30 minutes  
**Severity:** CRITICAL

---

## 🔴 ENDPOINT: /api/deliveries (2-5 seconds)

```
Problem: Delivery list slow
│
├─ ROOT CAUSES (likely multiple):
│  ├─ N+1 queries - Each delivery loads order → customer
│  ├─ Missing indexes on (chauffeur_id, status)
│  ├─ formatDelivery() called per item
│  ├─ JOINs in search create cartesian products
│  └─ Large result sets returned
│
├─ DIAGNOSIS STEPS:
│  1. Enable query logging:
│     echo 'queries executed: 30-50 (bad) vs 5-10 (good)'
│
│  2. Check if these queries are repeated:
│     SELECT * FROM orders WHERE id = ?  (repeated N times)
│     SELECT * FROM customers WHERE id = ? (repeated N times)
│
│  3. Check if indexes are used:
│     EXPLAIN SELECT * FROM deliveries
│       WHERE chauffeur_id = ? AND status = ?
│     Should have: key = 'deliveries_chauffeur_status_index'
│
├─ FIX CHECKLIST:
│  
│  [ ] Step 1: Add Missing Indexes (~5 mins)
│  ──────────────────────────────────────
│  Run: php artisan migrate
│  Indexes added:
│  - deliveries_chauffeur_id_index
│  - deliveries_status_index
│  - deliveries_chauffeur_status_index (composite)
│  
│  [ ] Step 2: Fix Eager Loading (~10 mins)
│  ───────────────────────────────────────
│  In DeliveryController.index():
│  Change: ->with(['order.customer', 'chauffeur', 'vehicle'])
│  To:     ->with([
│            'order:id,order_number,total,customer_id',
│            'order.customer:id,name,city,address,phone',
│            'chauffeur:id,name',
│            'vehicle:id,license_plate,brand,model'
│          ])
│
│  [ ] Step 3: Fix Search Logic (~15 mins)
│  ──────────────────────────────────────
│  Replace JOIN-based search with subquery:
│  
│  If $request->has('search'):
│    Use Order::whereHas() with subquery
│    Instead of JOIN which creates duplicates
│
│  [ ] Step 4: Verify Pagination
│  ─────────────────────────────
│  Ensure pagination is capped at 100
│  min(request_per_page, 100)
│
└─ EXPECTED: 3-5s → 1-2s (50% improvement)
```

**Files Affected:**
- [DeliveryController.php](app/Http/Controllers/Api/DeliveryController.php#L187)
- `2026_03_21_190000_add_missing_critical_indexes.php`

**Time to Fix:** 30-40 minutes  
**Severity:** CRITICAL

---

## 🟠 ENDPOINT: /api/notifications/unread-count (1-4 seconds)

```
Problem: Notification badge slow
│
├─ ROOT CAUSES:
│  ├─ No caching - query runs every time
│  ├─ Called frequently by frontend
│  ├─ Missing indexes on notification.read column
│  └─ COUNT(*) with WHERE doing table scan
│
├─ HOW OFTEN IS IT CALLED?
│  ├─ Every 1-2 seconds (frontend polling)
│  └─ For every page view
│  Result: Hundreds of identical queries per user per minute
│
├─ QUICK FIX (takes 20 minutes):
│
│  [ ] Step 1: Add Index on 'read' Column
│  ────────────────────────────────────
│  Run: php artisan migrate
│  Indexes added:
│  - notifications_read_index
│  - notifications_read_created_at_index
│
│  Impact: 30% improvement
│
│  [ ] Step 2: Add Query Caching
│  ─────────────────────────────
│  In NotificationController.unreadCount():
│
│  $cacheKey = "notifications_unread_{$userId}";
│  $count = Cache::remember($cacheKey, 60, function() {
│      return Notification::where('user_id', $userId)
│          ->where('read', false)
│          ->count();
│  });
│
│  [ ] Step 3: Invalidate Cache on Updates
│  ──────────────────────────────────────
│  In markAsRead(), markAllRead(), destroy():
│
│  Cache::forget("notifications_unread_{$userId}");
│
│  Impact: 90% improvement for repeated checks
│
├─ VALIDATION:
│  1. Monitor notification query frequency
│  2. Before: 100+ identical queries/min per user
│  3. After: 1 query/min per user
│  4. Server: Reduced load by 95%
│
└─ EXPECTED: 1-4s → 100-200ms (90% improvement)
```

**Files Affected:**
- [NotificationController.php](app/Http/Controllers/Api/NotificationController.php#L32)
- `2026_03_21_190000_add_missing_critical_indexes.php`

**Time to Fix:** 20 minutes  
**Severity:** HIGH

---

## 🟡 ENDPOINT: /api/tasks (varies - slow)

```
Problem: Task list slow or hangs occasionally
│
├─ ROOT CAUSE:
│  ├─ Loaded with pagination → All tasks loaded without limit
│  ├─ Three eager-loaded relations (createdBy, assignedTo, order)
│  ├─ No performance limit (100+ tasks into memory)
│  └─ Results in 100-300+ database queries
│
├─ DIAGNOSIS:
│  1. Check task count: SELECT COUNT(*) FROM tasks
│  2. If > 100, you have a problem
│  3. Each task = 3 relation queries (100 tasks = 300+ queries)
│
├─ THE PROBLEM IN CODE:
│
│  // CURRENT (SLOW):
│  $tasks = Task::with(['createdBy', 'assignedTo', 'order'])
│      ->orderBy('created_at', 'desc')
│      ->get();  // ← NO PAGINATION = ALL TASKS INTO MEMORY
│
│  // Result: 1 + (N * 3) queries = 1 + 300 queries for 100 tasks
│
├─ SOLUTION (takes 15 minutes):
│
│  [ ] Add Pagination
│  ────────────────
│  $perPage = min(request('per_page', 20), 100);
│  $tasks = Task::select([...])
│      ->with([
│          'createdBy:id,name',
│          'assignedTo:id,name',
│          'order:id,status'
│      ])
│      ->orderBy('created_at', 'desc')
│      ->paginate($perPage);  // ← ADD THIS
│
│  Impact: 95% improvement for large datasets
│
├─ VALIDATION:
│  1. Before: ?
│  2. After list with 1000 tasks: < 1 second
│
└─ EXPECTED: varies → <1s
```

**Files Affected:**
- [TaskController.php](app/Http/Controllers/Api/TaskController.php#L11)

**Time to Fix:** 15 minutes  
**Severity:** HIGH

---

## 🟡 ENDPOINT: /api/invoices (slow)

```
Problem: Invoice list slow, especially on first load
│
├─ ROOT CAUSE:
│  ├─ syncMissingInvoicesFromOrders() called EVERY request
│  ├─ Does 1 + N database queries (N = number of orders without invoices)
│  ├─ No pagination on invoice list
│  └─ Complex invoice generation logic in loop
│
├─ HOW BAD IS IT?
│
│  SCENARIO: 100 orders without invoices
│
│  Current Code:
│  ├─ Query 1: SELECT * FROM orders WHERE status != 'cancelled'
│  ├─ Query 2-101: INSERT INTO invoices ... (one per order)
│  └─ Total: 101 queries every API call!
│
│  After Fix:
│  ├─ Query 1: SELECT * FROM orders ...
│  ├─ Query 2: INSERT INTO invoices ... (batch insert)
│  └─ Total: 2 queries every API call
│
├─ SOLUTION (takes 25 minutes):
│
│  [ ] Step 1: Batch Insert Instead of Loop
│  ───────────────────────────────────────
│  Replace syncMissingInvoicesFromOrders():
│
│  // BEFORE (100 queries):
│  foreach ($orders as $order) {
│      Invoice::create([...]);  // 1 query per order
│  }
│
│  // AFTER (1 query):
│  Invoice::insert($invoicesArray);  // 1 batch insert
│
│  [ ] Step 2: Optimize generateInvoiceNumber()
│  ───────────────────────────────────────────
│  Use MAX(invoice_number) instead of checking each one
│
│  [ ] Step 3: Add Pagination
│  ──────────────────────────
│  $invoices = Invoice::paginate(20);
│
│  Impact: 95% improvement in sync time
│
├─ VALIDATION:
│  1. Time call to syncMissingInvoicesFromOrders()
│  2. Before: 500ms-2s for 100 orders
│  3. After: 50-100ms for 100 orders
│
└─ EXPECTED: varies → <1s
```

**Files Affected:**
- [InvoiceController.php](app/Http/Controllers/Api/InvoiceController.php#L27)

**Time to Fix:** 25 minutes  
**Severity:** HIGH

---

## QUICK REFERENCE: WHICH FIX FOR WHICH SYMPTOM

### Your Problem → Use This Decision Tree

```
Is page taking 20+ seconds?
├─ YES: Favicon.ico routing issue → See /favicon.ico section
└─ NO: Continue

Is admin dashboard slow (12+ sec)?
├─ YES: Cache + indexes → See /stats/dashboard section
└─ NO: Continue

Is a specific API endpoint slow?
├─ /deliveries → See /api/deliveries section
├─ /notifications/unread-count → See .../unread-count section
├─ /api/tasks → See /api/tasks section
├─ /api/invoices → See /api/invoices section
└─ Other → See PERFORMANCE_ANALYSIS_REPORT.md for specific endpoint

Are queries taking too long?
├─ Are similar queries repeated 10+ times?
│  └─ N+1 Query Problem → Fix with eager loading
├─ Are results loading everything?
│  └─ Use select() → Fix with specific column selection
├─ Is data being requested frequently?
│  └─ Caching Problem → Add cache layer
└─ Are WHERE conditions not using indexes?
   └─ Index Problem → Run migration 2026_03_21_190000

```

---

## PERFORMANCE MONITORING CHECKLIST

Use this to monitor performance over time:

```
Weekly Performance Review:

[ ] Check query count for each endpoint
    SELECT * FROM information_schema.INNODB_TRXWHERE trx_mysql_thread_id != connection_id()

[ ] Check cache hit rate
    Laravel: dd(Cache::getStore()->getMetrics());

[ ] Check slow query log
    mysql> SELECT * FROM mysql.slow_log;

[ ] Check database connections
    SHOW PROCESSLIST;

[ ] Check most-called endpoints
    Use New Relic or Laravel Telescope

[ ] Verify no new N+1 queries introduced
    Use Laravel Debugbar in development

[ ] Check page load metrics
    Monitor /favicon.ico → should be <50ms
    Monitor admin dashboard → should be <4s
    Monitor delivery API → should be <2s
```

---

## EMERGENCY: PERFORMANCE DEGRADATION

If performance suddenly degrades:

```
Step 1: Identify the problem
├─ Which endpoint is slow?
├─ Did recent code changes happen?
├─ Is database full?
└─ Are there too many connections?

Step 2: Quick diagnostics
├─ Check slow query log: TAIL -f /var/log/mysql/slow.log
├─ Check active connections: SHOW PROCESSLIST;
├─ Check tables for locks: SHOW OPEN TABLES WHERE In_use > 0;
└─ Check disk space: df -h

Step 3: Immediate actions
├─ Kill long-running queries: KILL <query_id>;
├─ Restart database: systemctl restart mysql
├─ Clear application cache: php artisan cache:clear
├─ Disable slow endpoints temporarily (feature flag)
└─ Scale up resources if needed

Step 4: Investigate
├─ Check error logs
├─ Review last code deployment
├─ Check database size growth
└─ Monitor query performance
```

---

## NEED HELP?

**Quick Reference Files:**
1. **EXECUTIVE_SUMMARY.md** - High-level overview
2. **PERFORMANCE_ANALYSIS_REPORT.md** - Detailed technical analysis
3. **PERFORMANCE_FIXES_QUICK_GUIDE.md** - Implementation guide with code
4. **This file** - Decision trees and troubleshooting

**Tools Used in Analysis:**
- Laravel Query Analysis
- MySQL EXPLAIN OUTPUT
- Database Index Review
- Code Path Tracing
- Migration Inspection

**Contact & Support:**
- For technical questions: See specific fix in PERFORMANCE_FIXES_QUICK_GUIDE.md
- For architecture decisions: See PERFORMANCE_ANALYSIS_REPORT.md
- For quick wins: Start with Phase 1 in EXECUTIVE_SUMMARY.md

