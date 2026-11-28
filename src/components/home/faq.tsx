"use client";

import { useState } from "react";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import { ConceptCollage } from "./concept-collage";

const questions = [
  {
    q: "What are the requirements to join Astra?",
    a: "Astra Core and Fellow are open to students aged 14–18 currently studying in Qatar, regardless of their school, nationality or curriculum. We value initiative, curiosity and a willingness to contribute, alongside any previous experience or achievements.",
  },
  {
    q: "What are the benefits of getting involved?",
    a: "Astra aims to give students access to a wider network, collaborative projects, opportunities to develop their own initiatives and experiences beyond those available within their individual schools.",
  },
  {
    q: "Are Astra events open to students from all schools?",
    a: "Astra aims to welcome students from all schools across Qatar. Participation requirements may vary depending on the nature, format and capacity of each event.",
  },
  {
    q: "Does it cost anything to join Astra?",
    a: "No. Joining Astra is free. We believe that financial circumstances should not be a barrier to becoming part of the network. Any costs associated with specific activities will be communicated separately in advance.",
  },
  {
    q: "Can schools and organizations collaborate with Astra?",
    a: "Yes. Astra welcomes collaboration with schools, universities, businesses and organizations that share our vision for youth innovation. Collaborations may include joint events, student initiatives, speaker sessions, exhibitions and other opportunities that benefit the wider student community.",
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
          text="FAQs."
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
                  <p className="body-copy">{question.a}</p>
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
