"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import {
  type SchoolLocation,
  searchSchoolLocations,
} from "@/lib/school-locations";
import "./school-network.css";

const SchoolMap = dynamic(() => import("./school-map"), {
  ssr: false,
  loading: () => (
    <div className="network-map-loading" role="status">
      Loading map…
    </div>
  ),
});

export function SchoolNetwork() {
  const mapTrigger = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const focusSearchAfterChange = useRef(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SchoolLocation | null>(null);
  const [changingSelection, setChangingSelection] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = useMemo(() => searchSchoolLocations(query), [query]);
  const expanded =
    searchFocused && (!selected || changingSelection) && matches.length > 0;
  const select = useCallback((school: SchoolLocation) => {
    // A repeated marker click must reopen a popup dismissed independently of selection.
    setSelected({ ...school });
    setChangingSelection(false);
    setQuery(school.name);
    setActive(-1);
    setSearchFocused(false);
  }, []);

  useEffect(() => {
    const target = mapTrigger.current;
    if (!target || mapReady) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMapReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [mapReady]);

  useEffect(() => {
    if (selected) setMapReady(true);
  }, [selected]);

  useEffect(() => {
    if (active >= 0) {
      const element = document.getElementById(`school-result-${active}`);
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
    }
  }, [active]);

  const context = selected ? `?school=${encodeURIComponent(selected.id)}` : "";
  return (
    <div className="school-network">
      <div className="network-intro">
        <div className="network-copy">
          <WordRevealHeading
            shimmer="home"
            as="h2"
            id="schools-heading"
            className="display"
            text="Put your school on the map."
          />
          <p className="network-description" data-reveal="fade-up">
            Astra connects ambitious students across Qatar. Find your school and
            discover how you can be part of what&apos;s next.
          </p>
        </div>
        <div className="network-search-area">
          <AnimatePresence mode="wait" initial={false}>
            {selected && !changingSelection ? (
              <motion.div
                key="selected-school"
                className="selected-school"
                role="status"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: -4,
                  transition: { duration: 0.1, ease: "easeOut" },
                }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <svg
                  className="school-selected-check"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="m4 10 4 4 8-8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      delay: 0.04,
                      duration: 0.18,
                      ease: "easeOut",
                    }}
                  />
                </svg>
                <motion.strong
                  className="selected-school-name"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02, duration: 0.18, ease: "easeOut" }}
                >
                  {selected.name}
                </motion.strong>
                <motion.button
                  type="button"
                  className="school-change"
                  aria-label="Change"
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, duration: 0.15, ease: "easeOut" }}
                  onClick={() => {
                    focusSearchAfterChange.current = true;
                    setChangingSelection(true);
                    setQuery("");
                    setActive(-1);
                    setSearchFocused(false);
                  }}
                >
                  <Pencil className="school-change-icon" aria-hidden="true" />
                  Change
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="school-search"
                className="school-search-shell"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: -4,
                  transition: { duration: 0.1, ease: "easeOut" },
                }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <label className="school-search">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 5 5" />
                  </svg>
                  <input
                    ref={(node) => {
                      searchInput.current = node;
                      if (node && focusSearchAfterChange.current) {
                        node.focus();
                        focusSearchAfterChange.current = false;
                      }
                    }}
                    name="schoolSearch"
                    value={query}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={expanded}
                    aria-controls="school-results"
                    aria-activedescendant={
                      expanded && active >= 0
                        ? `school-result-${active}`
                        : undefined
                    }
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setChangingSelection(Boolean(selected));
                      setActive(-1);
                      setSearchFocused(true);
                    }}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setSearchFocused(false);
                        setActive(-1);
                      }
                      if (
                        event.key === "ArrowDown" ||
                        event.key === "ArrowUp"
                      ) {
                        event.preventDefault();
                        setSearchFocused(true);
                        setActive((index) =>
                          event.key === "ArrowDown"
                            ? Math.min(index + 1, matches.length - 1)
                            : Math.max(index - 1, 0),
                        );
                      }
                      if (
                        event.key === "Enter" &&
                        expanded &&
                        active >= 0 &&
                        matches[active]
                      ) {
                        event.preventDefault();
                        select(matches[active]);
                      }
                    }}
                    placeholder="Search your school in Qatar"
                    aria-label="Search your school in Qatar"
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      type="button"
                      className="school-search-clear"
                      aria-label="Clear selected school and search"
                      onClick={() => {
                        setQuery("");
                        setSelected(null);
                        setActive(-1);
                      }}
                    >
                      ×
                    </button>
                  )}
                </label>
                <div
                  id="school-results"
                  className="school-suggestions"
                  role="listbox"
                  aria-label="Matching schools"
                  hidden={!expanded}
                  data-lenis-prevent
                >
                  {expanded &&
                    matches.map((school, index) => (
                      <button
                        key={school.id}
                        id={`school-result-${index}`}
                        role="option"
                        aria-selected={active === index}
                        type="button"
                        tabIndex={-1}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => select(school)}
                      >
                        <span>{school.name}</span>
                        {(school.locality || school.municipality) && (
                          <small>
                            {school.locality || school.municipality}
                          </small>
                        )}
                      </button>
                    ))}
                </div>
                {query.trim() && !selected && matches.length === 0 && (
                  <p className="search-empty" role="status">
                    No match in this snapshot. You can still apply and enter
                    your school.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="network-map-wrap" ref={mapTrigger} data-reveal="image">
        {mapReady ? (
          <SchoolMap
            key={mapAttempt}
            selected={selected}
            onSelect={select}
            onRetry={() => setMapAttempt((attempt) => attempt + 1)}
          />
        ) : (
          <div className="network-map-loading" aria-hidden="true">
            Map loads as you explore
          </div>
        )}
      </div>
      <nav
        className="network-pathways"
        data-reveal-group=""
        aria-label="Choose an Astra application"
      >
        {selected && !changingSelection && (
          <motion.div
            className="network-pathway-instruction"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h3>Choose your path.</h3>
            <p>Select how you&apos;d like to be part of Astra.</p>
          </motion.div>
        )}
        <ShinyButton
          className="network-pathway astra-card-glass"
          data-reveal="cta"
          href={`/apply/core${context}`}
          scroll={true}
        >
          <svg
            className="pathway-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden="true"
          >
            <path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span>
            <strong>Astra Core</strong>
            <small>Contribute to student-led projects.</small>
          </span>
          <span className="pathway-arrow" aria-hidden="true">
            ↗
          </span>
        </ShinyButton>
        <ShinyButton
          className="network-pathway astra-card-glass"
          data-reveal="cta"
          href={`/apply/fellow${context}`}
          scroll={true}
        >
          <svg
            className="pathway-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="7.5" />
            <ellipse
              cx="12"
              cy="12"
              rx="11"
              ry="4"
              transform="rotate(-35 12 12)"
            />
            <circle cx="19" cy="6" r="1.5" fill="currentColor" stroke="none" />
          </svg>
          <span>
            <strong>Astra Fellow</strong>
            <small>Build independent work with a wider network.</small>
          </span>
          <span className="pathway-arrow" aria-hidden="true">
            ↗
          </span>
        </ShinyButton>
      </nav>
    </div>
  );
}
