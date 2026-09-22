'use client';
/**
 * Friends Page
 * 
 * Manage friends, friend requests, and search for new friends
 */

import { useState } from 'react';
import { Users, UserPlus, Clock, CheckCircle, XCircle, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useFriends, type User } from '@/hooks/useFriends';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

export default function FriendsPage() {
  const { user } = useAuth();
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Search users
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } finally {
      setSearchLoading(false);
    }
  };

  // Effect for debounced search
  useState(() => {
    if (activeTab === 'search') {
      handleSearch(debouncedSearch);
    }
  });

  const handleSendRequest = async (toUserId: string) => {
    setActionLoading(toUserId);
    try {
      await sendFriendRequest(toUserId);
      setSearchResults((prev) => prev.filter((u) => u.uid !== toUserId));
    } catch (error: any) {
      alert(error.message || 'Gagal mengirim friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await acceptFriendRequest(requestId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await rejectFriendRequest(requestId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await cancelFriendRequest(requestId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (friendId: string) => {
    if (!confirm('Hapus dari daftar teman?')) return;
    
    setActionLoading(friendId);
    try {
      await removeFriend(friendId);
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-primary mb-2">Login Required</h2>
          <p className="text-secondary">Silakan login untuk melihat dan mengelola teman.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Teman</h1>
        <p className="text-sm text-secondary">
          Kelola teman, terima friend request, dan cari teman baru
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors relative ${
            activeTab === 'friends'
              ? 'text-cyan'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5" />
          Teman ({friends.length})
          {activeTab === 'friends' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors relative ${
            activeTab === 'requests'
              ? 'text-cyan'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1.5" />
          Request ({pendingRequests.length + sentRequests.length})
          {activeTab === 'requests' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors relative ${
            activeTab === 'search'
              ? 'text-cyan'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Search className="w-4 h-4 inline mr-1.5" />
          Cari Teman
          {activeTab === 'search' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <>
            {loading ? (
              <div className="text-center py-8 text-secondary">Loading...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-secondary">Belum ada teman</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="btn-primary mt-4"
                >
                  <UserPlus className="w-4 h-4" />
                  Cari Teman
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {friends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="bg-surface border border-border rounded-app p-4 flex items-center gap-3"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-surface-2 overflow-hidden relative flex-shrink-0">
                      {friend.photoURL ? (
                        <Image src={friend.photoURL} alt={friend.displayName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-primary truncate">
                        {friend.displayName}
                      </h3>
                      <p className="text-xs text-muted">
                        Teman sejak {friend.friendsSince.toLocaleDateString('id-ID')}
                      </p>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleRemove(friend.uid)}
                      disabled={actionLoading === friend.uid}
                      className="w-8 h-8 flex items-center justify-center rounded text-muted hover:text-pink-400 hover:bg-pink-400/10 transition-colors"
                      title="Hapus teman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {/* Pending (Received) */}
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">
                  📥 Friend Request Masuk
                </h3>
                <div className="grid gap-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-surface border border-border rounded-app p-4 flex items-center gap-3"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-surface-2 overflow-hidden relative flex-shrink-0">
                        {request.fromUserAvatar ? (
                          <Image src={request.fromUserAvatar} alt={request.fromUserName} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted">
                            <Users className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-primary truncate">
                          {request.fromUserName}
                        </h3>
                        <p className="text-xs text-muted">
                          {request.createdAt.toLocaleDateString('id-ID')}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                          className="w-8 h-8 flex items-center justify-center rounded bg-cyan/10 text-cyan hover:bg-cyan/20 transition-colors"
                          title="Terima"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                          className="w-8 h-8 flex items-center justify-center rounded bg-pink-400/10 text-pink-400 hover:bg-pink-400/20 transition-colors"
                          title="Tolak"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <div className={pendingRequests.length > 0 ? 'mt-6' : ''}>
                <h3 className="text-sm font-semibold text-primary mb-3">
                  📤 Request Terkirim
                </h3>
                <div className="grid gap-3">
                  {sentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-surface border border-border rounded-app p-4 flex items-center gap-3"
                    >
                      {/* Avatar placeholder */}
                      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-muted" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-secondary truncate">
                          Menunggu konfirmasi...
                        </h3>
                        <p className="text-xs text-muted">
                          {request.createdAt.toLocaleDateString('id-ID')}
                        </p>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleCancel(request.id)}
                        disabled={actionLoading === request.id}
                        className="btn-ghost text-xs py-1.5"
                      >
                        Batalkan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-secondary">Tidak ada friend request</p>
              </div>
            )}
          </>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pengguna..."
                className="w-full bg-surface border border-border rounded-app pl-10 pr-4 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-cyan/60 transition-colors"
              />
            </div>

            {/* Search Results */}
            {searchLoading ? (
              <div className="text-center py-8 text-secondary">Mencari...</div>
            ) : searchQuery.trim() === '' ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-secondary">Ketik nama untuk mencari teman</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary">Tidak ada hasil</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {searchResults.map((searchUser) => (
                  <div
                    key={searchUser.uid}
                    className="bg-surface border border-border rounded-app p-4 flex items-center gap-3"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-surface-2 overflow-hidden relative flex-shrink-0">
                      {searchUser.photoURL ? (
                        <Image src={searchUser.photoURL} alt={searchUser.displayName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-primary truncate">
                        {searchUser.displayName}
                      </h3>
                      {searchUser.email && (
                        <p className="text-xs text-muted truncate">{searchUser.email}</p>
                      )}
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleSendRequest(searchUser.uid)}
                      disabled={actionLoading === searchUser.uid}
                      className="btn-primary text-xs py-2"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {actionLoading === searchUser.uid ? 'Mengirim...' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
