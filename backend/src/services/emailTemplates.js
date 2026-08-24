export function layout(title, bodyHtml) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:24px;color:#1e293b;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:#2563eb;padding:20px 24px;">
        <h2 style="margin:0;color:#ffffff;font-size:20px;">${title}</h2>
      </div>
      <div style="padding:24px;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">
        Mental Health Support System · This is an automated email.
      </div>
    </div>
  </div>`;
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:6px 0;color:#64748b;font-size:13px;width:160px;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;vertical-align:top;">${value || "-"}</td>
    </tr>`;
}

export function appointmentTable(appt) {
  return `
  <table style="width:100%;border-collapse:collapse;">
    ${row("Candidate Name", appt.candidateName || appt.patientName)}
    ${row("Candidate ID", appt.candidateId || appt.patientId)}
    ${row("Candidate Email", appt.candidateEmail || appt.patientEmail)}
    ${row("Candidate Phone", appt.candidatePhone || appt.patientPhone)}
    ${row("Appointment ID", appt.appointmentId)}
    ${row("Date", appt.date)}
    ${row("Time", appt.time)}
    ${row("Consultation Type", appt.consultationType)}
    ${row("Reason", appt.reason)}
    ${row("Additional Notes", appt.additionalNotes)}
    ${row("Booking Time", appt.bookingTime)}
    ${row("Status", appt.status)}
  </table>`;
}

export function actionButton(url, label) {
  return `
  <div style="margin-top:20px;">
    <a href="${url}" style="background:#2563eb;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">
      ${label}
    </a>
  </div>`;
}
