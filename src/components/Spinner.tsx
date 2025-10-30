import React from "react";

const Spinner: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center justify-center w-full h-full ${className}`}>
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-contessa-600 border-t-2"></div>
  </div>
);

export default Spinner;
