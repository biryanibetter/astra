"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./admin-review.module.css";
import { pathwayQuestions } from "./pathway-questions";

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    signal: init?.signal ?? AbortSignal.timeout(20000),
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.message || "The operation could not be confirmed.");
  return result;
}
export function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className={styles.page}>
      <form
        className={styles.login}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const fields = new FormData(event.currentTarget);
          setBusy(true);
          setError("");
          try {
            await api("/api/admin/session", {
              method: "POST",
              body: JSON.stringify({
                email: fields.get("email"),
                password: fields.get("password"),
              }),
            });
            window.location.assign("/admin");
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "Sign-in failed.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>Astra review access</h1>
        <p>For invited administrators only.</p>
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={200}
            required
          />
        </label>
        <button disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
    </main>
  );
}
type Profile = { full_name: string; school: string; grade: string };
type Row = {
  id: string;
  track: "core" | "fellow";
  status: string;
  submitted_at: string;
  astra_profiles: Profile | Profile[];
};
type Detail = Row & {
  email: string;
  astra_answers: { question_id: string; value: string | string[] }[];
  astra_projects: { ordinal: number; title: string; description: string }[];
  astra_links: { ordinal: number; type: string; label: string; url: string }[];
  astra_cv_files: { id: string; ordinal: number; file_size: number }[];
  astra_review_notes: { id: string; note: string; created_at: string }[];
};
const statuses = [
  "pending",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn",
];
const profile = (row: Row) =>
  Array.isArray(row.astra_profiles)
    ? row.astra_profiles[0]
    : row.astra_profiles;

export function AdminReview({ owner }: { owner: boolean }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    track: "",
    status: "",
    sort: "submitted_at",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [download, setDownload] = useState("");
  const detailVersion = useRef(0);
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value),
  );
  params.set("page", String(page));
  params.set("refresh", String(revision));
  const queryString = params.toString();
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    void api(`/api/admin/applications?${queryString}`, {
      signal: controller.signal,
    })
      .then((data) => {
        setRows(data.applications);
        setCount(data.count ?? 0);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setRows([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load applications.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [queryString]);
  const openDetail = async (id: string) => {
    const version = ++detailVersion.current;
    setDownload("");
    setNote("");
    setError("");
    setDetail(null);
    try {
      const data = (await api(
        `/api/admin/applications?id=${encodeURIComponent(id)}`,
      )) as Detail;
      if (version === detailVersion.current) {
        setDetail(data);
        setStatus(data.status);
      }
    } catch (cause) {
      if (version === detailVersion.current)
        setError(
          cause instanceof Error ? cause.message : "Could not load detail.",
        );
    }
  };
  const mutate = async (operation: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await operation();
      setRevision((v) => v + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The operation failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className={styles.page} aria-busy={busy}>
      <h1>Astra applications</h1>
      <p>
        Private review workspace. Do not copy applicant information into public
        documents.
      </p>
      <form
        className={styles.toolbar}
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters((f) => ({ ...f, q: query }));
        }}
      >
        <label>
          Applicant name
          <input
            value={query}
            maxLength={80}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Pathway
          <select
            value={filters.track}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, track: e.target.value }));
            }}
          >
            <option value="">All pathways</option>
            <option value="core">Core</option>
            <option value="fellow">Fellow</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, status: e.target.value }));
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            value={filters.sort}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sort: e.target.value }))
            }
          >
            <option value="submitted_at">Submission date</option>
            <option value="status">Status</option>
            <option value="track">Pathway</option>
          </select>
        </label>
        <label>
          Order
          <select
            value={filters.direction}
            onChange={(e) =>
              setFilters((f) => ({ ...f, direction: e.target.value }))
            }
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>
          Search
        </button>
        {owner ? (
          <a href={`/api/admin/applications?${queryString}&export=csv`}>
            Export filtered CSV
          </a>
        ) : null}
        <button
          type="button"
          onClick={() =>
            void mutate(async () => {
              await api("/api/admin/session", { method: "DELETE" });
              window.location.assign("/admin/login");
            })
          }
        >
          Sign out
        </button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      <section
        className={styles.scroll}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll the wide spreadsheet.
        tabIndex={0}
        aria-label="Application spreadsheet"
      >
        <table>
          <caption>{count} matching applications</caption>
          <thead>
            <tr>
              {[
                "Applicant",
                "School",
                "Grade",
                "Pathway",
                "Submitted",
                "Status",
                "CV / detail",
              ].map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{profile(row)?.full_name}</td>
                <td>{profile(row)?.school}</td>
                <td>{profile(row)?.grade}</td>
                <td>{row.track}</td>
                <td>{new Date(row.submitted_at).toLocaleString()}</td>
                <td>{row.status}</td>
                <td>
                  <button type="button" onClick={() => void openDetail(row.id)}>
                    Review and CV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {!rows.length && !busy ? (
        <p>No applications match these filters.</p>
      ) : null}
      <div className={styles.toolbar}>
        <button
          type="button"
          disabled={busy || page <= 1}
          onClick={() => setPage((v) => v - 1)}
        >
          Previous page
        </button>
        <span>Page {page}</span>
        <button
          type="button"
          disabled={busy || page * 25 >= count}
          onClick={() => setPage((v) => v + 1)}
        >
          Next page
        </button>
        {owner ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void mutate(async () => {
                await api("/api/admin/maintenance", { method: "POST" });
              })
            }
          >
            Run retention and upload cleanup
          </button>
        ) : null}
      </div>
      {detail ? (
        <section className={styles.detail} aria-label="Application detail">
          <h2>{profile(detail)?.full_name}</h2>
          <p>
            {detail.email} · {profile(detail)?.school} · {detail.track}
          </p>
          {detail.astra_answers.map((answer) => (
            <article key={answer.question_id}>
              <h3>
                {pathwayQuestions[detail.track].questions.find(
                  (q) => q.id === answer.question_id,
                )?.label ?? answer.question_id}
              </h3>
              <p>
                {Array.isArray(answer.value)
                  ? answer.value.join(", ")
                  : answer.value}
              </p>
            </article>
          ))}
          <h3>Projects</h3>
          {detail.astra_projects
            .toSorted((a, b) => a.ordinal - b.ordinal)
            .map((project) => (
              <article key={project.ordinal}>
                <h4>{project.title}</h4>
                <p>{project.description}</p>
              </article>
            ))}
          <h3>Supporting links</h3>
          {detail.astra_links.map((link) => (
            <p key={link.ordinal}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label || link.url}
              </a>
            </p>
          ))}
          <h3>CV files</h3>
          {detail.astra_cv_files.map((file) => (
            <button
              key={file.id}
              type="button"
              disabled={busy || detail.status === "deleting"}
              onClick={() =>
                void mutate(async () => {
                  const result = await api("/api/admin/applications", {
                    method: "POST",
                    body: JSON.stringify({ id: detail.id, fileId: file.id }),
                  });
                  setDownload(result.url);
                })
              }
            >
              Prepare CV {file.ordinal} download
            </button>
          ))}
          {download ? (
            <p>
              <a href={download} rel="noreferrer">
                Download CV — link expires after 60 seconds
              </a>
            </p>
          ) : null}
          <h3>Internal notes</h3>
          {detail.astra_review_notes.map((item) => (
            <p key={item.id}>{item.note}</p>
          ))}
          <form
            className={styles.toolbar}
            onSubmit={(event) => {
              event.preventDefault();
              void mutate(async () => {
                await api("/api/admin/applications", {
                  method: "PATCH",
                  body: JSON.stringify({ id: detail.id, status, note }),
                });
                await openDetail(detail.id);
              });
            }}
          >
            <label>
              Review status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              New internal note
              <textarea
                value={note}
                maxLength={5000}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy || detail.status === "deleting"}
            >
              Save review
            </button>
            {owner ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Permanently delete this application and all its CV files?",
                    )
                  )
                    void mutate(async () => {
                      await api(
                        `/api/admin/applications?id=${encodeURIComponent(detail.id)}`,
                        { method: "DELETE" },
                      );
                      setDetail(null);
                      setDownload("");
                    });
                }}
              >
                Delete application and CVs
              </button>
            ) : null}
          </form>
        </section>
      ) : null}
    </main>
  );
}
