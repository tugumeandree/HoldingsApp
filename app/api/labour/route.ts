import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const labourSchema = z.object({
  employeeName: z.string().min(1),
  position: z.string().min(1),
  department: z.string().min(1),
  employeeType: z.string().default('full-time'),
  salary: z.number().positive(),
  hireDate: z.string(),
  status: z.string().default('active'),
  skills: z.string().optional(),
  contactInfo: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const labours = await prisma.labour.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(labours);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = labourSchema.parse(body);

    const labour = await prisma.labour.create({
      data: {
        ...data,
        hireDate: new Date(data.hireDate),
        userId: session.user.id,
      },
    });

    return NextResponse.json(labour, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
