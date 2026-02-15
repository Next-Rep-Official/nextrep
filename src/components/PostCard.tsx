import React, { useState, useEffect } from 'react';
import { getPostReplies, replyToPost, replyToReply, deleteReply, getPostAttachments, getUser, getProfile, getAsset, getAssetUrl } from '../api/endpoints';
import { ApiError } from '../api/client';
import ImageLightbox from './ImageLightbox';

interface PostCardProps {
  post: any;
  currentUserId?: string;
  onDelete?: (postId: string) => void;
  onUserClick?: (userId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onDelete, onUserClick }) => {
  const [replies, setReplies] = useState<any[]>([]);
  const [nestedReplies, setNestedReplies] = useState<Record<string, any[]>>({});
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(null);
  const [nestedReplyTexts, setNestedReplyTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [nestedReplyLoading, setNestedReplyLoading] = useState<Record<string, boolean>>({});
  const [expandedNestedReplies, setExpandedNestedReplies] = useState<Record<string, boolean>>({});
  const [attachments, setAttachments] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [authorUser, setAuthorUser] = useState<any>(null);
  const [authorProfilePictureUrl, setAuthorProfilePictureUrl] = useState<string | null>(null);
  const [replyUsers, setReplyUsers] = useState<Record<string, any>>({});
  const [replyProfilePictures, setReplyProfilePictures] = useState<Record<string, string>>({});

  const postId = post?.id || post?._id;
  // Get replies count from post data, fallback to loaded replies length
  const repliesCount = post?.replies_count ?? post?.repliesCount ?? replies.length;

  // Get author ID from post
  const authorId = post?.author_id || post?.author?.id || post?.author?._id || post?.user_id;

  const loadAuthorUser = async () => {
    if (!authorId) return;
    
    try {
      // First get the user
      const userResponse = await getUser(authorId);
      const userData = userResponse.body.data?.user;
      if (userData) {
        setAuthorUser(userData);
      }
      
      // Then get the profile to get the profile_picture (asset ID)
      try {
        const profileResponse = await getProfile(authorId);
        const profileData = profileResponse.body.data?.profile;
        const profilePictureAssetId = profileData?.profile_picture || profileData?.profile_picture_id;
        if (profilePictureAssetId) {
          // Get the asset using the profile_picture asset ID
          try {
            const assetResponse = await getAsset(profilePictureAssetId);
            const asset = assetResponse.body.data?.asset;
            if (asset) {
              // Then get the URL for the asset
              const urlResponse = await getAssetUrl(profilePictureAssetId);
              const signedUrl = urlResponse.body.data?.signedUrl;
              if (signedUrl) {
                setAuthorProfilePictureUrl(signedUrl);
              }
            }
          } catch (err) {
            // Asset might not be accessible
          }
        }
      } catch (err) {
        // Profile might not be accessible - that's okay
      }
    } catch (error) {
      // User might not be found or not accessible - that's okay
      // We'll just use the author data from the post
    }
  };

  useEffect(() => {
    if (postId) {
      loadAttachments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    if (authorId) {
      loadAuthorUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId]);

  useEffect(() => {
    // Add visible class after mount for animation
    const timer = setTimeout(() => {
      const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
      if (card) {
        card.classList.add('visible');
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [postId]);

  if (!post || !postId) {
    return null;
  }

  const loadAttachments = async () => {
    try {
      if (!postId) return;
      
      const response = await getPostAttachments(postId);
      const attachmentList = response.body.data?.attachments || [];
      
      const attachmentUrls = await Promise.all(
        attachmentList.map(async (att: any) => {
          try {
            const attId = att.asset_id || att.id || att._id || att;
            const urlResponse = await getAssetUrl(attId);
            return urlResponse.body.data?.signedUrl;
          } catch {
            return null;
          }
        })
      );
      setAttachments(attachmentUrls.filter((url) => url !== null) as string[]);
    } catch (error) {
      // Attachments might not exist, that's okay
      console.error('Failed to load attachments:', error);
    }
  };

  const loadUserProfilePicture = async (userId: string, reply?: any) => {
    if (!userId || replyProfilePictures[userId]) return; // Already loaded
    
    // First check if profile data is already in the reply
    const replyProfile = reply?.author?.profile || reply?.profile;
    const replyProfilePictureId = replyProfile?.profile_picture || replyProfile?.profile_picture_id;
    if (replyProfilePictureId) {
      try {
        // Get the asset using the profile_picture asset ID
        const assetResponse = await getAsset(replyProfilePictureId);
        const asset = assetResponse.body.data?.asset;
        if (asset) {
          // Then get the URL for the asset
          const urlResponse = await getAssetUrl(replyProfilePictureId);
          const signedUrl = urlResponse.body.data?.signedUrl;
          if (signedUrl) {
            setReplyProfilePictures((prev) => ({ ...prev, [userId]: signedUrl }));
            return; // Found it in reply data, no need to fetch
          }
        }
      } catch (err) {
        // Profile picture might not be accessible
      }
    }
    
    // If not in reply data, get user first, then profile
    try {
      // Get the user
      await getUser(userId);
      
      // Then get the profile to get the profile_picture (asset ID)
      const profileResponse = await getProfile(userId);
      const profileData = profileResponse.body.data?.profile;
      const profilePictureAssetId = profileData?.profile_picture || profileData?.profile_picture_id;
      if (profilePictureAssetId) {
        try {
          // Get the asset using the profile_picture asset ID
          const assetResponse = await getAsset(profilePictureAssetId);
          const asset = assetResponse.body.data?.asset;
          if (asset) {
            // Then get the URL for the asset
            const urlResponse = await getAssetUrl(profilePictureAssetId);
            const signedUrl = urlResponse.body.data?.signedUrl;
            if (signedUrl) {
              setReplyProfilePictures((prev) => ({ ...prev, [userId]: signedUrl }));
            }
          }
        } catch (err) {
          // Profile picture might not be accessible
        }
      }
    } catch (err) {
      // User or profile might not be accessible - that's okay
    }
  };

  const loadReplyUser = async (userId: string) => {
    if (!userId || replyUsers[userId]) return; // Already loaded
    
    try {
      const userResponse = await getUser(userId);
      const userData = userResponse.body.data?.user;
      if (userData) {
        setReplyUsers((prev) => ({ ...prev, [userId]: userData }));
      }
    } catch (error) {
      // User might not be found or not accessible
    }
  };

  const loadReplies = async (forceReload = false) => {
    if (!postId) return;
    // Only skip if we already have replies loaded and we're not forcing a reload
    if (replies.length > 0 && showReplies && !forceReload) return;
    
    setLoading(true);
    try {
      const response = await getPostReplies(postId);
      const allReplies = response.body.data?.replies || [];
      // Remove duplicates based on reply ID
      const uniqueReplies = allReplies.filter((reply: any, index: number, self: any[]) => {
        const replyId = reply.id || reply._id;
        return replyId && index === self.findIndex((r: any) => (r.id || r._id) === replyId);
      });
      
      // Separate top-level replies (no parent_id) from nested replies (have parent_id)
      const topLevelReplies: any[] = [];
      const nestedRepliesMap: Record<string, any[]> = {};
      
      uniqueReplies.forEach((reply: any) => {
        const replyId = String(reply.id || reply._id);
        const parentId = reply.parent_id || reply.parent_reply_id || reply.parentId;
        
        if (parentId) {
          // This is a nested reply
          const parentIdStr = String(parentId);
          if (!nestedRepliesMap[parentIdStr]) {
            nestedRepliesMap[parentIdStr] = [];
          }
          nestedRepliesMap[parentIdStr].push(reply);
        } else {
          // This is a top-level reply
          topLevelReplies.push(reply);
        }
      });
      
      setReplies(topLevelReplies);
      setNestedReplies(nestedRepliesMap);
      
      // Load user data and profile pictures for all reply authors
      const loadReplyData = (reply: any) => {
        const replyAuthorId = reply.author_id || reply.author?.id || reply.author?._id || reply.user_id;
        if (replyAuthorId) {
          loadReplyUser(replyAuthorId);
          loadUserProfilePicture(replyAuthorId, reply);
        }
      };
      
      // Load data for all replies (top-level and nested)
      uniqueReplies.forEach((reply: any) => {
        loadReplyData(reply);
      });
    } catch (error) {
      console.error('Failed to load replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('.btn-icon') ||
      target.closest('.reply-form') ||
      target.closest('.reply-input') ||
      target.closest('.btn-small')
    ) {
      return;
    }
    
    if (!showReplies) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !postId) return;

    setLoading(true);
    try {
      const response = await replyToPost(postId, replyText);
      const newReply = response.body.data?.reply;
      if (newReply) {
        setReplyText('');
        // Reload replies to get updated structure with proper nesting
        await loadReplies();
      }
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNestedReply = async (e: React.FormEvent, parentReplyId: string) => {
    e.preventDefault();
    const nestedText = nestedReplyTexts[parentReplyId] || '';
    if (!nestedText.trim() || !parentReplyId) return;

    setNestedReplyLoading((prev) => ({ ...prev, [parentReplyId]: true }));
    try {
      const response = await replyToReply(parentReplyId, nestedText);
      const newReply = response.body.data?.reply;
      if (newReply) {
        // Reload replies to get the updated nested structure
        await loadReplies(true);
      }
      setNestedReplyTexts((prev) => ({ ...prev, [parentReplyId]: '' }));
      setReplyingToReplyId(null);
    } catch (error) {
      console.error('Failed to reply to reply:', error);
    } finally {
      setNestedReplyLoading((prev) => ({ ...prev, [parentReplyId]: false }));
    }
  };

  const handleDeleteReply = async (replyId: string, isNested: boolean = false) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      await deleteReply(replyId);
      if (isNested) {
        // Remove from nested replies
        setNestedReplies((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((parentId) => {
            updated[parentId] = updated[parentId].filter(
              (r: any) => String(r.id || r._id) !== String(replyId)
            );
          });
          return updated;
        });
      } else {
        // Remove from top-level replies
        setReplies((prev) => prev.filter((r) => String(r.id || r._id) !== String(replyId)));
        // Also remove from nested replies map if it exists as a parent
        setNestedReplies((prev) => {
          const updated = { ...prev };
          delete updated[String(replyId)];
          return updated;
        });
      }
      // Reload replies to get updated structure
      await loadReplies(true);
    } catch (error) {
      console.error('Failed to delete reply:', error);
      alert('Failed to delete reply');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="post-card visible" data-post-id={postId} onClick={handlePostClick}>
      <div className="post-header">
        <div className="post-author">
          <div
            className="author-avatar"
            onClick={(e) => {
              e.stopPropagation();
              if (authorId && onUserClick) {
                onUserClick(authorId);
              }
            }}
            style={{ cursor: onUserClick ? 'pointer' : 'default' }}
          >
            {authorProfilePictureUrl ? (
              <img
                src={authorProfilePictureUrl}
                alt="Author"
                className="author-avatar-image"
              />
            ) : (
              <div className="author-avatar-placeholder">
                {(authorUser?.display_name || post?.author?.display_name || authorUser?.username || post?.author?.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div
              className="author-name"
              onClick={(e) => {
                e.stopPropagation();
                if (authorId && onUserClick) {
                  onUserClick(authorId);
                }
              }}
              style={{ cursor: onUserClick ? 'pointer' : 'default' }}
            >
              {authorUser?.display_name || post?.author?.display_name || authorUser?.username || post?.author?.username || 'Unknown'}
            </div>
            <div className="post-date">{formatDate(post?.created_at || post?.createdAt)}</div>
          </div>
        </div>
        {onDelete && postId && (authorUser?.id === currentUserId || post?.author?.id === currentUserId || post?.author_id === currentUserId || authorId === currentUserId) && (
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(postId);
            }}
            title="Delete post"
          >
            ×
          </button>
        )}
      </div>
      <h3 className="post-title">{post?.title || ''}</h3>
      <p className="post-body">{post?.body || ''}</p>
      {attachments.length > 0 && (
        <div className="post-attachments">
          {attachments.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Attachment ${idx + 1}`}
              className="attachment-image"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImage(url);
              }}
            />
          ))}
        </div>
      )}
      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
      <div className="post-actions">
        <span className="replies-hint">
          {showReplies ? 'Click to hide' : 'Click to view'} replies ({showReplies ? replies.length : repliesCount})
        </span>
      </div>
      {showReplies && (
        <div className="post-replies">
          {replies.map((reply) => {
            const replyId = reply.id || reply._id || Math.random();
            const replyAuthorId = reply.author_id || reply.author?.id || reply.author?._id || reply.user_id;
            const replyUser = replyAuthorId ? replyUsers[replyAuthorId] : null;
            const replyProfilePic = replyAuthorId ? replyProfilePictures[replyAuthorId] : null;
            const replyDisplayName = replyUser?.display_name || reply.author?.display_name || replyUser?.username || reply.author?.username || 'Unknown';
            
            return (
              <div key={replyId} className="reply-item">
                <div className="reply-header">
                  <div
                    className="reply-avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (replyAuthorId && onUserClick) {
                        onUserClick(replyAuthorId);
                      }
                    }}
                    style={{ cursor: onUserClick ? 'pointer' : 'default' }}
                  >
                    {replyProfilePic ? (
                      <img
                        src={replyProfilePic}
                        alt="Author"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUserClick && replyAuthorId) {
                            onUserClick(replyAuthorId);
                          } else {
                            setLightboxImage(replyProfilePic);
                          }
                        }}
                        className="reply-avatar-image"
                      />
                    ) : (
                      <div className="reply-avatar-placeholder">
                        {replyDisplayName[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div
                    className="reply-author"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (replyAuthorId && onUserClick) {
                        onUserClick(replyAuthorId);
                      }
                    }}
                    style={{ cursor: onUserClick ? 'pointer' : 'default' }}
                  >
                    {replyDisplayName}
                  </div>
                  <button
                    className="btn-icon-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyingToReplyId(replyingToReplyId === replyId ? null : replyId);
                    }}
                    style={{ marginLeft: 'auto' }}
                  >
                    Reply
                  </button>
                  {currentUserId && (replyAuthorId === currentUserId || reply.author_id === currentUserId || reply.user_id === currentUserId) && (
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReply(String(replyId), false);
                      }}
                      title="Delete reply"
                      style={{ marginLeft: '0.5rem' }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="reply-body">{reply.body}</div>
                {/* Render nested replies if they exist */}
                {nestedReplies[String(replyId)] && nestedReplies[String(replyId)].length > 0 && (
                  <div className="nested-replies-container" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="nested-replies-toggle"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const replyIdStr = String(replyId);
                        setExpandedNestedReplies((prev) => ({
                          ...prev,
                          [replyIdStr]: !prev[replyIdStr],
                        }));
                      }}
                    >
                      {expandedNestedReplies[String(replyId)] ? '▼ Hide' : '▶ View'} {nestedReplies[String(replyId)].length} {nestedReplies[String(replyId)].length === 1 ? 'reply' : 'replies'}
                    </button>
                    {expandedNestedReplies[String(replyId)] && (
                      <div className="nested-replies">
                        {nestedReplies[String(replyId)].map((nestedReply: any) => {
                      const nestedReplyId = nestedReply.id || nestedReply._id || Math.random();
                      const nestedReplyAuthorId = nestedReply.author_id || nestedReply.author?.id || nestedReply.author?._id || nestedReply.user_id;
                      const nestedReplyUser = nestedReplyAuthorId ? replyUsers[nestedReplyAuthorId] : null;
                      const nestedReplyProfilePic = nestedReplyAuthorId ? replyProfilePictures[nestedReplyAuthorId] : null;
                      const nestedReplyDisplayName = nestedReplyUser?.display_name || nestedReply.author?.display_name || nestedReplyUser?.username || nestedReply.author?.username || 'Unknown';
                      
                      return (
                        <div key={nestedReplyId} className="nested-reply-item">
                          <div className="reply-header">
                            <div
                              className="reply-avatar"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (nestedReplyAuthorId && onUserClick) {
                                  onUserClick(nestedReplyAuthorId);
                                }
                              }}
                              style={{ cursor: onUserClick ? 'pointer' : 'default' }}
                            >
                              {nestedReplyProfilePic ? (
                                <img
                                  src={nestedReplyProfilePic}
                                  alt="Author"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onUserClick && nestedReplyAuthorId) {
                                      onUserClick(nestedReplyAuthorId);
                                    } else {
                                      setLightboxImage(nestedReplyProfilePic);
                                    }
                                  }}
                                  className="reply-avatar-image"
                                />
                              ) : (
                                <div className="reply-avatar-placeholder">
                                  {nestedReplyDisplayName[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div
                              className="reply-author"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (nestedReplyAuthorId && onUserClick) {
                                  onUserClick(nestedReplyAuthorId);
                                }
                              }}
                              style={{ cursor: onUserClick ? 'pointer' : 'default' }}
                            >
                              {nestedReplyDisplayName}
                            </div>
                            {currentUserId && (nestedReplyAuthorId === currentUserId || nestedReply.author_id === currentUserId || nestedReply.user_id === currentUserId) && (
                              <button
                                className="btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteReply(String(nestedReplyId), true);
                                }}
                                title="Delete reply"
                                style={{ marginLeft: 'auto' }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <div className="reply-body">{nestedReply.body}</div>
                        </div>
                      );
                    })}
                      </div>
                    )}
                  </div>
                )}
                {replyingToReplyId === replyId && (
                  <form 
                    onSubmit={(e) => handleNestedReply(e, replyId)} 
                    className="reply-form" 
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: '0.75rem' }}
                  >
                    <input
                      type="text"
                      placeholder={`Reply to ${replyDisplayName}...`}
                      value={nestedReplyTexts[replyId] || ''}
                      onChange={(e) => setNestedReplyTexts((prev) => ({ ...prev, [replyId]: e.target.value }))}
                      className="reply-input"
                    />
                    <button 
                      type="submit" 
                      className="btn-small" 
                      disabled={nestedReplyLoading[replyId]}
                    >
                      {nestedReplyLoading[replyId] && (
                        <span className="loading-spinner loading-spinner-small" style={{ marginRight: '6px', display: 'inline-block' }}></span>
                      )}
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyingToReplyId(null);
                        setNestedReplyTexts((prev) => ({ ...prev, [replyId]: '' }));
                      }}
                      className="btn-small btn-secondary"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            );
          })}
          <form onSubmit={handleReply} className="reply-form" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="reply-input"
            />
            <button type="submit" className="btn-small" disabled={loading}>
              {loading && (
                <span className="loading-spinner loading-spinner-small" style={{ marginRight: '6px', display: 'inline-block' }}></span>
              )}
              Reply
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
