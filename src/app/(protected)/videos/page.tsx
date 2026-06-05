/* eslint-disable no-console */
"use client";
import { EyeIcon, Loader2, Trash2Icon, UploadCloudIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteVideo, getVideos, uploadVideo } from "@/lib/apiActions";
import { useVideoStore } from "@/stores/videoStore";
import { Video } from "@/types/api";

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();
  const { uploadModalOpen, setUploadModalOpen } = useVideoStore();

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await getVideos();
      setVideos(res);
    } catch (e) {
      console.log(e);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setUploadError("File and title are required");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await uploadVideo({ file, title, description });
      setUploadModalOpen(false);
      setFile(null);
      setTitle("");
      setDescription("");
      fetchVideos();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload video";
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteVideo(id);
      await fetchVideos();
    } catch (error) {
      console.error("Failed to delete video:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Videos</h2>
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="cursor-pointer"
        >
          <UploadCloudIcon className="mr-2 w-4 h-4" /> Upload Video
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground">
              No videos found.
            </div>
          ) : (
            videos.map((video) => (
              <Card key={video.id} className="group relative overflow-hidden">
                <div className="relative">
                  <video
                    src={video.video_file}
                    className="w-full h-48 object-cover"
                    controls={false}
                    preload="metadata"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 bg-background/80"
                      onClick={() => handleDelete(video.id)}
                      disabled={deletingId === video.id}
                    >
                      {deletingId === video.id ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <Trash2Icon className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-primary bg-background/80"
                      onClick={() => router.push(`/videos/${video.id}`)}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="truncate">{video.title}</CardTitle>
                  <CardDescription className="truncate">
                    {video.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
            <DialogDescription>
              Upload a new video. File and title are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
              required
            />
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              required
            />
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
            />
            {uploadError && (
              <div className="text-red-500 text-sm">{uploadError}</div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={uploading}
                className="w-full cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                ) : null}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Videos;
