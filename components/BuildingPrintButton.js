"use client";

export default function BuildingPrintButton({ building, totalUnits, totalEvents, totalDocuments, totalContractors, propertyManagers, events, documents, units, aoao, contractors }) {
  const generatePDF = async () => {
    try {
      // Dynamic import for jsPDF - handle both default and named exports
      const jsPDFModule = await import("jspdf");
      // jsPDF v3: try default export first, then named export
      let JsPDF;
      if (jsPDFModule.default) {
        JsPDF = jsPDFModule.default;
      } else if (jsPDFModule.jsPDF) {
        JsPDF = jsPDFModule.jsPDF;
      } else {
        JsPDF = jsPDFModule;
      }
      
      if (typeof JsPDF !== 'function') {
        throw new Error(`jsPDF constructor not found. Module keys: ${Object.keys(jsPDFModule).join(', ')}`);
      }
      
      const doc = new JsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;
      
      // Load logo image once at the start
      let logoImage = null;
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/aina-logo-dark.png';
        logoImage = await new Promise((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = reject;
          setTimeout(() => reject(new Error('Image load timeout')), 1000);
        });
      } catch (error) {
        console.log('Logo image could not be loaded, using text-only fallback');
      }

      // Helper function to add header with logo and branding
      const addHeader = (pdfDoc, width, marginLeft) => {
        if (logoImage) {
          // Add logo (small size)
          const logoSize = 10;
          pdfDoc.addImage(logoImage, 'PNG', marginLeft, yPosition, logoSize, logoSize);
          
          // Text branding next to logo
          pdfDoc.setFontSize(9);
          pdfDoc.setFont("helvetica", "bold");
          pdfDoc.setTextColor(0, 0, 0);
          pdfDoc.text("AINAREPORTS", marginLeft + logoSize + 5, yPosition + 7);
        } else {
          // Fallback to text-only if image didn't load
          pdfDoc.setFontSize(9);
          pdfDoc.setFont("helvetica", "bold");
          pdfDoc.setTextColor(0, 0, 0);
          pdfDoc.text("AINAREPORTS", marginLeft, yPosition + 7);
        }
        
        // Generation date on right
        pdfDoc.setFontSize(8);
        pdfDoc.setFont("helvetica", "normal");
        const genDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        pdfDoc.text(`Generated ${genDate}`, width - marginLeft, yPosition + 7, { align: "right" });
      };

      // Add header to first page
      addHeader(doc, pageWidth, margin);
      yPosition += 12;

      // Building Name
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(building.name || "Building Report", margin, yPosition);
      yPosition += 8;

      // Address and TMK on one line
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const addressParts = [
        building.address,
        building.city,
        building.state,
        building.zip
      ].filter(Boolean);
      let addressLine = addressParts.join(", ");
      if (building.tmk) {
        addressLine += ` TMK ${building.tmk}`;
      }
      doc.text(addressLine, margin, yPosition);
      yPosition += 6;

      // Building Health Status (if available)
      // For now, we'll skip this as it's not in our data model
      
      // Intro paragraph
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      const introText = "This FREE Building Report provides a snapshot of recorded building activity, including recent events, documents, AOAO governance, property management, and vendor involvement. For complete historical records, unit-level detail, and analytics, upgrade to the Premium AinaReport.";
      const maxWidth = pageWidth - margin * 2;
      const introLines = doc.splitTextToSize(introText, maxWidth);
      introLines.forEach((line) => {
        doc.text(line, margin, yPosition);
        yPosition += 4;
      });
      yPosition += 4;

      // Quick Stats Table
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      const statsY = yPosition;
      doc.text("Units", margin, statsY);
      doc.text("Floors", margin + 30, statsY);
      doc.text("Events", margin + 60, statsY);
      doc.text("Documents", margin + 90, statsY);
      
      doc.setFont("helvetica", "normal");
      yPosition += 5;
      doc.text(totalUnits?.toString() || "—", margin, yPosition);
      doc.text(building.floors?.toString() || "—", margin + 30, yPosition);
      doc.text(totalEvents?.toString() || "—", margin + 60, yPosition);
      doc.text(totalDocuments?.toString() || "—", margin + 90, yPosition);
      yPosition += 8;

      // Recent Events (5) - Table format
      if (events && events.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Recent Events (5)", margin, yPosition);
        yPosition += 6;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        
        events.slice(0, 5).forEach((event) => {
          if (yPosition > pageHeight - 40) return; // Stop if we're running out of space
          
          const eventDate = event.occurred_at ? new Date(event.occurred_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : "—";
          const eventType = event.event_type || "—";
          const severity = event.severity || "—";
          const status = event.status || "—";
          
          // Event title with bullet
          doc.setFont("helvetica", "bold");
          doc.text(`■ ${event.title || "Event"}`, margin, yPosition);
          
          // Type, Severity, Status
          const details = [eventType, severity, status].filter(d => d !== "—").join(" · ");
          doc.setFont("helvetica", "normal");
          const detailsX = margin + 80;
          doc.text(details, detailsX, yPosition);
          
          // Date on right
          doc.text(eventDate, pageWidth - margin - 15, yPosition, { align: "right" });
          
          yPosition += 5;
        });
        yPosition += 3;
      }

      // AOAO Section
      if (aoao && (aoao.organization_name || aoao.company_name || aoao.name)) {
        if (yPosition > pageHeight - 50) return;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const aoaoName = aoao.organization_name || aoao.company_name || aoao.name;
        const isVerified = aoao.subscription_tier === "paid";
        doc.text(`AOAO${isVerified ? " (Verified)" : ""}`, margin, yPosition);
        yPosition += 6;

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(aoaoName, margin, yPosition);
        if (isVerified) {
          doc.text("★", margin + doc.getTextWidth(aoaoName) + 2, yPosition);
        }
        yPosition += 5;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        const contactParts = [];
        if (aoao.contact_person) contactParts.push(aoao.contact_person);
        const aoaoPhone = aoao.contact_phone || aoao.phone;
        if (aoaoPhone) {
          // Format phone with extension if available
          let phoneText = aoaoPhone;
          if (aoao.contact_phone_extension) {
            phoneText += ` ext. ${aoao.contact_phone_extension}`;
          }
          contactParts.push(phoneText);
        }
        const aoaoEmail = aoao.contact_email || aoao.email;
        if (aoaoEmail) contactParts.push(aoaoEmail);
        if (aoao.website) contactParts.push(aoao.website);
        
        if (contactParts.length > 0) {
          doc.text(contactParts.join(" · "), margin, yPosition);
          yPosition += 5;
        }
        yPosition += 3;
      }

      // Property Managers (Top 5) - Table format
      if (propertyManagers && propertyManagers.length > 0) {
        if (yPosition > pageHeight - 50) return;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Property Managers (Top 5)", margin, yPosition);
        yPosition += 6;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        
        propertyManagers.slice(0, 5).forEach((pm) => {
          if (yPosition > pageHeight - 40) return;
          
          const pmName = pm.company_name || pm.name || "Property Manager";
          const isPaid = pm.subscription_tier === "paid";
          const license = pm.license_number && pm.license_number !== "string" ? pm.license_number : "—";
          const unitCount = pm.building_count > 0 ? "ALL" : (pm.unit_count > 0 ? `${pm.unit_count} Units` : "—");
          
          // Name with star if paid
          doc.setFont("helvetica", "bold");
          doc.text(pmName, margin, yPosition);
          if (isPaid) {
            doc.text("★", margin + doc.getTextWidth(pmName) + 2, yPosition);
          }
          
          // License
          doc.setFont("helvetica", "normal");
          doc.text(license, margin + 60, yPosition);
          
          // Unit count
          doc.text(unitCount, pageWidth - margin - 30, yPosition, { align: "right" });
          
          yPosition += 5;
        });
        yPosition += 3;
      }

      // Recent Documents (5) - Table format
      if (documents && documents.length > 0) {
        if (yPosition > pageHeight - 50) return;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Recent Documents (5)", margin, yPosition);
        yPosition += 6;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        
        documents.slice(0, 5).forEach((documentItem) => {
          if (yPosition > pageHeight - 40) return;
          
          const docTitle = documentItem.title || documentItem.filename || "Document";
          const category = documentItem.category || "—";
          const subcategory = documentItem.subcategory || "";
          const categoryText = subcategory ? `${category} / ${subcategory}` : category;
          const source = documentItem.source || documentItem.uploaded_by_role || "—";
          const docDate = documentItem.created_at ? new Date(documentItem.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : "—";
          
          // Title with bullet
          doc.setFont("helvetica", "bold");
          doc.text(`■ ${docTitle}`, margin, yPosition);
          
          // Category, source, and date
          doc.setFont("helvetica", "normal");
          const details = `${categoryText} · ${source} · ${docDate}`;
          doc.text(details, margin + 75, yPosition);
          
          yPosition += 5;
        });
        yPosition += 3;
      }

      // Contractors/Vendors (Top 5) - Table format
      if (contractors && contractors.length > 0) {
        if (yPosition > pageHeight - 50) return;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Contractors / Vendors (Top 5)", margin, yPosition);
        yPosition += 6;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        
        contractors.slice(0, 5).forEach((contractor) => {
          if (yPosition > pageHeight - 40) return;
          
          const contractorName = contractor.company_name || contractor.name || "Contractor";
          const isPaid = contractor.subscription_tier === "paid";
          const role = contractor.roles && contractor.roles.length > 0 
            ? contractor.roles[0].charAt(0).toUpperCase() + contractor.roles[0].slice(1)
            : "—";
          const eventCount = contractor.count || contractor.event_count || 0;
          const eventText = eventCount === 1 ? "1 Event" : `${eventCount} Events`;
          
          // Name with star if paid
          doc.setFont("helvetica", "bold");
          doc.text(contractorName, margin, yPosition);
          if (isPaid) {
            doc.text("★", margin + doc.getTextWidth(contractorName) + 2, yPosition);
          }
          
          // Role
          doc.setFont("helvetica", "normal");
          doc.text(role, margin + 60, yPosition);
          
          // Event count
          doc.text(eventText, pageWidth - margin - 30, yPosition, { align: "right" });
          
          yPosition += 5;
        });
        yPosition += 3;
      }

      // Premium AinaReport Available section
      if (yPosition > pageHeight - 30) {
        // If we're too low, we can't fit this section
      } else {
        yPosition += 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Premium AinaReport Available", margin, yPosition);
        yPosition += 5;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        const premiumText = "Unlock full building and unit history, downloadable documents, contractor analytics, and AOAO transparency. This report reflects information recorded in Aina Protocol as of the generation date and may not include off-platform activity or historical records prior to onboarding. AinaReports.com";
        const premiumLines = doc.splitTextToSize(premiumText, pageWidth - margin * 2);
        premiumLines.forEach((line) => {
          doc.text(line, margin, yPosition);
          yPosition += 4;
        });
      }

      // Footer
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated by AinaReports on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
      doc.text(
        `Page 1 of 1`,
        pageWidth / 2,
        pageHeight - 4,
        { align: "center" }
      );
      doc.setTextColor(0, 0, 0);

      // Save the PDF
      const filename = `${building.name || "Building"}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Error generating PDF: ${error.message || error.toString()}. Please check the console for details.`);
    }
  };

  return (
    <div className="border rounded-md p-4 bg-gray-50 text-sm mt-8">
      <h3 className="font-semibold mb-1 text-center">Building Report</h3>
      <p className="text-gray-700 text-xs mb-4 text-center">
        Download a comprehensive report with building data, events, documents, contractor activity, and unit details for {building.name}.
      </p>
      <div className="space-y-2">
        <button
          onClick={generatePDF}
          className="block w-full text-center border border-gray-800 rounded-md py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Print Free Basic Report"
        >
          Free Basic Report
        </button>
        <button
          disabled
          className="block w-full text-center border border-gray-400 rounded-md py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
          title="Full Premium Report coming soon"
          aria-label="Full Premium Report"
        >
          Full Premium Report - Coming Soon
        </button>
      </div>
    </div>
  );
}
