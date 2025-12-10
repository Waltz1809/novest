/**
 * API Test Script
 * Run: npx tsx scripts/test-api.ts
 * 
 * Requires dev server running at localhost:3000
 */

const BASE_URL = "http://localhost:3000";

interface TestResult {
    endpoint: string;
    method: string;
    status: number;
    success: boolean;
    time: number;
    error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
    method: string,
    endpoint: string,
    options?: { body?: object; expectStatus?: number }
): Promise<TestResult> {
    const start = Date.now();
    const expectStatus = options?.expectStatus || 200;

    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            ...(options?.body && { body: JSON.stringify(options.body) }),
        });

        const data = await res.json().catch(() => ({}));
        const time = Date.now() - start;
        const success = res.status === expectStatus && (data.success !== false);

        const result: TestResult = {
            endpoint,
            method,
            status: res.status,
            success,
            time,
            ...(success ? {} : { error: data.error || `Unexpected status ${res.status}` }),
        };

        results.push(result);
        return result;
    } catch (error) {
        const result: TestResult = {
            endpoint,
            method,
            status: 0,
            success: false,
            time: Date.now() - start,
            error: error instanceof Error ? error.message : "Unknown error",
        };
        results.push(result);
        return result;
    }
}

function log(result: TestResult) {
    const icon = result.success ? "✅" : "❌";
    const statusColor = result.success ? "\x1b[32m" : "\x1b[31m";
    const reset = "\x1b[0m";

    console.log(
        `${icon} ${result.method.padEnd(6)} ${result.endpoint.padEnd(40)} ${statusColor}${result.status}${reset} (${result.time}ms)${result.error ? ` - ${result.error}` : ""}`
    );
}

async function runTests() {
    console.log("\n🔬 Testing Novest API Endpoints\n");
    console.log("─".repeat(80));

    // ============ PUBLIC READ APIS ============
    console.log("\n📖 PUBLIC READ APIs\n");

    // Genres
    log(await testEndpoint("GET", "/api/genres"));
    log(await testEndpoint("GET", "/api/genres?withCount=true"));

    // Search
    log(await testEndpoint("GET", "/api/search?q=test&mode=quick"));
    log(await testEndpoint("GET", "/api/search?q=test&page=1&limit=10"));

    // Rankings
    log(await testEndpoint("GET", "/api/rankings?type=views&limit=5"));
    log(await testEndpoint("GET", "/api/rankings?type=rating&limit=5"));
    log(await testEndpoint("GET", "/api/rankings?type=latest&limit=5"));

    // Novels
    log(await testEndpoint("GET", "/api/novels"));
    log(await testEndpoint("GET", "/api/novels?page=1&limit=5"));

    // ============ AUTH REQUIRED APIS ============
    console.log("\n🔐 AUTH REQUIRED APIs (expect 401/403 without auth)\n");

    // Notifications (requires auth)
    log(await testEndpoint("GET", "/api/notifications", { expectStatus: 401 }));

    // Library (requires auth)
    log(await testEndpoint("GET", "/api/library", { expectStatus: 401 }));

    // Comments - GET is public
    log(await testEndpoint("GET", "/api/comments?novelId=1"));

    // ============ ADMIN APIS ============
    console.log("\n👑 ADMIN APIs (expect 403 without admin auth)\n");

    log(await testEndpoint("GET", "/api/admin/stats", { expectStatus: 403 }));
    log(await testEndpoint("GET", "/api/admin/users", { expectStatus: 403 }));
    log(await testEndpoint("GET", "/api/admin/novels", { expectStatus: 403 }));
    log(await testEndpoint("GET", "/api/admin/comments", { expectStatus: 403 }));
    log(await testEndpoint("GET", "/api/admin/tickets", { expectStatus: 403 }));

    // ============ SUMMARY ============
    console.log("\n" + "─".repeat(80));
    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalTime = results.reduce((sum, r) => sum + r.time, 0);

    console.log(`\n📊 Summary: ${passed} passed, ${failed} failed, ${results.length} total`);
    console.log(`⏱️  Total time: ${totalTime}ms`);

    if (failed > 0) {
        console.log("\n❌ Failed tests:");
        results
            .filter((r) => !r.success)
            .forEach((r) => console.log(`   - ${r.method} ${r.endpoint}: ${r.error}`));
    }

    console.log("\n");
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
