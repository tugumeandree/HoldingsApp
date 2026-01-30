import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const businessSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  registrationNumber: z.string().optional(),
  establishedDate: z.string(),
  ownershipPercentage: z.number().min(0).max(100),
  investmentAmount: z.number(),
  currentValue: z.number(),
  status: z.string().default('active'),
  location: z.string().optional(),
  employees: z.number().default(0),
  annualRevenue: z.number().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businesses = await prisma.business.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(businesses);
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
    const data = businessSchema.parse(body);

    const business = await prisma.business.create({
      data: {
        ...data,
        establishedDate: new Date(data.establishedDate),
        userId: session.user.id,
      },
    });

    return NextResponse.json(business, { status: 201 });
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
