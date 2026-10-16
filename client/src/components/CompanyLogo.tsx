import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface DocLogo {
  id: string;
  name: string;
  filePath: string;
  uploadedAt: number;
}

interface CompanyLogoProps {
  className?: string;
}

export default function CompanyLogo({ className }: CompanyLogoProps) {
  const { data: logos = [] } = useQuery<DocLogo[]>({ queryKey: ["/api/doc/logos"] });
  if (!logos.length) return null;
  return (
    <img
      src={`/api/doc/logos/${logos[0].id}/image`}
      alt="Logo aziendale"
      className={cn("h-6 w-auto object-contain opacity-70", className)}
    />
  );
}
