"use client";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "lucide-react";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  dob: string;
  avatarUrl?: string;
}

interface Post {
  _id: string;
  text?: string;
  imageUrl?: string;
  pdfUrl?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
