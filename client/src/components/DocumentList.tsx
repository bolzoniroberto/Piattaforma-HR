import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Eye, CheckCircle } from "lucide-react";
import { useState } from "react";

export interface Document {
  id: string;
  title: string;
  description: string;
  type: "regulation" | "policy" | "contract";
  date: string;
  requiresAcceptance: boolean;
  accepted?: boolean;
}

interface DocumentListProps {
  documents: Document[];
  onAccept?: (id: string) => void;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export default function DocumentList({
  documents,
  onAccept,
  onView,
  onDownload,
}: DocumentListProps) {
  const [acceptedDocs, setAcceptedDocs] = useState<Set<string>>(
    new Set(documents.filter((d) => d.accepted).map((d) => d.id))
  );

  const handleAccept = (id: string, checked: boolean) => {
    const newAccepted = new Set(acceptedDocs);
    if (checked) {
      newAccepted.add(id);
      onAccept?.(id);
    } else {
      newAccepted.delete(id);
    }
    setAcceptedDocs(newAccepted);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Documenti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 py-4 border-b last:border-b-0"
              data-testid={`document-${doc.id}`}
            >
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-medium text-sm leading-tight">{doc.title}</h4>
                <p className="text-xs text-muted-foreground">{doc.description}</p>
                <p className="text-xs text-muted-foreground">{doc.date}</p>
              </div>

              <div className="flex items-center gap-2">
                {doc.requiresAcceptance && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`accept-${doc.id}`}
                      checked={acceptedDocs.has(doc.id)}
                      onCheckedChange={(checked) =>
                        handleAccept(doc.id, checked as boolean)
                      }
                      data-testid={`checkbox-accept-${doc.id}`}
                    />
                    <label
                      htmlFor={`accept-${doc.id}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      {acceptedDocs.has(doc.id) ? (
                        <CheckCircle className="h-4 w-4 text-chart-2" />
                      ) : (
                        "Accetta"
                      )}
                    </label>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView?.(doc.id)}
                  data-testid={`button-view-${doc.id}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDownload?.(doc.id)}
                  data-testid={`button-download-${doc.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
