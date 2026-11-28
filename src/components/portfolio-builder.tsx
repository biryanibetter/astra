"use client";

import { FileText, Link2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./portfolio-builder.module.css";

export type PortfolioDocument = {
  id: string;
  file: File;
  error: string | undefined;
};
export type PortfolioEntry = { id: string; title: string; description: string };
export type PortfolioLink = {
  id: string;
  type: string;
  label: string;
  url: string;
};
export type PortfolioData = {
  cv: PortfolioDocument[];
  links: PortfolioLink[];
  projects: PortfolioEntry[];
};

export const emptyPortfolioData: PortfolioData = {
  cv: [],
  links: [],
  projects: [],
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_PROJECTS = 5;
export const MAX_LINKS = 5;
const MAX_PROJECT_TITLE = 120;
const MAX_PROJECT_DESCRIPTION = 600;
const id = () =>
  globalThis.crypto?.randomUUID?.() ??
  `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function isValidHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
}

export function normalizeLinkUrl(value: string) {
  return value.trim();
}

export function validateLinkUrl(value: string): string | undefined {
  const normalized = normalizeLinkUrl(value);
  if (!normalized) return "Enter a link before saving.";
  if (!isValidHttpUrl(normalized))
    return "Enter a complete http:// or https:// link.";
  return undefined;
}

export function validateProjectDraft(
  draft: Pick<PortfolioEntry, "title" | "description">,
): string | undefined {
  if (!draft.title.trim() && !draft.description.trim())
    return "Add a title or description before saving.";
  if (draft.title.trim().length > MAX_PROJECT_TITLE)
    return `Keep the project title under ${MAX_PROJECT_TITLE} characters.`;
  if (draft.description.trim().length > MAX_PROJECT_DESCRIPTION)
    return `Keep the project description under ${MAX_PROJECT_DESCRIPTION} characters.`;
  return undefined;
}

export function canAddProject(count: number, editorOpen = false) {
  return !editorOpen && count < MAX_PROJECTS;
}

export function canAddLink(count: number, editorOpen = false) {
  return !editorOpen && count < MAX_LINKS;
}

function fileError(file: File) {
  if (file.size > MAX_FILE_SIZE) return "Maximum file size is 5 MB.";
  if (
    !file.name.toLowerCase().endsWith(".pdf") ||
    (file.type && file.type !== "application/pdf")
  )
    return "Unsupported file type. Choose a PDF.";
  return undefined;
}
export function hasValidCV(value: PortfolioData) {
  return (
    value.cv.length > 0 &&
    value.cv.every(({ file, error }) => !error && !fileError(file))
  );
}

export function isPortfolioValid(value: PortfolioData) {
  return (
    (value.cv.length === 0 || hasValidCV(value)) &&
    value.links.every(({ url }) => !url.trim() || !validateLinkUrl(url))
  );
}

function InlineEditor({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  return (
    <motion.div
      className={styles.entryFields}
      inert={!present}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

function ProjectsSection({
  items,
  onChange,
}: {
  items: PortfolioEntry[];
  onChange: (items: PortfolioEntry[]) => void;
}) {
  const [editor, setEditor] = useState<{
    id: string;
    original: PortfolioEntry | null;
  } | null>(null);
  const [draft, setDraft] = useState<PortfolioEntry | null>(null);
  const [editorError, setEditorError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const addLock = useRef(false);
  useEffect(() => {
    if (!editor) return;
    document
      .getElementById(`projects-${editor.id}-title`)
      ?.focus({ preventScroll: true });
  }, [editor]);

  const draftOpen = editor !== null && editor.original === null;
  const total = items.length + (draftOpen ? 1 : 0);
  const atLimit = total >= MAX_PROJECTS;
  const canAdd = canAddProject(items.length, editor !== null);

  const add = () => {
    if (addLock.current || editor || !canAddProject(items.length, false))
      return;
    addLock.current = true;
    const newProject = { id: id(), title: "", description: "" };
    setEditor({ id: newProject.id, original: null });
    setDraft(newProject);
    setEditorError("");
    requestAnimationFrame(() => {
      addLock.current = false;
    });
  };
  const patch = (patchData: Partial<PortfolioEntry>) => {
    setDraft((current) => (current ? { ...current, ...patchData } : current));
    setEditorError("");
  };
  const remove = (itemId: string) => {
    onChange(items.filter((entry) => entry.id !== itemId));
    if (editor?.id === itemId) {
      setEditor(null);
      setDraft(null);
      setEditorError("");
    }
    setConfirming(null);
    requestAnimationFrame(() =>
      document.getElementById("projects-add")?.focus({ preventScroll: true }),
    );
  };
  const close = (cancel: boolean) => {
    if (!editor) return;
    const { id: itemId, original } = editor;
    if (cancel) {
      setEditor(null);
      setDraft(null);
      setEditorError("");
      requestAnimationFrame(() =>
        document
          .getElementById(original ? `project-row-${itemId}` : "projects-add")
          ?.focus({ preventScroll: true }),
      );
      return;
    }
    if (!draft) return;
    const error = validateProjectDraft(draft);
    if (error) {
      setEditorError(error);
      return;
    }
    if (original) {
      onChange(
        items.map((item) =>
          item.id === itemId ? { ...draft, id: itemId } : item,
        ),
      );
    } else {
      onChange([...items, { ...draft, id: itemId }]);
    }
    setEditor(null);
    setDraft(null);
    setEditorError("");
    requestAnimationFrame(() =>
      document
        .getElementById(`project-row-${itemId}`)
        ?.focus({ preventScroll: true }),
    );
  };

  const hasItems = items.length > 0;
  const showAdd = hasItems || draftOpen;

  const fields = (item: PortfolioEntry) => (
    <InlineEditor>
      <label htmlFor={`projects-${item.id}-title`}>Title</label>
      <input
        id={`projects-${item.id}-title`}
        name={`projects-${item.id}-title`}
        autoComplete="off"
        placeholder="e.g. A community garden sensor"
        value={draft?.title ?? ""}
        maxLength={MAX_PROJECT_TITLE}
        onChange={(event) => patch({ title: event.target.value })}
      />
      <label htmlFor={`projects-${item.id}-description`}>Description</label>
      <textarea
        id={`projects-${item.id}-description`}
        name={`projects-${item.id}-description`}
        placeholder="What did you do or learn?"
        value={draft?.description ?? ""}
        maxLength={MAX_PROJECT_DESCRIPTION}
        rows={3}
        onChange={(event) => patch({ description: event.target.value })}
      />
      {editorError ? (
        <p className="field-error" role="alert">
          {editorError}
        </p>
      ) : null}
      <div className={styles.editorActions}>
        <button type="button" onClick={() => close(false)}>
          Save project
        </button>
        <button type="button" onClick={() => close(true)}>
          Cancel
        </button>
      </div>
    </InlineEditor>
  );

  return (
    <section className={styles.entries} aria-label="Projects">
      <div className={styles.entriesHeading}>
        <div>
          <h3>Projects</h3>
          <p>Add a title and a short description. Both are optional.</p>
          {atLimit ? (
            <p className={styles.limitNote} id="projects-limit" role="status">
              Maximum {MAX_PROJECTS} projects
            </p>
          ) : null}
        </div>
        {showAdd && (
          <button
            type="button"
            className={styles.addLink}
            onClick={add}
            id="projects-add"
            disabled={!canAdd}
            aria-describedby={atLimit ? "projects-limit" : undefined}
          >
            <Plus size={15} aria-hidden="true" /> Add project
          </button>
        )}
      </div>
      {!showAdd ? (
        <button
          type="button"
          className={styles.emptyState}
          onClick={add}
          id="projects-add"
        >
          <Plus size={14} aria-hidden="true" /> Add your first project
        </button>
      ) : (
        <div className={styles.entryList}>
          {items.map((item, index) => {
            const open = editor?.id === item.id && editor.original !== null;
            const title = item.title.trim() || `Untitled project ${index + 1}`;
            const edit = () => {
              if (editor) {
                if (open)
                  document
                    .getElementById(`projects-${item.id}-title`)
                    ?.focus({ preventScroll: true });
                return;
              }
              setEditor({ id: item.id, original: { ...item } });
              setDraft({ ...item });
              setEditorError("");
            };
            return (
              <article className={styles.entry} key={item.id}>
                <div className={styles.entryTop}>
                  <button
                    type="button"
                    className={styles.entryToggle}
                    id={`project-row-${item.id}`}
                    aria-expanded={open}
                    onClick={edit}
                  >
                    <span>{title}</span>
                  </button>
                  <div className={styles.entryActions}>
                    <button
                      type="button"
                      aria-label={`Edit ${title}`}
                      title="Edit project"
                      onClick={edit}
                      disabled={Boolean(editor) && !open}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${title}`}
                      title="Remove project"
                      onClick={() =>
                        item.title.trim() || item.description.trim()
                          ? setConfirming(item.id)
                          : remove(item.id)
                      }
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {confirming === item.id && (
                  <fieldset
                    className={styles.removePrompt}
                    aria-label={`Remove ${title}?`}
                  >
                    <span>Remove this project?</span>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label="Confirm removal"
                    >
                      Remove
                    </button>
                    <button type="button" onClick={() => setConfirming(null)}>
                      Keep project
                    </button>
                  </fieldset>
                )}
                <AnimatePresence initial={false}>
                  {open ? fields(item) : null}
                </AnimatePresence>
              </article>
            );
          })}
          {draftOpen && draft ? (
            <article className={styles.entry} key={draft.id}>
              <div className={styles.entryTop}>
                <span className={styles.entryTitle}>
                  <span>{draft.title.trim() || "New project"}</span>
                </span>
              </div>
              <AnimatePresence initial={false}>{fields(draft)}</AnimatePresence>
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}

function LinksSection({
  items,
  onChange,
  onDraftInvalid,
  attempted,
}: {
  items: PortfolioLink[];
  onChange: (items: PortfolioLink[]) => void;
  onDraftInvalid: (invalid: boolean) => void;
  attempted: boolean;
}) {
  const [editor, setEditor] = useState<{
    id: string;
    original: PortfolioLink | null;
  } | null>(null);
  const [draft, setDraft] = useState<PortfolioLink | null>(null);
  const [editorError, setEditorError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const addLock = useRef(false);
  useEffect(() => () => onDraftInvalid(false), [onDraftInvalid]);
  useEffect(() => {
    if (!editor) return;
    document
      .getElementById(`application-link-${editor.id}`)
      ?.focus({ preventScroll: true });
  }, [editor]);

  const draftOpen = editor !== null && editor.original === null;
  const total = items.length + (draftOpen ? 1 : 0);
  const atLimit = total >= MAX_LINKS;
  const canAdd = canAddLink(items.length, editor !== null);

  const add = () => {
    if (addLock.current || editor || !canAddLink(items.length, false)) return;
    addLock.current = true;
    const newLink: PortfolioLink = {
      id: id(),
      type: "Portfolio",
      label: "Supporting link",
      url: "",
    };
    setEditor({ id: newLink.id, original: null });
    setDraft(newLink);
    setEditorError("");
    requestAnimationFrame(() => {
      addLock.current = false;
    });
  };
  const patch = (updates: Partial<PortfolioLink>) => {
    setDraft((current) => (current ? { ...current, ...updates } : current));
    setEditorError("");
    if (updates.url !== undefined) {
      onDraftInvalid(
        Boolean(updates.url.trim()) && Boolean(validateLinkUrl(updates.url)),
      );
    }
  };
  const remove = (itemId: string) => {
    onChange(items.filter((link) => link.id !== itemId));
    if (editor?.id === itemId) {
      onDraftInvalid(false);
      setEditor(null);
      setDraft(null);
      setEditorError("");
    }
    setConfirming(null);
    requestAnimationFrame(() =>
      document.getElementById("links-add")?.focus({ preventScroll: true }),
    );
  };
  const close = (cancel: boolean) => {
    if (!editor) return;
    const { id: itemId, original } = editor;
    if (cancel) {
      onDraftInvalid(false);
      setEditor(null);
      setDraft(null);
      setEditorError("");
      requestAnimationFrame(() =>
        document
          .getElementById(original ? `link-row-${itemId}` : "links-add")
          ?.focus({ preventScroll: true }),
      );
      return;
    }
    if (!draft) return;
    const error = validateLinkUrl(draft.url);
    if (error) {
      setEditorError(error);
      return;
    }
    const normalized = { ...draft, url: normalizeLinkUrl(draft.url) };
    onDraftInvalid(false);
    if (original) {
      onChange(
        items.map((item) =>
          item.id === itemId ? { ...normalized, id: itemId } : item,
        ),
      );
    } else {
      onChange([...items, { ...normalized, id: itemId }]);
    }
    setEditor(null);
    setDraft(null);
    setEditorError("");
    requestAnimationFrame(() =>
      document
        .getElementById(`link-row-${itemId}`)
        ?.focus({ preventScroll: true }),
    );
  };

  const hasItems = items.length > 0;
  const showAdd = hasItems || draftOpen;

  const fields = (item: PortfolioLink) => {
    // Existing saved links surface a live error until their draft is valid,
    // while new drafts only show an error after an attempted save.
    const draftError =
      draft && (editor?.original || (attempted && draft.url.trim()))
        ? validateLinkUrl(draft.url)
        : editorError || undefined;
    return (
      <InlineEditor>
        <label htmlFor={`application-link-${item.id}`}>URL</label>
        <input
          id={`application-link-${item.id}`}
          name={`link-${item.id}`}
          type="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://example.com/…"
          value={draft?.url ?? ""}
          aria-invalid={Boolean(draftError)}
          aria-describedby={draftError ? `link-error-${item.id}` : undefined}
          onChange={(event) => patch({ url: event.target.value })}
        />
        {draftError ? (
          <p id={`link-error-${item.id}`} className="field-error" role="alert">
            {draftError}
          </p>
        ) : null}
        <div className={styles.editorActions}>
          <button type="button" onClick={() => close(false)}>
            Save link
          </button>
          <button type="button" onClick={() => close(true)}>
            Cancel
          </button>
        </div>
      </InlineEditor>
    );
  };

  return (
    <section className={styles.linkSection} aria-label="Supporting links">
      <div className={styles.linksHeading}>
        <div>
          <h3>Supporting links</h3>
          <p className={styles.hint}>
            Portfolio, GitHub, website, or a project.
          </p>
          {atLimit ? (
            <p className={styles.limitNote} id="links-limit" role="status">
              Maximum {MAX_LINKS} links
            </p>
          ) : null}
        </div>
        {showAdd && (
          <button
            type="button"
            className={styles.addLink}
            onClick={add}
            id="links-add"
            disabled={!canAdd}
            aria-describedby={atLimit ? "links-limit" : undefined}
          >
            <Plus size={15} aria-hidden="true" /> Add link
          </button>
        )}
      </div>
      {!showAdd ? (
        <button
          type="button"
          className={styles.emptyState}
          onClick={add}
          id="links-add"
        >
          <Plus size={14} aria-hidden="true" /> Add your first link
        </button>
      ) : (
        items.map((item, index) => {
          const savedError = item.url.trim()
            ? validateLinkUrl(item.url)
            : undefined;
          const open = editor?.id === item.id && editor.original !== null;
          const edit = () => {
            if (editor) {
              if (open)
                document
                  .getElementById(`application-link-${item.id}`)
                  ?.focus({ preventScroll: true });
              return;
            }
            setEditor({ id: item.id, original: { ...item } });
            setDraft({ ...item });
            setEditorError("");
          };
          const title = item.url.trim() || `Untitled link ${index + 1}`;
          return (
            <div
              className={styles.linkRow}
              key={item.id}
              data-validation-field=""
            >
              <div className={styles.entryTop}>
                <Link2 size={16} aria-hidden="true" />
                <button
                  type="button"
                  className={styles.entryToggle}
                  id={`link-row-${item.id}`}
                  onClick={edit}
                  aria-expanded={open}
                  aria-invalid={!open && Boolean(savedError)}
                  aria-describedby={
                    !open && savedError ? `link-error-${item.id}` : undefined
                  }
                >
                  <span>{title}</span>
                </button>
                <div className={styles.entryActions}>
                  <button
                    type="button"
                    aria-label={`Edit link ${index + 1}`}
                    title="Edit link"
                    onClick={edit}
                    disabled={Boolean(editor) && !open}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove link ${index + 1}`}
                    title="Remove link"
                    onClick={() =>
                      item.url.trim() ? setConfirming(item.id) : remove(item.id)
                    }
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {confirming === item.id && (
                <fieldset
                  className={styles.removePrompt}
                  aria-label="Remove this link?"
                >
                  <span>Remove this link?</span>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label="Confirm removal"
                  >
                    Remove
                  </button>
                  <button type="button" onClick={() => setConfirming(null)}>
                    Keep link
                  </button>
                </fieldset>
              )}
              <AnimatePresence initial={false}>
                {open ? fields(item) : null}
              </AnimatePresence>
              {!open && savedError ? (
                <p
                  id={`link-error-${item.id}`}
                  className="field-error"
                  role="alert"
                >
                  {savedError}
                </p>
              ) : null}
            </div>
          );
        })
      )}
      {draftOpen && draft ? (
        <div className={styles.linkRow} key={draft.id} data-validation-field="">
          <div className={styles.entryTop}>
            <Link2 size={16} aria-hidden="true" />
            <span className={styles.entryTitle}>
              <span>{draft.url.trim() || "New link"}</span>
            </span>
          </div>
          <AnimatePresence initial={false}>{fields(draft)}</AnimatePresence>
        </div>
      ) : null}
    </section>
  );
}

function FileDrop({
  title,
  hint,
  files,
  multiple,
  onFiles,
  onRemove,
  missing,
}: {
  title: string;
  hint: string;
  files: PortfolioDocument[];
  multiple?: boolean;
  onFiles: (files: FileList | null, replaceId?: string) => void;
  onRemove: (fileId: string) => void;
  missing: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const replaceId = useRef<string | undefined>(undefined);
  const acceptFiles = (event: ChangeEvent<HTMLInputElement>) => {
    onFiles(event.target.files, replaceId.current);
    replaceId.current = undefined;
    event.target.value = "";
  };
  const drop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    onFiles(event.dataTransfer.files, replaceId.current);
    replaceId.current = undefined;
  };
  return (
    <div className={styles.fileField}>
      <h3>{title}</h3>
      <p className={styles.hint}>{hint}</p>
      <fieldset
        aria-label={`${title} file drop area`}
        tabIndex={-1}
        aria-invalid={missing || files.some(({ error }) => Boolean(error))}
        aria-describedby={
          missing || files.some(({ error }) => Boolean(error))
            ? "portfolio-cv-error"
            : undefined
        }
        className={`${styles.upload} ${dragging ? styles.dragging : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
      >
        <input
          ref={input}
          className={styles.fileInput}
          type="file"
          accept=".pdf,application/pdf"
          multiple={multiple}
          onChange={acceptFiles}
          aria-label={`${title} PDF files`}
        />
        {files.length ? (
          <div className={styles.fileList} aria-live="polite">
            {files.map(({ id: fileId, file, error }) => (
              <div className={styles.fileItem} key={fileId}>
                <FileText size={18} aria-hidden="true" />
                <span>
                  <strong>{file.name}</strong>
                  <small>
                    {Math.max(1, Math.round(file.size / 1024))} KB
                    {error ? ` · ${error}` : ""}
                  </small>
                </span>
                <button
                  type="button"
                  aria-label={`Replace ${file.name}`}
                  onClick={() => {
                    replaceId.current = fileId;
                    input.current?.click();
                  }}
                >
                  Replace
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemove(fileId)}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.dropPrompt}>
            <Upload size={20} aria-hidden="true" />
            <span>
              <strong>Drop PDF files here</strong>
              <small>or choose from your device · up to 5 MB each</small>
            </span>
          </div>
        )}
        <button
          type="button"
          className={styles.chooseFile}
          onClick={() => input.current?.click()}
        >
          <Plus size={15} />
          {files.length
            ? multiple
              ? `Add ${title.toLowerCase()}`
              : `Replace ${title === "CV" ? "CV" : title.toLowerCase()}`
            : `Choose ${title === "CV" ? "CV" : title.toLowerCase()}`}
        </button>
      </fieldset>
      {missing && (
        <p id="portfolio-cv-error" className="field-error" role="alert">
          Choose a PDF CV to continue.
        </p>
      )}
      {files.map(({ id: fileId, error }) =>
        error ? (
          <p
            className="field-error"
            role="alert"
            key={fileId}
            id="portfolio-cv-error"
          >
            {error}
          </p>
        ) : null,
      )}
    </div>
  );
}

export function PortfolioBuilder({
  value,
  onChange,
  cvRequired,
  attempted,
  onLinkDraftInvalid,
}: {
  value: PortfolioData;
  onChange: (value: PortfolioData) => void;
  cvRequired: boolean;
  attempted: boolean;
  onLinkDraftInvalid: (invalid: boolean) => void;
}) {
  const updateFiles = (
    field: "cv",
    fileList: FileList | null,
    replaceId?: string,
  ) => {
    if (!fileList) return;
    const incoming = Array.from(fileList).map((file) => ({
      id: id(),
      file,
      error: fileError(file),
    }));
    if (!incoming.length) return;
    if (replaceId) {
      const replacement = incoming[0];
      if (!replacement) return;
      const replaced = value[field].map((document) =>
        document.id === replaceId
          ? { ...replacement, id: replaceId }
          : document,
      );
      onChange({ ...value, [field]: replaced });
      return;
    }
    // A CV is a single document: a new selection replaces the previous file.
    onChange({ ...value, [field]: incoming.slice(-1) });
  };
  const updateLinks = (links: PortfolioLink[]) => onChange({ ...value, links });
  const updateProjects = (projects: PortfolioEntry[]) =>
    onChange({ ...value, projects });
  return (
    <section
      className={styles.builder}
      aria-labelledby="portfolio-title"
      data-compact-controls=""
    >
      <header className={styles.header}>
        <h2 id="portfolio-title">Build your profile.</h2>
      </header>
      <ProjectsSection items={value.projects} onChange={updateProjects} />
      <LinksSection
        items={value.links}
        onChange={updateLinks}
        onDraftInvalid={onLinkDraftInvalid}
        attempted={attempted}
      />
      <div className={styles.filesGrid}>
        <FileDrop
          title="CV"
          hint={`PDF only, up to 5 MB. ${cvRequired ? "Required" : "Optional"}.`}
          files={value.cv}
          missing={attempted && cvRequired && value.cv.length === 0}
          onFiles={(files, replaceId) => updateFiles("cv", files, replaceId)}
          onRemove={(fileId) =>
            onChange({
              ...value,
              cv: value.cv.filter((file) => file.id !== fileId),
            })
          }
        />
      </div>
    </section>
  );
}
