import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const taxEventSchema = z.object({
  type: z.enum(['income', 'expense', 'wht']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('UGX'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  source: z.string().optional(),
  receiptUrl: z.string().optional(),
  deductible: z.boolean().default(false),
  whtAmount: z.number().min(0).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const year = searchParams.get('year') ?? String(new Date().getFullYear());

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const where: Record<string, unknown> = {
      userId: session.user.id,
      date: { gte: startDate, lte: endDate },
    };
    if (type) where.type = type;

    const events = await prisma.taxEvent.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(events);
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
    const data = taxEventSchema.parse(body);

    const event = await prisma.taxEvent.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId: session.user.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
