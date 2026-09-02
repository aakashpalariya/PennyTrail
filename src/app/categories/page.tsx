'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiClient, type Category } from '@/lib/api';
import { formatAmount } from '@/domain/currency';
import { currentMonth } from '@/domain/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner, PageHeader, Badge } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';

const EMOJI_OPTIONS = [
  '🍽️','🚗','🛍️','💡','🏥','🎬','📚','🛒','✈️','📦',
  '💊','🎮','🏋️','🐾','🎁','🏠','📱','☕','🍕','🎵',
  '💇','🧴','🎓','🔧','🎪','🏖️','🎭','🌮','🚀','🏔️',
  '🎨','🖥️','🎹','🏊','🚴','🌿','💐','🎂','🍺','🧘',
  '🎯','💼','🔑','🌍','⚽','🏀','🎾','🎸','🎤','🛡️',
  '🍔','🍿','🍣','🍩','🍹','🚕','⛽','🏨','🎟️','🏷️',
];

const COLOR_OPTIONS = [
  '#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6',
  '#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899',
  '#f43f5e','#e11d48','#b91c1c','#78716c','#6b7280','#0d9488','#0369a1','#7c3aed',
];

interface CategoryWithSpend extends Category {
  monthSpend: number;
}

// Form Component defined OUTSIDE main page to prevent React remount on keystroke
interface CategoryFormProps {
  name: string;
  setName: (v: string) => void;
  icon: string;
  setIcon: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  nameError: string;
  setNameError: (v: string) => void;
  isSaving: boolean;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function CategoryForm({
  name,
  setName,
  icon,
  setIcon,
  color,
  setColor,
  nameError,
  setNameError,
  isSaving,
  isEditing,
  onSave,
  onCancel,
}: CategoryFormProps) {
  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
      <Input
        id="category-name-input"
        label="Category Name"
        value={name}
        onChange={e => {
          setName(e.target.value);
          if (nameError) setNameError('');
        }}
        error={nameError}
        placeholder="e.g. Subscriptions"
        leftElement={<span className="text-xl">{icon}</span>}
      />

      {/* Emoji Picker Grid (6 on mobile, 10 on desktop) */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">
          Choose Icon ({EMOJI_OPTIONS.length})
        </p>
        <div className="p-2.5 sm:p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/70 max-h-48 overflow-y-auto border border-neutral-200/60 dark:border-neutral-700/60">
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 sm:gap-2 justify-items-center">
            {EMOJI_OPTIONS.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => setIcon(em)}
                className={`h-8 w-8 sm:h-9 sm:w-9 text-base sm:text-lg rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  icon === em
                    ? 'bg-white dark:bg-neutral-700 shadow-sm ring-2 ring-emerald-500 scale-110'
                    : 'hover:bg-white/60 dark:hover:bg-neutral-700/60'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color Picker Grid (8 on mobile, 12 on desktop, centered) */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">
          Choose Color ({COLOR_OPTIONS.length})
        </p>
        <div className="p-2.5 sm:p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/60">
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 sm:gap-2.5 justify-items-center">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                  color === c
                    ? 'ring-2 ring-offset-2 ring-neutral-800 dark:ring-neutral-200 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check size={14} className="text-white drop-shadow" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave} isLoading={isSaving}>
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryWithSpend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#10b981');
  const [nameError, setNameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const [cats, expenses] = await Promise.all([
      apiClient.categories.getAll(user.id),
      apiClient.expenses.getForMonth(user.id, currentMonth()),
    ]);

    const catTotals = apiClient.expenses.getCategoryTotals(expenses);
    const spendMap = new Map(catTotals.map(t => [t.categoryId, t.total]));

    const enriched = cats.map(c => ({
      ...c,
      monthSpend: spendMap.get(c.id) ?? 0,
    }));

    setCategories(enriched);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) loadData();
  }, [user, authLoading, router, loadData]);

  const resetForm = () => {
    setName('');
    setIcon('📦');
    setColor('#10b981');
    setNameError('');
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError('Please enter a category name');
      return;
    }
    setNameError('');
    setIsSaving(true);
    try {
      await apiClient.categories.create(user!.id, { name: name.trim(), icon, color });
      showToast('Category created!', 'success');
      resetForm();
      loadData();
    } catch {
      showToast('Failed to create', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingId) return;
    if (!name.trim()) {
      setNameError('Please enter a category name');
      return;
    }
    setNameError('');
    setIsSaving(true);
    try {
      await apiClient.categories.update(editingId, { name: name.trim(), icon, color });
      showToast('Category updated!', 'success');
      resetForm();
      loadData();
    } catch {
      showToast('Failed to update', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.isDefault) {
      showToast('Cannot delete default categories', 'warning');
      setDeleteTarget(null);
      return;
    }
    setIsDeleting(true);
    try {
      await apiClient.categories.delete(deleteTarget.id);
      showToast(`Category "${deleteTarget.name}" deleted`, 'info');
      setDeleteTarget(null);
      loadData();
    } catch {
      showToast('Failed to delete category', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (cat: Category) => {
    if (cat.isDefault) {
      showToast('Default categories cannot be edited', 'warning');
      return;
    }
    setEditingId(cat.id);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setNameError('');
    setShowAddForm(false);
  };

  if (authLoading || isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size={32} /></div>;
  if (!user) return null;

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-16 sm:pb-8">
      {/* Unified Page Header */}
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories configured`}
        actions={
          !showAddForm && !editingId ? (
            <Button
              size="sm"
              onClick={() => { resetForm(); setShowAddForm(true); }}
              leftIcon={<Plus size={15} strokeWidth={2.5} />}
            >
              Add Category
            </Button>
          ) : null
        }
      />

      {/* Add Form */}
      {showAddForm && (
        <CategoryForm
          name={name}
          setName={setName}
          icon={icon}
          setIcon={setIcon}
          color={color}
          setColor={setColor}
          nameError={nameError}
          setNameError={setNameError}
          isSaving={isSaving}
          isEditing={false}
          onSave={handleCreate}
          onCancel={resetForm}
        />
      )}

      {/* Category List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(cat => {
          const isEditing = editingId === cat.id;
          if (isEditing) {
            return (
              <div key={cat.id} className="sm:col-span-2">
                <CategoryForm
                  name={name}
                  setName={setName}
                  icon={icon}
                  setIcon={setIcon}
                  color={color}
                  setColor={setColor}
                  nameError={nameError}
                  setNameError={setNameError}
                  isSaving={isSaving}
                  isEditing={true}
                  onSave={handleEdit}
                  onCancel={resetForm}
                />
              </div>
            );
          }

          return (
            <div
              key={cat.id}
              className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3 border border-neutral-200/80 dark:border-neutral-800 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-xs"
                  style={{ backgroundColor: cat.color + '22' }}
                >
                  {cat.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{cat.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                    {cat.monthSpend > 0 ? `${formatAmount(cat.monthSpend, user.currency)} this month` : 'No spend this month'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {cat.isDefault ? (
                  <Badge variant="neutral" size="sm">
                    Default
                  </Badge>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => startEdit(cat)}
                      title="Edit Category"
                    >
                      <Edit2 size={14} className="text-neutral-500 hover:text-emerald-600" />
                    </Button>
                    <Button
                      variant="danger-ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(cat)}
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Are you sure you want to delete category <strong className="text-neutral-900 dark:text-neutral-100">&quot;{deleteTarget?.name}&quot;</strong>?
          </p>
          <div className="flex gap-2.5 pt-2">
            <Button
              variant="danger"
              fullWidth
              isLoading={isDeleting}
              onClick={confirmDeleteCategory}
            >
              Delete Category
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
