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

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
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
    if (unit.owner_name) unitDetails.push(`Owner: ${unit.owner_name}`);
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
        if (event.severity) {
          doc.text(`   Severity: ${event.severity}`, margin + 5, yPosition);
          yPosition += 6;
        }
        if (event.status) {
          doc.text(`   Status: ${event.status}`, margin + 5, yPosition);
          yPosition += 6;
        }
        if (event.body) {
          const bodyLines = doc.splitTextToSize(`   ${event.body}`, pageWidth - margin * 2 - 10);
          bodyLines.forEach((line) => {
            checkPageBreak(6);
            doc.text(line, margin + 5, yPosition);
            yPosition += 6;
          });
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
          doc.text(`   Category: ${documentItem.category}`, margin + 5, yPosition);
          yPosition += 6;
        }
        if (documentItem.document_type) {
          doc.text(`   Type: ${documentItem.document_type}`, margin + 5, yPosition);
          yPosition += 6;
        }
        doc.text(`   Uploaded: ${docDate}`, margin + 5, yPosition);
        yPosition += 6;
        yPosition += 3;
      });
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
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
    <button
      onClick={generatePDF}
      className="fixed bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full shadow-lg font-semibold text-sm transition-colors z-50 flex items-center gap-2"
      aria-label="Print Unit Report"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      Print Report
    </button>
  );
}

