"use client";

export default function UnitPrintButton({ building, unit, totalEvents, totalDocuments, totalContractors, buildingContractors, unitContractors, events, documents }) {
  const generatePDF = async () => {
    try {
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
      doc.text(`Unit ${unit.unit_number || "Report"}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

    // Building Name
    if (building.name) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(building.name, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;
    }

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
      yPosition += 15;
    }

    // Unit Details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Unit Details", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const unitDetails = [];
    if (unit.unit_number) unitDetails.push(`Unit Number: ${unit.unit_number}`);
    // Don't include owner_name here - it's in the Owners section below
    if (unit.floor !== null && unit.floor !== undefined) unitDetails.push(`Floor: ${unit.floor}`);
    if (unit.bedrooms) unitDetails.push(`Bedrooms: ${unit.bedrooms}`);
    if (unit.bathrooms) unitDetails.push(`Bathrooms: ${unit.bathrooms}`);
    if (unit.square_feet) unitDetails.push(`Square Feet: ${unit.square_feet.toLocaleString()}`);

    unitDetails.forEach((detail, index) => {
      checkPageBreak(8);
      doc.text(detail, margin + 5, yPosition);
      yPosition += 8;
    });

    // Owners
    if (unit.owners && Array.isArray(unit.owners) && unit.owners.length > 0) {
      yPosition += 5;
      checkPageBreak(15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Owners", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      unit.owners.forEach((owner, index) => {
        checkPageBreak(15);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${owner.name || owner.owner_name || "Owner"}`, margin + 5, yPosition);
        yPosition += 7;
        
        doc.setFont("helvetica", "normal");
        if (owner.email) {
          doc.text(`   Email: ${owner.email}`, margin + 5, yPosition);
          yPosition += 6;
        }
        if (owner.phone) {
          doc.text(`   Phone: ${owner.phone}`, margin + 5, yPosition);
          yPosition += 6;
        }
        yPosition += 3;
      });
    }

    // Building Details
    yPosition += 5;
    checkPageBreak(25);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Building Details", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const buildingDetails = [];
    if (building.units) buildingDetails.push(`Total Units: ${building.units}`);
    if (building.floors) buildingDetails.push(`Floors: ${building.floors}`);
    if (building.zoning) {
      const zoningDesc = building.zoning.charAt(0).toUpperCase() === "H" ? `${building.zoning} - Hotel` :
                        building.zoning.charAt(0).toUpperCase() === "A" ? `${building.zoning} - Apartment` :
                        building.zoning.charAt(0).toUpperCase() === "R" ? `${building.zoning} - Residential` :
                        building.zoning;
      buildingDetails.push(`Zoning: ${zoningDesc}`);
    }
    if (building.bedrooms) buildingDetails.push(`Total Bedrooms: ${building.bedrooms}`);
    if (building.bathrooms) buildingDetails.push(`Total Bathrooms: ${building.bathrooms}`);
    if (building.square_feet) buildingDetails.push(`Total Square Feet: ${building.square_feet.toLocaleString()}`);

    buildingDetails.forEach((detail, index) => {
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
    
    if (totalEvents !== null && totalEvents !== undefined) {
      checkPageBreak(8);
      doc.text(`Total Events: ${totalEvents}`, margin + 5, yPosition);
      yPosition += 8;
    }
    if (totalDocuments !== null && totalDocuments !== undefined) {
      checkPageBreak(8);
      doc.text(`Total Documents: ${totalDocuments}`, margin + 5, yPosition);
      yPosition += 8;
    }
    if (totalContractors !== null && totalContractors !== undefined) {
      checkPageBreak(8);
      doc.text(`Total Contractors: ${totalContractors}`, margin + 5, yPosition);
      yPosition += 8;
    }
    if (buildingContractors && buildingContractors.length > 0) {
      checkPageBreak(8);
      doc.text(`Property Management Companies: ${buildingContractors.length}`, margin + 5, yPosition);
      yPosition += 8;
    }

    // Property Management Companies
    if (buildingContractors && buildingContractors.length > 0) {
      yPosition += 5;
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Property Management Companies", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      buildingContractors.slice(0, 10).forEach((pm, index) => {
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

    // Unit Contractors
    if (unitContractors && unitContractors.length > 0) {
      yPosition += 5;
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Unit Contractors", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      unitContractors.slice(0, 10).forEach((contractor, index) => {
        checkPageBreak(20);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${contractor.company_name || contractor.name || "Contractor"}`, margin + 5, yPosition);
        yPosition += 7;
        
        doc.setFont("helvetica", "normal");
        if (contractor.roles && Array.isArray(contractor.roles) && contractor.roles.length > 0) {
          doc.text(`   Role: ${contractor.roles.join(", ")}`, margin + 5, yPosition);
          yPosition += 6;
        }
        if (contractor.phone) {
          doc.text(`   Phone: ${contractor.phone}`, margin + 5, yPosition);
          yPosition += 6;
        }
        if (contractor.license_number) {
          doc.text(`   License: ${contractor.license_number}`, margin + 5, yPosition);
          yPosition += 6;
        }
        yPosition += 3;
      });
    }

    // Unit Events
    if (events && events.length > 0) {
      yPosition += 5;
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Unit Events", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      events.slice(0, 25).forEach((event, index) => {
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
        if (event.status) {
          doc.text(`   Status: ${event.status}`, margin + 5, yPosition);
          yPosition += 6;
        }
        if (event.body || event.description) {
          const description = event.body || event.description;
          const maxWidth = pageWidth - margin * 2 - 10;
          const lines = doc.splitTextToSize(`   Description: ${description}`, maxWidth);
          doc.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 5;
        }
        yPosition += 3;
      });
    }

    // Unit Documents
    if (documents && documents.length > 0) {
      yPosition += 5;
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Unit Documents", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      documents.slice(0, 20).forEach((documentItem, index) => {
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
        if (documentItem.document_type) {
          doc.text(`   Type: ${documentItem.document_type}`, margin + 5, yPosition);
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
    const filename = `${building.name || "Building"}_Unit_${unit.unit_number || "Report"}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Error generating PDF: ${error.message || error.toString()}. Please check the console for details.`);
    }
  };

  return (
    <div className="border rounded-md p-4 bg-gray-50 text-sm">
      <h3 className="font-semibold mb-1 text-center">Unit Report</h3>
      <p className="text-gray-700 text-xs mb-4 text-center">
        Download a comprehensive report with unit and building data, events, documents, and contractor activity for {building.name} - Unit {unit.unit_number}.
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

