import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const complianceSchema = z.object({
  type: z.enum(['return', 'payment']),
  period: z.enum(['monthly', 'quarterly', 'annual']),
  dueDate: z.string().min(1),
  status: z.enum(['pending', 'filed', 'paid', 'overdue']).default('pending'),
  description: z.string().optional(),
  taxAmount: z.number().optional(),
  taxEventIds: z.string().default('[]'),
  filedDate: z.string().optional(),
});

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.complianceItem.findMany({
      where: { userId: session.user.id },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = complianceSchema.parse(body);

    const item = await prisma.complianceItem.create({
      data: {
        ...data,
        dueDate: new Date(data.dueDate),
        filedDate: data.filedDate ? new Date(data.filedDate) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
