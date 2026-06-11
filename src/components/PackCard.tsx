"use client";

import { ImageIcon, MapPinIcon, MoreVerticalIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pack } from "@/lib/apiActions";

export type { Pack };

interface PackCardProps {
  pack: Pack;
  // eslint-disable-next-line no-unused-vars
  onSubscribe?: (pack: Pack) => void;
  // eslint-disable-next-line no-unused-vars
  onEdit?: (pack: Pack) => void;
  // eslint-disable-next-line no-unused-vars
  onDelete?: (pack: Pack) => void;
  // eslint-disable-next-line no-unused-vars
  onToggleActive?: (pack: Pack) => void;
  showActions?: boolean;
}

export function PackCard({
  pack,
  onSubscribe,
  onEdit,
  onDelete,
  onToggleActive,
  showActions = true,
}: PackCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = !!pack.image && !imgError;

  return (
    <Card className="flex-1 flex flex-col overflow-hidden transition-shadow hover:shadow-lg dark:bg-card dark:border-border pt-0">
      <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-muted flex-shrink-0">
        {hasImage ? (
          <Image
            src={pack.image as string}
            alt={pack.title}
            fill
            className="object-cover"
            sizes="320px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted">
            <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/50">No image</span>
          </div>
        )}

        {showActions && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(pack)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onToggleActive?.(pack)}
                  className={pack.active ? "text-orange-600" : "text-green-600"}
                >
                  {pack.active ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(pack)}
                  variant="destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {!pack.active && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="bg-muted-foreground/80">
              Inactive
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="flex-1">
        <CardTitle className="text-xl font-bold text-foreground">
          {pack.title}
        </CardTitle>
        {pack.region_name && (
          <div className="flex items-center gap-1 mt-1">
            <MapPinIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {pack.region_name}
            </span>
          </div>
        )}
        <CardDescription className="text-sm text-muted-foreground mt-1">
          {pack.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            €{parseFloat(pack.price).toFixed(2)}
          </span>
        </div>
        {pack.total_hours !== undefined && (
          <div className="mt-2 text-sm text-muted-foreground">
            Credit Hours:{" "}
            <span className="font-semibold text-foreground">
              {pack.total_hours}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          onClick={() => onSubscribe?.(pack)}
          className="w-full"
          disabled={!pack.active}
        >
          Subscribe
        </Button>
      </CardFooter>
    </Card>
  );
}
