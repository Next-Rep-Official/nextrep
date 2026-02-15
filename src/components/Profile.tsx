import React, { useState, useEffect } from 'react';
import {
  getSelfProfile,
  getUser,
  updateBio,
  updatePronouns,
  updateDisplayName,
  updateProfilePicture,
  updateUserVisibility,
  getAsset,
  getAssetUrl,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import ImageLightbox from './ImageLightbox';

interface ProfileProps {
  onUpdate: () => void;
  currentUserId?: string;
}

const Profile: React.FC<ProfileProps> = ({ onUpdate, currentUserId }) => {
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [profilePictureLoading, setProfilePictureLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [userVisibility, setUserVisibility] = useState<'public' | 'private'>('private');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setProfilePictureLoading(false);
    setProfilePictureUrl(null);
    try {
      // Load profile data first to get user ID
      const profileResponse = await getSelfProfile();
      const profileData = profileResponse.body.data?.profile;
      setProfile(profileData);
      setBio(profileData?.bio || '');
      setPronouns(profileData?.pronouns || 'n');
      setDisplayName(profileData?.display_name || '');
      
      // Get user ID from profile (user_id, id, or _id)
      const userId = profileData?.user_id || profileData?.id || profileData?._id || currentUserId;
      
      // Load auth data (which includes visibility) using the user ID
      if (userId) {
        try {
          const authResponse = await getUser(String(userId));
          const userData = authResponse.body.data?.user;
          setUser(userData);
          
          // Update display name from user if not set in profile
          if (userData?.display_name && !profileData?.display_name) {
            setDisplayName(userData.display_name);
          }
          
          // Set user visibility from auth data
          if (userData?.visibility) {
            setUserVisibility(userData.visibility);
          } else {
            // Default to private if not specified
            setUserVisibility('private');
          }
        } catch (err) {
          console.error('Failed to load auth data:', err);
          // Continue without auth data - visibility will remain default
        }
      }
      
      // Load profile picture asset URL
      // profile_picture is the asset ID (number), not profile_picture_id
      const profilePictureAssetId = profileData?.profile_picture || profileData?.profile_picture_id;
      if (profilePictureAssetId) {
        setProfilePictureLoading(true);
        try {
          // First get the asset using the profile_picture asset ID
          const assetResponse = await getAsset(profilePictureAssetId);
          const asset = assetResponse.body.data?.asset;
          if (asset) {
            // Asset exists, now get the URL
            const urlResponse = await getAssetUrl(profilePictureAssetId);
            const signedUrl = urlResponse.body.data?.signedUrl;
            if (signedUrl) {
              setProfilePictureUrl(signedUrl);
            }
          }
        } catch (err) {
          // Asset might not exist or user doesn't have access - that's okay
          // Profile picture will just show the placeholder
        } finally {
          setProfilePictureLoading(false);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBio = async () => {
    try {
      await updateBio(bio);
      setEditing(null);
      // Update local state instead of reloading
      setProfile((prev: any) => ({ ...prev, bio }));
      onUpdate();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to update bio');
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

  const handleUpdatePronouns = async () => {
    try {
      // Send 'n' if pronouns is empty, otherwise send the value
      const pronounsValue = pronouns || 'n';
      await updatePronouns(pronounsValue);
      setEditing(null);
      // Update local state instead of reloading
      setProfile((prev: any) => ({ ...prev, pronouns: pronounsValue }));
      onUpdate();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to update pronouns');
    }
  };

  const handleUpdateDisplayName = async () => {
    try {
      await updateDisplayName(displayName);
      setEditing(null);
      // Update local state instead of reloading
      setProfile((prev: any) => ({ ...prev, display_name: displayName }));
      if (user) {
        setUser((prev: any) => ({ ...prev, display_name: displayName }));
      }
      onUpdate();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to update display name');
    }
  };

  const handleUpdatePicture = async () => {
    if (!profilePicture) return;
    try {
      const response = await updateProfilePicture(profilePicture);
      setProfilePicture(null);
      // Update local state with the new profile picture asset ID
      const updatedProfile = response.body.data?.profile;
      if (updatedProfile?.profile_picture) {
        setProfile((prev: any) => ({ ...prev, profile_picture: updatedProfile.profile_picture }));
        // Load the new profile picture URL
        try {
          const assetResponse = await getAsset(updatedProfile.profile_picture);
          if (assetResponse.body.data?.asset) {
            const urlResponse = await getAssetUrl(updatedProfile.profile_picture);
            const signedUrl = urlResponse.body.data?.signedUrl;
            if (signedUrl) {
              setProfilePictureUrl(signedUrl);
            }
          }
        } catch (err) {
          console.error('Failed to load new profile picture URL:', err);
        }
      }
      onUpdate();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to update picture');
    }
  };

  const handleUpdateVisibility = async () => {
    const newVisibility = userVisibility === 'public' ? 'private' : 'public';
    const visibilityText = newVisibility === 'public' ? 'public' : 'private';
    const currentText = userVisibility === 'public' ? 'public' : 'private';
    
    const confirmed = window.confirm(
      `Are you sure you want to make your account ${visibilityText}? ` +
      `Your account is currently ${currentText}. ` +
      `${newVisibility === 'private' ? 'Only you will be able to see your posts and profile.' : 'Everyone will be able to see your posts and profile.'}`
    );
    
    if (!confirmed) return;
    
    try {
      const response = await updateUserVisibility(newVisibility);
      if (response && response.status >= 200 && response.status < 300) {
        // Update state immediately without reloading
        setUserVisibility(newVisibility);
        if (user) {
          setUser((prev: any) => ({ ...prev, visibility: newVisibility }));
        }
        onUpdate();
        alert('Visibility updated successfully!');
      } else {
        alert('Failed to update visibility');
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error updating visibility:', err);
      alert(apiError.message || 'Failed to update visibility');
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <h1>Profile</h1>
        <div className="skeleton-profile skeleton">
          <div className="skeleton-profile-header">
            <div className="skeleton-avatar-large skeleton"></div>
            <div className="skeleton-profile-info">
              <div className="skeleton-text-large skeleton"></div>
              <div className="skeleton-text-small skeleton"></div>
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-field">
              <div className="skeleton-field-label skeleton"></div>
              <div className="skeleton-field-value skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="profile-container">
      <h1>Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {profilePictureLoading ? (
              <div className="profile-picture-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                onClick={() => setLightboxImage(profilePictureUrl)}
                className="profile-picture-clickable"
              />
            ) : (
              <div className="avatar-placeholder">
                {(profile?.display_name || user?.display_name || user?.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2>{profile?.display_name || user?.display_name || user?.username || 'User'}</h2>
            <p className="profile-username">@{user?.username || profile?.username || 'username'}</p>
            {formatPronouns(profile?.pronouns) && (
              <p className="profile-pronouns">{formatPronouns(profile.pronouns)}</p>
            )}
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-field">
            <label>Display Name</label>
            {editing === 'displayName' ? (
              <div className="edit-field">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <button onClick={handleUpdateDisplayName} className="btn-small">
                  Save
                </button>
                <button onClick={() => setEditing(null)} className="btn-small btn-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="field-value">
                <span>{profile?.display_name || 'Not set'}</span>
                <button onClick={() => setEditing('displayName')} className="btn-icon-small">
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="profile-field">
            <label>Pronouns</label>
            {editing === 'pronouns' ? (
              <div className="edit-field">
                <select
                  value={pronouns || 'n'}
                  onChange={(e) => setPronouns(e.target.value)}
                >
                  <option value="n">None</option>
                  <option value="h">he/him</option>
                  <option value="s">she/her</option>
                  <option value="o">they/them</option>
                </select>
                <button onClick={handleUpdatePronouns} className="btn-small">
                  Save
                </button>
                <button onClick={() => setEditing(null)} className="btn-small btn-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="field-value">
                <span>{formatPronouns(profile?.pronouns) || 'Not set'}</span>
                <button onClick={() => setEditing('pronouns')} className="btn-icon-small">
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="profile-field">
            <label>Bio</label>
            {editing === 'bio' ? (
              <div className="edit-field">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
                <button onClick={handleUpdateBio} className="btn-small">
                  Save
                </button>
                <button onClick={() => setEditing(null)} className="btn-small btn-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="field-value">
                <span>{profile?.bio || 'No bio yet'}</span>
                <button onClick={() => setEditing('bio')} className="btn-icon-small">
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="profile-field">
            <label>Profile Picture</label>
            <div className="edit-field">
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="profile-picture-input"
                  accept="image/*"
                  onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                />
                <label htmlFor="profile-picture-input" className={`file-input-label ${profilePicture ? 'has-file' : ''}`}>
                  {profilePicture ? profilePicture.name : 'Choose profile picture'}
                </label>
              </div>
              {profilePicture && (
                <button onClick={handleUpdatePicture} className="btn-small" style={{ marginTop: '0.75rem' }}>
                  Upload
                </button>
              )}
            </div>
          </div>

          <div className="profile-field">
            <label>Account Visibility</label>
            <div className="field-value">
              <span>
                {userVisibility === 'public' ? 'Public' : 'Private'} -{' '}
                {userVisibility === 'public'
                  ? 'Your profile is visible to everyone'
                  : 'Your profile is only visible to you'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUpdateVisibility();
                }}
                className="btn-small"
              >
                Make {userVisibility === 'public' ? 'Private' : 'Public'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
};

export default Profile;
