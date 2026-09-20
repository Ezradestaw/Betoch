// ==============================================================================
// BETOCH RECENTLY VIEWED & LOCAL PREFERENCES UTILITIES
// Privacy-respecting client storage for rapid 1-tap UX
// ==============================================================================

import { PropertyCardItem } from '../components/PropertyCard';

const RECENTLY_VIEWED_KEY = 'betoch_recently_viewed';
const SEARCH_PREFERENCES_KEY = 'betoch_search_preferences';

export function getRecentlyViewed(): PropertyCardItem[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(property: PropertyCardItem): void {
  try {
    const current = getRecentlyViewed();
    // Remove if already exists to push to front
    const filtered = current.filter((p) => p.id !== property.id);
    const updated = [property, ...filtered].slice(0, 10); // Keep last 10
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update recently viewed', err);
  }
}

export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (err) {
    console.error('Failed to clear recently viewed', err);
  }
}

export function getSavedSearchPreferences(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(SEARCH_PREFERENCES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSearchPreferences(preferences: Record<string, any>): void {
  try {
    localStorage.setItem(SEARCH_PREFERENCES_KEY, JSON.stringify({
      ...preferences,
      savedAt: new Date().toISOString()
    }));
  } catch (err) {
    console.error('Failed to save search preferences', err);
  }
}

export function clearSearchPreferences(): void {
  try {
    localStorage.removeItem(SEARCH_PREFERENCES_KEY);
  } catch (err) {
    console.error('Failed to clear search preferences', err);
  }
}
