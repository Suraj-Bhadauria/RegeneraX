 "use client";
import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect } from "react";

export const TypewriterEffectSmooth = ({
  words,
  className,
  cursorClassName,
}) => {
  // 1. Splits words into individual characters for animation
  const wordsArray = words.map((word) => ({
    ...word,
    text: word.text.split(""),
  }));

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true }); // Animation runs only once

  useEffect(() => {
    if (isInView) {
      // 2. Creates the staggered "typing" animation for each character
      animate(
        "span",
        {
          display: "inline-block",
          opacity: 1,
        },
        {
          duration: 0.15,
          delay: stagger(0.05), // Controls the speed of typing
          ease: "easeInOut",
        }
      );
    }
  }, [isInView]);

  const renderWords = () => {
    return (
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, idx) => (
          <div key={`word-${idx}`} className="inline-block">
            {word.text.map((char, index) => (
              <span
                key={`char-${index}`}
                // 3. Allows styles (color, size) to be passed in from the parent component
                className={cn(`opacity-0`, word.className)}
              >
                {char}
              </span>
            ))}
            &nbsp; {/* Adds a space between words */}
          </div>
        ))}
      </motion.div>
    );
  };

  return (
    // 4. Uses 'items-baseline' to perfectly align the cursor with the text
    <div className={cn("flex items-baseline space-x-1 my-6", className)}>
      <motion.div
        className="overflow-hidden"
        initial={{ width: "0%" }}
        whileInView={{ width: "fit-content" }}
        transition={{ duration: 0.5, ease: "linear", delay: 0.4 }}
      >
        <div
          className="font-bold"
          style={{ whiteSpace: "nowrap" }}
        >
          {renderWords()}
        </div>
      </motion.div>

      {/* The blinking cursor */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className={cn(
          "rounded-sm w-[4px] h-4 sm:h-6 xl:h-12 bg-blue-500",
          cursorClassName
        )}
      ></motion.span>
    </div>
  );
};