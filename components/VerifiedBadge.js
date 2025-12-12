export default function VerifiedBadge({ type = "building" }) {
  const label = type === "building" ? "Aina Verified Building" : "Aina Verified Unit";
  
  return (
    <div className="inline-flex items-center ml-2" title={label}>
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Gold circular badge with serrated edge */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-md"
          style={{
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 15%, 94% 20%, 100% 25%, 94% 30%, 100% 35%, 94% 40%, 100% 45%, 94% 50%, 100% 55%, 94% 60%, 100% 65%, 94% 70%, 100% 75%, 94% 80%, 100% 85%, 100% 100%, 0% 100%, 0% 85%, 6% 80%, 0% 75%, 6% 70%, 0% 65%, 6% 60%, 0% 55%, 6% 50%, 0% 45%, 6% 40%, 0% 35%, 6% 30%, 0% 25%, 6% 20%, 0% 15%)'
          }}
        >
        </div>
        
        {/* White checkmark in center */}
        <div className="relative z-10 flex items-center justify-center">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <path 
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" 
              fill="white" 
              stroke="white" 
              strokeWidth="0.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

