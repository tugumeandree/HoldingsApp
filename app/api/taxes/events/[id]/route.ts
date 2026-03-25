import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  type: z.enum(['income', 'expense', 'wht']).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  date: z.string().optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  source: z.string().optional(),
  receiptUrl: z.string().optional(),
  deductible: z.boolean().optional(),
  whtAmount: z.number().min(0).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await prisma.taxEvent.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exists = await prisma.taxEvent.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.taxEvent.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exists = await prisma.taxEvent.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.taxEvent.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
