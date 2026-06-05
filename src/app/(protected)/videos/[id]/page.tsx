"use client";
import { ArrowLeftIcon, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getVideoDetail } from "@/lib/apiActions";
import { Video } from "@/types/api";

const VideoPreview = () => {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getVideoDetail(Number(id))
      .then(setVideo)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">Video not found.</div>
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon className="mr-2 w-4 h-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Button
        variant="outline"
        className="mb-4 self-start"
        onClick={() => router.back()}
      >
        <ArrowLeftIcon className="mr-2 w-4 h-4" /> Back
      </Button>
      <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
      <p className="text-muted-foreground mb-4">{video.description}</p>
      <video
        src={video.video_file}
        controls
        autoPlay
        className="w-full max-w-3xl rounded-xl shadow-lg"
        style={{ maxHeight: "70vh" }}
      />
    </div>
  );
};

export default VideoPreview;
