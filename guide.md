
## 🛠️ Phase 1: Authentication & Role Setup

### Step 1.1: Register the Team
Go to the frontend Registration page (`/register`) and create three separate users:
1. **User 1:** `tl@example.com` | Role: **Team Lead (TL)**
2. **User 2:** `dev@example.com` | Role: **Developer**
3. **User 3:** `tester@example.com` | Role: **Tester**

*✅ Expected Result: Each should successfully redirect to the Dashboard.*

### Step 1.2: Verify Supreme Admin Login
You cannot register an Admin via the UI. 
1. Go to the Login page (`/login`).
2. If your frontend doesn't have a specific Admin login form yet, you can test this via **Postman** or **Thunder Client**:
   - **Method:** `POST http://localhost:5000/api/auth/admin-login`
   - **Body (JSON):** `{ "email": "admin@iqas.com", "password": "admin123" }`
3. *✅ Expected Result: You receive a 200 OK along with an Admin `token`.*

---

## 🏗️ Phase 2: Project Management (Admin & TL)

### Step 2.1: Admin Creates a Project
*(Requires Admin Token in Postman, or Admin logged into frontend if UI supports it)*
1. **Endpoint:** `POST http://localhost:5000/api/projects`
2. **Body:**
   ```json
   {
     "name": "Alpha E-Commerce App",
     "description": "Testing the new cart flow.",
     "project_head": "<Insert the MongoDB _id of your TL user here>"
   }
   ```
3. *✅ Expected Result: Project is created successfully in DB.*
4. *🐛 Debugging if it fails:* Ensure the token used belongs to the Admin. The route will block non-Admins.

### Step 2.2: Verify Project Visibility
1. Log into the frontend dashboard as the **Tester**.
2. *✅ Expected Result: The Tester should see "Alpha E-Commerce App" listed.*

---

## 🐞 Phase 3: Bug Reporting & Notifications

### Step 3.1: Tester Raises a Bug
1. As the **Tester**, click on "Alpha E-Commerce App" to view Project Details.
2. Click the "Report Bug" button.
3. Fill out the form (e.g., Title: "Cart crashes on checkout", Priority: "High"). Submit it.
4. *✅ Expected Result: Bug appears in the list.*

### Step 3.2: Verify Notifications Triggered
*(This step verifies the backend logic)*
1. Log in (or use Postman) as the **TL** user.
2. Endpoint `GET http://localhost:5000/api/notifications`
3. *✅ Expected Result: The TL should have a new notification stating: "New bug created: Cart crashes on checkout in project Alpha E-Commerce App".*

---

## 🎯 Phase 4: Bug Assignment (TL or Admin)

### Step 4.1: Assign the Developer
*(Requires TL or Admin login)*
1. As the **TL**, go to the Bug Details page for the bug just created.
2. If your frontend UI has an "Assign To" dropdown, select the **Developer** user and save.
   *(Or via Postman: `PUT http://localhost:5000/api/bugs/<bug_id>` with Body: `{ "assignedTo": "<Dev_User_ID>" }`)*
3. *✅ Expected Result: The bug assigns successfully.*
4. *🐛 Debugging if it fails:* Try doing this as the Tester. It **should fail** with a "403: Only Admin or TL can assign bugs" error.

### Step 4.2: Developer Notification Check
1. Log in as the **Developer**.
2. Check notifications (`GET /api/notifications`).
3. *✅ Expected Result: "You have been assigned to bug: Cart crashes on checkout".*

---

## 🔧 Phase 5: Fixing & Status Updates (Developer)

### Step 5.1: Dev Updates Status
1. As the **Developer**, view the assigned bug (`BugDetails.jsx`).
2. Change the status dropdown from `Open` to `In Progress`, and then to `Resolved`.
3. *✅ Expected Result: Status successfully changes.*

### Step 5.2: Verification Notifications
1. Log back in as the **TL** (and/or the **Tester**).
2. Check notifications.
3. *✅ Expected Result: They both receive a notification stating: "Bug status updated to Resolved: Cart crashes on checkout".*

---

## 💬 Phase 6: Communication (Everyone)

### Step 6.1: Add Comments
1. Everyone (Tester, Dev, TL) can go to the bug page and type a comment in the chat box at the bottom.
2. *✅ Expected Result: Comments appear in real-time or upon reload with accurate timestamps and usernames.*

---

## ⚠️ Common Debugging Tips

1. **401 Unauthorized:** Your JWT token expired or wasn't sent. Check frontend `localStorage` to ensure the token exists and is being attached to `axios` headers as `Bearer <token>`.
2. **403 Forbidden:** The authenticated user does not have the right `role` (e.g., a Dev trying to delete a project). Check your `User` collection in MongoDB to verify the user's role is exactly `Admin` or `TL`.
3. **500 Internal Error on Creating/Updating:** Usually means a required field matches the wrong data type (like sending an invalid MongoDB ObjectId for `project_head` or `assignedTo`). Look closely at the Node terminal running `server.js` for the exact stack trace.
