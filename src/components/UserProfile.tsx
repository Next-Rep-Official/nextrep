import React, { useState, useEffect, useCallback } from 'react';
import {
  getUser,
  getProfile,
  getAsset,
  getAssetUrl,
  followUser,
  unfollowUser,
  getFollowersCount,
  getFollowingCount,
  getFollowers,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import ImageLightbox from './ImageLightbox';

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

interface UserProfileProps {
  userId: string;
  currentUserId?: string;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, currentUserId, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    const currentUserIdStr = currentUserId ? String(currentUserId) : null;
    
    try {
      // Get user data
      const userResponse = await getUser(userId);
      const userData = userResponse.body.data?.user;
      
      if (!userData) {
        setError('User not found');
        setLoading(false);
        return;
      }

      // Check if user is public
      const userIdStr = String(userData.id || userData._id || userId);
      if (userData.visibility === 'private' && userIdStr !== currentUserIdStr) {
        setError('This account is private');
        setLoading(false);
        return;
      }

      setUser(userData);

      // Get profile data
      try {
        const profileResponse = await getProfile(userId);
        const profileData = profileResponse.body.data?.profile;
        setProfile(profileData);

        // Load profile picture
        const profilePictureAssetId = profileData?.profile_picture;
        if (profilePictureAssetId) {
          try {
            const assetResponse = await getAsset(profilePictureAssetId);
            const asset = assetResponse.body.data?.asset;
            if (asset) {
              const urlResponse = await getAssetUrl(profilePictureAssetId);
              const signedUrl = urlResponse.body.data?.signedUrl;
              if (signedUrl) {
                setProfilePictureUrl(signedUrl);
              }
            }
          } catch (err) {
            // Profile picture might not be accessible
          }
        }

        // Load followers and following counts
        try {
          const followersResponse = await getFollowersCount(userId);
          setFollowersCount(followersResponse.body.data?.followersCount || 0);
        } catch (err) {
          // Count might not be available
        }

        try {
          const followingResponse = await getFollowingCount(userId);
          setFollowingCount(followingResponse.body.data?.followingCount || 0);
        } catch (err) {
          // Count might not be available
        }

        // Check if current user is following this user
        if (currentUserIdStr && userIdStr !== currentUserIdStr) {
          try {
            const followersResponse = await getFollowers(userId);
            const followers = followersResponse.body.data?.followers || [];
            const isCurrentlyFollowing = followers.some(
              (follower: any) => {
                const followerId = String(follower.id || follower._id || follower.user_id);
                return followerId === currentUserIdStr;
              }
            );
            setIsFollowing(isCurrentlyFollowing);
          } catch (err) {
            // Can't check follow status - that's okay
          }
        }
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.status === 404) {
          setError('Profile not found');
        } else {
          setError(apiError.message || 'Failed to load profile');
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 404) {
        setError('User not found');
      } else {
        setError(apiError.message || 'Failed to load user');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleFollow = async () => {
    if (!currentUserId || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        if (followersCount !== null) {
          setFollowersCount(Math.max(0, followersCount - 1));
        }
      } else {
        await followUser(userId);
        setIsFollowing(true);
        if (followersCount !== null) {
          setFollowersCount(followersCount + 1);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="user-profile-overlay" onClick={onClose}>
        <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading profile...</div>
            <div className="skeleton-profile-header">
              <div className="skeleton-avatar-large skeleton"></div>
              <div className="skeleton-profile-info">
                <div className="skeleton-text-large skeleton"></div>
                <div className="skeleton-text-small skeleton"></div>
                <div className="skeleton-text skeleton" style={{ marginTop: '1rem' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-overlay" onClick={onClose}>
        <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="user-profile-header">
          <div className="user-profile-avatar-large">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                onClick={() => setLightboxImage(profilePictureUrl)}
                className="profile-picture-clickable"
              />
            ) : (
              <div className="avatar-placeholder">
                {(user?.display_name || user?.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-profile-info">
            <h2>{profile?.display_name || user?.display_name || user?.username || 'User'}</h2>
            <p className="profile-username">@{user?.username}</p>
            {formatPronouns(profile?.pronouns) && (
              <p className="profile-pronouns">{formatPronouns(profile.pronouns)}</p>
            )}
            {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
            
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{followersCount ?? '—'}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{followingCount ?? '—'}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>

            {currentUserId && String(user?.id || user?._id) !== String(currentUserId) && (
              <button 
                onClick={handleFollow} 
                className={isFollowing ? 'follow-button unfollow' : 'follow-button'}
                disabled={followLoading}
              >
                {followLoading ? (
                  <>
                    <span className="loading-spinner loading-spinner-small" style={{ marginRight: '8px', display: 'inline-block' }}></span>
                    {isFollowing ? 'Unfollowing...' : 'Following...'}
                  </>
                ) : (
                  isFollowing ? 'Unfollow' : 'Follow'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
};

export default UserProfile;
