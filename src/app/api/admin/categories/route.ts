import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

// GET /api/admin/categories
export async function GET() {
  const categories = await serverDb.adminGetDefaultCategories();
  return NextResponse.json({ categories });
}

// POST /api/admin/categories (Create new default category)
export async function POST(req: NextRequest) {
  try {
    const { name, icon, color, isActive } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    const category = await serverDb.adminCreateDefaultCategory({
      name: name.trim(),
      icon: icon || '🏷️',
      color: color || '#10b981',
      isActive: isActive !== false,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create default category' }, { status: 500 });
  }
}

// PATCH /api/admin/categories (Update default category or toggle status)
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    const category = await serverDb.adminUpdateDefaultCategory(id, updates);
    if (!category) {
      return NextResponse.json({ error: 'Category not found or not a default category' }, { status: 404 });
    }
    return NextResponse.json({ category, ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/admin/categories?id=...
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    const result = await serverDb.adminDeleteDefaultCategory(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete category' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
