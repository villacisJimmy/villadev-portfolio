"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { submitContact, type ContactState } from "@/server-actions/contact";
import styles from "./Contact.module.css";

function Submit() {
  const t = useTranslations("form");
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      <span>{pending ? t("states.submitting") : t("send")}</span> <span>↗</span>
    </button>
  );
}

export function ContactForm() {
  const t = useTranslations("form");
  const [state, action] = useActionState<ContactState | undefined, FormData>(
    submitContact,
    undefined,
  );
  return (
    <form className={styles["formCard"]} action={action} noValidate>
      <input
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
      />
      <div className={styles["field"]}>
        <label htmlFor="c-name">{t("name")}</label>
        <input
          id="c-name"
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder={t("namePh")}
        />
      </div>
      <div className={styles["field"]}>
        <label htmlFor="c-email">{t("email")}</label>
        <input
          id="c-email"
          name="email"
          type="email"
          required
          maxLength={120}
          placeholder={t("emailPh")}
        />
      </div>
      <div className={styles["field"]}>
        <label htmlFor="c-subject">{t("subject")}</label>
        <select id="c-subject" name="subject" defaultValue="proyecto">
          <option value="proyecto">{t("opts.proyecto")}</option>
          <option value="consultoria">{t("opts.consultoria")}</option>
          <option value="colaboracion">{t("opts.colaboracion")}</option>
          <option value="otro">{t("opts.otro")}</option>
        </select>
      </div>
      <div className={styles["field"]}>
        <label htmlFor="c-message">{t("message")}</label>
        <textarea
          id="c-message"
          name="message"
          rows={4}
          required
          minLength={20}
          maxLength={2000}
          placeholder={t("messagePh")}
        />
      </div>
      <Submit />
      {state?.ok === true && (
        <div className={styles["formNote"]} role="status">
          {t("states.success")}
        </div>
      )}
      {state?.ok === false && state.error === "rate_limit" && (
        <div className={styles["formNote"]} role="alert">
          {t("states.rateLimit")}
        </div>
      )}
      {state?.ok === false && state.error === "validation" && (
        <div className={styles["formNote"]} role="alert">
          {t("states.validation")}
        </div>
      )}
      {state?.ok === false && state.error === "internal" && (
        <div className={styles["formNote"]} role="alert">
          {t("states.error")}
        </div>
      )}
    </form>
  );
}
