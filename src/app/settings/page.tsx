'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Palette, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

const BACKGROUNDS = [
  { name: 'Aurora', value: 'linear-gradient(135deg, #164e63 0%, #312e81 52%, #831843 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #075985 0%, #155e75 50%, #134e4a 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #9a3412 0%, #be185d 52%, #581c87 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #14532d 0%, #166534 48%, #164e63 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #111827 0%, #1e1b4b 52%, #3f1d3d 100%)' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [bio, setBio] = useState('');
  const [bioBackground, setBioBackground] = useState(BACKGROUNDS[0].value);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? '');
      setBioBackground(profile.bioBackground || BACKGROUNDS[0].value);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, user, router]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !db) return;

    setSaving(true);
    setMessage('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bio: bio.trim().slice(0, 300),
        bioBackground,
      });
      setMessage('Profil berhasil disimpan.');
    } catch (error) {
      console.error('[Settings] Profile update failed:', error);
      setMessage('Profil gagal disimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted">Memuat pengaturan...</div>;
  }

  return (
    <main className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>

        <div className="bg-surface border border-border rounded-app overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h1 className="text-xl font-bold text-primary">Edit Profile</h1>
            <p className="text-sm text-muted mt-1">Atur bio dan background profil kamu.</p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <label className="block">
              <span className="text-sm font-semibold text-primary">Bio</span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Ceritakan sedikit tentang kamu..."
                className="mt-2 w-full resize-y rounded-lg bg-surface-2 border border-border px-3 py-2.5 text-sm text-primary outline-none focus:border-cyan transition-colors"
              />
              <span className="block text-right text-xs text-muted mt-1">{bio.length}/300</span>
            </label>

            <fieldset>
              <legend className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Palette className="w-4 h-4 text-cyan" />
                Background bio
              </legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {BACKGROUNDS.map((background) => {
                  const selected = bioBackground === background.value;
                  return (
                    <button
                      key={background.name}
                      type="button"
                      onClick={() => setBioBackground(background.value)}
                      className={`relative h-20 rounded-lg border-2 overflow-hidden text-left transition-all ${selected ? 'border-cyan ring-2 ring-cyan/30' : 'border-border hover:border-secondary'}`}
                      style={{ background: background.value }}
                      aria-label={`Pilih background ${background.name}`}
                    >
                      <span className="absolute inset-x-2 bottom-2 text-xs font-semibold text-white drop-shadow">{background.name}</span>
                      {selected && <Check className="absolute top-2 right-2 w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className={`text-sm ${message.includes('berhasil') ? 'text-green-400' : 'text-red-400'}`} aria-live="polite">{message}</p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan text-bg text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}