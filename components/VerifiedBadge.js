export default function VerifiedBadge({ type = "building" }) {
  const label = type === "building" ? "Aina Verified Building" : "Aina Verified Unit";
  
  return (
    <div className="inline-flex items-center ml-2" title={label}>
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Outer gold ring with serrated edge effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg">
          {/* Serrated edge using border */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-600/50" 
               style={{
                 clipPath: 'polygon(0% 0%, 100% 0%, 100% 20%, 92% 25%, 100% 30%, 92% 35%, 100% 40%, 92% 45%, 100% 50%, 92% 55%, 100% 60%, 92% 65%, 100% 70%, 92% 75%, 100% 80%, 100% 100%, 0% 100%, 0% 80%, 8% 75%, 0% 70%, 8% 65%, 0% 60%, 8% 55%, 0% 50%, 8% 45%, 0% 40%, 8% 35%, 0% 30%, 8% 25%, 0% 20%)'
               }}>
          </div>
        </div>
        
        {/* Inner circle with black background */}
        <div className="absolute inset-1.5 rounded-full bg-black flex flex-col items-center justify-center overflow-hidden">
          {/* Top text */}
          <div className="absolute top-1 left-0 right-0 text-[6px] text-amber-400 font-bold uppercase tracking-tighter text-center leading-tight px-1">
            100% GUARANTEE
          </div>
          
          {/* Center CERTIFIED band */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 py-0.5 px-1">
            <div className="text-[7px] font-black text-black uppercase tracking-tight text-center leading-none">
              CERTIFIED
            </div>
          </div>
          
          {/* Bottom text (inverted) */}
          <div className="absolute bottom-1 left-0 right-0 text-[6px] text-amber-400 font-bold uppercase tracking-tighter text-center leading-tight px-1 transform scale-y-[-1]">
            100% GUARANTEE
          </div>
          
          {/* Top star */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[5px] text-red-500 leading-none">★</div>
          
          {/* Bottom stars */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            <span className="text-[4px] text-amber-400 leading-none">★</span>
            <span className="text-[4px] text-amber-400 leading-none">★</span>
            <span className="text-[4px] text-amber-400 leading-none">★</span>
            <span className="text-[4px] text-amber-400 leading-none">★</span>
            <span className="text-[4px] text-amber-400 leading-none">★</span>
          </div>
        </div>
      </div>
    </div>
  );
}

