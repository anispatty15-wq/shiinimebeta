'use client';

import { useState } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import { AnimeAPI } from '@/lib/api';
import type { AnimeDetail, AnimeEpisodeListItem, MediaCard } from '@/types/media';

interface AnimeEpisodePickerProps {
  value: string;
  onChange: (episode: AnimeEpisodeListItem) => void;
}

export default function AnimeEpisodePicker({ value, onChange }: AnimeEpisodePickerProps) {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<MediaCard[]>([]);
  const [episodes, setEpisodes] = useState<AnimeEpisodeListItem[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<AnimeDetail | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [error, setError] = useState('');

  const searchAnime = async () => {
    const query = searchText.trim();
    if (!query) return;
    setLoadingSearch(true);
    setError('');
    const response = await AnimeAPI.search(query);
    setResults(response.data);
    if (response.data.length === 0) setError('Anime tidak ditemukan.');
    setLoadingSearch(false);
  };

  const selectSeries = async (series: MediaCard) => {
    setLoadingEpisodes(true);
    setError('');
    const response = await AnimeAPI.getDetail(series.slug);
    setSelectedSeries(response.data);
    setEpisodes(response.data.episode_list);
    if (response.data.episode_list.length === 0) setError('Daftar episode anime ini kosong.');
    setLoadingEpisodes(false);
  };

  return (
    <div className="rounded-app border border-border bg-bg p-3">
      <p className="text-xs font-semibold text-primary">Pilih anime dan episode</p>
      <div className="mt-2 flex gap-2">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') void searchAnime(); }}
          placeholder="Cari judul anime..."
          className="min-w-0 flex-1 rounded-app border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-cyan"
        />
        <button type="button" onClick={() => void searchAnime()} disabled={loadingSearch} className="flex items-center gap-1.5 rounded-app bg-cyan px-3 py-2 text-xs font-semibold text-bg disabled:opacity-50">
          {loadingSearch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Cari
        </button>
      </div>
      {results.length > 0 && (
        <div className="mt-2 grid max-h-44 gap-1.5 overflow-y-auto sm:grid-cols-2">
          {results.slice(0, 12).map((series) => (
            <button key={series.slug} type="button" onClick={() => void selectSeries(series)} className="flex min-w-0 items-center gap-2 rounded-app border border-border bg-surface px-2.5 py-2 text-left hover:border-cyan/50">
              {series.poster && <img src={series.poster} alt="" className="h-9 w-7 shrink-0 rounded object-cover" />}
              <span className="truncate text-xs text-primary">{series.title}</span>
            </button>
          ))}
        </div>
      )}
      {loadingEpisodes && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat daftar episode...</p>}
      {selectedSeries && episodes.length > 0 && (
        <label className="mt-3 block text-xs text-secondary">
          {selectedSeries.title}
          <select value={value} onChange={(event) => { const episode = episodes.find((item) => item.slug === event.target.value); if (episode) onChange(episode); }} className="mt-1 w-full rounded-app border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-cyan">
            <option value="">Pilih episode...</option>
            {episodes.map((episode) => <option key={episode.slug} value={episode.slug}>{episode.title || episode.slug}</option>)}
          </select>
        </label>
      )}
      {value && !selectedSeries && <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-cyan"><Check className="h-3.5 w-3.5 shrink-0" /> Episode aktif: {value}</p>}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}