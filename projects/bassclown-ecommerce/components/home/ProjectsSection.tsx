"use client";

import { useState, useEffect } from "react";
import { PROJECTS } from "@/lib/constants";
import { ProjectCard } from "@/components/ProjectCard";
import { ImageLightbox } from "@/components/ImageLightbox";

export const ProjectsSection = () => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          }
        });
      },
      { threshold: 0.1 }
    );

    const projects = document.querySelectorAll(".project-card");
    projects.forEach((project) => observer.observe(project));

    return () => {
      projects.forEach((project) => observer.unobserve(project));
    };
  }, []);

  return (
    <section id="projects" className="py-24 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Our Projects</h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Explore our portfolio of completed projects showcasing our expertise in video production,
            content creation, and promotional marketing solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROJECTS.map((project, index) => (
            <ProjectCard
              key={project.title}
              project={project}
              index={index}
              onClick={() => setSelectedProject(index)}
            />
          ))}
        </div>
      </div>

      {selectedProject !== null && (
        <ImageLightbox
          projects={PROJECTS}
          currentIndex={selectedProject}
          onClose={() => setSelectedProject(null)}
          onNext={() => 
            setSelectedProject((prev) => 
              prev === PROJECTS.length - 1 ? 0 : (prev ?? 0) + 1
            )
          }
          onPrev={() => 
            setSelectedProject((prev) => 
              prev === 0 ? PROJECTS.length - 1 : (prev ?? 0) - 1
            )
          }
        />
      )}
    </section>
  );
};
