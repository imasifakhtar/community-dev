"use client"
import React, { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, FileText as PdfIcon, Send as SendIcon, ThumbsUp, ThumbsDown, Edit2, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import useSWR from "swr";

interface Reply {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  text: string;
  createdAt: string;
}

interface Post {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    calendly?: string; // Added for calendly link
    role?: string;
  };
  text?: string;
  imageUrl?: string;
  pdfUrl?: string;
  createdAt: string;
  upvotes: string[];
  downvotes: string[];
  comments: Array<{
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
    text: string;
    createdAt: string;
    replies: Reply[];
  }>;
}

interface Comment {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  text: string;
  createdAt: string;
  replies: Reply[];
}

export default function HomeFeed() {
  const [postText, setPostText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [postError, setPostError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentLoading, setCommentLoading] = useState<{ [postId: string]: boolean }>({});
  const [commentError, setCommentError] = useState<{ [postId: string]: string }>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editText, setEditText] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setFetching(true);
    setError("");
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch posts");
      setPosts(data.posts);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch posts";
      setError(errorMessage);
    } finally {
      setFetching(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setPdfError("Only PDF files are allowed.");
        setPdfFile(null);
        return;
      }
      setPdfFile(file);
    }
  };
  const handlePost = async () => {
    setLoading(true);
    setPostError("");
    try {
      const formData = new FormData();
      if (postText) formData.append("text", postText);
      if (imageFile) formData.append("image", imageFile);
      if (pdfFile) formData.append("pdf", pdfFile);
      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post");
      setPosts([data.post, ...posts]);
      setPostText("");
      setImageFile(null);
      setPdfFile(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to post";
      setPostError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: string, action: "upvote" | "downvote") => {
    try {
      await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action }),
      });
      fetchPosts();
    } catch {}
  };

  const handleCommentInput = (postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const handleAddComment = async (postId: string) => {
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    setCommentError((prev) => ({ ...prev, [postId]: "" }));
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action: "comment", commentText: commentInputs[postId] }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add comment");
      }
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      fetchPosts();
    } catch (err: unknown) {
      setCommentError((prev) => ({ ...prev, [postId]: err instanceof Error ? err.message : "Failed to add comment" }));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  function handleEditPost(post: Post) {
    setEditPost(post);
    setEditText(post.text || "");
    setEditModalOpen(true);
  }
  async function handleDeletePost(postId: string) {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch('/api/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete post');
      }
      setPosts(posts => posts.filter(p => p._id !== postId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post');
    }
  }
  async function handleEditSave() {
    if (!editPost) return;
    setEditLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: editPost._id, action: 'edit', commentText: editText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to edit post');
      setPosts(posts => posts.map(p => p._id === editPost._id ? { ...p, text: editText } : p));
      setEditModalOpen(false);
      setEditPost(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to edit post');
    } finally {
      setEditLoading(false);
    }
  }
  function handleEditCancel() {
    setEditModalOpen(false);
    setEditPost(null);
  }

  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data: session } = useSWR("/api/auth/session", fetcher);
  const currentUser = session?.user;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* What&apos;s On Your Mind Composer */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">What&apos;s on your mind?</h2>
          <Textarea
            placeholder="Share something with the community..."
            value={postText}
            onChange={e => setPostText(e.target.value)}
            className="mb-3"
            disabled={loading}
          />
          <div className="flex items-center gap-4 mb-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => imageInputRef.current?.click()}
              aria-label="Attach image"
              disabled={loading}
            >
              <ImageIcon className="w-5 h-5 text-blue-600" />
            </Button>
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              className="hidden"
              onChange={handleImageChange}
              disabled={loading}
            />
            {imageFile && (
              <span className="text-xs text-gray-600">{imageFile.name}</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => pdfInputRef.current?.click()}
              aria-label="Attach PDF"
              disabled={loading}
            >
              <PdfIcon className="w-5 h-5 text-rose-600" />
            </Button>
            <input
              type="file"
              accept="application/pdf"
              ref={pdfInputRef}
              className="hidden"
              onChange={handlePdfChange}
              disabled={loading}
            />
            {pdfFile && (
              <span className="text-xs text-gray-600">{pdfFile.name}</span>
            )}
            {pdfError && <span className="text-xs text-red-500">{pdfError}</span>}
          </div>
          {postError && <div className="text-red-500 text-sm mb-2">{postError}</div>}
          <Button
            onClick={handlePost}
            disabled={loading || (!postText && !imageFile && !pdfFile)}
            className="flex items-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2"><SendIcon className="w-4 h-4 animate-spin" /> Posting...</span>
            ) : (
              <><SendIcon className="w-4 h-4" /> Post</>
            )}
          </Button>
        </div>
        {/* Feed posts */}
        <div className="space-y-4">
          {fetching ? (
            <div className="text-center text-gray-500">Loading posts...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-500">No posts yet.</div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="size-9">
                    {post.user?.avatarUrl ? (
                      <AvatarImage src={post.user.avatarUrl} alt="avatar" />
                    ) : null}
                    <AvatarFallback>
                      {post.user?.firstName && post.user.firstName.length > 0 ? post.user.firstName[0] : '?'}
                      {post.user?.lastName && post.user.lastName.length > 0 ? post.user.lastName[0] : ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Link href={post.user?._id ? `/profile?userId=${post.user._id}` : '#'} className="font-semibold text-gray-900 hover:underline">
                      {post.user?.firstName && post.user?.lastName
                        ? `${post.user.firstName} ${post.user.lastName}`
                        : 'Unknown User'}
                    </Link>
                    <div className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</div>
                  </div>
                  {/* Post owner controls: Edit/Delete */}
                  {currentUser && post.user?._id === currentUser._id && (
                    <div className="flex gap-2 ml-auto">
                      <Button size="icon" variant="ghost" onClick={() => handleEditPost(post)} title="Edit Post">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeletePost(post._id)} title="Delete Post">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </Button>
                    </div>
                  )}
                  {/* Investor: Schedule a Call */}
                  {currentUser &&
                    currentUser.role === "investor" &&
                    post.user.role === "entrepreneur" &&
                    post.user.calendly &&
                    post.user._id !== currentUser._id && (
                      <a
                        href={post.user.calendly}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto"
                      >
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" /> Schedule a Call
                        </Button>
                      </a>
                  )}
                </div>
                {post.text && <div className="mb-2 text-gray-800 text-base leading-relaxed">{post.text}</div>}
                {post.imageUrl && (
                  <div className="mb-2">
                    <img src={post.imageUrl} alt="Post image" className="max-h-80 rounded-xl border mx-auto" />
                  </div>
                )}
                {post.pdfUrl && (
                  <div className="mb-2">
                    <div className="mb-2">
                      <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(post.pdfUrl)}&embedded=true`}
                        style={{ width: '100%', height: '400px', border: '1px solid #ccc', borderRadius: '8px' }}
                        frameBorder="0"
                        title="PDF Preview"
                        allowFullScreen
                      ></iframe>
                      <a href={post.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1 mt-2">
                        View PDF
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-4 mb-2">
                  <button
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => handleVote(post._id, "upvote")}
                    aria-label="Upvote"
                  >
                    <ThumbsUp className="w-4 h-4" /> {post.upvotes?.length ?? 0}
                  </button>
                  <button
                    className="flex items-center gap-1 text-rose-600 hover:text-rose-800 font-medium"
                    onClick={() => handleVote(post._id, "downvote")}
                    aria-label="Downvote"
                  >
                    <ThumbsDown className="w-4 h-4" /> {post.downvotes?.length ?? 0}
                  </button>
                </div>
                {/* Discussion/Comments Section */}
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Discussion</h3>
                  <div className="space-y-3 mb-2">
                    {post.comments && post.comments.length > 0 ? (
                      post.comments.map((comment, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Avatar className="size-7">
                            {comment.user.avatarUrl ? (
                              <AvatarImage src={comment.user.avatarUrl} alt="avatar" />
                            ) : null}
                            <AvatarFallback>
                              {comment.user?.firstName && comment.user.firstName.length > 0 ? comment.user.firstName[0] : '?'}
                              {comment.user?.lastName && comment.user.lastName.length > 0 ? comment.user.lastName[0] : ''}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                              <Link href={comment.user?.email ? `/profile?userId=${comment.user.email}` : '#'} className="hover:underline">
                                {comment.user.firstName} {comment.user.lastName}
                              </Link>
                              <span className="text-gray-400 font-normal">{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-gray-700">{comment.text}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400">No comments yet.</div>
                    )}
                  </div>
                  <div className="flex items-end gap-2 mt-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentInputs[post._id] || ""}
                      onChange={e => handleCommentInput(post._id, e.target.value)}
                      className="min-h-8 h-8 resize-none"
                      disabled={commentLoading[post._id]}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post._id)}
                      disabled={commentLoading[post._id] || !(commentInputs[post._id] && commentInputs[post._id].trim())}
                    >
                      {commentLoading[post._id] ? "Posting..." : "Post"}
                    </Button>
                  </div>
                  {commentError[post._id] && <div className="text-xs text-red-500 mt-1">{commentError[post._id]}</div>}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Edit Post Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="mb-4"
              rows={5}
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={handleEditCancel} disabled={editLoading}>Cancel</Button>
              <Button onClick={handleEditSave} disabled={editLoading || !editText.trim()}>
                {editLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
} 