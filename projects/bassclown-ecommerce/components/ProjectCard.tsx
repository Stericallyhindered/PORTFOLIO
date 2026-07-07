"use client";

import Image from "next/image";
import { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  index: number;
  onClick?: () => void;
}

export const ProjectCard = ({ project, index, onClick }: ProjectCardProps) => {
  const { title, description, image, category } = project;
  
  const handleClick = () => {
    // Default click handler if none provided
    onClick?.();
    // You can add additional functionality here if needed
    console.log(`Clicked on project: ${title}`);
  };
  
  return (
    <div 
      className={cn(
        "project-card cursor-pointer bg-slate-800 rounded-lg overflow-hidden transition-all duration-500 transform opacity-0 translate-y-8 hover:shadow-xl",
        index % 2 === 0 ? "hover:-translate-y-2" : "hover:translate-y-2"
      )}
      onClick={handleClick}
    >
      <div className="relative h-64">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
        <div className="absolute top-4 right-4">
          <span className="bg-red-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {category}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <p className="text-slate-300">{description}</p>
      </div>
    </div>
  );
};
