import { JoinLink } from "@/components/site";

export function NetworkContent() {
  return (
    <main id="main" className="content-page wrap" data-reveal-group="">
      <p className="eyebrow" data-reveal="fade-up">
        One network. Different schools.
      </p>
      <h1
        className="display"
        style={{ color: "#FFFFFF" }}
        data-reveal="section"
      >
        Different schools. Shared ambition.
      </h1>
      <p data-reveal="section">
        ASTRA is a student-led youth innovation network in Qatar. It brings
        students aged 14–18 together around technology, AI, programming,
        entrepreneurship, business, science, engineering, design and media.
      </p>
      <h2 data-reveal="fade-up">Find your way in.</h2>
      <p data-reveal="section">
        Astra Fellow is for students pursuing their own projects, research, and
        independent initiatives. Astra Core is for students who want to help
        shape Astra through its operations, events, and initiatives.
      </p>
      <h2 data-reveal="fade-up">Across schools, not just within them.</h2>
      <p data-reveal="section">
        The school representation model is built around small student teams,
        sharing ideas and opportunities across school boundaries. School
        participation and representation arrangements must be confirmed before
        they are published.
      </p>
      <JoinLink reveal />
    </main>
  );
}
