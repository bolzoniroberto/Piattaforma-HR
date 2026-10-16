import React from "react";

interface PageHeaderProps {
  title: string;
  context?: string;
  description?: string;
  className?: string;
}

export default function PageHeader({ title, context, description, className = "" }: PageHeaderProps) {
  return (
    <div className={`mb-5 ${className}`}>
      {context && (
        <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1.5">
          {context}
        </div>
      )}
      <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}
