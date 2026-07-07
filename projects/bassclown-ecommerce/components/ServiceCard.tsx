import Image from "next/image";
import { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  index: number;
}

export const ServiceCard = ({ service, index }: ServiceCardProps) => {
  const { title, description, icon: Icon, image } = service;
  
  return (
    <div 
      className={cn(
        "service-card bg-white rounded-lg shadow-md overflow-hidden transition-all duration-500 transform opacity-0 translate-y-8 hover:shadow-xl",
        index % 2 === 0 ? "hover:-translate-y-2" : "hover:translate-y-2"
      )}
    >
      <div className="relative h-48">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className="bg-red-500/10 p-2 rounded-full mr-3">
            <Icon className="h-5 w-5 text-red-600" />
          </div>
        </div>
        <p className="text-slate-600">{description}</p>
      </div>
    </div>
  );
};