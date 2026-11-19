import test from 'node:test';
import assert from 'node:assert/strict';

// Pure algorithm replicate of exact integer cents getSummary logic
function computeSummary(space, expenses, settlements) {
  const members = space.members;
  let totalSpentCents = 0;
  const memberTotals = {};

  members.forEach((m) => {
    memberTotals[m.id] = {
      member: m,
      total_paid_cents: 0,
      total_owed_cents: 0,
      settled_paid_cents: 0,
      settled_received_cents: 0,
    };
  });

  const ensureMember = (memberId, fallback) => {
    if (!memberTotals[memberId]) {
      const found = members.find((m) => m.id === memberId) || fallback;
      memberTotals[memberId] = {
        member: found || {
          id: memberId,
          name: "Former Member",
          email: "",
          role: "member",
        },
        total_paid_cents: 0,
        total_owed_cents: 0,
        settled_paid_cents: 0,
        settled_received_cents: 0,
      };
    }
  };

  expenses.forEach((e) => {
    const expenseCents = Math.round(Number(e.amount) * 100);
    totalSpentCents += expenseCents;

    if (e.payers && Array.isArray(e.payers) && e.payers.length > 0) {
      e.payers.forEach((p) => {
        const payerCents = Math.round(Number(p.amount) * 100);
        ensureMember(p.user_id);
        if (memberTotals[p.user_id]) {
          memberTotals[p.user_id].total_paid_cents += payerCents;
        }
      });
    } else {
      ensureMember(e.paid_by.id, e.paid_by);
      memberTotals[e.paid_by.id].total_paid_cents += expenseCents;
    }

    if (e.splits && e.splits.length > 0) {
      e.splits.forEach((sp) => {
        ensureMember(sp.user_id);
        if (memberTotals[sp.user_id]) {
          memberTotals[sp.user_id].total_owed_cents += Math.round(Number(sp.amount) * 100);
        }
      });
    } else {
      const count = Math.max(members.length, 1);
      const baseCents = Math.floor(expenseCents / count);
      const remainderCents = expenseCents % count;

      members.forEach((m, idx) => {
        ensureMember(m.id, m);
        if (memberTotals[m.id]) {
          const shareCents = baseCents + (idx < remainderCents ? 1 : 0);
          memberTotals[m.id].total_owed_cents += shareCents;
        }
      });
    }
  });

  settlements.forEach((s) => {
    const settleCents = Math.round(Number(s.amount) * 100);
    ensureMember(s.from_member.id, s.from_member);
    ensureMember(s.to_member.id, s.to_member);
    if (memberTotals[s.from_member.id]) {
      memberTotals[s.from_member.id].settled_paid_cents += settleCents;
    }
    if (memberTotals[s.to_member.id]) {
      memberTotals[s.to_member.id].settled_received_cents += settleCents;
    }
  });

  const memberBalances = Object.values(memberTotals).map((mt) => {
    const netCents = (mt.total_paid_cents - mt.total_owed_cents) + (mt.settled_paid_cents - mt.settled_received_cents);
    return {
      member: mt.member,
      total_paid: mt.total_paid_cents / 100,
      total_owed: mt.total_owed_cents / 100,
      net_balance: netCents / 100,
      _netCents: netCents,
    };
  });

  const debtors = [];
  const creditors = [];

  memberBalances.forEach((mb) => {
    if (mb._netCents < 0) {
      debtors.push({ member: mb.member, balanceCents: -mb._netCents });
    } else if (mb._netCents > 0) {
      creditors.push({ member: mb.member, balanceCents: mb._netCents });
    }
  });

  const settlementInstructions = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settleCents = Math.min(debtor.balanceCents, creditor.balanceCents);

    if (settleCents > 0) {
      settlementInstructions.push({
        from_member: debtor.member,
        to_member: creditor.member,
        amount: settleCents / 100,
      });
    }

    debtor.balanceCents -= settleCents;
    creditor.balanceCents -= settleCents;
    if (debtor.balanceCents === 0) dIdx++;
    if (creditor.balanceCents === 0) cIdx++;
  }

  return {
    total_spent: totalSpentCents / 100,
    settlements: settlementInstructions,
    member_balances: memberBalances,
  };
}

test('Equal Split: eliminates penny rounding drift across odd member counts', () => {
  const space = {
    members: [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
      { id: 'm3', name: 'Charlie' },
    ]
  };

  const expenses = [
    {
      id: 'e1',
      amount: 10.00,
      paid_by: { id: 'm1', name: 'Alice' },
      split_mode: 'equal',
    }
  ];

  const summary = computeSummary(space, expenses, []);
  
  assert.equal(summary.total_spent, 10.00);
  
  const m1 = summary.member_balances.find(b => b.member.id === 'm1');
  const m2 = summary.member_balances.find(b => b.member.id === 'm2');
  const m3 = summary.member_balances.find(b => b.member.id === 'm3');

  // Sum of net balances must be EXACTLY zero
  const netSum = m1.net_balance + m2.net_balance + m3.net_balance;
  assert.equal(Math.round(netSum * 100) / 100, 0);

  // Total owed across all members must equal total paid ($10.00)
  const totalOwed = m1.total_owed + m2.total_owed + m3.total_owed;
  assert.equal(Math.round(totalOwed * 100) / 100, 10.00);

  // Settlement should resolve the debt cleanly
  assert.equal(summary.settlements.length, 2);
  const totalSettled = summary.settlements.reduce((acc, s) => acc + s.amount, 0);
  assert.equal(Math.round(totalSettled * 100) / 100, 6.66);
});

test('Circular Debt Simplification: transitive debt collapse', () => {
  const space = {
    members: [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
      { id: 'm3', name: 'Charlie' },
    ]
  };

  // Alice pays $30 for Bob only
  // Bob pays $30 for Charlie only
  const expenses = [
    {
      id: 'e1',
      amount: 30.00,
      paid_by: { id: 'm1', name: 'Alice' },
      split_mode: 'exact',
      splits: [{ user_id: 'm2', amount: 30.00 }]
    },
    {
      id: 'e2',
      amount: 30.00,
      paid_by: { id: 'm2', name: 'Bob' },
      split_mode: 'exact',
      splits: [{ user_id: 'm3', amount: 30.00 }]
    }
  ];

  const summary = computeSummary(space, expenses, []);
  
  // Bob has net_balance 0 (paid 30, owes 30)
  // Alice is owed 30, Charlie owes 30
  // Greedy algorithm should output exactly ONE direct settlement: Charlie -> Alice ($30)
  assert.equal(summary.settlements.length, 1);
  assert.equal(summary.settlements[0].from_member.id, 'm3');
  assert.equal(summary.settlements[0].to_member.id, 'm1');
  assert.equal(summary.settlements[0].amount, 30.00);
});

test('Direct settlement recording reconciles balance to zero', () => {
  const space = {
    members: [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
    ]
  };

  const expenses = [
    {
      id: 'e1',
      amount: 50.00,
      paid_by: { id: 'm1', name: 'Alice' },
      split_mode: 'equal',
    }
  ];

  // Bob pays Alice $25 direct settlement
  const settlements = [
    {
      id: 's1',
      amount: 25.00,
      from_member: { id: 'm2', name: 'Bob' },
      to_member: { id: 'm1', name: 'Alice' },
    }
  ];

  const summary = computeSummary(space, expenses, settlements);

  const m1 = summary.member_balances.find(b => b.member.id === 'm1');
  const m2 = summary.member_balances.find(b => b.member.id === 'm2');

  assert.equal(m1.net_balance, 0);
  assert.equal(m2.net_balance, 0);
  assert.equal(summary.settlements.length, 0);
});

test('Subset Equal Split: respects selected splits instead of dividing among all space members', () => {
  const space = {
    members: [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
      { id: 'm3', name: 'Charlie' },
    ]
  };

  // Alice pays $30 for lunch with Bob ONLY (Charlie is excluded)
  const expenses = [
    {
      id: 'e1',
      amount: 30.00,
      paid_by: { id: 'm1', name: 'Alice' },
      split_mode: 'equal',
      splits: [
        { user_id: 'm1', amount: 15.00 },
        { user_id: 'm2', amount: 15.00 },
      ]
    }
  ];

  const summary = computeSummary(space, expenses, []);

  const m1 = summary.member_balances.find(b => b.member.id === 'm1');
  const m2 = summary.member_balances.find(b => b.member.id === 'm2');
  const m3 = summary.member_balances.find(b => b.member.id === 'm3');

  // Alice paid 30, owes 15 -> net +15
  assert.equal(m1.net_balance, 15.00);
  // Bob paid 0, owes 15 -> net -15
  assert.equal(m2.net_balance, -15.00);
  // Charlie was not in the split -> net 0
  assert.equal(m3.net_balance, 0);

  // Settlement should be Bob -> Alice $15, Charlie has nothing to pay
  assert.equal(summary.settlements.length, 1);
  assert.equal(summary.settlements[0].from_member.id, 'm2');
  assert.equal(summary.settlements[0].to_member.id, 'm1');
  assert.equal(summary.settlements[0].amount, 15.00);
});

test('Departed Member: retains balance equilibrium without dropping orphaned funds', () => {
  const space = {
    members: [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
    ]
  };

  // Former member 'm_former' paid $40 for Alice & Bob, but m_former has left the space
  const expenses = [
    {
      id: 'e1',
      amount: 40.00,
      paid_by: { id: 'm_former', name: 'Former Member' },
      split_mode: 'equal',
      splits: [
        { user_id: 'm1', amount: 20.00 },
        { user_id: 'm2', amount: 20.00 },
      ]
    }
  ];

  const summary = computeSummary(space, expenses, []);

  // Net balances across all participants must sum to EXACTLY 0
  const netSum = summary.member_balances.reduce((acc, mb) => acc + mb.net_balance, 0);
  assert.equal(Math.abs(Math.round(netSum * 100) / 100), 0);
  assert.equal(summary.member_balances.length, 3);
});

test('Case 1.2: High-Modulus Remainder Cascade (7 Members, €100.00 Expense)', () => {
  const space = {
    members: Array.from({ length: 7 }, (_, i) => ({ id: `m${i + 1}`, name: `User ${i + 1}` }))
  };

  const expenses = [
    {
      id: 'e1',
      amount: 100.00,
      paid_by: { id: 'm1', name: 'User 1' },
      split_mode: 'equal',
    }
  ];

  const summary = computeSummary(space, expenses, []);
  assert.equal(summary.total_spent, 100.00);

  // Remainder: 10000 % 7 = 4 cents. First 4 members owe 14.29, remaining 3 owe 14.28.
  const m1 = summary.member_balances.find(b => b.member.id === 'm1');
  assert.equal(m1.total_owed, 14.29);
  assert.equal(m1.net_balance, 85.71); // Paid 100 - Owed 14.29

  const m5 = summary.member_balances.find(b => b.member.id === 'm5');
  assert.equal(m5.total_owed, 14.28);
  assert.equal(m5.net_balance, -14.28);

  const netSum = summary.member_balances.reduce((acc, mb) => acc + mb.net_balance, 0);
  assert.equal(Math.abs(Math.round(netSum * 100) / 100), 0);
  assert.equal(summary.settlements.length, 6);
});

test('Case 1.3: Heavy Repetition Drift Test (13 Members, 100 Micro-Expenses)', () => {
  const space = {
    members: Array.from({ length: 13 }, (_, i) => ({ id: `m${i + 1}`, name: `User ${i + 1}` }))
  };

  const expenses = Array.from({ length: 100 }, (_, i) => ({
    id: `exp_${i}`,
    amount: 1.00,
    paid_by: { id: 'm1', name: 'User 1' },
    split_mode: 'equal',
  }));

  const summary = computeSummary(space, expenses, []);
  assert.equal(summary.total_spent, 100.00);

  const netSum = summary.member_balances.reduce((acc, mb) => acc + mb.net_balance, 0);
  assert.equal(Math.abs(Math.round(netSum * 100) / 100), 0);

  const m1 = summary.member_balances.find(b => b.member.id === 'm1');
  assert.equal(m1.net_balance, 92.00);
});

test('Case 1.4: 3-Party Ring Cycle Collapse (A -> B -> C -> A = 0)', () => {
  const space = {
    members: [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
      { id: 'm3', name: 'Charlie' },
    ]
  };

  const expenses = [
    {
      id: 'e1',
      amount: 30.00,
      paid_by: { id: 'm1', name: 'Alice' },
      split_mode: 'exact',
      splits: [{ user_id: 'm2', amount: 30.00 }]
    },
    {
      id: 'e2',
      amount: 30.00,
      paid_by: { id: 'm2', name: 'Bob' },
      split_mode: 'exact',
      splits: [{ user_id: 'm3', amount: 30.00 }]
    },
    {
      id: 'e3',
      amount: 30.00,
      paid_by: { id: 'm3', name: 'Charlie' },
      split_mode: 'exact',
      splits: [{ user_id: 'm1', amount: 30.00 }]
    }
  ];

  const summary = computeSummary(space, expenses, []);
  assert.equal(summary.total_spent, 90.00);
  summary.member_balances.forEach(b => assert.equal(b.net_balance, 0));
  assert.equal(summary.settlements.length, 0);
});

test('Case 1.6: 5-Node Asymmetric Graph Minimal Transfers (Star + Ring Hybrid)', () => {
  const space = {
    members: [
      { id: 'mA', name: 'Amy' },
      { id: 'mB', name: 'Ben' },
      { id: 'mC', name: 'Chris' },
      { id: 'mD', name: 'Dan' },
      { id: 'mE', name: 'Eva' },
    ]
  };

  const expenses = [
    {
      id: 'e1',
      amount: 100.00,
      paid_by: { id: 'mA', name: 'Amy' },
      split_mode: 'equal',
    },
    {
      id: 'e2',
      amount: 60.00,
      paid_by: { id: 'mB', name: 'Ben' },
      split_mode: 'exact',
      splits: [
        { user_id: 'mC', amount: 20.00 },
        { user_id: 'mD', amount: 20.00 },
        { user_id: 'mE', amount: 20.00 },
      ]
    },
    {
      id: 'e3',
      amount: 40.00,
      paid_by: { id: 'mC', name: 'Chris' },
      split_mode: 'exact',
      splits: [
        { user_id: 'mD', amount: 20.00 },
        { user_id: 'mE', amount: 20.00 },
      ]
    }
  ];

  const summary = computeSummary(space, expenses, []);
  
  // Amy Net: +80, Ben Net: +40, Chris Net: 0, Dan Net: -60, Eva Net: -60
  const mA = summary.member_balances.find(b => b.member.id === 'mA');
  const mB = summary.member_balances.find(b => b.member.id === 'mB');
  const mC = summary.member_balances.find(b => b.member.id === 'mC');
  const mD = summary.member_balances.find(b => b.member.id === 'mD');
  const mE = summary.member_balances.find(b => b.member.id === 'mE');

  assert.equal(mA.net_balance, 80.00);
  assert.equal(mB.net_balance, 40.00);
  assert.equal(mC.net_balance, 0.00);
  assert.equal(mD.net_balance, -60.00);
  assert.equal(mE.net_balance, -60.00);

  // Max settlements should be <= 3 (reduced from potentially 8 pairwise transactions)
  assert.equal(summary.settlements.length, 3);
  const totalSettled = summary.settlements.reduce((sum, s) => sum + s.amount, 0);
  assert.equal(totalSettled, 120.00);
});

test('Case 1.13: Scale Stress ($100,000,000.00 Transaction)', () => {
  const space = {
    members: [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
    ]
  };

  const expenses = [
    {
      id: 'e1',
      amount: 100000000.00,
      paid_by: { id: 'm1', name: 'Alice' },
      split_mode: 'equal',
    }
  ];

  const summary = computeSummary(space, expenses, []);
  assert.equal(summary.total_spent, 100000000.00);
  assert.equal(summary.settlements.length, 1);
  assert.equal(summary.settlements[0].amount, 50000000.00);
});

test('Case 1.14: Multi-Payer Split Expense (Co-payments by multiple members)', () => {
  const space = {
    members: [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
      { id: 'm3', name: 'Charlie' },
    ]
  };

  // $120.00 dinner: Alice paid $70, Bob paid $50. Split equally among all 3 ($40 each).
  const expenses = [
    {
      id: 'e1',
      amount: 120.00,
      paid_by: { id: 'm1', name: 'Alice' },
      payers: [
        { user_id: 'm1', amount: 70.00 },
        { user_id: 'm2', amount: 50.00 },
      ],
      split_mode: 'equal',
    }
  ];

  const summary = computeSummary(space, expenses, []);
  assert.equal(summary.total_spent, 120.00);

  const b1 = summary.member_balances.find(b => b.member.id === 'm1');
  const b2 = summary.member_balances.find(b => b.member.id === 'm2');
  const b3 = summary.member_balances.find(b => b.member.id === 'm3');

  // Alice: paid 70, owed 40 -> net +30
  // Bob: paid 50, owed 40 -> net +10
  // Charlie: paid 0, owed 40 -> net -40
  assert.equal(b1.total_paid, 70.00);
  assert.equal(b1.total_owed, 40.00);
  assert.equal(b1.net_balance, 30.00);

  assert.equal(b2.total_paid, 50.00);
  assert.equal(b2.total_owed, 40.00);
  assert.equal(b2.net_balance, 10.00);

  assert.equal(b3.total_paid, 0.00);
  assert.equal(b3.total_owed, 40.00);
  assert.equal(b3.net_balance, -40.00);

  // Settlement should be exactly: Charlie pays Alice $30, Charlie pays Bob $10
  assert.equal(summary.settlements.length, 2);
  const toAlice = summary.settlements.find(s => s.to_member.id === 'm1');
  const toBob = summary.settlements.find(s => s.to_member.id === 'm2');
  assert.equal(toAlice.from_member.id, 'm3');
  assert.equal(toAlice.amount, 30.00);
  assert.equal(toBob.from_member.id, 'm3');
  assert.equal(toBob.amount, 10.00);
});
