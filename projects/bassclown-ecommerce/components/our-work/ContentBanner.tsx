"use client";

export const ContentBanner = ({ BannerText }: { BannerText: string }) => {
  return (
    <div className="w-full my-12 text-center grid grid-cols-12 relative">
        <div className="col-span-12 md:col-span-11 md:col-start-2">
          <div className="w-full bg-red-600 py-8 relative">
            <h2 className="text-white text-xl md:text-4xl font-thin title-text phosphate md:absolute top-1/2 left-1/2 md:-translate-x-2/3 md:-translate-y-1/2 md:w-fit text-center">
              {BannerText}
            </h2>
          </div>
        </div>
    </div>
  );
};
