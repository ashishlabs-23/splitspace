const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

const serviceAccountPath = path.resolve(__dirname, "../../service-account.json");
const serviceAccount = require(serviceAccountPath);

const app = getApps().length === 0 ? initializeApp({
  credential: cert(serviceAccount),
  projectId: "splitspace-9d28f",
}) : getApps()[0];

const db = getFirestore(app);

async function initFirestore() {
  console.log("🚀 Initializing Cloud Firestore collections for SplitSpace...");

  // 1. Seed Demo User
  const demoUserId = "demo-user-ashish";
  const userRef = db.collection("users").doc(demoUserId);
  await userRef.set({
    id: demoUserId,
    email: "demo@splitspace.local",
    name: "Ashish",
    avatar: null,
    createdAt: new Date().toISOString(),
  });
  console.log("✅ Seeded User: demo@splitspace.local");

  // 2. Seed Default Space (Goa Weekend)
  const spaceId = "demo-space-goa";
  const spaceRef = db.collection("spaces").doc(spaceId);

  const members = [
    { id: "mem-ashish", name: "Ashish", email: "demo@splitspace.local", role: "owner", userId: demoUserId },
    { id: "mem-yatin", name: "Yatin", email: "yatin@example.com", role: "member", userId: "" },
    { id: "mem-rohan", name: "Rohan", email: "rohan@example.com", role: "member", userId: "" },
    { id: "mem-neha", name: "Neha", email: "neha@example.com", role: "member", userId: "" },
  ];

  await spaceRef.set({
    id: spaceId,
    title: "Goa Weekend",
    emoji: "🌴",
    period: "18–20 Aug 2026",
    currency: "INR",
    createdBy: demoUserId,
    memberUids: [demoUserId],
    members: members,
    createdAt: new Date().toISOString(),
  });
  console.log("✅ Seeded Space: Goa Weekend (ID: demo-space-goa)");

  // 3. Seed Expenses Subcollection
  const expenses = [
    {
      id: "exp-1",
      title: "Villa booking",
      amount: 8800,
      currency: "INR",
      original_amount: 8800,
      original_currency: "INR",
      exchange_rate: 1.0,
      paid_by: members[0],
      category: "accommodation",
      note: "2 nights booking",
      split_mode: "equal",
      splits: members.map((m) => ({ user_id: m.id, amount: 2200 })),
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "exp-2",
      title: "Airport cabs",
      amount: 1460,
      currency: "INR",
      original_amount: 1460,
      original_currency: "INR",
      exchange_rate: 1.0,
      paid_by: members[3],
      category: "transport",
      note: "Both ways",
      split_mode: "equal",
      splits: members.map((m) => ({ user_id: m.id, amount: 365 })),
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "exp-3",
      title: "Dinner — Day 1",
      amount: 2240,
      currency: "INR",
      original_amount: 2240,
      original_currency: "INR",
      exchange_rate: 1.0,
      paid_by: members[1],
      category: "food",
      note: "Beach shack dinner",
      split_mode: "equal",
      splits: members.map((m) => ({ user_id: m.id, amount: 560 })),
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: "exp-4",
      title: "Scooter rental",
      amount: 2100,
      currency: "INR",
      original_amount: 2100,
      original_currency: "INR",
      exchange_rate: 1.0,
      paid_by: members[2],
      category: "transport",
      note: "2 scooters for 2 days",
      split_mode: "equal",
      splits: members.map((m) => ({ user_id: m.id, amount: 525 })),
      created_at: new Date().toISOString(),
    },
  ];

  for (const exp of expenses) {
    await spaceRef.collection("expenses").doc(exp.id).set(exp);
  }
  console.log(`✅ Seeded ${expenses.length} Expenses in Goa Weekend`);

  // 4. Seed Direct Settlement Payment
  const settlement = {
    id: "settle-1",
    space_id: spaceId,
    from_member: members[1],
    to_member: members[0],
    amount: 500,
    currency: "INR",
    note: "Partial advance payment via UPI",
    created_at: new Date().toISOString(),
  };
  await spaceRef.collection("settlements").doc(settlement.id).set(settlement);
  console.log("✅ Seeded Settlement: Yatin paid Ashish ₹500");

  console.log("\n🎉 Cloud Firestore initialization complete! Your database is live.");
}

initFirestore().catch((err) => {
  console.error("❌ Firestore setup error:", err);
  process.exit(1);
});
