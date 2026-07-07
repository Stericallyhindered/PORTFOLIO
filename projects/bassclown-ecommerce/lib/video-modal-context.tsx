"use client";

import React, { createContext, useContext, useState } from 'react';
import { VideoModal } from '@/components/ui/video-modal';

interface VideoModalData {
  videoSrc: string;
  title: string;
  description?: string;
  category?: string;
  duration?: string;
}

interface VideoModalContextType {
  openVideoModal: (data: VideoModalData) => void;
  closeVideoModal: () => void;
  isOpen: boolean;
}

const VideoModalContext = createContext<VideoModalContextType | undefined>(undefined);

export const useVideoModal = () => {
  const context = useContext(VideoModalContext);
  if (!context) {
    throw new Error('useVideoModal must be used within a VideoModalProvider');
  }
  return context;
};

interface VideoModalProviderProps {
  children: React.ReactNode;
}

export const VideoModalProvider: React.FC<VideoModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<VideoModalData>({
    videoSrc: '',
    title: '',
    description: '',
    category: '',
    duration: '',
  });

  const openVideoModal = (data: VideoModalData) => {
    setModalData(data);
    setIsOpen(true);
  };

  const closeVideoModal = () => {
    setIsOpen(false);
    setModalData({
      videoSrc: '',
      title: '',
      description: '',
      category: '',
      duration: '',
    });
  };

  const value: VideoModalContextType = {
    openVideoModal,
    closeVideoModal,
    isOpen,
  };

  return (
    <VideoModalContext.Provider value={value}>
      {children}
      
      {/* Centralized Video Modal */}
      <VideoModal
        isOpen={isOpen}
        onClose={closeVideoModal}
        videoSrc={modalData.videoSrc}
        title={modalData.title}
        description={modalData.description}
        category={modalData.category}
        duration={modalData.duration}
      />
    </VideoModalContext.Provider>
  );
}; 