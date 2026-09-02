import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

// GET /api/categories?userId=...
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const categories = await serverDb.getCategories(userId);
  return NextResponse.json({ categories });
}

// POST /api/categories
export async function POST(req: NextRequest) {
  const { userId, name, icon, color } = await req.json();
  if (!userId || !name) return NextResponse.json({ error: 'userId and name required' }, { status: 400 });
  const category = await serverDb.createCategory(userId, { name, icon, color });
  return NextResponse.json({ category }, { status: 201 });
}

// PATCH /api/categories (update or delete)
export async function PATCH(req: NextRequest) {
  const { id, action, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (action === 'delete') {
    const ok = await serverDb.deleteCategory(id);
    if (!ok) return NextResponse.json({ error: 'Default categories cannot be deleted' }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const ok = await serverDb.updateCategory(id, updates);
  if (!ok) return NextResponse.json({ error: 'Default categories cannot be edited' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
