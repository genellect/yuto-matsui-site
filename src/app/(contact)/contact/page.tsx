import { ContactFooter, ContactHeader } from "../../../contact/ContactChrome";
import { ContactForm } from "../../../contact/ContactForm";
import styles from "../../../contact/contact.module.css";

export default function ContactPage() {
  return (
    <div className={styles.page} id="contact-top">
      <ContactHeader />
      <div className={styles.gallery}>
        <main id="main" className={styles.main}>
          <ContactForm />
        </main>
      </div>
      <ContactFooter />
    </div>
  );
}
