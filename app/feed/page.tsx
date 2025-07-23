"use client"
import React, { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, FileText as PdfIcon, Send as SendIcon, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";

interface Post {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
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
    replies: Array<{
      user: {
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string;
      };
      text: string;
      createdAt: string;
    }>;
  }>;
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
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
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
              <div key={post._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link href={post.user?._id ? `/profile?userId=${post.user._id}` : '#'} className="font-semibold text-gray-800 hover:underline">
                    {post.user?.firstName && post.user?.lastName
                      ? `${post.user.firstName} ${post.user.lastName}`
                      : 'Unknown User'}
                  </Link>
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
                <div className="flex items-center gap-3 mt-2">
                  <button
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    onClick={() => handleVote(post._id, "upvote")}
                    aria-label="Upvote"
                  >
                    <ThumbsUp className="w-4 h-4" /> {post.upvotes?.length ?? 0}
                  </button>
                  <button
                    className="flex items-center gap-1 text-rose-600 hover:text-rose-800"
                    onClick={() => handleVote(post._id, "downvote")}
                    aria-label="Downvote"
                  >
                    <ThumbsDown className="w-4 h-4" /> {post.downvotes?.length ?? 0}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
} 