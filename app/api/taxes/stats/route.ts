import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateAnnualPAYE } from '@/lib/tax-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    const [events, complianceItems] = await Promise.all([
      prisma.taxEvent.findMany({
        where: { userId: session.user.id, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'desc' },
      }),
      prisma.complianceItem.findMany({
        where: { userId: session.user.id },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const incomeEvents = events.filter((e) => e.type === 'income');
    const expenseEvents = events.filter((e) => e.type === 'expense');
    const whtEvents = events.filter((e) => e.type === 'wht');

    const totalIncomeYTD = incomeEvents.reduce((s, e) => s + e.amount, 0);
    const totalExpensesYTD = expenseEvents
      .filter((e) => e.deductible)
      .reduce((s, e) => s + e.amount, 0);
    const whtFromEvents = whtEvents.reduce((s, e) => s + e.amount, 0);
    const whtFromIncome = incomeEvents.reduce((s, e) => s + (e.whtAmount ?? 0), 0);
    const totalWHTCreditedYTD = whtFromEvents + whtFromIncome;

    const taxableIncome = Math.max(0, totalIncomeYTD - totalExpensesYTD);
    const estimatedPAYE = calculateAnnualPAYE(taxableIncome);
    const estimatedTaxDue = Math.max(0, estimatedPAYE - totalWHTCreditedYTD);

    // Compliance score
    const now = new Date();
    const overdueItems = complianceItems.filter(
      (c) => c.status === 'pending' && new Date(c.dueDate) < now
    );
    const pendingItems = complianceItems.filter(
      (c) => c.status === 'pending' && new Date(c.dueDate) >= now
    );
    const completedItems = complianceItems.filter(
      (c) => c.status === 'filed' || c.status === 'paid'
    );

    const complianceScore =
      complianceItems.length === 0
        ? 100
        : Math.max(
            0,
            Math.round(
              ((completedItems.length - overdueItems.length) / complianceItems.length) * 100
            )
          );

    const nextDeadline = pendingItems[0]
      ? {
          description: pendingItems[0].description ?? 'Tax Filing',
          dueDate: pendingItems[0].dueDate.toISOString(),
          daysLeft: Math.ceil(
            (new Date(pendingItems[0].dueDate).getTime() - now.getTime()) / 86400000
          ),
        }
      : null;

    // Monthly breakdown (12 months)
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = MONTHS.map((month, i) => {
      const monthEvents = events.filter((e) => new Date(e.date).getMonth() === i);
      const income = monthEvents.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
      const expenses = monthEvents.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
      const tax = income > 0 ? calculateAnnualPAYE(income) / 12 : 0;
      return { month, income, expenses, tax };
    });

    return NextResponse.json({
      totalIncomeYTD,
      totalExpensesYTD,
      totalWHTCreditedYTD,
      estimatedTaxDue,
      nextDeadline,
      complianceScore,
      recentEvents: events.slice(0, 6),
      monthlyBreakdown,
    });
  } catch (error) {
    console.error('Tax stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
