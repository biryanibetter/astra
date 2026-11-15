"use client";

import { motion, type Variants } from "motion/react";
import {
  type FocusEvent,
  forwardRef,
  type InputHTMLAttributes,
  useState,
} from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  requiredMark?: boolean;
  variant?: "default" | "profile";
};

const labelVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    color: "var(--astra-form-muted-foreground, #9ca4b0)",
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  floated: {
    y: -24,
    scale: 0.78,
    color: "var(--astra-form-muted-foreground, #9ca4b0)",
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

export const profileLabelVariants: Variants = {
  rest: {
    ...labelVariants.rest,
    left: "14px",
    x: 0,
    transition: {
      type: "tween",
      duration: 0.3,
      ease: "easeInOut",
      staggerChildren: 0.018,
      staggerDirection: -1,
    },
  },
  floated: {
    ...labelVariants.floated,
    left: "14px",
    x: "0%",
    y: -4,
    transition: {
      type: "tween",
      duration: 0.3,
      ease: "easeInOut",
      staggerChildren: 0.018,
    },
  },
};

const letterVariants: Variants = {
  rest: {
    y: 0,
    opacity: 1,
    transition: { type: "tween", duration: 0.3, ease: "easeInOut" },
  },
  floated: {
    y: -5,
    opacity: 1,
    transition: { type: "tween", duration: 0.3, ease: "easeInOut" },
  },
};

export function AnimatedLabelLetters({
  label,
  requiredMark = false,
  ariaHidden = false,
}: {
  label: string;
  requiredMark?: boolean;
  ariaHidden?: boolean;
}) {
  const letterOccurrences = new Map<string, number>();
  return Array.from(`${label}${requiredMark ? " *" : ""}`).map((letter) => {
    const occurrence = letterOccurrences.get(letter) ?? 0;
    letterOccurrences.set(letter, occurrence + 1);
    return (
      <motion.span
        key={`${letter}-${occurrence}`}
        aria-hidden={ariaHidden || undefined}
        data-label-letter=""
        variants={letterVariants}
        style={{
          display: "inline-block",
          whiteSpace: letter === " " ? "pre" : undefined,
        }}
      >
        {letter}
      </motion.span>
    );
  });
}

export const AnimatedLabelInput = forwardRef<HTMLInputElement, Props>(
  function AnimatedLabelInput(
    {
      label,
      requiredMark,
      value,
      onFocus,
      onBlur,
      variant = "default",
      ...props
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const floated = focused || String(value ?? "").length > 0;
    const variants =
      variant === "profile" ? profileLabelVariants : labelVariants;
    return (
      <div
        className={`astra-animated-input${variant === "profile" ? " astra-profile-animated-input" : ""}`}
      >
        <motion.label
          htmlFor={props.id}
          className="astra-animated-label"
          variants={variants}
          initial={false}
          animate={floated ? "floated" : "rest"}
        >
          {variant === "profile" ? (
            <span aria-hidden="true">
              <AnimatedLabelLetters
                label={label}
                requiredMark={requiredMark ?? false}
                ariaHidden
              />
            </span>
          ) : (
            <>
              {label}
              {requiredMark && <span aria-hidden="true"> *</span>}
            </>
          )}
        </motion.label>
        <input
          {...props}
          aria-label={props["aria-label"] ?? label}
          ref={ref}
          placeholder=" "
          value={value}
          onFocus={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </div>
    );
  },
);
