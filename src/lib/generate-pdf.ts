import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { OnboardingData } from "@/types/onboarding";
import { termsOfUseCopy, isTermsHeading } from "@/lib/terms-content";

// TJ brand blue
const TJ_BLUE: [number, number, number] = [15, 65, 155];
const TJ_BLUE_LIGHT: [number, number, number] = [230, 236, 250];

export interface SignerInfo {
  fullName: string;
  jobTitle: string;
  companyName: string;
  email: string;
  acceptedAt: string;
  sessionId: string;
  dealId: string;
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export { blobToBase64 };

export async function generateAcceptancePdf(
  data: OnboardingData,
  signer: SignerInfo
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const fees = data.adminConfig.fees;
  const includePosIntegrationFee = fees.includePosIntegrationFee ?? true;
  const posIntegrationFee = fees.posIntegrationFee ?? 45000;
  const backupBankFee = 30;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;

  // ── HEADER ──────────────────────────────────────────────────────────────
  doc.setFillColor(...TJ_BLUE);
  doc.rect(0, 0, pageW, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Junction", margin, 13);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Terms of Use & Fee Schedule – Acceptance Certificate", margin, 21);

  doc.setFontSize(8.5);
  doc.text(`Generated: ${signer.acceptedAt}`, margin, 28);

  // ── ACCEPTANCE DETAILS ──────────────────────────────────────────────────
  let y = 40;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Acceptance Details", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 52, fillColor: TJ_BLUE_LIGHT } },
    body: [
      ["Signer Full Name", signer.fullName],
      ["Job Title", signer.jobTitle],
      ["Company", signer.companyName],
      ["Email Address", signer.email],
      ["Accepted At (UTC)", signer.acceptedAt],
      ["Session ID", signer.sessionId],
      ["HubSpot Deal ID", signer.dealId],
    ],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── AUTHORIZATION STATEMENT ─────────────────────────────────────────────
  doc.setFillColor(240, 244, 255);
  const stmtText =
    `By accepting this agreement, ${signer.fullName} (${signer.jobTitle}) confirms they are duly authorised ` +
    `to accept these Terms of Use and Fee Schedule on behalf of ${signer.companyName}, and that this ` +
    `electronic acceptance constitutes a legally binding agreement between ${signer.companyName} and ` +
    `Transaction Junction (Pty) Ltd.`;
  const stmtLines = doc.splitTextToSize(stmtText, contentW - 8);
  const stmtBoxH = stmtLines.length * 4.5 + 8;
  doc.rect(margin, y, contentW, stmtBoxH, "F");
  doc.setDrawColor(...TJ_BLUE);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentW, stmtBoxH, "D");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(30, 30, 80);
  doc.text(stmtLines, margin + 4, y + 6);
  y += stmtBoxH + 12;

  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 180, 180);

  // ── SECTION 1: TERMS OF USE ─────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("1. Terms of Use", margin, y);
  y += 8;

  doc.setFontSize(8.5);
  for (const line of termsOfUseCopy) {
    if (y > 272) {
      doc.addPage();
      y = 18;
    }
    const isHeading = isTermsHeading(line);
    if (isHeading) {
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 65, 155);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
    }
    const textX = isHeading ? margin : margin + 5;
    const wrapped = doc.splitTextToSize(line, isHeading ? contentW : contentW - 5);
    // check again after wrapping in case it's a long heading
    if (y + wrapped.length * 4.5 > 275) {
      doc.addPage();
      y = 18;
    }
    doc.text(wrapped, textX, y);
    y += wrapped.length * 4.5;
  }

  // ── SECTION 2: FEE SCHEDULE ─────────────────────────────────────────────
  if (y > 240) {
    doc.addPage();
    y = 18;
  } else {
    y += 10;
  }

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("2. Fee Schedule", margin, y);
  y += 7;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const feeIntroLines = doc.splitTextToSize(
    "For avoidance of doubt, all terms recorded here are subject to the terms defined in the Master " +
      "Services Agreement. TJ will invoice monthly in arrears for all amounts due, and the client must " +
      "sign a debit order mandate for the nominated account.",
    contentW
  );
  doc.text(feeIntroLines, margin, y);
  y += feeIntroLines.length * 4.5 + 6;

  // Once-off fees
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Once-off fees", margin, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: TJ_BLUE, textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 3 },
    head: [["Deliverable", "Description", "Fee (ex VAT)"]],
    body: [
      [
        "Fixed fee per store",
        "Configuration and project management fee",
        fmtCurrency(fees.oneOffSetupFeePerSite),
      ],
      ...(includePosIntegrationFee
        ? [[
            "POS integration support",
            "Integration specialist support and certification before go-live.",
            fmtCurrency(posIntegrationFee),
          ]]
        : []),
    ],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (y > 240) {
    doc.addPage();
    y = 18;
  }

  // Recurring fees
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Recurring monthly fees", margin, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: TJ_BLUE, textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 3 },
    head: [["Platform", "Description", "Fee"]],
    body: [
      [
        "Payment Platform license fee",
        "Monthly fee per integrated device",
        `${fmtCurrency(fees.monthlyFeePerDevice)} per month`,
      ],
      [
        "Cloud hosting fee",
        "Monthly fee per integrated device",
        `${fmtCurrency(fees.monthlyCloudHostingFeePerDevice)} per month`,
      ],
      [
        "Reconciliation Platform license fee",
        "Monthly fee per reconciled store",
        `${fmtCurrency(fees.monthlyReconProFeePerSite)} per month`,
      ],
      [
        "Back up bank fee",
        "Monthly fee per site with automated failover acquiring",
        `${fmtCurrency(backupBankFee)} per month`,
      ],
    ],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // ── SIGNATURE FOOTER ────────────────────────────────────────────────────
  if (y > 252) {
    doc.addPage();
    y = 18;
  }

  doc.setFillColor(...TJ_BLUE_LIGHT);
  const footerH = 30;
  doc.rect(margin, y, contentW, footerH, "F");
  doc.setDrawColor(...TJ_BLUE);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentW, footerH, "D");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TJ_BLUE);
  doc.text("Electronic Acceptance Record", margin + 4, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Signed by: ${signer.fullName}, ${signer.jobTitle} — ${signer.companyName}`,
    margin + 4,
    y + 14
  );
  doc.text(`Email: ${signer.email}  |  Timestamp: ${signer.acceptedAt}`, margin + 4, y + 20);
  doc.text(
    "This document was generated automatically upon electronic acceptance of TJ terms and fees.",
    margin + 4,
    y + 26
  );

  // ── PAGE NUMBERS ─────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}  |  Transaction Junction Terms Acceptance  |  ${signer.acceptedAt}`,
      margin,
      doc.internal.pageSize.getHeight() - 6
    );
  }

  return doc.output("blob");
}
