"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSmoothScroll } from "@/components/smooth-scroll-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShinyAction } from "@/components/ui/shiny-button";
import { Textarea } from "@/components/ui/textarea";
import { useSystemReducedMotion } from "@/lib/system-motion-preference";
import { cn } from "@/lib/utils";

const steps = [
  { id: "personal", title: "Personal Info" },
  { id: "professional", title: "Professional" },
  { id: "goals", title: "Website Goals" },
  { id: "design", title: "Design" },
  { id: "budget", title: "Budget" },
  { id: "requirements", title: "Requirements" },
];

interface FormData {
  name: string;
  email: string;
  company: string;
  profession: string;
  experience: string;
  industry: string;
  primaryGoal: string;
  targetAudience: string;
  contentTypes: string[];
  colorPreference: string;
  stylePreference: string;
  inspirations: string;
  budget: string;
  timeline: string;
  features: string[];
  additionalInfo: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};
const applicationContentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export interface ApplicationSteps {
  steps: ReadonlyArray<{ id: string; title: string; shortTitle?: string }>;
  renderStep: (
    step: number,
    goToStep: (step: number) => void,
  ) => React.ReactNode;
  canProceed: (step: number) => boolean;
  onNext: (step: number) => Promise<boolean>;
  onDone: () => void | Promise<void>;
  /** Explicit opt-in after a real submission endpoint is available. */
  doneAvailable?: boolean;
  onInvalid?: (step: number) => void;
  submitting: boolean;
}

const OnboardingForm = ({
  application,
}: {
  application?: ApplicationSteps;
}) => {
  const prefersReducedMotion = useSystemReducedMotion();
  const lenis = useSmoothScroll();
  const displayedSteps = application?.steps ?? steps;
  const [currentStep, setCurrentStep] = useState(0);
  const navigationRef = useRef({ step: 0, generation: 0 });
  const navigationGeneration = navigationRef.current.generation;
  const positionedNavigationRef = useRef(0);
  const cardPositionRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const changeStep = (step: number) => {
    if (step === navigationRef.current.step) return;
    navigationRef.current = {
      step,
      generation: navigationRef.current.generation + 1,
    };
    setCurrentStep(step);
  };
  const timelineSteps = displayedSteps;
  const timelineCurrentStep = currentStep;
  const [reachedReview, setReachedReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    profession: "",
    experience: "",
    industry: "",
    primaryGoal: "",
    targetAudience: "",
    contentTypes: [],
    colorPreference: "",
    stylePreference: "",
    inspirations: "",
    budget: "",
    timeline: "",
    features: [],
    additionalInfo: "",
  });

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const toggleFeature = (feature: string) => {
    setFormData((prev) => {
      const features = [...prev.features];
      if (features.includes(feature))
        return { ...prev, features: features.filter((f) => f !== feature) };
      return { ...prev, features: [...features, feature] };
    });
  };
  // biome-ignore lint/correctness/noUnusedVariables: retained from the original 21st.dev demo for source parity.
  const toggleContentType = (type: string) => {
    setFormData((prev) => {
      const types = [...prev.contentTypes];
      if (types.includes(type))
        return { ...prev, contentTypes: types.filter((t) => t !== type) };
      return { ...prev, contentTypes: [...types, type] };
    });
  };
  const nextStep = () => {
    if (currentStep < displayedSteps.length - 1) {
      if (currentStep === displayedSteps.length - 2) setReachedReview(true);
      changeStep(currentStep + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 0) changeStep(currentStep - 1);
  };
  const handleSubmit = () => {
    setIsSubmitting(true);
    // Original 21st.dev demo behavior: no network submission.
    setTimeout(() => {
      toast.success("Form submitted successfully!");
      setIsSubmitting(false);
    }, 1500);
  };
  const isStepValid = (step = currentStep) => {
    if (application) return application.canProceed(step);
    switch (step) {
      case 0:
        return formData.name.trim() !== "" && formData.email.trim() !== "";
      case 1:
        return formData.profession.trim() !== "" && formData.industry !== "";
      case 2:
        return formData.primaryGoal !== "";
      case 3:
        return formData.stylePreference !== "";
      case 4:
        return formData.budget !== "" && formData.timeline !== "";
      default:
        return true;
    }
  };

  // Desktop progress alignment: each marker sits on the center of an equal column.
  const getProgressWidth = (
    step: number,
    total: number,
    edgeAligned = false,
  ) => {
    if (total <= 1) return "100%";
    const progress = edgeAligned
      ? step / (total - 1)
      : (step * 2 + 1) / (total * 2);
    return `${progress * 100}%`;
  };
  const mobileRouteProgress =
    [0, 0.176, 0.352, 0.648, 0.824, 1][currentStep] ?? 1;

  return (
    <div
      className={
        application
          ? "astra-multistep-form w-full min-w-0"
          : "w-full max-w-lg mx-auto py-8"
      }
    >
      <motion.div
        className="mb-8"
        initial={
          application && prefersReducedMotion ? false : { opacity: 0, y: -20 }
        }
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: application && prefersReducedMotion ? 0 : 0.5 }}
      >
        <div className={application ? "astra-application-timeline" : undefined}>
          <div
            className={
              application ? "astra-step-grid" : "flex justify-between mb-2"
            }
          >
            {timelineSteps.map((step, index) => {
              const applicationStepIndex = index;
              return (
                <motion.div
                  key={step.id}
                  className={
                    application
                      ? "astra-step flex flex-col items-center"
                      : "flex flex-col items-center"
                  }
                  {...(application && prefersReducedMotion
                    ? {}
                    : { whileHover: { scale: 1.1 } })}
                >
                  <motion.button
                    type="button"
                    aria-label={`Go to ${step.title}`}
                    aria-current={
                      applicationStepIndex === currentStep ? "step" : undefined
                    }
                    disabled={
                      applicationStepIndex > currentStep &&
                      !(
                        application &&
                        reachedReview &&
                        applicationStepIndex === displayedSteps.length - 1 &&
                        isStepValid(displayedSteps.length - 1)
                      )
                    }
                    className={cn(
                      application
                        ? "astra-step-marker rounded-full cursor-pointer transition-colors duration-300"
                        : "w-4 h-4 rounded-full cursor-pointer transition-colors duration-300",
                      applicationStepIndex < currentStep
                        ? "bg-primary"
                        : applicationStepIndex === currentStep
                          ? "bg-primary ring-4 ring-primary/20"
                          : "bg-muted",
                    )}
                    onClick={() => changeStep(applicationStepIndex)}
                    {...(application && prefersReducedMotion
                      ? {}
                      : { whileTap: { scale: 0.95 } })}
                  >
                    {application ? (
                      applicationStepIndex < currentStep ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <span>{index + 1}</span>
                      )
                    ) : null}
                  </motion.button>
                  <motion.span
                    className={cn(
                      application
                        ? "astra-step-label"
                        : "text-xs mt-1.5 hidden sm:block",
                      applicationStepIndex === currentStep
                        ? "text-primary font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    {application ? (
                      <>
                        <span className="astra-step-full">{step.title}</span>
                        <span className="astra-step-short">
                          {application.steps[applicationStepIndex]
                            ?.shortTitle ?? step.title}
                        </span>
                      </>
                    ) : (
                      step.title
                    )}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
          <div
            className={cn(
              "w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2 relative",
              application && "astra-application-progress",
            )}
            role="progressbar"
            aria-label="Application progress"
            aria-valuemin={1}
            aria-valuemax={timelineSteps.length}
            aria-valuenow={Math.min(
              timelineSteps.length,
              timelineCurrentStep + 1,
            )}
          >
            {timelineSteps.map((_, index) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: Static alignment markers, order never changes
                key={index}
                className="absolute top-1/2 -translate-y-1/2 w-px h-2 bg-muted-foreground/30 pointer-events-none"
                style={{
                  left: `${(index / Math.max(1, timelineSteps.length - 1)) * 100}%`,
                }}
                aria-hidden="true"
              />
            ))}
            <motion.div
              className="h-full bg-primary absolute top-0 left-0"
              initial={{
                width: getProgressWidth(
                  0,
                  timelineSteps.length,
                  Boolean(application),
                ),
              }}
              animate={{
                width: getProgressWidth(
                  timelineCurrentStep,
                  timelineSteps.length,
                  Boolean(application),
                ),
              }}
              transition={{
                duration: application && prefersReducedMotion ? 0 : 0.42,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            />
            {application ? (
              <svg
                className="astra-mobile-progress"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M16.667 6.06 H83.333 V62.12 H16.667"
                  fill="none"
                  pathLength="1"
                  stroke="rgba(198, 204, 213, 0.22)"
                  strokeWidth="0.7"
                  vectorEffect="non-scaling-stroke"
                />
                <motion.path
                  d="M16.667 6.06 H83.333 V62.12 H16.667"
                  fill="none"
                  pathLength="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: mobileRouteProgress }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.42,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  stroke="#c6ccd5"
                  strokeWidth="0.9"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : null}
          </div>
        </div>
      </motion.div>

      <motion.div
        ref={cardPositionRef}
        initial={application ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: application ? (prefersReducedMotion ? 0 : 0.2) : 0.5,
          delay: application ? 0 : 0.2,
        }}
      >
        <Card
          data-application-card={application ? "" : undefined}
          className={cn(
            "border shadow-md rounded-3xl overflow-hidden",
            application && "application-shell glass",
          )}
        >
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                ref={stepContentRef}
                tabIndex={application ? -1 : undefined}
                className={application ? "application-step-content" : undefined}
                key={
                  application
                    ? `${currentStep}-${navigationGeneration}`
                    : currentStep
                }
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={
                  application ? applicationContentVariants : contentVariants
                }
                onAnimationComplete={(definition) => {
                  if (
                    !application ||
                    definition !== "visible" ||
                    navigationGeneration !== navigationRef.current.generation ||
                    positionedNavigationRef.current === navigationGeneration
                  )
                    return;
                  positionedNavigationRef.current = navigationGeneration;
                  // The applicant or validation may already have focused a
                  // field while the entrance animation was running. Do not
                  // override that focus or its error-scroll destination.
                  if (
                    document.activeElement !== stepContentRef.current &&
                    stepContentRef.current?.contains(document.activeElement)
                  )
                    return;
                  stepContentRef.current?.focus({ preventScroll: true });
                  const bounds =
                    cardPositionRef.current?.getBoundingClientRect();
                  if (bounds) {
                    if (lenis) {
                      lenis.scrollTo(
                        Math.max(0, window.scrollY + bounds.top - 24),
                        { immediate: true, force: true },
                      );
                    } else {
                      window.scrollTo({
                        top: Math.max(0, window.scrollY + bounds.top - 24),
                        behavior: "instant",
                      });
                    }
                  }
                }}
              >
                {application
                  ? application.renderStep(currentStep, changeStep)
                  : null}
                {!application && currentStep === 0 && (
                  <>
                    <CardHeader>
                      <CardTitle>Tell us about yourself</CardTitle>
                      <CardDescription>
                        Let&apos;s start with some basic information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) =>
                            updateFormData("name", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            updateFormData("email", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="company">
                          Company/Organization (Optional)
                        </Label>
                        <Input
                          id="company"
                          placeholder="Your Company"
                          value={formData.company}
                          onChange={(e) =>
                            updateFormData("company", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {!application && currentStep === 1 && (
                  <>
                    <CardHeader>
                      <CardTitle>Professional Background</CardTitle>
                      <CardDescription>
                        Tell us about your professional experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="profession">
                          What&apos;s your profession?
                        </Label>
                        <Input
                          id="profession"
                          placeholder="e.g. Designer, Developer, Marketer"
                          value={formData.profession}
                          onChange={(e) =>
                            updateFormData("profession", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="industry">
                          What industry do you work in?
                        </Label>
                        <Select
                          value={formData.industry}
                          onValueChange={(value) =>
                            updateFormData("industry", value)
                          }
                        >
                          <SelectTrigger
                            id="industry"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">
                              Technology
                            </SelectItem>
                            <SelectItem value="healthcare">
                              Healthcare
                            </SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="creative">
                              Creative Arts
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {!application && currentStep === 2 && (
                  <>
                    <CardHeader>
                      <CardTitle>Website Goals</CardTitle>
                      <CardDescription>
                        What are you trying to achieve with your website?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>
                          What&apos;s the primary goal of your website?
                        </Label>
                        <RadioGroup
                          value={formData.primaryGoal}
                          onValueChange={(value) =>
                            updateFormData("primaryGoal", value)
                          }
                          className="space-y-2"
                        >
                          {[
                            {
                              value: "showcase",
                              label: "Showcase portfolio/work",
                            },
                            { value: "sell", label: "Sell products/services" },
                            {
                              value: "generate-leads",
                              label: "Generate leads/inquiries",
                            },
                            {
                              value: "provide-info",
                              label: "Provide information",
                            },
                            { value: "blog", label: "Blog/content publishing" },
                          ].map((goal, index) => (
                            <motion.div
                              key={goal.value}
                              className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{
                                opacity: 1,
                                x: 0,
                                transition: {
                                  delay: 0.1 * index,
                                  duration: 0.3,
                                },
                              }}
                            >
                              <RadioGroupItem
                                value={goal.value}
                                id={`goal-${index + 1}`}
                              />
                              <Label
                                htmlFor={`goal-${index + 1}`}
                                className="cursor-pointer w-full"
                              >
                                {goal.label}
                              </Label>
                            </motion.div>
                          ))}
                        </RadioGroup>
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="targetAudience">
                          Who is your target audience?
                        </Label>
                        <Textarea
                          id="targetAudience"
                          placeholder="Describe your ideal visitors/customers"
                          value={formData.targetAudience}
                          onChange={(e) =>
                            updateFormData("targetAudience", e.target.value)
                          }
                          className="min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {!application && currentStep === 3 && (
                  <>
                    <CardHeader>
                      <CardTitle>Design Preferences</CardTitle>
                      <CardDescription>
                        Tell us about your aesthetic preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>
                          What style do you prefer for your website?
                        </Label>
                        <RadioGroup
                          value={formData.stylePreference}
                          onValueChange={(value) =>
                            updateFormData("stylePreference", value)
                          }
                          className="space-y-2"
                        >
                          {[
                            { value: "modern", label: "Modern & Sleek" },
                            { value: "minimalist", label: "Minimalist" },
                            { value: "bold", label: "Bold & Creative" },
                            {
                              value: "corporate",
                              label: "Corporate & Professional",
                            },
                          ].map((style, index) => (
                            <motion.div
                              key={style.value}
                              className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.1 * index,
                                  duration: 0.3,
                                },
                              }}
                            >
                              <RadioGroupItem
                                value={style.value}
                                id={`style-${index + 1}`}
                              />
                              <Label
                                htmlFor={`style-${index + 1}`}
                                className="cursor-pointer w-full"
                              >
                                {style.label}
                              </Label>
                            </motion.div>
                          ))}
                        </RadioGroup>
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="inspirations">
                          Any websites you like for inspiration?
                        </Label>
                        <Textarea
                          id="inspirations"
                          placeholder="List websites you admire or want to emulate"
                          value={formData.inspirations}
                          onChange={(e) =>
                            updateFormData("inspirations", e.target.value)
                          }
                          className="min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {!application && currentStep === 4 && (
                  <>
                    <CardHeader>
                      <CardTitle>Budget & Timeline</CardTitle>
                      <CardDescription>
                        Let&apos;s talk about your investment and timeline
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="budget">
                          What&apos;s your budget range? (USD)
                        </Label>
                        <Select
                          value={formData.budget}
                          onValueChange={(value) =>
                            updateFormData("budget", value)
                          }
                        >
                          <SelectTrigger
                            id="budget"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <SelectValue placeholder="Select your budget" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under-1000">
                              Under $1,000
                            </SelectItem>
                            <SelectItem value="1000-3000">
                              $1,000 - $3,000
                            </SelectItem>
                            <SelectItem value="3000-5000">
                              $3,000 - $5,000
                            </SelectItem>
                            <SelectItem value="5000-10000">
                              $5,000 - $10,000
                            </SelectItem>
                            <SelectItem value="over-10000">
                              Over $10,000
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>What&apos;s your expected timeline?</Label>
                        <RadioGroup
                          value={formData.timeline}
                          onValueChange={(value) =>
                            updateFormData("timeline", value)
                          }
                          className="space-y-2"
                        >
                          {[
                            { value: "asap", label: "ASAP" },
                            { value: "1-month", label: "Within 1 month" },
                            { value: "3-months", label: "1-3 months" },
                            { value: "flexible", label: "Flexible" },
                          ].map((time, index) => (
                            <motion.div
                              key={time.value}
                              className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{
                                opacity: 1,
                                x: 0,
                                transition: {
                                  delay: 0.1 * index,
                                  duration: 0.3,
                                },
                              }}
                            >
                              <RadioGroupItem
                                value={time.value}
                                id={`time-${index + 1}`}
                              />
                              <Label
                                htmlFor={`time-${index + 1}`}
                                className="cursor-pointer w-full"
                              >
                                {time.label}
                              </Label>
                            </motion.div>
                          ))}
                        </RadioGroup>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {!application && currentStep === 5 && (
                  <>
                    <CardHeader>
                      <CardTitle>Additional Requirements</CardTitle>
                      <CardDescription>
                        Any other specific needs for your website?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Which features do you need?</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {[
                            "Contact Form",
                            "Blog/News",
                            "E-commerce",
                            "User Accounts",
                            "Search Functionality",
                            "Social Media Integration",
                            "Newsletter Signup",
                            "Analytics",
                          ].map((feature, index) => (
                            <motion.div
                              key={feature}
                              className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.05 * index,
                                  duration: 0.3,
                                },
                              }}
                              onClick={(event) => {
                                if (event.target === event.currentTarget)
                                  toggleFeature(feature.toLowerCase());
                              }}
                            >
                              <Checkbox
                                id={`feature-${feature}`}
                                checked={formData.features.includes(
                                  feature.toLowerCase(),
                                )}
                                onCheckedChange={() =>
                                  toggleFeature(feature.toLowerCase())
                                }
                              />
                              <Label
                                htmlFor={`feature-${feature}`}
                                className="cursor-pointer w-full"
                              >
                                {feature}
                              </Label>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="additionalInfo">
                          Anything else we should know?
                        </Label>
                        <Textarea
                          id="additionalInfo"
                          placeholder="Any additional requirements or information"
                          value={formData.additionalInfo}
                          onChange={(e) =>
                            updateFormData("additionalInfo", e.target.value)
                          }
                          className="min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <CardFooter className="flex justify-between pt-6 pb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShinyAction
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={cn(
                    "flex items-center gap-1 transition-all duration-300 rounded-2xl",
                    application &&
                      currentStep === 0 &&
                      "pathway-intro-back-button",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </ShinyAction>
              </motion.div>
              {application &&
              reachedReview &&
              currentStep > 0 &&
              currentStep < displayedSteps.length - 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isStepValid()) changeStep(displayedSteps.length - 1);
                    else application.onInvalid?.(currentStep);
                  }}
                >
                  Review
                </Button>
              ) : null}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShinyActionOrButton
                  shiny
                  type="button"
                  onClick={
                    currentStep === displayedSteps.length - 1
                      ? () => {
                          if (isStepValid())
                            (application?.onDone ?? handleSubmit)();
                          else application?.onInvalid?.(currentStep);
                        }
                      : application
                        ? async () => {
                            if (!isStepValid()) {
                              application.onInvalid?.(currentStep);
                            } else if (await application.onNext(currentStep))
                              nextStep();
                          }
                        : nextStep
                  }
                  disabled={
                    (!application && !isStepValid()) ||
                    isSubmitting ||
                    Boolean(application?.submitting) ||
                    Boolean(
                      application &&
                        currentStep === displayedSteps.length - 1 &&
                        !application.doneAvailable,
                    )
                  }
                  aria-describedby={
                    application &&
                    currentStep === displayedSteps.length - 1 &&
                    !application.doneAvailable
                      ? "application-done-unavailable"
                      : undefined
                  }
                  className={cn(
                    "flex items-center gap-1 transition-all duration-300 rounded-2xl",
                    application && currentStep === 0 && "pathway-start-button",
                    currentStep === displayedSteps.length - 1 ? "" : "",
                  )}
                >
                  {isSubmitting || application?.submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      {application && currentStep === 0
                        ? "Start Application"
                        : currentStep === displayedSteps.length - 1
                          ? application
                            ? "Done Now"
                            : "Submit"
                          : "Next"}
                      {currentStep === displayedSteps.length - 1 ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </>
                  )}
                </ShinyActionOrButton>
              </motion.div>
              {application &&
              currentStep === displayedSteps.length - 1 &&
              !application.doneAvailable ? (
                <p
                  id="application-done-unavailable"
                  className="application-done-unavailable"
                  role="status"
                >
                  Submissions aren’t open yet. Your answers remain on this page.
                </p>
              ) : null}
            </CardFooter>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default OnboardingForm;

function ShinyActionOrButton({
  shiny,
  ...props
}: React.ComponentProps<typeof Button> & { shiny: boolean }) {
  const Action = shiny ? ShinyAction : Button;
  return <Action {...props} />;
}
