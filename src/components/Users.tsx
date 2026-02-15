import React, { useState } from 'react';
import { searchUsers, getProfile, getAsset, getAssetUrl } from '../api/endpoints';
import { ApiError } from '../api/client';

interface UsersProps {
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

const Users: React.FC<UsersProps> = ({ currentUserId, onUserClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [userProfilePictures, setUserProfilePictures] = useState<Record<string, string>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await searchUsers(searchTerm.trim());
      const usersData = response.body.data?.users || [];
      setUsers(usersData);

      // Load profile data and profile pictures for all users
      usersData.forEach((user: any) => {
        const userId = String(user.id || user._id);
        loadUserProfileData(userId);
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfileData = async (userId: string) => {
    if (userProfiles[userId] || userProfilePictures[userId]) return; // Already loaded

    try {
      const profileResponse = await getProfile(userId);
      const profileData = profileResponse.body.data?.profile;
      if (profileData) {
        setUserProfiles((prev) => ({ ...prev, [userId]: profileData }));

        // Load profile picture
        const profilePictureAssetId = profileData?.profile_picture;
        if (profilePictureAssetId) {
          try {
            const assetResponse = await getAsset(profilePictureAssetId);
            if (assetResponse.body.data?.asset) {
              const urlResponse = await getAssetUrl(profilePictureAssetId);
              const signedUrl = urlResponse.body.data?.signedUrl;
              if (signedUrl) {
                setUserProfilePictures((prev) => ({ ...prev, [userId]: signedUrl }));
              }
            }
          } catch (err) {
            // Profile picture might not exist - that's okay
          }
        }
      }
    } catch (err) {
      // Profile might not exist - that's okay
    }
  };

  const formatPronouns = (pronouns: string | null | undefined): string => {
    if (!pronouns) return '';
    switch (pronouns.toLowerCase()) {
      case 'h':
        return 'he/him';
      case 's':
        return 'she/her';
      case 'o':
        return 'they/them';
      case 'n':
        return '';
      default:
        return pronouns;
    }
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>Search Users</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by username or display name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-secondary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setUsers([]);
                setError('');
              }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Searching users...</div>
        </div>
      ) : users.length === 0 && searchTerm ? (
        <div className="empty-state">No users found.</div>
      ) : users.length === 0 ? (
        <div className="empty-state">Enter a search term to find users.</div>
      ) : (
        <div className="users-list">
          {users.map((user) => {
            const userId = String(user.id || user._id);
            const profile = userProfiles[userId];
            const profilePictureUrl = userProfilePictures[userId];
            const displayName = profile?.display_name || user.display_name || user.username || 'Unknown';
            const username = user.username || 'unknown';
            const pronouns = formatPronouns(profile?.pronouns);

            return (
              <div
                key={userId}
                className="user-card"
                onClick={() => {
                  if (onUserClick && userId !== currentUserId) {
                    onUserClick(userId);
                  }
                }}
              >
                <div className="user-card-header">
                  <div className="user-card-avatar">
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt={displayName}
                        className="user-card-avatar-image"
                      />
                    ) : (
                      <div className="user-card-avatar-placeholder">
                        {displayName[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-card-info">
                    <div className="user-card-name">{displayName}</div>
                    <div className="user-card-username">@{username}</div>
                    {pronouns && (
                      <div className="user-card-pronouns">{pronouns}</div>
                    )}
                  </div>
                </div>
                {profile?.bio && (
                  <div className="user-card-bio">{profile.bio}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Users;
