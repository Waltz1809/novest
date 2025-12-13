"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  FileText,
  MoreVertical,
} from "lucide-react";
import InlineChapterForm from "./inline-chapter-form";

interface Chapter {
  id: number;
  title: string;
  order: number;
  createdAt: Date;
  content: string;
  price: number;
  isDraft?: boolean; // Draft chapters show in orange
}

interface Volume {
  id: number;
  title: string;
  order: number;
  chapters: Chapter[];
}

interface VolumeAccordionProps {
  novelId: number;
  volumes: Volume[];
  onRenameVolume: (volumeId: number, newTitle: string) => void;
  onCreateVolume: () => void;
}

export default function VolumeAccordion({
  novelId,
  volumes,
  onRenameVolume,
  onCreateVolume,
}: VolumeAccordionProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<Set<number>>(
    new Set()
  );
  const [addingChapterToVolume, setAddingChapterToVolume] = useState<
    number | null
  >(null);
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);

  const toggleVolume = (volumeId: number) => {
    const newExpanded = new Set(expandedVolumes);
    if (newExpanded.has(volumeId)) {
      newExpanded.delete(volumeId);
    } else {
      newExpanded.add(volumeId);
    }
    setExpandedVolumes(newExpanded);
  };

  const handleRenameClick = (e: React.MouseEvent, volume: Volume) => {
    e.stopPropagation();
    const newTitle = window.prompt("Đổi tên tập:", volume.title);
    if (newTitle && newTitle !== volume.title) {
      onRenameVolume(volume.id, newTitle);
    }
  };

  return (
    <div className="space-y-4">
      {volumes.map((volume) => {
        const isExpanded = expandedVolumes.has(volume.id);
        const isAddingChapter = addingChapterToVolume === volume.id;

        return (
          <div
            key={volume.id}
            className="bg-card/50 border border-border rounded-xl overflow-hidden transition-all duration-200"
          >
            {/* Volume Header */}
            <div
              onClick={() => toggleVolume(volume.id)}
              className={`
                                p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors
                                ${isExpanded
                  ? "bg-muted/50 border-b border-border"
                  : ""
                }
                            `}
            >
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                    {volume.title}
                    <button
                      onClick={(e) => handleRenameClick(e, volume)}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="Đổi tên tập"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {volume.chapters.length} chương
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-primary" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Volume Content (Chapters) */}
            {isExpanded && (
              <div className="p-4 bg-muted/20">
                {/* Chapter List */}
                <div className="space-y-2 mb-4">
                  {volume.chapters.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground italic">
                      Chưa có chương nào. Hãy thêm chương mới!
                    </div>
                  ) : (
                    volume.chapters.map((chapter) => {
                      if (editingChapterId === chapter.id) {
                        return (
                          <InlineChapterForm
                            key={chapter.id}
                            novelId={novelId}
                            volumeId={volume.id}
                            initialData={chapter}
                            onCancel={() => setEditingChapterId(null)}
                            onSuccess={() => {
                              setEditingChapterId(null);
                              window.location.reload();
                            }}
                          />
                        );
                      }

                      return (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 bg-muted rounded-md ${chapter.isDraft ? 'text-amber-500' : 'text-primary'}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className={`font-medium ${chapter.isDraft ? 'text-amber-500' : 'text-foreground'} group-hover:text-primary transition-colors flex items-center gap-2`}>
                                {chapter.title}
                                {chapter.isDraft && (
                                  <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded font-bold">Nháp</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>
                                  Cập nhật:{" "}
                                  {new Date(
                                    chapter.createdAt
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                                {chapter.price > 0 && (
                                  <span className="text-primary font-bold">
                                    • {chapter.price} Xu
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <button
                            onClick={() => setEditingChapterId(chapter.id)}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            title="Chỉnh sửa chương"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Chapter Area */}
                {isAddingChapter ? (
                  <InlineChapterForm
                    novelId={novelId}
                    volumeId={volume.id}
                    onCancel={() => setAddingChapterToVolume(null)}
                    onSuccess={() => {
                      setAddingChapterToVolume(null);
                      window.location.reload();
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setAddingChapterToVolume(volume.id)}
                    className="w-full py-3 border-2 border-dashed border-border rounded-lg text-primary font-bold hover:bg-primary/10 hover:border-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm chương mới
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Create Volume Button */}
      <button
        onClick={onCreateVolume}
        className="w-full py-4 bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-bold rounded-xl border-2 border-dashed border-border hover:border-primary transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Tạo tập mới
      </button>
    </div>
  );
}
