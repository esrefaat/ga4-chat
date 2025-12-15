/**
 * Saved Searches Management
 * 
 * Manages user's saved GA4 search queries in PostgreSQL
 */

import { query } from './db';

export interface SavedSearch {
  id: number;
  username: string;
  question: string;
  usage_count: number;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * Get all saved searches for a user
 */
export async function getSavedSearches(username: string, limit: number = 20): Promise<SavedSearch[]> {
  try {
    const result = await query<SavedSearch>(
      `SELECT id, username, question, COALESCE(usage_count, 0) as usage_count, created_at, updated_at
       FROM saved_searches
       WHERE username = $1
       ORDER BY COALESCE(usage_count, 0) DESC, created_at DESC
       LIMIT $2`,
      [username, limit]
    );

    return result.rows.map((row) => ({
      ...row,
      usage_count: row.usage_count || 0,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    }));
  } catch (error) {
    console.error('Failed to fetch saved searches:', error);
    return [];
  }
}

/**
 * Add a new saved search
 */
export async function addSavedSearch(username: string, question: string): Promise<{ success: boolean; error?: string; id?: number }> {
  if (!question || !question.trim()) {
    return { success: false, error: 'Question cannot be empty' };
  }

  try {
    // Check if question already exists for this user
    const existing = await query<SavedSearch>(
      'SELECT id FROM saved_searches WHERE username = $1 AND LOWER(question) = LOWER($2)',
      [username, question.trim()]
    );

    if (existing.rows.length > 0) {
      // If search already exists, increment its usage count instead of returning error
      const existingId = existing.rows[0].id;
      await incrementUsageCount(username, existingId);
      return { success: false, error: 'This search is already saved', id: existingId };
    }

    // Insert new saved search
    const result = await query<SavedSearch>(
      `INSERT INTO saved_searches (username, question, usage_count)
       VALUES ($1, $2, 0)
       RETURNING id`,
      [username, question.trim()]
    );

    return { success: true, id: result.rows[0].id };
  } catch (error: any) {
    console.error('Failed to add saved search:', error);
    if (error.code === '23505') { // Unique violation
      return { success: false, error: 'This search is already saved' };
    }
    return { success: false, error: 'Failed to save search' };
  }
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(username: string, id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await query(
      'DELETE FROM saved_searches WHERE id = $1 AND username = $2',
      [id, username]
    );

    if (result.rowCount === 0) {
      return { success: false, error: 'Saved search not found or access denied' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete saved search:', error);
    return { success: false, error: 'Failed to delete search' };
  }
}

/**
 * Delete all saved searches for a user
 */
export async function deleteAllSavedSearches(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    await query(
      'DELETE FROM saved_searches WHERE username = $1',
      [username]
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to delete all saved searches:', error);
    return { success: false, error: 'Failed to delete searches' };
  }
}

/**
 * Update a saved search
 */
export async function updateSavedSearch(username: string, id: number, question: string): Promise<{ success: boolean; error?: string }> {
  if (!question || !question.trim()) {
    return { success: false, error: 'Question cannot be empty' };
  }

  try {
    const result = await query(
      `UPDATE saved_searches 
       SET question = $1, updated_at = NOW()
       WHERE id = $2 AND username = $3`,
      [question.trim(), id, username]
    );

    if (result.rowCount === 0) {
      return { success: false, error: 'Saved search not found or access denied' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update saved search:', error);
    return { success: false, error: 'Failed to update search' };
  }
}

/**
 * Increment usage count for a saved search
 */
export async function incrementUsageCount(username: string, id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await query(
      `UPDATE saved_searches 
       SET usage_count = COALESCE(usage_count, 0) + 1, updated_at = NOW()
       WHERE id = $1 AND username = $2`,
      [id, username]
    );

    if (result.rowCount === 0) {
      return { success: false, error: 'Saved search not found or access denied' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to increment usage count:', error);
    return { success: false, error: 'Failed to increment usage count' };
  }
}

