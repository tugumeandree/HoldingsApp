import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
  
  // Strategic fields
  investmentPurpose: z.string().default('operations'),
  fundingSource: z.string().default('bootstrapped'),
  deploymentStrategy: z.string().optional(),
  isLeveraged: z.boolean().default(false),
  leverageRatio: z.number().default(1.0),
  monthlyBurnRate: z.number().default(0),
  runwayMonths: z.number().default(0),
  capitalEfficiency: z.number().default(0),
  allocationBreakdown: z.string().optional(),
  bankAccounts: z.string().optional(),
  moneyMarketAccounts: z.string().optional(),
  financialLiteracy: z.string().default('basic'),
  growthVelocity: z.number().default(0),
  replaceManualEffort: z.boolean().default(false),
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

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const body = await req.json();
    const data = capitalSchema.parse(body);

    // Verify ownership
    const existing = await prisma.capital.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const capital = await prisma.capital.update({
      where: { id },
      data: {
        ...data,
        acquisitionDate: new Date(data.acquisitionDate),
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
      },
    });

    return NextResponse.json(capital);
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

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.capital.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.capital.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
