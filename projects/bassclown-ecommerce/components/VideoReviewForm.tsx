"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VideoReviewFormValues, videoReviewFormSchema } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, MapPin } from "lucide-react";
import { submitVideoReviewForm } from "@/lib/videoReviewFormSubmission";

const US_STATES_AND_PROVINCES = [
  // US States
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

export const VideoReviewForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { 
    register, 
    handleSubmit, 
    reset,
    setValue,
    formState: { errors } 
  } = useForm<VideoReviewFormValues>({
    resolver: zodResolver(videoReviewFormSchema),
  });


  const onSubmit = async (data: VideoReviewFormValues) => {
    setIsSubmitting(true);
    setError("");
    
    try {
      const result = await submitVideoReviewForm(data);
      
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

  const inputStyles = "bg-slate-700 border-slate-600 placeholder:text-cream/60 focus:border-red-500 focus:ring-red-500 text-cream";
  const errorBorder = "border-red-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Honeypot field - hidden from users, bots might fill it */}
      <div className="absolute left-[-9999px] opacity-0 pointer-events-none" aria-hidden="true">
        <Label htmlFor="website">Website (leave blank)</Label>
        <Input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-cream border-b border-red-500 pb-2">
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-cream">Full Name *</Label>
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
            <Label htmlFor="company" className="text-cream">Company Name *</Label>
            <Input
              id="company"
              placeholder="Your Company"
              {...register("company")}
              className={`${inputStyles} ${errors.company ? errorBorder : ""}`}
            />
            {errors.company && (
              <p className="text-red-400 text-sm">{errors.company.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-cream">Email Address *</Label>
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
            <Label htmlFor="phone" className="text-cream">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              {...register("phone")}
              className={`${inputStyles} ${errors.phone ? errorBorder : ""}`}
            />
            {errors.phone && (
              <p className="text-red-400 text-sm">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Physical Address Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-cream border-b border-red-500 pb-2 flex-1">
            Physical Address
          </h3>
        </div>
        <p className="text-cream/80 text-sm">
          Please provide your physical address.
        </p>
        
        <div className="space-y-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="space-y-2">
            <Label htmlFor="streetAddress" className="text-cream">Street Address *</Label>
            <Input
              id="streetAddress"
              placeholder="123 Main Street"
              {...register("streetAddress")}
              className={`${inputStyles} ${errors.streetAddress ? errorBorder : ""}`}
            />
            {errors.streetAddress && (
              <p className="text-red-400 text-sm">{errors.streetAddress.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="city" className="text-cream">City *</Label>
              <Input
                id="city"
                placeholder="Anytown"
                {...register("city")}
                className={`${inputStyles} ${errors.city ? errorBorder : ""}`}
              />
              {errors.city && (
                <p className="text-red-400 text-sm">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-cream">State *</Label>
              <Select onValueChange={(value) => setValue("state", value, { shouldValidate: true })}>
                <SelectTrigger className={`${inputStyles} ${errors.state ? errorBorder : ""}`}>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 max-h-60">
                  {US_STATES_AND_PROVINCES.map((location) => (
                    <SelectItem 
                      key={location.value} 
                      value={location.value}
                      className="text-cream focus:bg-primary"
                    >
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-red-400 text-sm">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode" className="text-cream">ZIP/Postal Code *</Label>
              <Input
                id="zipCode"
                placeholder="12345"
                {...register("zipCode")}
                className={`${inputStyles} ${errors.zipCode ? errorBorder : ""}`}
              />
              {errors.zipCode && (
                <p className="text-red-400 text-sm">{errors.zipCode.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-cream border-b border-red-500 pb-2">
          Product Information
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="description" className="text-cream">Product Description *</Label>
          <p className="text-cream/70 text-sm">
            Tell us about your product, its features, target audience, and what makes it special.
          </p>
          <Textarea
            id="description"
            placeholder="Describe your product in detail - what it does, who it's for, key features, benefits, etc."
            rows={6}
            {...register("description")}
            className={`${inputStyles} ${errors.description ? errorBorder : ""}`}
          />
          {errors.description && (
            <p className="text-red-400 text-sm">{errors.description.message}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
          <p>{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-red-700 text-white font-phosphate title-text text-lg py-3"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Request...
          </>
        ) : (
          "Submit Video Review Request"
        )}
      </Button>
    </form>
  );
};

export default VideoReviewForm;
