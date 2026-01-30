import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const capitalSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  category: z.string().min(1),
  amount: z.number(),
  currency: z.string().default('USD'),
  acquisitionDate: z.string(),
  maturityDate: z.string().optional(),
  status: z.string().default('active'),
  description: z.string().optional(),
  returns: z.number().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const capitals = await prisma.capital.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(capitals);
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
    const data = capitalSchema.parse(body);

    const capital = await prisma.capital.create({
      data: {
        ...data,
        acquisitionDate: new Date(data.acquisitionDate),
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(capital, { status: 201 });
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
