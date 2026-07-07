"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactFormValues, contactFormSchema } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { submitContactForm } from "@/lib/actions";
import { SERVICES } from "@/lib/constants";

const SERVICE_OPTIONS = [
  { value: "general", label: "General Inquiry" },
  { value: "brand-development", label: "Brand Development Videos" },
  { value: "product-launch", label: "Product Launch Videos" },
  { value: "product-review", label: "Product Review Videos" },
  { value: "promotional", label: "Promotional Videos" },
  { value: "content-promotion", label: "Video Content Promotions" },
  { value: "event-promotion", label: "Video Event Promotions" },
  { value: "video-contests", label: "Video Contests" },
  { value: "custom", label: "Custom Project" },
];

export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const router = useRouter();

  const { 
    register, 
    handleSubmit, 
    reset,
    setValue,
    watch,
    formState: { errors } 
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  const watchedService = watch("service");

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    setError("");
    
    try {
      const result = await submitContactForm(data);
      
      if (result.success) {
        // Redirect to thank you page
        router.push('/contact/thank-you');
      } else {
        setError(result.error || "There was an error submitting your form. Please try again.");
      }
    } catch (err) {
      setError("There was an error submitting your form. Please try again.");
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    setValue("service", value);
  };

  const inputStyles = "bg-slate-700 border-slate-600 placeholder:text-cream/60 focus:border-red-500 focus:ring-red-500 text-cream";
  const errorBorder = "border-red-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-cream">Full Name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          {...register("name")}
          className={`${inputStyles} ${errors.name ? errorBorder : ""}`}
        />
        {errors.name && (
          <p className="text-red-400 text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-cream">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          {...register("email")}
          className={`${inputStyles} ${errors.email ? errorBorder : ""}`}
        />
        {errors.email && (
          <p className="text-red-400 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="service" className="text-cream">Service/Topic</Label>
        <Select onValueChange={handleServiceChange} value={selectedService}>
          <SelectTrigger className={`${inputStyles} ${errors.service ? errorBorder : ""}`}>
            <SelectValue placeholder="Select a service or topic" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            {SERVICE_OPTIONS.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="text-cream hover:bg-slate-600 focus:bg-slate-600 focus:text-cream"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.service && (
          <p className="text-red-400 text-sm">{errors.service.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-cream">Message</Label>
        <Textarea
          id="message"
          placeholder="Tell us about your project or inquiry..."
          rows={5}
          {...register("message")}
          className={`${inputStyles} ${errors.message ? errorBorder : ""}`}
        />
        {errors.message && (
          <p className="text-red-400 text-sm">{errors.message.message}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
          <p>{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white font-phosphate title-text text-lg py-3"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
};
