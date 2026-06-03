import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RatingStars({ value = 0, onChange, size = 'md', readOnly = false }) {
  const [hover, setHover] = useState(0);
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  const sizeClass = sizes[size];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readOnly}
            whileHover={readOnly ? {} : { scale: 1.2 }}
            whileTap={readOnly ? {} : { scale: 0.9 }}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange?.(star)}
            className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <Star
              className={`${sizeClass} transition-all duration-200 ${
                filled
                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]'
                  : 'text-sf-text-secondary'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
