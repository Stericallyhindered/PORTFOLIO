"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function WaitlistForm() {
  const [form, setForm] = useState({ firstName: "", lastName: "", company: "", email: "", message: "" });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      setError("Please fill out all required fields.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          setForm({ firstName: "", lastName: "", company: "", email: "", message: "" });
          toast.success("Message sent! Thank you.");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto bg-[#23211C] p-8 rounded-lg shadow-lg flex flex-col gap-6 mt-16">
      <Image
        src="/logo-title.png"
        alt="Bass Clown Co Logo"
        className="mx-auto mb-4 w-2/3 max-w-xs"
        width={340}
        height={80}
      />
      <h2 className="text-2xl font-bold mb-2 text-center tracking-widest text-cream">Join our Waitlist</h2>
      <div>
        <label htmlFor="firstName" className="text-cream block mb-1 font-medium">First Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          placeholder="First Name"
          value={form.firstName}
          required
          onChange={handleChange}
          className="p-3 rounded bg-[#ECE9D9] text-[#23211C] placeholder-[#A9A7A1] focus:outline-none focus:ring-2 focus:ring-[#ECE9D9] w-full"
        />
      </div>
      <div>
        <label htmlFor="lastName" className="text-cream block mb-1 font-medium">Last Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          placeholder="Last Name"
          value={form.lastName}
          required
          onChange={handleChange}
          className="p-3 rounded bg-[#ECE9D9] text-[#23211C] placeholder-[#A9A7A1] focus:outline-none focus:ring-2 focus:ring-[#ECE9D9] w-full"
        />
      </div>
      <div>
        <label htmlFor="company" className="text-cream block mb-1 font-medium">Company Name</label>
        <input
          type="text"
          id="company"
          name="company"
          placeholder="Company Name (Optional)"
          value={form.company}
          onChange={handleChange}
          className="p-3 rounded bg-[#ECE9D9] text-[#23211C] placeholder-[#A9A7A1] focus:outline-none focus:ring-2 focus:ring-[#ECE9D9] w-full"
        />
      </div>
      <div>
        <label htmlFor="email" className="text-cream block mb-1 font-medium">Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Your Email"
          value={form.email}
          required
          onChange={handleChange}
          className="p-3 rounded bg-[#ECE9D9] text-[#23211C] placeholder-[#A9A7A1] focus:outline-none focus:ring-2 focus:ring-[#ECE9D9] w-full"
        />
      </div>
      <div>
        <label htmlFor="message" className="text-cream block mb-1 font-medium">Message <span className="text-red-500">*</span></label>
        <textarea
          id="message"
          name="message"
          placeholder="Your Message"
          value={form.message}
          onChange={handleChange}
          required
          rows={5}
          className="p-3 rounded bg-[#ECE9D9] text-[#23211C] placeholder-[#A9A7A1] focus:outline-none focus:ring-2 focus:ring-[#ECE9D9] w-full"
        />
      </div>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <button
        type="submit"
        className="bg-[#ECE9D9] text-[#23211C] font-bold py-3 rounded hover:bg-[#d6d3c2] transition-colors tracking-widest disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Sending..." : "Submit"}
      </button>
    </form>
  );
} 