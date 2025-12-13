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
      
      // Load logo and badge images once at the start
      let logoImage = null;
      let badgeImage = null;
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '/aina-logo-dark.png';
        logoImage = await new Promise((resolve, reject) => {
          logoImg.onload = () => resolve(logoImg);
          logoImg.onerror = reject;
          setTimeout(() => reject(new Error('Logo load timeout')), 1000);
        });
      } catch (error) {
        console.log('Logo image could not be loaded, using text-only fallback');
      }
      
      try {
        const badgeImg = new Image();
        badgeImg.crossOrigin = 'anonymous';
        badgeImg.src = '/verified-badge.png';
        badgeImage = await new Promise((resolve, reject) => {
          badgeImg.onload = () => resolve(badgeImg);
          badgeImg.onerror = reject;
          setTimeout(() => reject(new Error('Badge load timeout')), 1000);
        });
      } catch (error) {
        console.log('Badge image could not be loaded, using star fallback');
      }

      // Helper function to add header with logo and branding
      const addHeader = (pdfDoc, width, marginLeft) => {
        const headerY = 5;
        if (logoImage) {
          // Add logo (smaller size to prevent overlap)
          const logoSize = 10;
          pdfDoc.addImage(logoImage, 'PNG', marginLeft, headerY, logoSize, logoSize);
          
          // Text branding next to logo (with more spacing to prevent overlap)
          pdfDoc.setFontSize(14);
          pdfDoc.setFont("helvetica", "bold");
          pdfDoc.setTextColor(0, 0, 0);
          // Increased spacing to prevent overlap - more space between logo and text
          pdfDoc.text("AINAREPORTS", marginLeft + logoSize + 25, headerY + 7);
        } else {
          // Fallback to text-only if image didn't load
          pdfDoc.setFontSize(14);
          pdfDoc.setFont("helvetica", "bold");
          pdfDoc.setTextColor(0, 0, 0);
          pdfDoc.text("AINAREPORTS", marginLeft, headerY + 7);
        }
        
        // Generation date on right
        pdfDoc.setFontSize(8);
        pdfDoc.setFont("helvetica", "normal");
        const genDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        pdfDoc.text(`Generated ${genDate}`, width - marginLeft, headerY + 7, { align: "right" });
      };

      // Add header to first page
      addHeader(doc, pageWidth, margin);
      yPosition = 20; // Start below header (logo is 12px + spacing)

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

      // Quick Stats Table - in a box
      const statsBoxY = yPosition;
      const statsBoxHeight = 12;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin - 2, statsBoxY - 4, pageWidth - margin * 2 + 4, statsBoxHeight, 2, 2, 'S');
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      const statsY = yPosition;
      doc.text("Units", margin, statsY);
      doc.text("Floors", margin + 30, statsY);
      doc.text("Events", margin + 60, statsY);
      doc.text("Documents", margin + 90, statsY);
      
      doc.setFont("helvetica", "normal");
      yPosition += 5;
      // Ensure numbers are displayed correctly (no % symbol)
      const unitsText = totalUnits?.toString() || "—";
      const floorsText = building.floors?.toString() || "—";
      const eventsText = totalEvents?.toString() || "—";
      const docsText = totalDocuments?.toString() || "—";
      doc.text(unitsText, margin, yPosition);
      doc.text(floorsText, margin + 30, yPosition);
      doc.text(eventsText, margin + 60, yPosition);
      doc.text(docsText, margin + 90, yPosition);
      yPosition += 8;

      // AOAO Section - in a box (moved before Events)
      if (aoao && (aoao.organization_name || aoao.company_name || aoao.name)) {
        if (yPosition > pageHeight - 50) return;
        
        const aoaoBoxY = yPosition;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const aoaoName = aoao.organization_name || aoao.company_name || aoao.name;
        const isVerified = aoao.subscription_tier === "paid";
        doc.text("AOAO", margin, yPosition);
        yPosition += 6;

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        const aoaoNameWidth = doc.getTextWidth(aoaoName);
        
        // No background tint - just text
        doc.setTextColor(0, 0, 0);
        doc.text(aoaoName, margin, yPosition);
        if (isVerified && badgeImage) {
          // Add verified badge image next to name (even smaller)
          const badgeSize = 3;
          doc.addImage(badgeImage, 'PNG', margin + aoaoNameWidth + 2, yPosition - 2, badgeSize, badgeSize);
        } else if (isVerified) {
          // Fallback to star if badge image didn't load
          doc.text("★", margin + aoaoNameWidth + 2, yPosition);
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

      // Property Managers (Top 5) - Table format in a box
      if (propertyManagers && propertyManagers.length > 0) {
        if (yPosition > pageHeight - 50) return;
        
        const pmBoxY = yPosition;
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
          
          // Name with badge if paid - no background tint
          doc.setFont("helvetica", "bold");
          const pmNameWidth = doc.getTextWidth(pmName);
          
          // Text stays black
          doc.setTextColor(0, 0, 0);
          doc.text(pmName, margin, yPosition);
          if (isPaid && badgeImage) {
            // Add verified badge image next to name (even smaller)
            const badgeSize = 3;
            doc.addImage(badgeImage, 'PNG', margin + pmNameWidth + 2, yPosition - 2, badgeSize, badgeSize);
          } else if (isPaid) {
            // Fallback to star if badge image didn't load
            doc.text("★", margin + pmNameWidth + 2, yPosition);
          }
          
          // License
          doc.setFont("helvetica", "normal");
          doc.text(license, margin + 55, yPosition);
          
          // Unit count
          doc.text(unitCount, pageWidth - margin - 25, yPosition, { align: "right" });
          
          yPosition += 5;
        });
        
        // Close the PM box
        const pmBoxHeight = yPosition - pmBoxY + 2;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin - 2, pmBoxY - 2, pageWidth - margin * 2 + 4, pmBoxHeight, 2, 2, 'S');
        
        yPosition += 5;
      }

      // Recent Documents (5) - Table format in a box
      if (documents && documents.length > 0) {
        if (yPosition > pageHeight - 50) return;
        
        const docsBoxY = yPosition;
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
          
          // Category, source, and date - on same line after title (lowercase category/subcategory)
          doc.setFont("helvetica", "normal");
          const categoryLower = categoryText.toLowerCase();
          const sourceLower = source.toLowerCase();
          const details = `${categoryLower} · ${sourceLower} · ${docDate}`;
          doc.text(details, margin + 75, yPosition);
          
          // "View" link on right - make it clickable
          const viewText = "View";
          const viewX = pageWidth - margin - 10;
          
          // Add clickable link if document has download URL
          if (documentItem.id) {
            const documentUrl = documentItem.download_url || documentItem.document_url;
            const isValidUrl = documentUrl && 
              typeof documentUrl === 'string' && 
              documentUrl.trim() !== '' &&
              (documentUrl.startsWith('http://') || documentUrl.startsWith('https://'));
            
            let linkUrl;
            if (isValidUrl) {
              linkUrl = documentUrl;
            } else {
              // Build relative URL for document download
              const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
              linkUrl = `${baseUrl}/api/documents/${documentItem.id}/download`;
            }
            
            // Use text with link option (jsPDF v3 syntax) - keep text black
            doc.setTextColor(0, 0, 0); // Black text for link
            doc.text(viewText, viewX, yPosition, { align: "right", link: linkUrl });
          } else {
            // No link available, just show text
            doc.setTextColor(0, 0, 0);
            doc.text(viewText, viewX, yPosition, { align: "right" });
          }
          
          // Add document description if available (compact)
          if (documentItem.description && documentItem.description.trim()) {
            yPosition += 4;
            doc.setFontSize(6);
            doc.setFont("helvetica", "italic");
            const descLines = doc.splitTextToSize(documentItem.description.trim(), pageWidth - margin * 2 - 20);
            descLines.slice(0, 1).forEach((line) => { // Limit to 1 line
              if (yPosition > pageHeight - 40) return;
              doc.text(line, margin + 5, yPosition);
              yPosition += 3;
            });
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
          }
          
          yPosition += 4; // Move to next document
        });
        
        // Close the documents box
        const docsBoxHeight = yPosition - docsBoxY + 2;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin - 2, docsBoxY - 2, pageWidth - margin * 2 + 4, docsBoxHeight, 2, 2, 'S');
        
        yPosition += 5;
      }

      // Contractors/Vendors (Top 5) - Table format in a box
      if (contractors && contractors.length > 0) {
        if (yPosition > pageHeight - 50) return;
        
        const contractorsBoxY = yPosition;
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
            ? contractor.roles[0].charAt(0).toUpperCase() + contractor.roles[0].slice(1).toLowerCase()
            : "—";
          const eventCount = contractor.count || contractor.event_count || 0;
          const eventText = eventCount === 1 ? "1 Event" : `${eventCount} Events`;
          
          // Name with badge if paid - no background tint
          doc.setFont("helvetica", "bold");
          const contractorNameWidth = doc.getTextWidth(contractorName);
          
          // Text stays black
          doc.setTextColor(0, 0, 0);
          doc.text(contractorName, margin, yPosition);
          if (isPaid && badgeImage) {
            // Add verified badge image next to name (even smaller)
            const badgeSize = 3;
            doc.addImage(badgeImage, 'PNG', margin + contractorNameWidth + 2, yPosition - 2, badgeSize, badgeSize);
          } else if (isPaid) {
            // Fallback to star if badge image didn't load
            doc.text("★", margin + contractorNameWidth + 2, yPosition);
          }
          
          // Role
          doc.setFont("helvetica", "normal");
          doc.text(role, margin + 60, yPosition);
          
          // Event count
          doc.text(eventText, pageWidth - margin - 30, yPosition, { align: "right" });
          
          yPosition += 5;
        });
        
        // Close the contractors box
        const contractorsBoxHeight = yPosition - contractorsBoxY + 2;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin - 2, contractorsBoxY - 2, pageWidth - margin * 2 + 4, contractorsBoxHeight, 2, 2, 'S');
        
        yPosition += 5;
      }

      // Premium AinaReport Available section
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
        if (yPosition > pageHeight - 30) return;
        doc.text(line, margin, yPosition);
        yPosition += 4;
      });
      
      // Disclosure section
      yPosition += 5;
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Disclaimer:", margin, yPosition);
      yPosition += 4;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const disclaimerText = "The information contained in any report and on our website is not necessarily 100% accurate, complete or up to date, nor a substitute for your own due diligence, especially concerning such sensitive items as criminal history, relatives, mortgages and liens. Our data comes from a wide variety of sources, but some municipalities and jurisdictions are slow to report and digitize their data, so we cannot guarantee or warrant full accuracy of ALL search results.";
      const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - margin * 2);
      disclaimerLines.forEach((line) => {
        if (yPosition > pageHeight - 15) return;
        doc.text(line, margin, yPosition);
        yPosition += 3.5;
      });
      doc.setTextColor(0, 0, 0);
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
