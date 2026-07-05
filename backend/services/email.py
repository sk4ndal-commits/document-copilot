import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USER)


def _send(to: str, subject: str, body_html: str) -> None:
    """Send a single email via SMTP. Silently skips if SMTP_USER is not configured."""
    if not SMTP_USER or not to:
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(body_html, "html"))
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(EMAIL_FROM, to, msg.as_string())


def send_onboarding_complete(sales_rep_email: str, client_name: str, session_id: str) -> None:
    """Notify the sales rep that all required documents are valid."""
    subject = f"✅ Onboarding complete — {client_name}"
    body = f"""
    <p>Hi,</p>
    <p>All required documents for <strong>{client_name}</strong> have been validated successfully.</p>
    <p>Session ID: <code>{session_id}</code></p>
    <p>You can now proceed with the onboarding process.</p>
    """
    _send(sales_rep_email, subject, body)


def send_slot_invalid(client_email: str, doc_label: str, missing_fields: list[str]) -> None:
    """Notify the client that their uploaded document needs correction."""
    subject = f"⚠️ Action required: Your {doc_label} needs correction"
    issues = "".join(f"<li>{f}</li>" for f in missing_fields)
    body = f"""
    <p>Hi,</p>
    <p>Your document <strong>{doc_label}</strong> could not be validated. Please correct the following issues and re-upload:</p>
    <ul>{issues}</ul>
    <p>Thank you.</p>
    """
    _send(client_email, subject, body)
