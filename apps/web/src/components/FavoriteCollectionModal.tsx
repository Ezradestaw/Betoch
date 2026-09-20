// ==============================================================================
// BETOCH FAVORITE COLLECTIONS & UNDO MODAL
// ==============================================================================

import React, { useState } from 'react';
import { Heart, Plus, Check, X, FolderHeart } from 'lucide-react';

interface FavoriteCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  currentCollection?: string;
  onSave: (collectionName: string) => void;
}

const DEFAULT_COLLECTIONS = [
  'My Favorites',
  'Family Options',
  'Best Prices',
  'To Visit'
];

export const FavoriteCollectionModal: React.FC<FavoriteCollectionModalProps> = ({
  isOpen,
  onClose,
  propertyTitle,
  currentCollection = 'My Favorites',
  onSave
}) => {
  const [selected, setSelected] = useState(currentCollection);
  const [customName, setCustomName] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (name: string) => {
    setSelected(name);
    onSave(name);
    onClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      handleSelect(customName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <FolderHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Save to Collection</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{propertyTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {DEFAULT_COLLECTIONS.map((col) => (
            <button
              key={col}
              onClick={() => handleSelect(col)}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition-all ${
                selected === col
                  ? 'border-red-500 bg-red-50/60 text-red-900'
                  : 'border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className={`w-4 h-4 ${selected === col ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                <span>{col}</span>
              </div>
              {selected === col && <Check className="w-4 h-4 text-red-600" />}
            </button>
          ))}
        </div>

        {isCreatingCustom ? (
          <form onSubmit={handleCreateCustom} className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="e.g. Near Work"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              autoFocus
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Save
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingCustom(true)}
            className="mt-3 w-full py-2.5 text-center text-xs font-semibold text-brand-700 hover:bg-brand-50 rounded-xl border border-dashed border-brand-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Collection
          </button>
        )}
      </div>
    </div>
  );
};
