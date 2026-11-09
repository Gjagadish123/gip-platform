// Emails a new website or live-layout enquiry to the sales inbox. Called by the enquiries insert trigger
// (supabase/migrations/20261110120000_enquiry_email.sql) with {"id": <enquiry id>}.
//
// The URL is public (verify_jwt is off: the database calls it without a user), so the function trusts nothing but the
// id: it sends an enquiry created in the last hour that has not been emailed yet, and each one only once.
//
// Secrets (Dashboard > Edge Functions > Secrets):
//   SMTP_USER, SMTP_PASS  a Hostinger mailbox and its password (sent over port 465: Edge Functions may not use 25/587)
//   ENQUIRY_MAIL_TO       optional, default gip@greaterinfraprojects.in
//   SMTP_HOST             optional, default smtp.hostinger.com
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import nodemailer from "npm:nodemailer@6.9.16";

const MAIL_TO = Deno.env.get("ENQUIRY_MAIL_TO") || "gip@greaterinfraprojects.in";
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.hostinger.com";
const FORMS: Record<string, string> = { enquiry: "Enquiry", site_visit: "Site visit request", plot: "Plot enquiry" };
const SOURCES: Record<string, string> = { website: "Website", live_layout: "Live layouts" };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  const { id } = await req.json().catch(() => ({}));
  if (!Number.isSafeInteger(id) || id < 1) return json(400, { error: "Send {id}" });

  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  if (!user || !pass) return json(503, { error: "SMTP_USER and SMTP_PASS are not set" });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  // Claim it: only a recent enquiry that nobody has emailed yet.
  const { data: rows, error } = await db
    .from("enquiries")
    .update({ emailed_at: new Date().toISOString() })
    .eq("id", id)
    .is("emailed_at", null)
    .gte("created_at", new Date(Date.now() - 3600_000).toISOString())
    .select("*, project:projects(name)");
  if (error) return json(500, { error: error.message });
  const e = rows?.[0];
  if (!e) return json(200, { sent: false, reason: "no recent unsent enquiry with that id" });

  const about = e.project?.name ?? e.interest ?? "General enquiry";
  const when = new Date(e.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  const fields: [string, string | null][] = [
    ["Name", e.name],
    ["Phone", e.phone],
    ["Email", e.email],
    ["Project", about],
    ["Plot", e.plot_number ? `${e.plot_number}${e.wants_similar ? " (not available: wants plots like it)" : ""}` : null],
    ["Visit", e.visit_when],
    ["Message", e.message],
    ["Sent from", `${SOURCES[e.source] ?? e.source}${e.page ? `, ${e.page}` : ""}`],
    ["Received", `${when} IST`],
  ];
  const shown = fields.filter((f): f is [string, string] => Boolean(f[1]));
  const subject = `${FORMS[e.form] ?? "Enquiry"}: ${about}, ${e.name}`;
  const text = `${shown.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nAlso in the admin's Common sheet.`;
  const html =
    `<table cellpadding="6" style="border-collapse:collapse;font:14px Arial,sans-serif">${shown
      .map(([k, v]) => `<tr><td style="color:#555;vertical-align:top">${esc(k)}</td><td><b>${esc(v).replace(/\n/g, "<br>")}</b></td></tr>`)
      .join("")}</table><p style="font:13px Arial,sans-serif;color:#555">Also in the admin's Common sheet.</p>`;

  try {
    const smtp = nodemailer.createTransport({ host: SMTP_HOST, port: 465, secure: true, auth: { user, pass } });
    await smtp.sendMail({
      from: { name: "GIP website", address: user },
      to: MAIL_TO,
      ...(e.email ? { replyTo: { name: e.name, address: e.email } } : {}),
      subject,
      text,
      html,
    });
    return json(200, { sent: true });
  } catch (err) {
    // Release the claim so a later call can try again.
    await db.from("enquiries").update({ emailed_at: null }).eq("id", id);
    console.error("enquiry email failed", id, err instanceof Error ? err.message : err);
    return json(502, { error: "Sending failed" });
  }
});
