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
        students aged 13–18 together around technology, AI, programming,
        entrepreneurship, business, science, engineering, design and media.
      </p>
      <h2 data-reveal="fade-up">Find your way in.</h2>
      <p data-reveal="section">
        ASTRA Network is an interest in connecting and exploring. ASTRA Core is
        an interest in contributing to student-led projects. School
        Representatives help connect their school community with the wider
        network. These are application interests, not automatic appointments.
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
