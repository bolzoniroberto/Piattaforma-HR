import React from "react";

interface PageHeaderProps {
  title: string;
  context?: string;
  description?: string;
  className?: string;
}

export default function PageHeader({ title, context, description, className = "" }: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      {context && (
        <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">
          {context}
        </div>
      )}
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}
