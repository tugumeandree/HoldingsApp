import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['pending', 'filed', 'paid', 'overdue']).optional(),
  dueDate: z.string().optional(),
  filedDate: z.string().optional(),
  taxAmount: z.number().optional(),
  description: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exists = await prisma.complianceItem.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.complianceItem.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.filedDate && { filedDate: new Date(data.filedDate) }),
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

    const exists = await prisma.complianceItem.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.complianceItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
