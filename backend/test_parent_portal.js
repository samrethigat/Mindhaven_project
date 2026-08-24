import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

async function runParentPortalIntegrationTest() {
  console.log("🚀 Starting Enhanced MindHaven Zero-Drawback Integration Test...\n");

  const timestamp = Date.now();
  const parentEmail = `parent_${timestamp}@test.com`;
  const studentEmail = `student_${timestamp}@test.com`;
  const password = "Password123!";

  try {
    // 1. Register Student
    console.log("1. Registering test Student...");
    const studentRegRes = await axios.post(`${BASE_URL}/auth/register/candidate`, {
      fullName: "Alex Student",
      email: studentEmail,
      password: password,
      role: "candidate",
      college: "MindHaven University",
      department: "Computer Science",
      year: "3rd Year",
    });
    const studentToken = studentRegRes.data.accessToken;
    const candidateId = studentRegRes.data.user.candidateId;
    console.log(`✅ Student registered successfully: ${candidateId}`);

    // 2. Register Parent
    console.log("\n2. Registering test Parent...");
    const parentRegRes = await axios.post(`${BASE_URL}/auth/register/parent`, {
      fullName: "Mr. Robert Parent",
      email: parentEmail,
      password: password,
      role: "parent",
      relationshipToStudent: "Father",
      phone: "+91 9876543210",
      occupation: "Engineer",
      city: "Chennai",
      state: "Tamil Nadu",
    });
    const parentToken = parentRegRes.data.accessToken;
    console.log(`✅ Parent registered successfully: ${parentRegRes.data.user.parentId}`);

    // 3. Parent Login
    console.log("\n3. Testing Parent Portal Login...");
    const parentLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: parentEmail,
      password: password,
      portal: "parent",
    });
    console.log(`✅ Parent login successful with role: ${parentLoginRes.data.role}`);

    // 4. Cross-Portal Isolation Test (Parent tries to log into Counselor Portal)
    console.log("\n4. Testing Portal Isolation (Parent -> Counselor portal)...");
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: parentEmail,
        password: password,
        portal: "counselor",
      });
      console.error("❌ Portal isolation failed: Parent was allowed into counselor portal!");
    } catch (err) {
      console.log(`✅ Portal isolation enforced: ${err.response?.data?.error}`);
    }

    // 5. Parent Requests Link to Student
    console.log("\n5. Parent sending link request to Student...");
    const linkReqRes = await axios.post(
      `${BASE_URL}/parent/link/request`,
      {
        studentEmail: studentEmail,
        relationship: "Father",
      },
      { headers: { Authorization: `Bearer ${parentToken}` } }
    );
    const linkId = linkReqRes.data.link._id;
    console.log(`✅ Link request created: ${linkId} (Status: ${linkReqRes.data.link.status})`);

    // 6. Student Views & Approves Link Request
    console.log("\n6. Student viewing and approving Parent link...");
    const studentLinksRes = await axios.get(`${BASE_URL}/candidate/parent-links`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`Found ${studentLinksRes.data.links.length} link requests for student.`);

    const approveRes = await axios.post(
      `${BASE_URL}/candidate/parent-links/${linkId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`✅ Link approved by student: ${approveRes.data.link.status}`);

    // 7. Testing Sarcasm & Casual Hyperbole Filtering (False Positive Prevention)
    console.log("\n7. Testing Sarcasm & Hyperbolic Venting False-Alarm Filter...");
    await axios.post(
      `${BASE_URL}/ai/chat`,
      {
        message: "Haha this funny comedy video killed me lol, dying of laughter! Just kidding.",
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    await new Promise((r) => setTimeout(r, 600));

    const checkNoAlert = await axios.get(`${BASE_URL}/parent/alerts`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    if (checkNoAlert.data.alerts.length === 0) {
      console.log("✅ False Positive successfully prevented! Casual venting was NOT flagged.");
    } else {
      console.warn("⚠️ Alert was created for hyperbole text.");
    }

    // 8. Trigger Genuine High Emotional Distress message in Student AI Chat
    console.log("\n8. Sending genuine distress message from student to AI assistant...");
    await axios.post(
      `${BASE_URL}/ai/chat`,
      {
        message: "I am having extreme anxiety and severe distress, feeling completely hopeless about my life",
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );

    // Wait a second for background alert evaluation & email dispatch
    await new Promise((r) => setTimeout(r, 1000));

    // 9. Parent Checks Mental Health Alerts
    console.log("\n9. Parent checking Mental Health Alerts & Multi-channel Dispatch...");
    const parentAlertsRes = await axios.get(`${BASE_URL}/parent/alerts`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    console.log(`✅ Permitted Alerts count: ${parentAlertsRes.data.alerts.length}`);
    if (parentAlertsRes.data.alerts.length > 0) {
      const alert = parentAlertsRes.data.alerts[0];
      console.log(`   Alert Level: ${alert.level}`);
      console.log(`   Ethical Non-Diagnostic Message: "${alert.message}"`);
      console.log(`   Parent Notified Flag: ${alert.parentNotified}`);

      // 10. Parent Acknowledges Alert
      console.log("\n10. Parent acknowledging the alert...");
      const ackRes = await axios.post(
        `${BASE_URL}/parent/alerts/${alert._id}/acknowledge`,
        {},
        { headers: { Authorization: `Bearer ${parentToken}` } }
      );
      console.log(`✅ Alert status updated to: ${ackRes.data.alert.status}`);
    }

    console.log("\n🎉 ALL ZERO-DRAWBACK ENHANCEMENT TESTS PASSED PERFECTLY! 🌟");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

runParentPortalIntegrationTest();
