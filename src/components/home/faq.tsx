"use client";

import Link from "next/link";
import { useState } from "react";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import { ConceptCollage } from "./concept-collage";

const questions = [
  {
    q: "Who can join?",
    a: "Students aged 13–18 in Qatar, from any school and with any interest, can express an interest in applying. Participation is subject to review and appropriate safeguarding and guardian authorization where required.",
  },
  {
    q: "Do I need experience?",
    a: "You do not need a polished CV to be curious. ASTRA Network is for connecting and exploring; ASTRA Core is an application interest for students who want to contribute to projects. Neither option guarantees membership.",
  },
  {
    q: "Who runs Astra?",
    a: "Astra is student-led. Adult oversight, safeguarding responsibilities and participation arrangements must be confirmed before activities begin.",
  },
  {
    q: "Is it free?",
    a: "Fees and any activity costs have not been confirmed. We will publish clear information before asking anyone to commit.",
  },
  {
    q: "How do I bring Astra to my school?",
    a: "Choose School Representative as your membership interest. Representation arrangements will be reviewed with the relevant students and school; applying does not automatically appoint you.",
  },
] as const;

export function FAQ() {
  const [active, setActive] = useState<number | null>(0);
  return (
    <section
      className="wrap faq-section home-section"
      aria-labelledby="faq-heading"
    >
      <div className="faq-copy">
        <WordRevealHeading
          shimmer="home"
          as="h2"
          id="faq-heading"
          className="display"
          text="Questions, answered."
        />
        <div className="faq-list" data-reveal-group="">
          {questions.map((question, index) => (
            <div
              className="faq-item glass"
              data-reveal="fade-up"
              data-open={active === index}
              key={question.q}
            >
              <h3>
                <button
                  type="button"
                  id={`faq-question-${index}`}
                  aria-expanded={active === index}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setActive(active === index ? null : index)}
                >
                  {question.q}
                  <span className="faq-toggle-icon" aria-hidden="true">
                    +
                  </span>
                </button>
              </h3>
              <section
                className="faq-answer"
                id={`faq-answer-${index}`}
                aria-labelledby={`faq-question-${index}`}
                aria-hidden={active !== index}
                inert={active !== index}
              >
                <div className="faq-answer-inner">
                  <p className="body-copy">
                    {question.a}
                    {index === 4 ? (
                      <>
                        {" "}
                        <Link href="/join" className="text-link">
                          Explore the application.
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
              </section>
            </div>
          ))}
        </div>
      </div>
      <ConceptCollage />
    </section>
  );
}
