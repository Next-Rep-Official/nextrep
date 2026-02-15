import React, { useState } from 'react';
import { createPost } from '../api/endpoints';
import { ApiError } from '../api/client';

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createPost(title, body, attachments, visibility);
      setTitle('');
      setBody('');
      setAttachments([]);
      setVisibility('private');
      onPostCreated();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(files.slice(0, 3));
  };

  return (
    <div className="create-post-container">
      <h2>Create Post</h2>
      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="form-field">
          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <textarea
            placeholder="What's on your mind? (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
          />
        </div>
        <div className="form-field">
          <label>
            Visibility
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
            >
              <option value="private">Private (only you can see)</option>
              <option value="public">Public (everyone can see)</option>
            </select>
          </label>
        </div>
        <div className="form-field">
          <label>Attachments (max 3)</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              id="file-input"
              multiple
              onChange={handleFileChange}
              accept="image/*"
            />
            <label htmlFor="file-input" className={`file-input-label ${attachments.length > 0 ? 'has-file' : ''}`}>
              {attachments.length > 0 ? `${attachments.length} file${attachments.length > 1 ? 's' : ''} selected` : '   Choose files'}
            </label>
          </div>
          {attachments.length > 0 && (
            <div className="attachments-preview">
              {attachments.map((file, idx) => (
                <span key={idx} className="attachment-tag">
                  {file.name}
                </span>
              ))}
            </div>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="loading-spinner loading-spinner-small" style={{ marginRight: '8px', display: 'inline-block' }}></span>
              Posting...
            </>
          ) : (
            'Post'
          )}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
