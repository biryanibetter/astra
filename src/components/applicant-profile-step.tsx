"use client";

import {
  Activity,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  Compass,
  FlaskConical,
  Handshake,
  type LucideIcon,
  Megaphone,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatedLabelInput,
  AnimatedLabelLetters,
  profileLabelVariants,
} from "@/components/ui/animated-label-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchSchoolLocations } from "@/lib/school-locations";
import styles from "./applicant-profile-step.module.css";
import type { PathwayQuestion } from "./pathway-questions";
import { getGradeLabel } from "./pathway-questions";

const gradeOptions = [
  ["grade-6-year-7", "Grade 6 / Year 7"],
  ["grade-7-year-8", "Grade 7 / Year 8"],
  ["grade-8-year-9", "Grade 8 / Year 9"],
  ["grade-9-year-10", "Grade 9 / Year 10"],
  ["grade-10-year-11", "Grade 10 / Year 11"],
  ["grade-11-year-12", "Grade 11 / Year 12"],
  ["grade-12-year-13", "Grade 12 / Year 13"],
] as const;

const optionIcons: Record<string, LucideIcon> = {
  "Events & experiences": Users,
  "Projects & programs": BriefcaseBusiness,
  "Technology & AI": BrainCircuit,
  "Communications & media": Megaphone,
  "Partnerships & outreach": Handshake,
  "School network": Compass,
  "Operations & planning": Activity,
  "Plan and coordinate tasks": Activity,
  "Create or improve digital tools": BrainCircuit,
  "Design content or communications": Megaphone,
  "Organize events or workshops": Users,
  "Research ideas and opportunities": FlaskConical,
  "Connect with students or partners": Handshake,
  "Support a team and follow through": BriefcaseBusiness,
};

type ProfileAnswers = {
  fullName: string;
  email: string;
  school: string;
  grade: string;
  ageEligible: boolean;
};

type ProfileField = "fullName" | "email" | "school" | "grade" | "ageEligible";

export function ApplicantProfileStep({
  answers,
  update,
  question,
  questionResponse,
  onQuestionChange,
  attempted,
}: {
  answers: ProfileAnswers;
  update: (key: ProfileField, value: string | boolean) => void;
  question: PathwayQuestion;
  questionResponse: string | string[] | undefined;
  onQuestionChange: (value: string | string[]) => void;
  attempted: boolean;
}) {
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [activeSchool, setActiveSchool] = useState(0);
  const [schoolBox, setSchoolBox] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    above: boolean;
  } | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradeFocused, setGradeFocused] = useState(false);
  const schoolInput = useRef<HTMLInputElement>(null);
  const schoolResults = useMemo(
    () =>
      schoolQuery.trim() ? searchSchoolLocations(schoolQuery).slice(0, 8) : [],
    [schoolQuery],
  );

  useEffect(() => setPortalReady(true), []);
  useEffect(() => {
    if (!schoolOpen) return;
    const updatePosition = () => {
      if (!schoolInput.current) return;
      const rect = schoolInput.current.getBoundingClientRect();
      const gutter = 12;
      const gap = 6;
      const preferredHeight = 280;
      const below = window.innerHeight - rect.bottom - gap - gutter;
      const above = rect.top - gap - gutter;
      const placeAbove =
        below < Math.min(preferredHeight, 120) && above > below;
      const maxHeight = Math.max(
        80,
        Math.min(preferredHeight, placeAbove ? above : below),
      );
      setSchoolBox({
        top: placeAbove
          ? Math.max(gutter, rect.top - gap - maxHeight)
          : rect.bottom + gap,
        left: Math.max(
          gutter,
          Math.min(rect.left, window.innerWidth - rect.width - gutter),
        ),
        width: Math.min(rect.width, window.innerWidth - gutter * 2),
        maxHeight,
        above: placeAbove,
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [schoolOpen]);
  useEffect(() => {
    if (!schoolOpen || !schoolResults[activeSchool]) return;
    const element = document.getElementById(
      `profile-school-${schoolResults[activeSchool].id}`,
    );
    if (element) {
      const list = element.parentElement;
      if (!list) return;
      if (element.offsetTop < list.scrollTop)
        list.scrollTop = element.offsetTop;
      else if (
        element.offsetTop + element.offsetHeight >
        list.scrollTop + list.clientHeight
      )
        list.scrollTop =
          element.offsetTop + element.offsetHeight - list.clientHeight;
    }
  }, [activeSchool, schoolOpen, schoolResults]);

  const errorFor = (field: ProfileField) => {
    if (!attempted) return "";
    if (field === "fullName" && answers.fullName.trim().length < 2)
      return "Enter your full name (at least 2 characters).";
    if (
      field === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email.trim())
    )
      return "Enter a valid email address.";
    if (field === "school" && answers.school.trim().length < 2)
      return "Choose or enter your school name.";
    if (field === "grade" && !answers.grade)
      return "Select your grade or academic year.";
    return "";
  };

  const chooseSchool = (name: string) => {
    update("school", name);
    setSchoolQuery("");
    setSchoolOpen(false);
  };
  const interestInvalid =
    attempted &&
    (!questionResponse ||
      (Array.isArray(questionResponse) && questionResponse.length === 0));

  return (
    <section className={styles.profile} aria-labelledby="profile-title">
      <header className={styles.header}>
        <h2 id="profile-title">Your profile &amp; interests</h2>
        <p>
          Tell us a little about yourself and where you would like to
          contribute.
        </p>
      </header>

      <div className={styles.fields}>
        <div className={`${styles.field} field`}>
          <AnimatedLabelInput
            variant="profile"
            id="profile-fullName"
            label="Full name"
            requiredMark
            autoComplete="name"
            maxLength={100}
            value={answers.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            aria-invalid={Boolean(errorFor("fullName"))}
            aria-describedby={
              errorFor("fullName") ? "profile-fullName-error" : undefined
            }
          />
          {errorFor("fullName") && (
            <p className="field-error" id="profile-fullName-error" role="alert">
              {errorFor("fullName")}
            </p>
          )}
        </div>
        <div className={`${styles.field} field`}>
          <AnimatedLabelInput
            variant="profile"
            id="profile-email"
            label="Email address"
            requiredMark
            type="email"
            autoComplete="email"
            maxLength={254}
            value={answers.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(errorFor("email"))}
            aria-describedby={
              errorFor("email") ? "profile-email-error" : undefined
            }
          />
          {errorFor("email") && (
            <p className="field-error" id="profile-email-error" role="alert">
              {errorFor("email")}
            </p>
          )}
        </div>
        <div className={`${styles.field} field ${styles.schoolField}`}>
          <AnimatedLabelInput
            variant="profile"
            ref={schoolInput}
            id="profile-school"
            label="School name"
            requiredMark
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={schoolOpen}
            aria-controls="profile-school-options"
            aria-activedescendant={
              schoolOpen && schoolResults[activeSchool]
                ? `profile-school-${schoolResults[activeSchool].id}`
                : undefined
            }
            autoComplete="organization"
            maxLength={150}
            value={schoolOpen ? schoolQuery : answers.school}
            onFocus={() => {
              setSchoolQuery(answers.school);
              setSchoolOpen(true);
            }}
            onChange={(event) => {
              setSchoolQuery(event.target.value);
              setActiveSchool(0);
              setSchoolOpen(true);
              update("school", event.target.value);
            }}
            onBlur={() => setSchoolOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSchoolOpen(false);
                return;
              }
              if (event.key === "ArrowDown" && schoolResults.length) {
                event.preventDefault();
                setActiveSchool((index) => (index + 1) % schoolResults.length);
              }
              if (event.key === "ArrowUp" && schoolResults.length) {
                event.preventDefault();
                setActiveSchool(
                  (index) =>
                    (index - 1 + schoolResults.length) % schoolResults.length,
                );
              }
              if (event.key === "Enter" && schoolResults[activeSchool]) {
                event.preventDefault();
                chooseSchool(schoolResults[activeSchool].name);
              }
            }}
            aria-invalid={Boolean(errorFor("school"))}
            aria-describedby={
              errorFor("school") ? "profile-school-error" : undefined
            }
          />
          {errorFor("school") && (
            <p className="field-error" id="profile-school-error" role="alert">
              {errorFor("school")}
            </p>
          )}
          {portalReady &&
            schoolOpen &&
            schoolBox &&
            (schoolResults.length > 0 || Boolean(schoolQuery.trim())) &&
            createPortal(
              <div
                id="profile-school-options"
                role="listbox"
                className={styles.schoolOptions}
                style={{
                  top: schoolBox.top,
                  left: schoolBox.left,
                  width: schoolBox.width,
                  maxHeight: schoolBox.maxHeight,
                  transformOrigin: schoolBox.above ? "bottom" : "top",
                }}
                data-lenis-prevent
              >
                {schoolResults.length === 0 ? (
                  <div role="presentation" className={styles.noSchoolResults}>
                    <span role="status">No schools found</span>
                  </div>
                ) : (
                  schoolResults.map((school, index) => (
                    <button
                      type="button"
                      key={school.id}
                      id={`profile-school-${school.id}`}
                      role="option"
                      aria-selected={index === activeSchool}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseSchool(school.name)}
                      onMouseEnter={() => setActiveSchool(index)}
                    >
                      <span>{school.name}</span>
                      {(school.locality || school.municipality) && (
                        <small>{school.locality || school.municipality}</small>
                      )}
                    </button>
                  ))
                )}
              </div>,
              document.body,
            )}
        </div>
        <div className={`${styles.field} field ${styles.gradeField}`}>
          <div className={styles.gradeInput}>
            <motion.label
              htmlFor="profile-grade"
              className={`astra-animated-label ${styles.gradeLabel}`}
              initial={false}
              animate={
                gradeOpen || gradeFocused || answers.grade ? "floated" : "rest"
              }
              variants={profileLabelVariants}
              style={{ width: "max-content" }}
            >
              {["Grade", "/", "Academic", "Year *"].map((word, index) => (
                <span key={word}>
                  {index > 0 ? " " : ""}
                  <span
                    style={{ display: "inline-block", whiteSpace: "nowrap" }}
                  >
                    <AnimatedLabelLetters label={word} />
                  </span>
                </span>
              ))}
            </motion.label>
            <Select
              value={answers.grade}
              onOpenChange={setGradeOpen}
              onValueChange={(value) => update("grade", value)}
            >
              <SelectTrigger
                className={styles.gradeTrigger}
                style={{ marginTop: 0 }}
                aria-label="Grade / Academic Year"
                onFocus={() => setGradeFocused(true)}
                onBlur={() => setGradeFocused(false)}
                id="profile-grade"
                aria-invalid={Boolean(errorFor("grade"))}
                aria-describedby={
                  errorFor("grade") ? "profile-grade-error" : undefined
                }
              >
                <SelectValue placeholder="">
                  {answers.grade ? getGradeLabel(answers.grade) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                align="start"
                sideOffset={5}
                collisionPadding={12}
                className={styles.gradePopover}
              >
                {gradeOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errorFor("grade") && (
            <p className="field-error" id="profile-grade-error" role="alert">
              {errorFor("grade")}
            </p>
          )}
        </div>
      </div>
      <div className={styles.eligibilityGroup}>
        <div className={styles.eligibility}>
          <input
            id="profile-eligibility"
            type="checkbox"
            checked={answers.ageEligible}
            onChange={(event) => update("ageEligible", event.target.checked)}
            aria-invalid={attempted && !answers.ageEligible}
            aria-describedby={
              attempted && !answers.ageEligible
                ? "profile-eligibility-error"
                : undefined
            }
          />
          <label htmlFor="profile-eligibility">
            I confirm that I am aged 13–18 and currently a student in Qatar.
          </label>
        </div>
        {attempted && !answers.ageEligible && (
          <p
            className="field-error"
            id="profile-eligibility-error"
            role="alert"
          >
            Confirm that you meet the student eligibility requirements.
          </p>
        )}
      </div>

      <fieldset
        className={styles.interestGroup}
        tabIndex={-1}
        aria-invalid={interestInvalid}
        aria-describedby={interestInvalid ? `${question.id}-error` : undefined}
      >
        <legend>
          {question.label} <span aria-hidden="true">*</span>
        </legend>
        <div className={styles.interests}>
          {question.type === "textarea"
            ? null
            : question.options.map((option, index) => {
                const selections = Array.isArray(questionResponse)
                  ? questionResponse
                  : [questionResponse ?? ""];
                const selected = selections.includes(option);
                const Icon = optionIcons[option] ?? Compass;
                return (
                  <motion.button
                    key={option}
                    type="button"
                    className={`${styles.interest} ${selected ? styles.selected : ""}`}
                    aria-pressed={selected}
                    aria-label={option}
                    onClick={() => {
                      if (question.type === "multi-select") {
                        onQuestionChange(
                          selected
                            ? selections.filter((item) => item !== option)
                            : [...selections.filter(Boolean), option],
                        );
                      } else {
                        onQuestionChange(option);
                      }
                    }}
                    initial={false}
                    animate={{
                      borderColor: selected
                        ? "rgba(220,226,234,.72)"
                        : "rgba(198,204,213,.2)",
                    }}
                    whileHover={{
                      y: -2,
                      backgroundColor: "rgba(198,204,213,.1)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.18, delay: index * 0.012 }}
                  >
                    <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                    <span>{option}</span>
                    <Check
                      className={styles.check}
                      size={15}
                      aria-hidden="true"
                    />
                  </motion.button>
                );
              })}
        </div>
        {interestInvalid && (
          <p className="field-error" id={`${question.id}-error`} role="alert">
            Select an option to continue.
          </p>
        )}
      </fieldset>
    </section>
  );
}
