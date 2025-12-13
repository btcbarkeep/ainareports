"use client";

export default function BuildingPrintButton({ building, totalUnits, totalEvents, totalDocuments, totalContractors, propertyManagers, events, documents, units, aoao }) {
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
      const margin = 20;
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
          const logoSize = 12;
          pdfDoc.addImage(logoImage, 'PNG', marginLeft + 5, 4, logoSize, logoSize);
          
          // Text branding next to logo
          pdfDoc.setFontSize(10);
          pdfDoc.setFont("helvetica", "bold");
          pdfDoc.setTextColor(0, 0, 0);
          pdfDoc.text("AINAREPORTS", marginLeft + logoSize + 10, 12);
        } else {
          // Fallback to text-only if image didn't load
          pdfDoc.setFontSize(10);
          pdfDoc.setFont("helvetica", "bold");
          pdfDoc.setTextColor(0, 0, 0);
          pdfDoc.text("AINAREPORTS", marginLeft + 5, 12);
        }
      };

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace) => {
        if (yPosition + requiredSpace > pageHeight - margin - 50) { // Leave space for footer and CTA
          doc.addPage();
          yPosition = margin + 25; // Leave space for header
          addHeader(doc, pageWidth, margin);
          return true;
        }
        return false;
      };

      // Add header to first page
      addHeader(doc, pageWidth, margin);
      yPosition = margin + 25;

      // Title
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(building.name || "Building Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Building Address
      if (building.address || building.city || building.state) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const addressParts = [
          building.address,
          building.city,
          building.state,
          building.zip
        ].filter(Boolean);
        doc.text(addressParts.join(", "), pageWidth / 2, yPosition, { align: "center" });
        yPosition += 10;
      }

      // Building Details
      yPosition += 5;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Building Details", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      const details = [];
      if (totalUnits) details.push(`Total Units: ${totalUnits}`);
      if (building.floors) details.push(`Floors: ${building.floors}`);
      if (building.zoning) details.push(`Zoning: ${building.zoning}`);
      if (building.bedrooms) details.push(`Bedrooms: ${building.bedrooms}`);
      if (building.bathrooms) details.push(`Bathrooms: ${building.bathrooms}`);
      if (building.square_feet) details.push(`Square Feet: ${building.square_feet.toLocaleString()}`);

      details.forEach((detail, index) => {
        checkPageBreak(8);
        doc.text(detail, margin + 5, yPosition);
        yPosition += 8;
      });

      // Statistics
      yPosition += 5;
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistics", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      if (totalEvents !== null) {
        checkPageBreak(8);
        doc.text(`Total Events: ${totalEvents}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (totalDocuments !== null) {
        checkPageBreak(8);
        doc.text(`Total Documents: ${totalDocuments}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (totalContractors !== null) {
        checkPageBreak(8);
        doc.text(`Total Contractors: ${totalContractors}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (propertyManagers && propertyManagers.length > 0) {
        checkPageBreak(8);
        doc.text(`Property Management Companies: ${propertyManagers.length}`, margin + 5, yPosition);
        yPosition += 8;
      }

      // AOAO Organization
      if (aoao) {
        yPosition += 5;
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("AOAO Organization", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        if (aoao.company_name || aoao.name) {
          checkPageBreak(8);
          doc.text(`Name: ${aoao.company_name || aoao.name}`, margin + 5, yPosition);
          yPosition += 8;
        }
        if (aoao.phone) {
          checkPageBreak(8);
          doc.text(`Phone: ${aoao.phone}`, margin + 5, yPosition);
          yPosition += 8;
        }
        if (aoao.email) {
          checkPageBreak(8);
          doc.text(`Email: ${aoao.email}`, margin + 5, yPosition);
          yPosition += 8;
        }
      }

      // Property Management
      if (propertyManagers && propertyManagers.length > 0) {
        yPosition += 5;
        checkPageBreak(25);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Property Management Companies", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        propertyManagers.slice(0, 10).forEach((pm, index) => {
          checkPageBreak(20);
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${pm.company_name || pm.name || "Property Manager"}`, margin + 5, yPosition);
          yPosition += 7;
          
          doc.setFont("helvetica", "normal");
          if (pm.license_number && pm.license_number !== "string") {
            doc.text(`   License: ${pm.license_number}`, margin + 5, yPosition);
            yPosition += 6;
          }
          if (pm.phone) {
            doc.text(`   Phone: ${pm.phone}`, margin + 5, yPosition);
            yPosition += 6;
          }
          yPosition += 3;
        });
      }

      // Recent Events
      if (events && events.length > 0) {
        yPosition += 5;
        checkPageBreak(25);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Recent Events", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        events.slice(0, 20).forEach((event, index) => {
          checkPageBreak(25);
          const eventDate = event.occurred_at ? new Date(event.occurred_at).toLocaleDateString() : "—";
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${event.title || "Event"}`, margin + 5, yPosition);
          yPosition += 7;
          
          doc.setFont("helvetica", "normal");
          doc.text(`   Date: ${eventDate}`, margin + 5, yPosition);
          yPosition += 6;
          if (event.event_type) {
            doc.text(`   Type: ${event.event_type}`, margin + 5, yPosition);
            yPosition += 6;
          }
          if (event.subcategory) {
            doc.text(`   Subcategory: ${event.subcategory}`, margin + 5, yPosition);
            yPosition += 6;
          }
          if (event.severity) {
            doc.text(`   Severity: ${event.severity}`, margin + 5, yPosition);
            yPosition += 6;
          }
          if (event.body || event.description) {
            const description = event.body || event.description;
            // Split long descriptions into multiple lines
            const maxWidth = pageWidth - margin * 2 - 10;
            const lines = doc.splitTextToSize(`   Description: ${description}`, maxWidth);
            doc.text(lines, margin + 5, yPosition);
            yPosition += lines.length * 5;
          }
          yPosition += 3;
        });
      }

      // Recent Documents
      if (documents && documents.length > 0) {
        yPosition += 5;
        checkPageBreak(25);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Recent Documents", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        documents.slice(0, 15).forEach((documentItem, index) => {
          checkPageBreak(20);
          const docDate = documentItem.created_at ? new Date(documentItem.created_at).toLocaleDateString() : "—";
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${documentItem.title || documentItem.filename || "Document"}`, margin + 5, yPosition);
          yPosition += 7;
          
          doc.setFont("helvetica", "normal");
          if (documentItem.category) {
            const categoryText = documentItem.subcategory 
              ? `Category: ${documentItem.category} / ${documentItem.subcategory}`
              : `Category: ${documentItem.category}`;
            doc.text(`   ${categoryText}`, margin + 5, yPosition);
            yPosition += 6;
          }
          if (documentItem.description) {
            // Split long descriptions into multiple lines
            const maxWidth = pageWidth - margin * 2 - 10;
            const lines = doc.splitTextToSize(`   Description: ${documentItem.description}`, maxWidth);
            doc.text(lines, margin + 5, yPosition);
            yPosition += lines.length * 5;
          }
          doc.text(`   Uploaded: ${docDate}`, margin + 5, yPosition);
          yPosition += 6;
          yPosition += 3;
        });
      }

      // Units Summary
      if (units && units.length > 0) {
        yPosition += 5;
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Units", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        // Create a table-like structure
        units.slice(0, 30).forEach((unit, index) => {
          checkPageBreak(10);
          const unitInfo = [
            unit.unit_number || "—",
            unit.floor ? `Floor ${unit.floor}` : "—",
            unit.owner_name || "—"
          ].filter(item => item !== "—").join(" • ");
          
          doc.text(`${index + 1}. ${unitInfo}`, margin + 5, yPosition);
          yPosition += 7;
        });
      }

      // Footer and Call to Action
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Call to Action box on last page
        if (i === totalPages) {
          const ctaY = pageHeight - 40;
          // Gray border box (like home page styling)
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.roundedRect(margin, ctaY, pageWidth - margin * 2, 25, 3, 3, 'S');
          
          // CTA text
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Download the Full Premium Report", pageWidth / 2, ctaY + 10, { align: "center" });
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          doc.text("Visit AinaReports.com for complete event history, documents, and analytics", pageWidth / 2, ctaY + 18, { align: "center" });
          
          doc.setTextColor(0, 0, 0);
        }
        
        // Footer text
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated by AinaReports on ${new Date().toLocaleDateString()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" }
        );
        doc.setTextColor(0, 0, 0);
      }

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

