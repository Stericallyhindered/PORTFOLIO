import { cn } from "@/lib/utils";

interface GridTitleLeftProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const GridTitleLeft = ({ title, children, className }: GridTitleLeftProps) => {
  return (
      <section className={cn("py-12 flex flex-col items-center justify-center", className)}>
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1 flex items-center justify-center">
              <h2 className="title-text text-4xl text-white mb-8">
                {title.toUpperCase()}
              </h2>
            </div>
            <div className="md:col-span-3">
                {children}
            </div>
          </div>
      </section>

  );
};