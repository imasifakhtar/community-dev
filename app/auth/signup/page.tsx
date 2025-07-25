"use client";
import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDown, User, Building2, Mail, Lock, Phone, Calendar as CalendarIcon, TrendingUp, Briefcase, CameraIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRef } from "react";

export default function SignupPage() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [company, setCompany] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    if (!role) {
      setError("Please select a role.");
      setLoading(false);
      return;
    }
    if (!dob) {
      setError("Please select your date of birth.");
      setLoading(false);
      return;
    }
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        formData.append("role", role);
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("phone", phone);
        formData.append("dob", dob ? dob.toString() : "");
        formData.append("company", company);
        formData.append("avatar", avatarFile);
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Signup failed");
          setSuccess("Signup successful! Please login.");
          setEmail("");
          setPassword("");
          setRole("");
          setFirstName("");
          setLastName("");
          setPhone("");
          setDob(undefined);
          setCompany("");
          setAvatarFile(null);
          setAvatarPreview(undefined);
        } catch (cloudErr) {
          console.error("Signup error:", cloudErr);
          setError("Profile photo upload failed. Please try again.");
          setLoading(false);
          return;
        }
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          firstName,
          lastName,
          phone,
          dob,
          company,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      setSuccess("Signup successful! Please login.");
      setEmail("");
      setPassword("");
      setRole("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setDob(undefined);
      setCompany("");
      setAvatarFile(null);
      setAvatarPreview(undefined);
    } catch (err: unknown) {
      let msg = "Signup failed";
      if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Our Platform</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-800">Sign Up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Sign up as:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={role === "investor" ? "default" : "outline"}
                    onClick={() => setRole("investor")}
                    className={`h-12 flex items-center justify-center gap-2 transition-all duration-200 ${
                      role === "investor" 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg" 
                        : "hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Investor
                  </Button>
                  <Button
                    type="button"
                    variant={role === "entrepreneur" ? "default" : "outline"}
                    onClick={() => setRole("entrepreneur")}
                    className={`h-12 flex items-center justify-center gap-2 transition-all duration-200 ${
                      role === "entrepreneur" 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg" 
                        : "hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    <Briefcase className="h-4 w-4" />
                    Entrepreneur
                  </Button>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-700">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="company"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="dob"
                      className="w-full h-11 justify-between font-normal border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className={dob ? "text-gray-900" : "text-gray-500"}>
                          {dob ? dob.toLocaleDateString() : "Select your birth date"}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0 shadow-xl border-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dob}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setDob(date!);
                        setOpen(false);
                      }}
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <Avatar className="size-20">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="text-xl">
                    {firstName ? firstName[0] : "U"}
                    {lastName ? lastName[0] : ""}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  ref={avatarInputRef}
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <CameraIcon className="w-4 h-4 mr-2" /> Upload Photo
                </Button>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-800 text-sm font-medium">{error}</div>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-green-800 text-sm font-medium">{success}</div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="button"
                onClick={handleSubmit}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing up...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Sign in
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}