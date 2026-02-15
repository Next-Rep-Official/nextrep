import { request, ApiResponse } from './client';

// Auth
export const signUp = async (
  username: string,
  email: string,
  password: string
): Promise<ApiResponse<{ token: string }>> => {
  return request<{ token: string }>('/user/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
};

export const login = async (
  key: string,
  password: string
): Promise<ApiResponse<{ token: string }>> => {
  return request<{ token: string }>('/user/auth/login', {
    method: 'POST',
    body: JSON.stringify({ key, password }),
  });
};

export const getUser = async (id: string): Promise<ApiResponse<{ user: any }>> => {
  return request<{ user: any }>(`/user/auth/${id}`);
};

export const searchUsers = async (search_term: string): Promise<ApiResponse<{ users: any[] }>> => {
  return request<{ users: any[] }>(`/user/auth/search/${encodeURIComponent(search_term)}`);
};

export const getSelfAuth = async (): Promise<ApiResponse<{ user: any }>> => {
  return request<{ user: any }>('/user/auth/self');
};

// Profile
export const getSelfProfile = async (): Promise<ApiResponse<{ profile: any }>> => {
  return request<{ profile: any }>('/user/profile/self');
};

export const getProfile = async (id: string): Promise<ApiResponse<{ profile: any }>> => {
  return request<{ profile: any }>(`/user/profile/${id}`);
};

export const updateBio = async (bio: string): Promise<ApiResponse<{ profile: any }>> => {
  return request<{ profile: any }>('/user/profile/bio', {
    method: 'PUT',
    body: JSON.stringify({ bio }),
  });
};

export const updatePronouns = async (pronouns: string): Promise<ApiResponse<{ profile: any }>> => {
  return request<{ profile: any }>('/user/profile/pronouns', {
    method: 'PUT',
    body: JSON.stringify({ pronouns }),
  });
};

export const updateDisplayName = async (
  display_name: string
): Promise<ApiResponse<{ profile: any }>> => {
  return request<{ profile: any }>('/user/profile/display-name', {
    method: 'PUT',
    body: JSON.stringify({ display_name }),
  });
};

export const updateProfilePicture = async (
  file: File
): Promise<ApiResponse<{ profile: any }>> => {
  const formData = new FormData();
  formData.append('profile_picture', file);
  return request<{ profile: any }>('/user/profile/picture', {
    method: 'PUT',
    body: formData,
  });
};

export const updateUserVisibility = async (
  visibility: 'public' | 'private'
): Promise<ApiResponse> => {
  // Try /user/auth/visibility first (matches pattern of other auth endpoints)
  // If that doesn't work, try /user/visibility or /users/visibility
  return request('/user/auth/visibility', {
    method: 'PUT',
    body: JSON.stringify({ visibility }),
  });
};

// Follow
export const followUser = async (id: string): Promise<ApiResponse> => {
  return request(`/user/follow/follow/${id}`, {
    method: 'POST',
  });
};

export const unfollowUser = async (id: string): Promise<ApiResponse> => {
  return request(`/user/follow/unfollow/${id}`, {
    method: 'POST',
  });
};

export const getFollowers = async (id: string): Promise<ApiResponse<{ followers: any[] }>> => {
  return request<{ followers: any[] }>(`/user/follow/followers/${id}`);
};

export const getFollowing = async (id: string): Promise<ApiResponse<{ following: any[] }>> => {
  return request<{ following: any[] }>(`/user/follow/following/${id}`);
};

export const getFollowersCount = async (
  id: string
): Promise<ApiResponse<{ followersCount: number }>> => {
  return request<{ followersCount: number }>(`/user/follow/followers/count/${id}`);
};

export const getFollowingCount = async (
  id: string
): Promise<ApiResponse<{ followingCount: number }>> => {
  return request<{ followingCount: number }>(`/user/follow/following/count/${id}`);
};

// Posts
export const createPost = async (
  title: string,
  body: string,
  attachments: File[],
  visibility: 'public' | 'private' = 'private'
): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('body', body);
  formData.append('visibility', visibility);
  attachments.forEach((file) => {
    formData.append('attachments', file);
  });
  return request('/feed/posts/post', {
    method: 'POST',
    body: formData,
  });
};

export const getPosts = async (params?: {
  id?: string;
  search_term?: string;
  order?: 'ascending' | 'descending';
  limit?: number;
}): Promise<ApiResponse<{ post?: any; posts?: any[] }>> => {
  let path = '/feed/posts/post';
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.id) queryParams.append('id', params.id);
    if (params.search_term) queryParams.append('search_term', params.search_term);
    if (params.order) queryParams.append('order', params.order);
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    const queryString = queryParams.toString();
    if (queryString) {
      path += `?${queryString}`;
    }
  }
  return request<{ post?: any; posts?: any[] }>(path);
};

export const getPostAttachments = async (
  post_id: string
): Promise<ApiResponse<{ attachments: any[] }>> => {
  return request<{ attachments: any[] }>(`/feed/posts/${post_id}/attachments`);
};

export const deletePost = async (post_id: string): Promise<ApiResponse> => {
  return request(`/feed/posts/${post_id}`, {
    method: 'DELETE',
  });
};

export const replyToPost = async (
  post_id: string,
  body: string
): Promise<ApiResponse<{ reply: any }>> => {
  return request<{ reply: any }>(`/feed/posts/${post_id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
};

export const replyToReply = async (
  reply_id: string,
  body: string
): Promise<ApiResponse<{ reply: any }>> => {
  return request<{ reply: any }>(`/feed/replies/${reply_id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
};

export const getPostReplies = async (post_id: string): Promise<ApiResponse<{ replies: any[] }>> => {
  return request<{ replies: any[] }>(`/feed/posts/${post_id}/reply`);
};

export const deleteReply = async (reply_id: string): Promise<ApiResponse> => {
  return request(`/feed/replies/${reply_id}`, {
    method: 'DELETE',
  });
};

// Assets
export const getAsset = async (id: string): Promise<ApiResponse<{ asset: any }>> => {
  return request<{ asset: any }>(`/assets/${id}`);
};

export const getAssetUrl = async (id: string): Promise<ApiResponse<{ signedUrl: string }>> => {
  return request<{ signedUrl: string }>(`/assets/url/${id}`);
};
