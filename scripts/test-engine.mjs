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
    };
  });

  expenses.forEach((e) => {
    const expenseCents = Math.round(Number(e.amount) * 100);
    totalSpentCents += expenseCents;

    if (memberTotals[e.paid_by.id]) {
      memberTotals[e.paid_by.id].total_paid_cents += expenseCents;
    }

    if (e.split_mode === "equal" || !e.splits || e.splits.length === 0) {
      const count = Math.max(members.length, 1);
      const baseCents = Math.floor(expenseCents / count);
      const remainderCents = expenseCents % count;

      members.forEach((m, idx) => {
        if (memberTotals[m.id]) {
          const shareCents = baseCents + (idx < remainderCents ? 1 : 0);
          memberTotals[m.id].total_owed_cents += shareCents;
        }
      });
    } else {
      e.splits.forEach((sp) => {
        if (memberTotals[sp.user_id]) {
          memberTotals[sp.user_id].total_owed_cents += Math.round(Number(sp.amount) * 100);
        }
      });
    }
  });

  settlements.forEach((s) => {
    const settleCents = Math.round(Number(s.amount) * 100);
    if (memberTotals[s.from_member.id]) {
      memberTotals[s.from_member.id].total_paid_cents += settleCents;
    }
    if (memberTotals[s.to_member.id]) {
      memberTotals[s.to_member.id].total_owed_cents += settleCents;
    }
  });

  const memberBalances = Object.values(memberTotals).map((mt) => {
    const netCents = mt.total_paid_cents - mt.total_owed_cents;
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
