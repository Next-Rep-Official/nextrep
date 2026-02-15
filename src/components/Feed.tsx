import React, { useState, useEffect } from 'react';
import { getPosts, deletePost } from '../api/endpoints';
import { ApiError } from '../api/client';
import PostCard from './PostCard';

interface FeedProps {
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

const Feed: React.FC<FeedProps> = ({ currentUserId, onUserClick }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadPosts = async (search?: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await getPosts({
        search_term: search,
        order: 'descending',
        limit: 50,
      });
      let postsData: any[] = [];
      if (response.body.data?.posts) {
        postsData = Array.isArray(response.body.data.posts) 
          ? response.body.data.posts 
          : [];
      } else if (response.body.data?.post) {
        postsData = [response.body.data.post];
      }
      // Filter out any undefined/null posts and replies (replies don't have a title field)
      setPosts(postsData.filter(post => {
        if (post == null) return false;
        // Only show items that are actual posts (have a title field)
        // Replies typically don't have a title, so filter them out
        return post.title != null;
      }));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts(searchTerm || undefined);
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost(postId);
      setPosts(posts.filter((p) => (p.id || p._id) !== postId));
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete post');
    }
  };

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>Feed</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-secondary">
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                loadPosts();
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
        <div className="posts-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-post skeleton">
              <div className="skeleton-header">
                <div className="skeleton-avatar skeleton"></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton-text skeleton"></div>
                  <div className="skeleton-text-small skeleton"></div>
                </div>
              </div>
              <div className="skeleton-text-large skeleton"></div>
              <div className="skeleton-text skeleton"></div>
              <div className="skeleton-text skeleton"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">No posts found. Be the first to post!</div>
      ) : (
        <div className="posts-list">
          {posts
            .filter(post => post != null)
            .map((post, index) => (
              <PostCard
                key={post.id || post._id || Math.random()}
                post={post}
                currentUserId={currentUserId}
                onDelete={handleDelete}
                onUserClick={onUserClick}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
