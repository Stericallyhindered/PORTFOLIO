'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFound() {
    const router = useRouter();

    return (
        <section className="bg-gray-500 min-h-screen" data-page="404">
            <div className="container min-h-screen px-6 py-12 mx-auto lg:flex lg:items-center lg:gap-12">
                <div className="w-full lg:w-1/2">
                    <p className="text-md font-medium text-white">404 error</p>
                    <h1 className="mt-3 text-2xl font-semibold text-black md:text-3xl">Page not found</h1>
                    <p className="mt-4 text-white">Sorry, the page you are looking for doesn't exist. Here are some helpful links:</p>

                    <div className="flex items-center mt-6 gap-x-3">
                        <button 
                            onClick={() => router.back()}
                            className="flex items-center justify-center w-1/2 px-5 py-2 text-sm text-white transition-colors duration-200 bg-primary border rounded-lg gap-x-2 sm:w-auto hover:bg-gray-900"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                            </svg>
                            <span>Go back</span>
                        </button>

                        <Link 
                            href="/"
                            className="w-1/2 px-5 py-2 text-sm tracking-wide text-white transition-colors duration-200 bg-blue-500 rounded-lg shrink-0 sm:w-auto hover:bg-blue-600 text-center"
                        >
                            Take me home
                        </Link>
                    </div>
                </div>

                <div className="relative w-full mt-8 lg:w-1/2 lg:mt-0">
                    <Image 
                        className="w-full lg:h-[32rem] h-80 md:h-96 rounded-lg object-contain bg-black" 
                        src="/images/bass-clown-co-logo-wide.png" 
                        alt="404 page not found" 
                        width={1000} 
                        height={1000} 
                    />
                </div>
            </div>
        </section>
    )
}