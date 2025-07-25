"use client";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarIcon } from "lucide-react";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  dob: string;
  avatarUrl?: string;
  _id?: string;
}

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

interface Post {
  _id: string;
  user: User;
  text?: string;
  imageUrl?: string;
  pdfUrl?: string;
  createdAt: string;
  comments: Comment[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentLoading, setCommentLoading] = useState<{ [postId: string]: boolean }>({});
  const [commentError, setCommentError] = useState<{ [postId: string]: string }>({});

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data.user);
        // Fetch user's posts
        const postsRes = await fetch(`/api/posts?userId=${data.user._id}`);
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

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
      // Refetch posts to update comments
      const postsRes = await fetch(`/api/posts?userId=${user?._id}`);
      const postsData = await postsRes.json();
      setPosts(postsData.posts || []);
    } catch (err: unknown) {
      setCommentError((prev) => ({ ...prev, [postId]: err instanceof Error ? err.message : "Failed to add comment" }));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-500">Loading profile...</div>;
  }
  if (error || !user) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error || "User not found"}</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 px-4 py-10">
      <div className="max-w-2xl mx-auto w-full">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row items-center gap-6 mb-8">
          <Avatar className="size-24">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt="Profile" />
            ) : null}
            <AvatarFallback className="text-2xl">
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {user.firstName} {user.lastName}
            </h1>
            <div className="text-gray-600 mb-2">{user.email}</div>
            <div className="flex flex-wrap gap-4 text-gray-700 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Company:</span> {user.company}
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">DOB:</span> {new Date(user.dob).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activities</h2>
          {posts.length === 0 ? (
            <div className="text-gray-500">No posts yet.</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post._id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="size-7">
                      {user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt="avatar" />
                      ) : null}
                      <AvatarFallback>
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-gray-800">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  {post.text && <div className="mb-2 text-gray-800">{post.text}</div>}
                  {post.imageUrl && (
                    <div className="mb-2">
                      <img src={post.imageUrl} alt="Post image" className="max-h-64 rounded border" />
                    </div>
                  )}
                  {post.pdfUrl && (
                    <div className="mb-2">
                      <a href={post.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">
                        PDF
                      </a>
                    </div>
                  )}
                  {/* Comments Section */}
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
                                {comment.user.firstName} {comment.user.lastName}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
