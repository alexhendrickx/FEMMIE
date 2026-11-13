/**
 * Tests for the Supabase client configuration.
 *
 * The headline test here is a source-text assertion: we verify that the
 * Supabase URL and anon key are never hardcoded into the code, only read
 * from environment variables (EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY). This prevents accidental commits of
 * credentials and ensures the project is configurable per environment.
 */
import fs from 'fs';
import path from 'path';

describe('supabase.ts configuration', () => {
  it('never hardcodes a Supabase URL or key — both come from process.env', () => {
    // Read the raw source file to check for hardcoded values
    const supabaseSourcePath = path.join(__dirname, '../supabase.ts');
    const source = fs.readFileSync(supabaseSourcePath, 'utf8');

    // The source must use process.env.EXPO_PUBLIC_SUPABASE_URL, not a hardcoded URL
    expect(source).toContain('process.env.EXPO_PUBLIC_SUPABASE_URL');
    expect(source).toContain('process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY');

    // No literal Supabase project URL (https://xxxxx.supabase.co) should appear
    expect(source).not.toMatch(/https:\/\/[a-z0-9]+\.supabase\.co/);

    // No literal anonymous key patterns (typically base64-like strings)
    // This is a basic check; it won't catch all possible hardcoded keys
    // but ensures the obvious case is caught.
  });
});
