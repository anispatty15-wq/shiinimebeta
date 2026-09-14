'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gamepad2, Heart, Palette, RefreshCw, Sparkles, Trophy, Zap } from 'lucide-react';

type Region = 'JP' | 'NA';

interface Servant {
  id: number;
  collectionNo: number;
  name: string;
  className: string;
  rarity: number;
  face?: string;
}

interface RawServant {
  id?: number;
  collectionNo?: number;
  name?: string;
  className?: string;
  rarity?: number;
  face?: string;
}

const FALLBACK_SERVANTS: Servant[] = [
  { id: 1, collectionNo: 2, name: 'Artoria Pendragon', className: 'Saber', rarity: 5 },
  { id: 2, collectionNo: 16, name: 'EMIYA', className: 'Archer', rarity: 4 },
  { id: 3, collectionNo: 78, name: 'Scathach', className: 'Lancer', rarity: 5 },
  { id: 4, collectionNo: 1, name: 'Mash Kyrielight', className: 'Shielder', rarity: 4 },
  { id: 5, collectionNo: 229, name: 'Merlin', className: 'Caster', rarity: 5 },
  { id: 6, collectionNo: 59, name: 'Jeanne d\'Arc', className: 'Ruler', rarity: 5 },
  { id: 7, collectionNo: 21, name: 'Ushiwakamaru', className: 'Rider', rarity: 4 },
  { id: 8, collectionNo: 64, name: 'Kiyohime', className: 'Berserker', rarity: 3 },
];

const BUTTON_COLORS = [
  { name: 'Cyan', value: '#00E5FF' },
  { name: 'Violet', value: '#8A2BE2' },
  { name: 'Pink', value: '#E91E8C' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Orange', value: '#F97316' },
];

function normaliseServants(data: unknown): Servant[] {
  const raw = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)
      ? (data as { data: unknown[] }).data
      : [];

  return raw
    .map((item) => item as RawServant)
    .map((item) => ({
      id: Number(item.id ?? item.collectionNo ?? 0),
      collectionNo: Number(item.collectionNo ?? item.id ?? 0),
      name: String(item.name ?? '').trim(),
      className: String(item.className ?? 'Unknown'),
      rarity: Number(item.rarity ?? 0),
      face: item.face,
    }))
    .filter((item) => item.id > 0 && item.name);
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function MiniGamePage() {
  const [region, setRegion] = useState<Region>('JP');
  const [servants, setServants] = useState<Servant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [niceDetail, setNiceDetail] = useState<Servant | null>(null);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selected, setSelected] = useState<string | null>(null);
  const [buttonLabel, setButtonLabel] = useState('Pilih Servant');
  const [buttonColor, setButtonColor] = useState('#00E5FF');
  const [buttonScale, setButtonScale] = useState(100);

  const loadServants = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelected(null);
    try {
      const response = await fetch(`/api/fgo/basic/${region}/servant/search?name=a`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Atlas Academy mengembalikan ${response.status}`);
      const fetched = normaliseServants(await response.json());
      if (fetched.length < 4) throw new Error('Data servant belum cukup untuk membuat pilihan.');
      setServants(fetched);
      setRound((value) => value + 1);
    } catch (loadError) {
      setServants(FALLBACK_SERVANTS);
      setRound((value) => value + 1);
      setError(loadError instanceof Error ? `${loadError.message} Memakai data demo.` : 'API tidak tersedia. Memakai data demo.');
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => { void loadServants(); }, [loadServants]);

  const question = servants.length > 0 ? servants[round % servants.length] : null;
  const choices = useMemo(() => {
    if (!question) return [];
    const others = servants.filter((servant) => servant.id !== question.id);
    return shuffle([question, ...shuffle(others).slice(0, 3)]);
  }, [question, servants]);

  useEffect(() => {
    if (!question) return;
    let cancelled = false;
    setNiceDetail(null);
    fetch(`/api/fgo/nice/${region}/servant/${question.collectionNo}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data: RawServant | null) => {
        if (cancelled || !data) return;
        const [detail] = normaliseServants([data]);
        if (detail) setNiceDetail(detail);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [question, region]);

  useEffect(() => {
    if (!question || selected || lives <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          setSelected('__timeout__');
          setLives((current) => Math.max(0, current - 1));
          setStreak(0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [question, selected, lives]);

  const answer = (choice: Servant) => {
    if (selected || !question || lives <= 0) return;
    setSelected(choice.name);
    if (choice.id === question.id) {
      setScore((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setLives((value) => Math.max(0, value - 1));
      setStreak(0);
    }
  };

  const nextRound = () => {
    setRound((value) => value + 1);
    setSelected(null);
    setTimeLeft(15);
  };

  const restartGame = () => {
    setScore(0);
    setStreak(0);
    setLives(3);
    setRound(0);
    setSelected(null);
    setTimeLeft(15);
  };

  const gameOver = lives <= 0;
  const displayQuestion = niceDetail ?? question;

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <section className="relative overflow-hidden rounded-app border border-cyan/30 bg-surface p-6 sm:p-8 shadow-glow-c">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan/10 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan text-xs font-bold uppercase tracking-[0.18em]">
                <Gamepad2 className="w-4 h-4" /> Mini Game
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black text-primary">Servant Guess</h1>
              <p className="mt-2 max-w-xl text-sm text-secondary">Tebak Servant dari class dan rarity-nya. Data diambil dari Atlas Academy API.</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-2 rounded-app border border-border bg-surface-2 px-3 py-2 text-secondary"><Trophy className="w-4 h-4 text-yellow-400" /> {score}</span>
              <span className="flex items-center gap-2 rounded-app border border-border bg-surface-2 px-3 py-2 text-secondary"><Zap className="w-4 h-4 text-orange-400" /> {streak}x</span>
              <select value={region} onChange={(event) => setRegion(event.target.value as Region)} className="rounded-app border border-border bg-surface-2 px-3 py-2 text-primary outline-none focus:border-cyan" aria-label="Region API">
                <option value="JP">JP</option>
                <option value="NA">NA</option>
              </select>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
          <section className="rounded-app border border-border bg-surface p-5 sm:p-7">
            {loading ? (
              <div className="py-20 text-center text-sm text-muted">Mengambil data Servant...</div>
            ) : question ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">Ronde {round}</p>
                  <button type="button" onClick={() => void loadServants()} className="btn-ghost px-3 py-2 text-xs"><RefreshCw className="w-3.5 h-3.5" /> Muat ulang</button>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 rounded-app border border-border bg-surface-2 px-4 py-3">
                  <div className="flex items-center gap-1" aria-label={`${lives} nyawa tersisa`}>{[0, 1, 2].map((life) => <Heart key={life} className={`h-4 w-4 ${life < lives ? 'fill-pink text-pink' : 'text-muted'}`} />)}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg"><div className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-400' : 'bg-cyan'}`} style={{ width: `${(timeLeft / 15) * 100}%` }} /></div>
                  <span className={`min-w-10 text-right text-sm font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-cyan'}`}>{timeLeft}s</span>
                </div>
                <div className="relative mt-4 overflow-hidden rounded-app border border-violet/30 bg-gradient-to-br from-violet/20 to-cyan/5 p-5 text-center">
                  {displayQuestion?.face ? <img src={displayQuestion.face} alt="Tebak Servant" className={`mx-auto h-32 w-32 rounded-full border-4 border-white/20 object-cover transition-all duration-500 ${selected ? '' : 'scale-105 blur-xl'}`} /> : <Sparkles className="mx-auto h-8 w-8 text-violet-400" />}
                  <p className="mt-4 text-sm text-secondary">Servant ini adalah class</p>
                  <p className="mt-1 text-3xl font-black capitalize text-primary">{displayQuestion?.className}</p>
                  <p className="mt-3 text-sm text-secondary">Rarity: <span className="text-yellow-400">{'★'.repeat(Math.max(1, displayQuestion?.rarity ?? question.rarity))}</span></p>
                </div>
                {error && <p className="mt-3 text-xs text-yellow-400">{error}</p>}
                {gameOver ? <div className="mt-6 rounded-app border border-pink/30 bg-pink/10 p-6 text-center"><Trophy className="mx-auto h-10 w-10 text-yellow-400" /><h2 className="mt-3 text-xl font-black text-primary">Game Over</h2><p className="mt-1 text-sm text-secondary">Skor akhir kamu: {score}</p><button type="button" onClick={restartGame} className="btn-primary mt-5">Main lagi</button></div> : <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {choices.map((choice) => {
                    const isCorrect = choice.id === question.id;
                    const isChosen = selected === choice.name;
                    const resultClass = selected
                      ? isCorrect ? 'border-green-400 bg-green-500/15 text-green-300' : isChosen ? 'border-red-400 bg-red-500/15 text-red-300' : 'border-border text-muted'
                      : 'border-border bg-surface-2 text-primary hover:border-cyan hover:-translate-y-0.5';
                    return <button key={choice.id} type="button" onClick={() => answer(choice)} className={`min-h-12 rounded-app border px-4 py-3 text-sm font-bold transition-all ${resultClass}`} style={!selected ? { borderColor: `${buttonColor}66` } : undefined}>{choice.name}</button>;
                  })}
                </div>}
                {selected && !gameOver && <div className="mt-5 flex items-center justify-between gap-3 rounded-app bg-surface-2 p-4"><p className="text-sm text-secondary">{selected === '__timeout__' ? 'Waktu habis.' : 'Jawaban:'} <strong className="text-primary">{question.name}</strong></p><button type="button" onClick={nextRound} className="btn-primary px-4 py-2 text-xs">Ronde berikutnya</button></div>}
              </>
            ) : <p className="py-20 text-center text-sm text-muted">Belum ada data game.</p>}
          </section>

          <aside className="rounded-app border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-primary font-bold"><Palette className="w-4 h-4 text-pink" /> Custom tombol</div>
            <p className="mt-2 text-xs leading-relaxed text-muted">Atur tampilan tombol jawaban sesuai gaya kamu. Perubahan langsung terlihat di preview.</p>
            <label className="mt-5 block text-xs font-semibold text-secondary">Label tombol</label>
            <input value={buttonLabel} onChange={(event) => setButtonLabel(event.target.value)} maxLength={24} className="mt-2 w-full rounded-app border border-border bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus:border-cyan" />
            <label className="mt-4 block text-xs font-semibold text-secondary">Warna tombol</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {BUTTON_COLORS.map((color) => <button key={color.value} type="button" onClick={() => setButtonColor(color.value)} aria-label={`Pilih warna ${color.name}`} className={`h-8 w-8 rounded-full border-2 ${buttonColor === color.value ? 'border-white ring-2 ring-cyan/50' : 'border-transparent'}`} style={{ backgroundColor: color.value }} />)}
            </div>
            <label className="mt-4 block text-xs font-semibold text-secondary">Ukuran teks: {buttonScale}%</label>
            <input type="range" min="80" max="130" value={buttonScale} onChange={(event) => setButtonScale(Number(event.target.value))} className="mt-3 w-full accent-cyan" />
            <button type="button" className="mt-5 w-full rounded-app px-4 py-3 font-bold text-bg transition-transform active:scale-95" style={{ backgroundColor: buttonColor, fontSize: `${buttonScale}%` }}>{buttonLabel || 'Pilih Servant'}</button>
          </aside>
        </div>
      </div>
    </main>
  );
}