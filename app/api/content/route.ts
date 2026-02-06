import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const contentSchema = z.object({
  title: z.string().min(1),
  contentType: z.string().min(1),
  platform: z.string().min(1),
  publicationDate: z.string().datetime(),
  audienceReach: z.number().default(0),
  viewCount: z.number().default(0),
  engagementRate: z.number().default(0),
  isRepeatable: z.boolean().default(true),
  distributionChannels: z.string().default(''),
  productionCost: z.number().default(0),
  revenueGenerated: z.number().default(0),
  contentUrl: z.string().optional(),
  status: z.string().default('published'),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { contents: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.contents);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = contentSchema.parse(body);

    const content = await prisma.content.create({
      data: {
        ...validatedData,
        publicationDate: new Date(validatedData.publicationDate),
        userId: user.id,
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating content:', error);
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingContent = await prisma.content.findUnique({
      where: { id },
    });

    if (!existingContent || existingContent.userId !== user.id) {
      return NextResponse.json({ error: 'Content not found or unauthorized' }, { status: 404 });
    }

    const validatedData = contentSchema.partial().parse(updateData);

    const content = await prisma.content.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.publicationDate && { publicationDate: new Date(validatedData.publicationDate) }),
      },
    });

    return NextResponse.json(content);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingContent = await prisma.content.findUnique({
      where: { id },
    });

    if (!existingContent || existingContent.userId !== user.id) {
      return NextResponse.json({ error: 'Content not found or unauthorized' }, { status: 404 });
    }

    await prisma.content.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
