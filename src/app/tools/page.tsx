'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download, ExternalLink, FileSearch, Loader2, Search, Wrench } from 'lucide-react';
import { AnimeAPI } from '@/lib/api';
import type { AnimeDetail, AnimeEpisodeData, MediaCard } from '@/types/media';

type ToolResult = {
  detail: AnimeDetail;
  episode: AnimeEpisodeData | null;
  selectedEpisode: string;
};

export default function ToolsPage() {
  const [query, setQuery] = useState('');
  const [episodeSlug, setEpisodeSlug] = useState('');
  const [results, setResults] = useState<MediaCard[]>([]);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEpisode, setLoadingEpisode] = useState(false);
  const [error, setError] = useState('');

  const searchAnime = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setLoading(true);
    setError('');
    setToolResult(null);
    const response = await AnimeAPI.search(value);
    setResults(response.data);
    if (response.error && response.data.length === 0) setError(response.error);
    setLoading(false);
  };

  const loadAnime = async (item: MediaCard) => {
    setLoadingEpisode(true);
    setError('');
    const detailResponse = await AnimeAPI.getDetail(item.slug);
    const firstEpisode = detailResponse.data.episode_list[0]?.slug ?? '';
    setToolResult({ detail: detailResponse.data, episode: null, selectedEpisode: firstEpisode });
    setEpisodeSlug(firstEpisode);
    if (detailResponse.error && !detailResponse.data.title) setError(detailResponse.error);
    setLoadingEpisode(false);
  };

  const loadEpisode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!episodeSlug.trim()) return;
    setLoadingEpisode(true);
    setError('');
    const response = await AnimeAPI.getEpisode(episodeSlug.trim());
    setToolResult((current) => current ? { ...current, episode: response.data, selectedEpisode: episodeSlug.trim() } : current);
    if (response.error && response.data.download_links.length === 0) setError(response.error);
    setLoadingEpisode(false);
  };

  return (
    <main className="min-h-screen pb-20 md:pb-8">
      <div className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-4 sm:py-8">
        <header className="rounded-app border border-border bg-surface p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Wrench className="mt-1 h-6 w-6 shrink-0 text-cyan" />
            <div>
              <h1 className="text-xl font-bold text-primary sm:text-2xl">Anime Tools</h1>
              <p className="mt-1 text-sm text-secondary">
                Cari anime, cek metadata, episode, server streaming, dan link download dari API resmi situs ini.
              </p>
            </div>
          </div>
          <form onSubmit={searchAnime} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-app border border-border bg-surface-2 px-3">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-primary outline-none"
                placeholder="Cari judul anime..."
                maxLength={100}
              />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-app bg-cyan px-5 py-3 text-sm font-semibold text-bg hover:brightness-110">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Cari
            </button>
          </form>
        </header>

        {error && <div className="rounded-app border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">{error}</div>}

        {results.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-primary">Hasil pencarian</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {results.map((item) => (
                <button key={item.slug} type="button" onClick={() => void loadAnime(item)} className="overflow-hidden rounded-app border border-border bg-surface text-left hover:border-cyan/50">
                  <div className="relative aspect-[2/3] bg-surface-2">
                    {item.poster && <Image src={item.poster} alt={item.title} fill sizes="(max-width: 640px) 45vw, 180px" className="object-cover" />}
                  </div>
                  <p className="line-clamp-2 p-2 text-xs font-semibold text-primary">{item.title}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {toolResult && (
          <section className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <div className="rounded-app border border-border bg-surface p-3">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-2">
                {toolResult.detail.poster && <Image src={toolResult.detail.poster} alt={toolResult.detail.title} fill sizes="220px" className="object-cover" />}
              </div>
              <h2 className="mt-3 font-bold text-primary">{toolResult.detail.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-secondary">{toolResult.detail.synopsis || 'Tidak ada sinopsis.'}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {toolResult.detail.genres.map((genre) => <span key={genre} className="rounded bg-cyan/10 px-2 py-1 text-[0.65rem] text-cyan">{genre}</span>)}
              </div>
            </div>
            <div className="space-y-4 rounded-app border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary"><FileSearch className="h-4 w-4 text-cyan" /> Metadata & episode</div>
              <form onSubmit={loadEpisode} className="flex flex-col gap-2 sm:flex-row">
                <select value={episodeSlug} onChange={(event) => setEpisodeSlug(event.target.value)} className="min-w-0 flex-1 rounded-app border border-border bg-surface-2 px-3 py-3 text-sm text-primary">
                  {toolResult.detail.episode_list.map((episode) => <option key={episode.slug} value={episode.slug}>{episode.title}</option>)}
                </select>
                <button className="rounded-app bg-cyan px-4 py-3 text-sm font-semibold text-bg">{loadingEpisode ? 'Memuat...' : 'Cek episode'}</button>
              </form>
              {toolResult.episode && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-surface-2 p-3 text-sm text-secondary">
                    <p className="font-semibold text-primary">{toolResult.episode.title}</p>
                    <p className="mt-1 break-all text-xs">Stream: {toolResult.episode.stream_url || 'Tidak tersedia'}</p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-primary">Download links</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {toolResult.episode.download_links.flatMap((group) => group.links.map((link) => (
                        <a key={`${group.resolution}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-border p-3 text-sm text-secondary hover:border-cyan/50 hover:text-cyan">
                          <span>{group.resolution} · {link.name}</span><Download className="h-4 w-4" />
                        </a>
                      )))}
                    </div>
                    {toolResult.episode.download_links.length === 0 && <p className="text-sm text-muted">Link download belum tersedia untuk episode ini.</p>}
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-primary">Streaming servers</h3>
                    <div className="flex flex-wrap gap-2">{toolResult.episode.stream_servers.map((server) => <a key={server.url} href={server.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-secondary hover:text-cyan">{server.name}<ExternalLink className="h-3 w-3" /></a>)}</div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
