import jsPDF from "jspdf";

export function generateCertificate({ studentName, courseTitle, date, certId }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [800, 600] });

  // Background
  doc.setFillColor(15, 15, 25);
  doc.rect(0, 0, 800, 600, "F");

  // Border
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(6);
  doc.rect(20, 20, 760, 560);

  doc.setDrawColor(150, 150, 220);
  doc.setLineWidth(1);
  doc.rect(35, 35, 730, 530);

  // Title
  doc.setTextColor(99, 102, 241);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text("CERTIFICATE OF COMPLETION", 400, 110, { align: "center" });

  // Subtitle
  doc.setTextColor(180, 180, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("This certificate is proudly presented to", 400, 160, { align: "center" });

  // Student Name
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(studentName, 400, 230, { align: "center" });

  // Underline
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(2);
  doc.line(250, 245, 550, 245);

  // Description
  doc.setTextColor(180, 180, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("for successfully completing the course", 400, 290, { align: "center" });

  // Course Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(courseTitle, 400, 330, { align: "center" });

  // Date
  doc.setTextColor(180, 180, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Issued on ${date}`, 400, 480, { align: "center" });

  // Footer / Brand
  doc.setTextColor(99, 102, 241);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LearnFlow", 400, 540, { align: "center" });

  // Cert ID
  doc.setTextColor(120, 120, 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Certificate ID: ${certId}`, 400, 560, { align: "center" });

  doc.save(`${courseTitle.replace(/\s+/g, "_")}_Certificate.pdf`);
}