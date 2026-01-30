import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [lands, labours, capitals, technologies, data, businesses] =
      await Promise.all([
        prisma.land.count({ where: { userId: session.user.id } }),
        prisma.labour.count({ where: { userId: session.user.id } }),
        prisma.capital.count({ where: { userId: session.user.id } }),
        prisma.technology.count({ where: { userId: session.user.id } }),
        prisma.data.count({ where: { userId: session.user.id } }),
        prisma.business.count({ where: { userId: session.user.id } }),
      ]);

    return NextResponse.json({
      lands,
      labours,
      capitals,
      technologies,
      data,
      businesses,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
