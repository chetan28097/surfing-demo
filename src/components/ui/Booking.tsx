"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLenis } from "lenis/react";
import { lessons, site } from "@/content/site";

type BookingCtx = { open: (lessonId?: string) => void };
const BookingContext = createContext<BookingCtx>({ open: () => {} });
export const useBooking = () => useContext(BookingContext);

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; email: string; ref: string } | { kind: "error"; message: string };
type Errors = Partial<Record<"lesson" | "date" | "people" | "name" | "email", string>>;

function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function validate(data: FormData): Errors {
  const e: Errors = {};
  if (!data.get("lesson")) e.lesson = "Choose a lesson.";
  const date = String(data.get("date") ?? "");
  if (!date) e.date = "Pick a preferred date.";
  else if (date < today()) e.date = "Pick a date from today onwards.";
  const people = Number(data.get("people"));
  if (!Number.isInteger(people) || people < 1 || people > 6) e.people = "Between 1 and 6 people.";
  if (!String(data.get("name") ?? "").trim()) e.name = "Add the name we should book under.";
  const email = String(data.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Add an email address like name@example.com.";
  return e;
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [lessonId, setLessonId] = useState(lessons[0].id);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [minDate, setMinDate] = useState("");
  const lenis = useLenis();
  const uid = useId();

  const open = useCallback(
    (id?: string) => {
      opener.current = document.activeElement as HTMLElement | null;
      if (id) setLessonId(id);
      setErrors({});
      setStatus({ kind: "idle" });
      setMinDate(today());
      lenis?.stop();
      dialogRef.current?.showModal();
    },
    [lenis],
  );

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => {
      lenis?.start();
      opener.current?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === d) d.close(); // click on the ::backdrop
    };
    d.addEventListener("close", onClose);
    d.addEventListener("click", onClick);
    return () => {
      d.removeEventListener("close", onClose);
      d.removeEventListener("click", onClick);
    };
  }, [lenis]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const json = (await res.json()) as { ok: boolean; reference?: string; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "The booking service didn't accept the request.");
      setStatus({ kind: "sent", email: String(data.get("email")), ref: json.reference ?? "" });
      formRef.current?.reset();
    } catch (err) {
      setStatus({
        kind: "error",
        message: `${err instanceof Error ? err.message : "Couldn't send the request."} Try again, or email ${site.email}.`,
      });
    }
  }

  const value = useMemo(() => ({ open }), [open]);
  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${uid}-${k}-err`} className="field__error">
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: keyof Errors) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined,
  });

  return (
    <BookingContext.Provider value={value}>
      {children}
      <dialog ref={dialogRef} className="booking-dialog" aria-labelledby={`${uid}-title`} data-lenis-prevent>
        <div className="relative p-6 sm:p-10">
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full hover:bg-ink/10"
            aria-label="Close booking form"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {status.kind === "sent" ? (
            <div className="py-6" role="status">
              <h2 id={`${uid}-title`} className="display display-m">
                Request received.
              </h2>
              <p className="mt-5 measure text-lg">
                We&apos;ll reply to <strong>{status.email}</strong> to confirm a time that suits the tide.
                {status.ref && <> Your reference is <strong>{status.ref}</strong>.</>}
              </p>
              <button type="button" className="btn btn--ink mt-8" onClick={close}>
                Back to the site
              </button>
            </div>
          ) : (
            <>
              <h2 id={`${uid}-title`} className="display display-m pr-12">
                Book a lesson
              </h2>
              <p className="mt-3 text-[1.05rem] opacity-80">
                Send a request and we&apos;ll confirm a time by email. Nothing is charged now.
              </p>

              <form ref={formRef} noValidate onSubmit={onSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
                <div className="field sm:col-span-2">
                  <label htmlFor={`${uid}-lesson`}>Lesson</label>
                  <select
                    id={`${uid}-lesson`}
                    name="lesson"
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                    {...a11y("lesson")}
                  >
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.level.toLowerCase()})
                      </option>
                    ))}
                  </select>
                  {err("lesson")}
                </div>
                <div className="field">
                  <label htmlFor={`${uid}-date`}>Preferred date</label>
                  <input id={`${uid}-date`} name="date" type="date" min={minDate} required {...a11y("date")} />
                  {err("date")}
                </div>
                <div className="field">
                  <label htmlFor={`${uid}-people`}>People</label>
                  <input
                    id={`${uid}-people`}
                    name="people"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={6}
                    defaultValue={1}
                    required
                    {...a11y("people")}
                  />
                  {err("people")}
                </div>
                <div className="field">
                  <label htmlFor={`${uid}-name`}>Name</label>
                  <input id={`${uid}-name`} name="name" autoComplete="name" required {...a11y("name")} />
                  {err("name")}
                </div>
                <div className="field">
                  <label htmlFor={`${uid}-email`}>Email</label>
                  <input
                    id={`${uid}-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    {...a11y("email")}
                  />
                  {err("email")}
                </div>
                <div className="field sm:col-span-2">
                  <label htmlFor={`${uid}-notes`}>
                    Anything we should know? <span className="font-normal opacity-70">(optional)</span>
                  </label>
                  <textarea id={`${uid}-notes`} name="notes" rows={3} maxLength={800} />
                </div>

                {status.kind === "error" && (
                  <p role="alert" className="field__error sm:col-span-2">
                    {status.message}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <button type="submit" className="btn btn--ink" disabled={status.kind === "sending"}>
                    {status.kind === "sending" ? "Sending request…" : "Send request"}
                  </button>
                  <span className="text-[0.95rem] opacity-70">Or call {site.phone}</span>
                </div>
              </form>
            </>
          )}
        </div>
      </dialog>
    </BookingContext.Provider>
  );
}

/** A button that opens the booking dialog. Optional lesson preselect. */
export function BookButton({
  lessonId,
  className = "btn btn--solid",
  children = "Book a lesson",
}: {
  lessonId?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { open } = useBooking();
  return (
    <button type="button" className={className} onClick={() => open(lessonId)} aria-haspopup="dialog">
      {children}
    </button>
  );
}
