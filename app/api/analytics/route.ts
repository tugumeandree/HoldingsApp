import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all data in parallel
    const [
      lands,
      labours,
      capitals,
      technologies,
      dataAssets,
      businesses,
    ] = await Promise.all([
      prisma.land.findMany({ where: { userId } }),
      prisma.labour.findMany({ where: { userId } }),
      prisma.capital.findMany({ where: { userId } }),
      prisma.technology.findMany({ where: { userId } }),
      prisma.data.findMany({ where: { userId } }),
      prisma.business.findMany({ where: { userId } }),
    ]);

    // Calculate total portfolio value
    const landValue = lands.reduce((sum, land) => sum + land.value, 0);
    const capitalValue = capitals.reduce((sum, cap) => sum + cap.amount, 0);
    const techValue = technologies.reduce((sum, tech) => sum + tech.purchasePrice, 0);
    const businessValue = businesses.reduce((sum, biz) => sum + biz.currentValue, 0);
    const totalValue = landValue + capitalValue + techValue + businessValue;

    // Resource distribution
    const resourceDistribution = [
      { name: 'Land', value: landValue, count: lands.length },
      { name: 'Capital', value: capitalValue, count: capitals.length },
      { name: 'Technology', value: techValue, count: technologies.length },
      { name: 'Businesses', value: businessValue, count: businesses.length },
    ].filter(item => item.value > 0);

    // Capital by type
    const capitalByType = capitals.reduce((acc: any[], capital) => {
      const existing = acc.find(item => item.type === capital.type);
      if (existing) {
        existing.amount += capital.amount;
      } else {
        acc.push({ type: capital.type, amount: capital.amount });
      }
      return acc;
    }, []);

    // Business performance
    const businessPerformance = businesses.map(biz => ({
      name: biz.name,
      revenue: biz.annualRevenue || 0,
      value: biz.currentValue,
      roi: biz.currentValue > 0 
        ? ((biz.currentValue - biz.investmentAmount) / biz.investmentAmount * 100)
        : 0,
    }));

    // Labour distribution by department
    const labourDistribution = labours.reduce((acc: any[], labour) => {
      const existing = acc.find(item => item.department === labour.department);
      if (existing) {
        existing.count += 1;
        existing.totalSalary += labour.salary;
      } else {
        acc.push({
          department: labour.department,
          count: 1,
          totalSalary: labour.salary,
        });
      }
      return acc;
    }, []);

    // Technology status distribution
    const technologyStatus = technologies.reduce((acc: any[], tech) => {
      const existing = acc.find(item => item.status === tech.status);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ status: tech.status, count: 1 });
      }
      return acc;
    }, []);

    // Monthly trends (simplified - using creation dates)
    const getMonthKey = (date: Date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return getMonthKey(date);
    });

    const monthlyTrends = last6Months.map(month => {
      const monthLands = lands.filter(l => getMonthKey(l.createdAt) === month).length;
      const monthCapital = capitals
        .filter(c => getMonthKey(c.createdAt) === month)
        .reduce((sum, c) => sum + c.amount, 0);
      const monthBusinesses = businesses.filter(b => getMonthKey(b.createdAt) === month).length;

      return {
        month,
        lands: monthLands,
        capital: monthCapital,
        businesses: monthBusinesses,
      };
    });

    return NextResponse.json({
      totalValue,
      resourceDistribution,
      capitalByType,
      monthlyTrends,
      businessPerformance,
      labourDistribution,
      technologyStatus,
      summary: {
        totalResources: lands.length + labours.length + capitals.length + 
                       technologies.length + dataAssets.length + businesses.length,
        totalEmployees: labours.length,
        totalPayroll: labours.reduce((sum, l) => sum + l.salary, 0),
        averageROI: businessPerformance.length > 0
          ? businessPerformance.reduce((sum, b) => sum + b.roi, 0) / businessPerformance.length
          : 0,
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
