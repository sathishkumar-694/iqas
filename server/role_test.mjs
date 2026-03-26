// Role-based test script - registers TL, Dev, Tester users via API
const BASE = 'http://localhost:5000/api';

async function test() {
    // 1. Register new users
    const users = [
        { username: 'testTL', email: 'testtl@iqas.com', password: 'Test@1234', role: 'TL' },
        { username: 'testDev', email: 'testdev@iqas.com', password: 'Test@1234', role: 'Dev' },
        { username: 'testTester', email: 'testtester@iqas.com', password: 'Test@1234', role: 'Tester' },
    ];

    for (const u of users) {
        try {
            const res = await fetch(`${BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(u),
            });
            const data = await res.json();
            console.log(`Register ${u.role} (${u.email}): ${res.status}`, data._id || data.message || '');
        } catch (e) {
            console.error(`Register ${u.role} failed:`, e.message);
        }
    }

    // 2. Login as TL to get cookie
    const loginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testtl@iqas.com', password: 'Test@1234' }),
    });
    const loginData = await loginRes.json();
    const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
    const cookieStr = cookies.join('; ');
    console.log('TL Login:', loginRes.status, loginData._id || loginData.message);
    console.log('TL role:', loginData.role);
    console.log('TL id:', loginData._id);

    // 3. Create a project as TL
    const projRes = await fetch(`${BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieStr },
        body: JSON.stringify({ name: 'Role Test Project', description: 'Testing role-based access' }),
    });
    const projData = await projRes.json();
    console.log('Create Project:', projRes.status, projData._id || projData.message);
    const projectId = projData._id;

    if (!projectId) {
        console.log('FAILED to create project. Full response:', JSON.stringify(projData));
        return;
    }

    // 4. Login as admin to get user IDs
    const adminLoginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@iqas.com', password: 'admin123' }),
    });
    const adminData = await adminLoginRes.json();
    const adminCookies = adminLoginRes.headers.getSetCookie ? adminLoginRes.headers.getSetCookie() : [];
    const adminCookieStr = adminCookies.join('; ');
    console.log('Admin Login:', adminLoginRes.status, adminData._id);

    const usersRes = await fetch(`${BASE}/users`, {
        headers: { Cookie: adminCookieStr },
    });
    const usersList = await usersRes.json();
    console.log('Users list count:', usersList.length);
    
    const devUser = usersList.find(u => u.email === 'testdev@iqas.com');
    const testerUser = usersList.find(u => u.email === 'testtester@iqas.com');
    console.log('Dev ID:', devUser?._id, 'Tester ID:', testerUser?._id);

    // 5. Re-login as TL and add members + create bug
    const tlLogin2 = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testtl@iqas.com', password: 'Test@1234' }),
    });
    const tlCookies2 = tlLogin2.headers.getSetCookie ? tlLogin2.headers.getSetCookie() : [];
    const tlCookieStr2 = tlCookies2.join('; ');

    if (devUser) {
        const addDev = await fetch(`${BASE}/projects/${projectId}/members`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Cookie: tlCookieStr2 },
            body: JSON.stringify({ userId: devUser._id }),
        });
        const addDevData = await addDev.json();
        console.log('Add Dev to project:', addDev.status, addDevData.message || 'OK');
    }

    if (testerUser) {
        const addTester = await fetch(`${BASE}/projects/${projectId}/members`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Cookie: tlCookieStr2 },
            body: JSON.stringify({ userId: testerUser._id }),
        });
        const addTesterData = await addTester.json();
        console.log('Add Tester to project:', addTester.status, addTesterData.message || 'OK');
    }

    // 6. Create a bug assigned to Dev
    const bugRes = await fetch(`${BASE}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: tlCookieStr2 },
        body: JSON.stringify({
            title: 'Role Test Bug',
            description: 'Testing role-based bug assignment',
            priority: 'High',
            projectId: projectId,
            assignedTo: devUser?._id,
        }),
    });
    const bugData = await bugRes.json();
    console.log('Create Bug:', bugRes.status, bugData._id || bugData.message);
    const bugId = bugData._id;

    if (!bugId) {
        console.log('FAILED to create bug. Stopping.');
        return;
    }

    // ===== ROLE RESTRICTION TESTS =====
    console.log('\n=== ROLE RESTRICTION TESTS ===\n');

    // 7. Dev tests
    const devLoginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testdev@iqas.com', password: 'Test@1234' }),
    });
    const devCookies = devLoginRes.headers.getSetCookie ? devLoginRes.headers.getSetCookie() : [];
    const devCookieStr = devCookies.join('; ');
    console.log('Dev Login:', devLoginRes.status);

    // Dev -> In Progress (SHOULD PASS)
    const d1 = await fetch(`${BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: devCookieStr },
        body: JSON.stringify({ status: 'In Progress' }),
    });
    console.log('Dev -> In Progress:', d1.status, d1.status === 200 ? 'PASS ✅' : 'FAIL ❌');

    // Dev -> Closed (SHOULD FAIL 403)
    const d2 = await fetch(`${BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: devCookieStr },
        body: JSON.stringify({ status: 'Closed' }),
    });
    console.log('Dev -> Closed:', d2.status, d2.status === 403 ? 'BLOCKED ✅' : 'FAIL ❌');

    // Dev -> Resolved (SHOULD PASS)
    const d3 = await fetch(`${BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: devCookieStr },
        body: JSON.stringify({ status: 'Resolved' }),
    });
    console.log('Dev -> Resolved:', d3.status, d3.status === 200 ? 'PASS ✅' : 'FAIL ❌');

    // Dev -> Open (SHOULD FAIL 403)
    const d4 = await fetch(`${BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: devCookieStr },
        body: JSON.stringify({ status: 'Open' }),
    });
    console.log('Dev -> Open:', d4.status, d4.status === 403 ? 'BLOCKED ✅' : 'FAIL ❌');

    // Dev DELETE bug (SHOULD FAIL 403)
    const d5 = await fetch(`${BASE}/bugs/${bugId}`, {
        method: 'DELETE',
        headers: { Cookie: devCookieStr },
    });
    console.log('Dev DELETE bug:', d5.status, d5.status === 403 ? 'BLOCKED ✅' : 'FAIL ❌');

    // Dev GET /users (SHOULD FAIL 403)
    const d6 = await fetch(`${BASE}/users`, {
        headers: { Cookie: devCookieStr },
    });
    console.log('Dev GET /users:', d6.status, d6.status === 403 ? 'BLOCKED ✅' : 'FAIL ❌');

    // 8. Tester tests
    const testerLoginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testtester@iqas.com', password: 'Test@1234' }),
    });
    const testerCookies = testerLoginRes.headers.getSetCookie ? testerLoginRes.headers.getSetCookie() : [];
    const testerCookieStr = testerCookies.join('; ');
    console.log('\nTester Login:', testerLoginRes.status);

    // Tester -> In Progress (SHOULD FAIL 403)
    const t1 = await fetch(`${BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: testerCookieStr },
        body: JSON.stringify({ status: 'In Progress' }),
    });
    console.log('Tester -> In Progress:', t1.status, t1.status === 403 ? 'BLOCKED ✅' : 'FAIL ❌');

    // Tester -> Closed (SHOULD PASS)
    const t2 = await fetch(`${BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: testerCookieStr },
        body: JSON.stringify({ status: 'Closed' }),
    });
    console.log('Tester -> Closed:', t2.status, t2.status === 200 ? 'PASS ✅' : 'FAIL ❌');

    // Tester -> Open/Reopen (SHOULD PASS)
    const t3 = await fetch(`${BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: testerCookieStr },
        body: JSON.stringify({ status: 'Open' }),
    });
    console.log('Tester -> Open (Reopen):', t3.status, t3.status === 200 ? 'PASS ✅' : 'FAIL ❌');

    // Tester -> Resolved (SHOULD FAIL 403)
    const t4 = await fetch(`${BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: testerCookieStr },
        body: JSON.stringify({ status: 'Resolved' }),
    });
    console.log('Tester -> Resolved:', t4.status, t4.status === 403 ? 'BLOCKED ✅' : 'FAIL ❌');

    console.log('\n=== ROLE-BASED TESTING COMPLETE ===');
}

test().catch(console.error);
